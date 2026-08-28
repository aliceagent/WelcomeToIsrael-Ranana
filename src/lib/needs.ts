import type { Lang } from "./types.js";

export type Copy = { en: string; fr: string; he: string };

export type Need = {
  id: string;
  icon: string;
  title: Copy;
  to: string;
  row: 1 | 2 | 3;
  aliases: string[];
};

/**
 * Everyday jobs a new arrival actually tries to solve.
 * Occasional items (hospital, school, plumber…) stay as search aliases
 * under broader chips — Health, Handyman, Kids & school — not as separate top-level taps.
 */
export const NEEDS: Need[] = [
  { id: "dinner", icon: "🍽️", title: { en: "Dinner", fr: "Dîner", he: "ארוחת ערב" }, to: "/d/restaurants", row: 1, aliases: ["dinner", "restaurant", "eat out", "souper"] },
  { id: "delivery", icon: "🛵", title: { en: "Delivery", fr: "Livraison", he: "משלוח" }, to: "/d/order-in", row: 1, aliases: ["wolt", "10bis", "delivery", "order in"] },
  { id: "groceries", icon: "🛒", title: { en: "Groceries", fr: "Courses", he: "סופר" }, to: "/d/groceries", row: 1, aliases: ["supermarket", "shufersal", "groceries"] },
  { id: "coffee", icon: "🥐", title: { en: "Coffee", fr: "Café", he: "קפה" }, to: "/d/bakeries", row: 1, aliases: ["coffee", "bakery", "cafe", "croissant"] },
  { id: "french", icon: "🇫🇷", title: { en: "French food", fr: "Cuisine FR", he: "אוכל צרפתי" }, to: "/d/french-food", row: 1, aliases: ["french", "boulangerie", "traiteur"] },
  { id: "butcher", icon: "🥩", title: { en: "Butcher", fr: "Boucher", he: "קצבייה" }, to: "/d/butcher", row: 1, aliases: ["butcher", "meat", "boucher"] },
  { id: "pharmacy", icon: "💊", title: { en: "Pharmacy", fr: "Pharmacie", he: "בית מרקחת" }, to: "/d/pharmacy", row: 1, aliases: ["pharmacy", "super-pharm", "pharmacie"] },
  {
    id: "health",
    icon: "🩺",
    title: { en: "Health", fr: "Santé", he: "בריאות" },
    to: "/d/health",
    row: 1,
    aliases: ["doctor", "hospital", "clinic", "kupah", "clalit", "dentist", "dentiste", "urgent", "רופא", "שיניים"],
  },
  {
    id: "handyman",
    icon: "🔧",
    title: { en: "Handyman", fr: "Artisans", he: "בעל מקצוע" },
    to: "/d/home-help",
    row: 2,
    aliases: [
      "handyman",
      "electrician",
      "electricien",
      "plumber",
      "plombier",
      "hardware",
      "home center",
      "ace",
      "diy",
      "ikea",
      "furniture",
      "meubles",
      "חשמלאי",
      "אינסטלטור",
    ],
  },
  { id: "internet", icon: "📶", title: { en: "SIM / Wi-Fi", fr: "SIM / Wi-Fi", he: "סלים / אינטרנט" }, to: "/d/phone-net", row: 2, aliases: ["sim", "internet", "cellcom", "hot", "partner", "golan"] },
  { id: "parking", icon: "🅿️", title: { en: "Parking", fr: "Parking", he: "חניה" }, to: "/d/drive", row: 2, aliases: ["parking", "pango", "waze"] },
  { id: "bank", icon: "🏦", title: { en: "Bank / bit", fr: "Banque / bit", he: "בנק / ביט" }, to: "/d/banks", row: 2, aliases: ["bank", "bit", "paybox"] },
  { id: "packages", icon: "📬", title: { en: "Packages", fr: "Colis", he: "חבילות" }, to: "/d/packages", row: 2, aliases: ["dhl", "fedex", "ups", "amazon", "forward"] },
  {
    id: "bills",
    icon: "🏠",
    title: { en: "Home & bills", fr: "Maison & factures", he: "בית וחשבונות" },
    to: "/d/home-setup",
    row: 2,
    aliases: ["arnona", "electricity", "water", "gas", "garbage", "recycling", "trash", "bills"],
  },
  {
    id: "school",
    icon: "🎒",
    title: { en: "Kids & school", fr: "École & enfants", he: "בית ספר וילדים" },
    to: "/d/schools",
    row: 3,
    aliases: ["school", "kindergarten", "mashov", "kids", "after school", "camp", "daycare", "école"],
  },
  { id: "synagogue", icon: "✡️", title: { en: "Synagogue", fr: "Synagogue", he: "בית כנסת" }, to: "/d/synagogues", row: 3, aliases: ["synagogue", "minyan", "shul"] },
  { id: "bus", icon: "🚌", title: { en: "Bus / train", fr: "Bus / train", he: "אוטובוס / רכבת" }, to: "/d/transit", row: 3, aliases: ["bus", "train", "rav-kav", "moovit"] },
  { id: "shelter", icon: "🛡️", title: { en: "Shelter", fr: "Abri", he: "מקלט" }, to: "/d/shelters", row: 3, aliases: ["shelter", "alert", "rocket", "מקלט"] },
  { id: "aliyah", icon: "✈️", title: { en: "Aliyah desk", fr: "Bureau olim", he: "קליטה" }, to: "/d/olim", row: 3, aliases: ["aliyah", "olim", "absorption"] },
  { id: "hebrew", icon: "א", title: { en: "Hebrew word", fr: "Mot d'hébreu", he: "מילה בעברית" }, to: "/glossary", row: 3, aliases: ["hebrew", "glossary", "ulpan"] },
  { id: "license", icon: "🪪", title: { en: "Driver licence", fr: "Permis", he: "רישיון נהיגה" }, to: "/d/government", row: 3, aliases: ["license", "licence", "driving", "permis"] },
  { id: "vet", icon: "🐾", title: { en: "Vet / pet", fr: "Vétérinaire", he: "וטרינר" }, to: "/d/pets", row: 3, aliases: ["vet", "pet", "dog", "veterinary"] },
  { id: "mall", icon: "🛍️", title: { en: "Mall / shops", fr: "Centre commercial", he: "קניון" }, to: "/d/shops", row: 3, aliases: ["mall", "renanim", "shopping"] },
  { id: "sports", icon: "🏊", title: { en: "Pool / sport", fr: "Piscine", he: "בריכה" }, to: "/d/sports", row: 3, aliases: ["pool", "swim", "tennis", "sport", "gym", "fitness"] },
  { id: "park", icon: "🌳", title: { en: "Park", fr: "Parc", he: "פארק" }, to: "/d/parks", row: 3, aliases: ["park", "playground"] },
  { id: "mikvah", icon: "💧", title: { en: "Mikvah", fr: "Mikvé", he: "מקווה" }, to: "/d/community", row: 3, aliases: ["mikvah", "mikveh", "מקווה"] },
  { id: "translate", icon: "🌐", title: { en: "Translate", fr: "Traduire", he: "תרגום" }, to: "/d/apps", row: 3, aliases: ["translate", "google translate"] },
  { id: "find", icon: "🔎", title: { en: "Find anyone", fr: "Trouver quelqu'un", he: "למצוא מישהו" }, to: "/d/directories", row: 3, aliases: ["easy", "google maps", "directory"] },
];

