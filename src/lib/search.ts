import MiniSearch from "minisearch";
import type { Resource } from "./types.js";
import { priorityScore } from "./format.js";
import { expandQuery, isThinTradeQuery, LIVE_LOOKUP_IDS, stripOpenIntent } from "./needs.js";
import { getById } from "./data.js";

function fold(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[׳']/g, "")
    .replace(/raanana|ra’anana|ra`anana|ranana/gi, "raanana")
    .toLowerCase();
}

/**
 * Consonant skeleton of a Hebrew string in latin letters (משרד → "msrd").
 * Indexed alongside each record so a vowel-stripped latin query can hit
 * Hebrew-only names typed without a Hebrew keyboard.
 */
const HE_LATIN: Record<string, string> = {
  א: "", ב: "b", ג: "g", ד: "d", ה: "h", ו: "v", ז: "z", ח: "ch", ט: "t",
  י: "y", כ: "k", ך: "k", ל: "l", מ: "m", ם: "m", נ: "n", ן: "n", ס: "s",
  ע: "", פ: "p", ף: "p", צ: "tz", ץ: "tz", ק: "k", ר: "r", ש: "sh", ת: "t",
};

export function hebrewSkeleton(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .split(/\s+/)
    .map((word) => [...word].map((ch) => HE_LATIN[ch] ?? "").join(""))
    .filter((w) => w.length >= 2)
    .join(" ");
}

/** Strip latin vowels so "misrad" can match the indexed skeleton "msrd". */
function stripVowels(q: string): string {
  return q
    .split(/\s+/)
    .map((w) => (/^[a-z']+$/i.test(w) && w.length > 3 ? w.replace(/[aeiou']/gi, "") : w))
    .join(" ");
}

const HEBREW = /[֐-׿]/;

/**
 * Latin function words carry no signal and drag in noise ("bus TO tel aviv"
 * matching "Wok TO Walk"). Hebrew prefixes are glued to their word, so Hebrew
 * needs no list.
 */
const STOPWORDS = new Set([
  "to", "the", "a", "an", "in", "of", "for", "at", "on", "is", "near", "me",
  "de", "la", "le", "les", "du", "des", "un", "une", "et", "en", "au", "aux", "pour",
]);

/** MiniSearch's default tokenizer split, so query tokens line up with indexed ones. */
const SPACE_OR_PUNCTUATION = /[\n\r\p{Z}\p{P}]+/u;

function processTerm(term: string): string | null {
  const folded = fold(term);
  return STOPWORDS.has(folded) ? null : folded;
}

function queryTokens(query: string): string[] {
  return query
    .split(SPACE_OR_PUNCTUATION)
    .map(processTerm)
    .filter((t): t is string => !!t);
}

/**
 * A hit is exact when an indexed term it matched is a query token or extends
 * one (prefix); anything else came from fuzzy edit distance alone.
 */
function isExactHit(terms: string[], tokens: string[]): boolean {
  return terms.some((term) => tokens.some((token) => term === token || term.startsWith(token)));
}

/** Length of the longest shared prefix of two folded terms. */
function sharedPrefix(a: string, b: string): number {
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n && a[i] === b[i]) i += 1;
  return i;
}

/**
 * Edit distance alone is a bad judge of whether a word was meant: "shawarma"
 * reaches the synagogue "Shaar HaRachamim" and "hummus" reaches the French
 * "hommes" of a crisis line. A fuzzy-only hit therefore has to *look* like the
 * word typed — most of the front of the word has to survive — and very short
 * tokens ("bus" → "BUG") get no fuzzy licence at all.
 */
function fuzzyPlausible(terms: string[], tokens: string[]): boolean {
  return terms.some((term) =>
    tokens.some((token) => {
      if (token.length < 4 || term.length < 4) return false;
      return sharedPrefix(term, token) >= Math.max(3, Math.ceil(token.length * 0.6));
    }),
  );
}

/**
 * Crisis and emergency records are never a near-miss answer: a hummus craving
 * must not surface a sexual-assault line. They stay out of loose result sets
 * unless the query itself is about an emergency.
 */
function isCrisisRecord(rec: Resource): boolean {
  return (
    rec.record_type === "important_phone_or_emergency_service" ||
    rec.category === "Emergency & Important Numbers"
  );
}

/** Loose results are a last resort, never a wall of near-noise. */
const LOOSE_MAX = 5;
const GLOSSARY_PENALTY = 4;
const CHECKLIST_PENALTY = 4;
/**
 * Synonym passes support the query; on equal footing they rank just behind it,
 * and behind each other in the order the synonym table lists them (equal
 * weights leave a stable sort to keep that order).
 */
const SYNONYM_WEIGHT = 0.9;

const FUZZY = 0.2;
/** Last-ditch pass for a typo the normal edit distance can't reach ("electrition"). */
const FUZZY_WIDE = 0.34;

function fuzzyFor(distance: number) {
  return (term: string) => (HEBREW.test(term) ? false : distance);
}

/**
 * A glossary card answers "what does this word mean", so it earns its place
 * only when the query is the term itself. name_fr/description are translations
 * of the meaning, not the card's name — "pédiatre" wants a doctor.
 */
function isTermQuery(rec: Resource, foldedQuery: string): boolean {
  return [rec.name_en, rec.name_he].some((n) => !!n && fold(n) === foldedQuery);
}

function isDemotedGlossary(rec: Resource, foldedQuery: string): boolean {
  return rec.record_type === "glossary_term" && !isTermQuery(rec, foldedQuery);
}

/** Queries that really are asking for a checklist rather than for a shop. */
const CHECKLIST_QUERY = /checklist|check list|to-?do|liste|רשימ|צ׳ק ליסט/i;

/**
 * A checklist is reading material, not somewhere to call: "phone plan" wants
 * Golan Telecom, not the Hebrew-learning plan. Same shape as the glossary
 * demotion — a penalty in the ranking and the tail of the merged list.
 */
function isDemotedChecklist(rec: Resource, foldedQuery: string): boolean {
  return (
    rec.record_type === "checklist" && !CHECKLIST_QUERY.test(foldedQuery) && !isTermQuery(rec, foldedQuery)
  );
}

let index: MiniSearch<Resource> | null = null;
let byId = new Map<string, Resource>();

export function buildSearch(records: Resource[]) {
  byId = new Map(records.map((r) => [r.record_id, r]));
  index = new MiniSearch({
    fields: [
      "name_en",
      "name_he",
      "name_fr",
      "search_aliases",
      "subcategory",
      "category",
      "tags",
      "description_en",
      "description_fr",
      "address_en",
      "address_he",
      "phone_primary",
      "search_text",
      "he_translit",
      "denomination_nusach",
    ],
    storeFields: ["record_id"],
    idField: "record_id",
    extractField: (doc, fieldName) =>
      fieldName === "he_translit"
        ? hebrewSkeleton((doc as Resource).name_he)
        : ((doc as unknown as Record<string, unknown>)[fieldName] as string),
    searchOptions: {
      boost: {
        name_en: 10,
        name_he: 10,
        name_fr: 10,
        search_aliases: 8,
        subcategory: 7,
        category: 6,
        tags: 6,
        phone_primary: 9,
        description_en: 4,
        description_fr: 4,
        address_en: 3,
        address_he: 3,
        search_text: 2,
        he_translit: 6,
        denomination_nusach: 5,
      },
      prefix: true,
      // Hebrew words are short and dense: one edit turns a real word into an
      // unrelated one, so Hebrew gets prefix matching only.
      fuzzy: fuzzyFor(FUZZY),
    },
    processTerm,
  });
  index.addAll(records);
}

/** One ranked hit, carrying the score so passes can be merged on merit. */
type Scored = { rec: Resource; score: number; loose: boolean };

/** Results of one index pass, with whether they are fuzzy-only ("loose"). */
type Pass = { hits: Scored[]; loose: boolean };

const EMPTY_PASS: Pass = { hits: [], loose: false };

/**
 * One pass over the index. `rootQuery` is what the person actually typed —
 * synonym passes still rank glossary and checklist cards against the original
 * words, not against the synonym they were expanded to.
 */
function searchOnce(query: string, rootQuery: string = query): Pass {
  if (!index || !query.trim()) return EMPTY_PASS;
  const tokens = queryTokens(query);
  if (!tokens.length) return EMPTY_PASS;
  const folded = fold(query);
  const rootFolded = fold(rootQuery);
  let raw = index.search(folded, { combineWith: "AND" });
  let orFallback = false;
  let typoRetry = false;
  if (raw.length === 0 && tokens.length > 1) {
    raw = index.search(folded, { combineWith: "OR" });
    orFallback = true;
  }
  if (raw.length === 0) {
    raw = index.search(folded, { combineWith: orFallback ? "OR" : "AND", fuzzy: fuzzyFor(FUZZY_WIDE) });
    typoRetry = true;
  }
  const emergency = /emergenc|urgence|חירום|rocket|alert|מקלט|shelter|ambulance|police/i.test(rootQuery);
  const scored = raw
    .map((hit): Scored | null => {
      const rec = byId.get(String(hit.id));
      if (!rec) return null;
      const exactHit = isExactHit(hit.terms, tokens);
      // A word the person never typed, only nearly typed, has to be believable.
      if (!exactHit && !fuzzyPlausible(hit.terms, tokens)) return null;
      let score = hit.score;
      score += priorityScore(rec.priority) / 20;
      if (rec.is_raanana) score += 2;
      if (emergency && rec.category === "Emergency & Important Numbers") score += 50;
      if (emergency && rec.record_type === "public_shelter") score += 20;
      // Flashcards are for looking a word up, not for answering "who can help".
      if (isDemotedGlossary(rec, rootFolded)) score -= GLOSSARY_PENALTY;
      if (isDemotedChecklist(rec, rootFolded)) score -= CHECKLIST_PENALTY;
      // A single matched token out of a multi-word query is a weak signal.
      const loose = typoRetry || !exactHit || (orFallback && hit.queryTerms.length < 2);
      if (loose && !emergency && isCrisisRecord(rec)) return null;
      return { rec, score, loose };
    })
    .filter((x): x is Scored => x !== null)
    .sort((a, b) => b.score - a.score);
  const exact = scored.filter((x) => !x.loose);
  const kept = exact.length ? exact : scored.slice(0, LOOSE_MAX);
  // Fuzzy matching produces a long tail of near-noise (shelters for
  // "plumber"); keep only hits in the same league as the best one.
  const top = kept[0]?.score ?? 0;
  const floor = top > 0 ? top * 0.3 : -Infinity;
  return { hits: kept.filter((x) => x.score >= floor), loose: !exact.length };
}

/**
 * Directory matches only, deduplicated by id AND by display name (the
 * dataset carries e.g. two Midrag records). Live-directory fallbacks are
 * NOT mixed in — the UI shows them in their own labeled section via
 * liveLookupRecords().
 *
 * `loose` means nothing matched the query as typed and the records below are
 * fuzzy near-misses, which the search page says out loud.
 */
export function searchWithMeta(query: string): { records: Resource[]; loose: boolean } {
  // "open"/"now" say when, not what: they are an intent, not a search term.
  // "open now" on its own leaves nothing to look up, so it falls through to
  // the try-instead chips rather than to whatever "open" fuzzily resembles.
  const root = stripOpenIntent(query);
  if (!root.trim()) return { records: [], loose: false };
  const queries = expandQuery(root);
  const collected: Scored[] = [];
  let anyExact = false;
  // Raw index scores grow with the number of query terms, so "home center"
  // would always outscore "midrag" whatever the two passes actually found.
  // Comparing each hit against the best its own pass could do is the only
  // scale the passes share.
  const take = (pass: Pass, weight: number) => {
    if (!pass.hits.length) return;
    if (!pass.loose) anyExact = true;
    const top = pass.hits[0].score;
    for (const hit of pass.hits) {
      collected.push({ ...hit, score: (top > 0 ? hit.score / top : 0) * weight });
    }
  };
  queries.forEach((q, i) => take(searchOnce(q, root), i === 0 ? 1 : SYNONYM_WEIGHT));
  if (!collected.length) {
    // Latin-typed Hebrew ("misrad", "makolet"): retry against the skeletons.
    const skeleton = stripVowels(root);
    if (skeleton !== root) take(searchOnce(skeleton, root), 1);
  }
  // Within a pass an exact hit beats a fuzzy one; the same has to hold across
  // passes, or one good synonym pass lends its confidence to another pass's
  // noise ("barber shop" answering with ice cream because "midrag" matched).
  const usable = anyExact ? collected.filter((x) => !x.loose) : collected;
  const seen = new Set<string>();
  const seenNames = new Set<string>();
  const merged: Resource[] = [];
  for (const { rec } of usable.sort((a, b) => b.score - a.score)) {
    if (seen.has(rec.record_id)) continue;
    const nameKey = fold(rec.name_en || rec.name_he || rec.record_id).replace(/[^a-z0-9֐-׿]/g, "");
    if (nameKey && seenNames.has(nameKey)) continue;
    seen.add(rec.record_id);
    if (nameKey) seenNames.add(nameKey);
    merged.push(rec);
  }
  if (!merged.length) return { records: [], loose: false };
  // Reading material sinks below places that can act, however well it scored.
  const folded = fold(root);
  const rank = (r: Resource) =>
    isDemotedGlossary(r, folded) ? 2 : isDemotedChecklist(r, folded) ? 1 : 0;
  const ordered = [0, 1, 2].flatMap((tier) => merged.filter((r) => rank(r) === tier));
  const loose = !anyExact;
  return { records: loose ? ordered.slice(0, LOOSE_MAX) : ordered, loose };
}

export function searchRecords(query: string): Resource[] {
  return searchWithMeta(query).records;
}

/** The live-directory cards (Midrag, Easy, Google Maps) for the fallback section. */
export function liveLookupRecords(query: string, resultCount: number): Resource[] {
  if (resultCount > 0 && !isThinTradeQuery(query)) return [];
  return LIVE_LOOKUP_IDS.map(getById).filter((r): r is Resource => !!r);
}
