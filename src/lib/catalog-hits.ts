import type { Lang, Resource } from "./types.js";
import { records, getById } from "./data.js";
import { displayDescription, displayName } from "./format.js";
import { FOLDERS, folderLabel, getFolder } from "./directory.js";
import { matchNeed } from "./needs.js";
import { buildSearch, searchRecords } from "./search.js";

export type CompactHit = {
  record_id: string;
  slug: string;
  path: string;
  name: string;
  name_he: string | null;
  category: string;
  subcategory: string | null;
  phone: string | null;
  address: string | null;
  blurb: string | null;
  priority: string | null;
};

export type FolderHit = {
  id: string;
  path: string;
  icon: string;
  title: string;
};

export type CatalogSearchOutput = {
  records: CompactHit[];
  folders: FolderHit[];
};

let indexed = false;

export function ensureCatalogSearch(): void {
  if (indexed) return;
  buildSearch(records);
  indexed = true;
}

export function compactHit(r: Resource, lang: Lang): CompactHit {
  const blurb = displayDescription(r, lang).slice(0, 180);
  return {
    record_id: r.record_id,
    slug: r.slug,
    path: `/e/${r.slug}`,
    name: displayName(r, lang),
    name_he: r.name_he,
    category: r.category,
    subcategory: r.subcategory,
    phone: r.phone_primary,
    address: (lang === "he" ? r.address_he : r.address_en) || r.address_en,
    blurb: blurb || null,
    priority: r.priority,
  };
}

const FOLDER_STOP = new Set(
  "i a an the for and or to of in on at my me we our need help how does do did what where is are in israel tonight please tonight's looking find get".split(" "),
);

export function matchingFolders(query: string, lang: Lang): FolderHit[] {
  const hits: FolderHit[] = [];
  const seen = new Set<string>();

  const need = matchNeed(query, lang);
  if (need?.to.startsWith("/d/")) {
    const id = need.to.slice(3);
    const folder = getFolder(id);
    if (folder) {
      seen.add(folder.id);
      hits.push({
        id: folder.id,
        path: need.to,
        icon: folder.icon,
        title: folderLabel(folder, lang),
      });
    }
  }

  const q = query.trim().toLowerCase();
  const terms = q.split(/[^\p{L}\p{N}]+/u).filter((part) => part.length > 2 && !FOLDER_STOP.has(part));
  if (terms.length) {
    for (const folder of FOLDERS) {
      if (hits.length >= 4) break;
      if (seen.has(folder.id)) continue;
      const blob = `${folder.id} ${folder.title.en} ${folder.title.fr} ${folder.title.he}`.toLowerCase();
      if (!terms.some((term) => blob.includes(term))) continue;
      seen.add(folder.id);
      hits.push({
        id: folder.id,
        path: `/d/${folder.id}`,
        icon: folder.icon,
        title: folderLabel(folder, lang),
      });
    }
  }

  return hits.slice(0, 4);
}

export function searchCatalog(query: string, lang: Lang, limit = 8): CatalogSearchOutput {
  ensureCatalogSearch();
  const q = query.trim();
  if (!q) return { records: [], folders: [] };
  const recordsHits = searchRecords(q)
    .slice(0, limit)
    .map((r) => compactHit(r, lang));
  return { records: recordsHits, folders: matchingFolders(q, lang) };
}

export function getCompactRecord(recordId: string, lang: Lang) {
  const r = getById(recordId);
  if (!r) return { found: false as const, record_id: recordId };
  return {
    found: true as const,
    ...compactHit(r, lang),
    hours: r.availability_hours_note,
    website: r.website_url,
    action: r.action_url,
    maps: r.google_maps_location_url,
    languages: r.languages,
  };
}

export const ASK_PROMPTS: { en: string; fr: string; he: string }[] = [
  { en: "Where is the best place to order clothing online?", fr: "Où commander des vêtements en ligne ?", he: "איפה הכי כדאי להזמין בגדים אונליין?" },
  { en: "I need a plumber tonight", fr: "J'ai besoin d'un plombier ce soir", he: "צריך אינסטלטור הערב" },
  { en: "How does a kupah work?", fr: "Comment marche une kupah ?", he: "איך עובדת קופת חולים?" },
  { en: "Where is the nearest pharmacy?", fr: "Où est la pharmacie la plus proche ?", he: "איפה בית מרקחת קרוב?" },
];