/** Live lookup cards when the catalog has no named shop (dentist, electrician, hairdresser…). */
export const LIVE_LOOKUP_IDS = ["TRN-026", "DIR-007", "DIR-008"] as const;

export const SEARCH_SYNONYMS: { test: RegExp; extra: string[] }[] = [
  { test: /electricien|electrician|חשמלאי|חשמל|handyman|plombier|plumber|אינסטלטור/i, extra: ["midrag", "home center"] },
  { test: /hardware|bricolage|diy|home depot|כלי עבודה/i, extra: ["home center", "ace"] },
  { test: /dentist|dentiste|שיניים/i, extra: ["midrag", "google maps"] },
  { test: /hairdresser|coiffeur|salon|ספר|מספרה|barber/i, extra: ["midrag", "easy"] },
  { test: /nanny|babysit|nounou|מטפלת/i, extra: ["midrag"] },
  { test: /kupah|kupat|caisse maladie|קופת חולים|hospital|hôpital|בית חולים/i, extra: ["clalit", "maccabi", "meuhedet", "leumit"] },
  { test: /pharmacy|pharmacie|בית מרקחת|superpharm|super-pharm/i, extra: ["super-pharm"] },
  { test: /dinner|dîner|souper|ארוחת ערב|tonight/i, extra: ["wolt", "restaurant"] },
  { test: /vet|vétérinaire|וטרינר/i, extra: ["veterinary"] },
  { test: /sim\b|wifi|wi-fi|fiber|fibre/i, extra: ["cellcom", "partner", "hot", "golan"] },
  { test: /arnona|property tax|taxe municipale/i, extra: ["arnona"] },
  { test: /licence|license|permis de conduire|רישיון/i, extra: ["driving licence", "ministry of transport"] },
  { test: /ikea|furniture|meuble|רהיט/i, extra: ["ikea"] },
  { test: /garbage|trash|poubelle|אשפה|recycling/i, extra: ["garbage", "recycling"] },
  { test: /school|école|kindergarten|גן ילדים|mashov/i, extra: ["school", "education"] },
  { test: /water heater|boiler|hot water|dud shemesh|דוד שמש|chauffe-eau/i, extra: ["plumber", "home services", "midrag"] },
  { test: /gym|fitness|workout|חדר כושר|musculation/i, extra: ["sports", "tennis", "swimming"] },
  { test: /taxi|cab|מונית|monit/i, extra: ["gett", "taxi"] },
  { test: /מכולת|makolet|épicerie/i, extra: ["supermarket", "grocery"] },
  { test: /pediatrician|pédiatre|רופא ילדים/i, extra: ["clalit", "maccabi", "meuhedet", "leumit", "tipat halav", "schneider"] },
  { test: /garderie|daycare|צהרון/i, extra: ["kindergarten", "childcare"] },
  { test: /pharmacie de garde|duty pharmacy/i, extra: ["super-pharm", "pharmacy"] },
  { test: /cacher|casher/i, extra: ["kosher", "butcher"] },
  { test: /locksmith|serrurier|מנעולן|aircon|air condition|מזגן/i, extra: ["midrag", "home services"] },
  { test: /bus|אוטובוס|autobus/i, extra: ["moovit", "rav-kav"] },
];

const THIN_TRADE =
  /electricien|electrician|plumber|plombier|dentist|dentiste|hairdresser|coiffeur|nanny|babysit|handyman|חשמלאי|אינסטלטור|שיניים|water heater|boiler|dud shemesh|locksmith|serrurier|aircon|מזגן|מנעולן/i;

export function isThinTradeQuery(query: string): boolean {
  return THIN_TRADE.test(query);
}

export function expandQuery(query: string): string[] {
  const q = query.trim();
  if (!q) return [];
  const extra = SEARCH_SYNONYMS.filter((s) => s.test.test(q)).flatMap((s) => s.extra);
  return [q, ...extra.filter((term) => term.toLowerCase() !== q.toLowerCase())];
}

export function matchNeed(query: string, lang: Lang = "en"): Need | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return NEEDS.find(
    (n) =>
      n.title[lang].toLowerCase() === q ||
      n.title.en.toLowerCase() === q ||
      n.aliases.some((a) => a.toLowerCase() === q || q.includes(a.toLowerCase()) || a.toLowerCase().includes(q)),
  );
}

/** Up to four "try instead" chips for an empty result page. */
export function suggestNeeds(query: string, lang: Lang = "en"): Need[] {
  const q = query.trim().toLowerCase();
  const scoredNeeds = NEEDS.map((n) => {
    const terms = [n.title.en, n.title[lang], ...n.aliases].map((s) => s.toLowerCase());
    let score = 0;
    for (const term of terms) {
      if (!q) break;
      if (term === q) score = Math.max(score, 3);
      else if (term.includes(q) || q.includes(term)) score = Math.max(score, 2);
      else if (q.length >= 3 && term.startsWith(q.slice(0, 3))) score = Math.max(score, 1);
    }
    return { n, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.n);
  if (scoredNeeds.length) return scoredNeeds.slice(0, 4);
  const defaults = ["dinner", "pharmacy", "handyman", "groceries"];
  return defaults.map((id) => NEEDS.find((n) => n.id === id)).filter((n): n is Need => !!n);
}

export function needsInRow(row: 1 | 2 | 3): Need[] {
  return NEEDS.filter((n) => n.row === row);
}

export function needLabel(need: Need, lang: Lang): string {
  return need.title[lang];
}
