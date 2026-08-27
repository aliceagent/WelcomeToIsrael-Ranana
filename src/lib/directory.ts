import type { Lang, Resource } from "./types";
import { records } from "./data";
import { priorityScore } from "./format";

export type FolderGroup = "food" | "daily" | "family" | "city" | "help";

export type Copy = { en: string; fr: string; he: string };

export type FolderChip = {
  id: string;
  title: Copy;
  match: (r: Resource) => boolean;
};

export type Folder = {
  id: string;
  icon: string;
  title: Copy;
  hint?: Copy;
  group: FolderGroup;
  /** Large tiles on the home food panel */
  featured?: boolean;
  match: (r: Resource) => boolean;
  chips?: FolderChip[];
  caveat?: "hours" | "kosher" | "shelter";
};

export type Launcher = {
  id: string;
  icon: string;
  title: Copy;
  group: FolderGroup;
  to: string;
};

function norm(s: string | null | undefined): string {
  return (s || "").toLowerCase().replace(/[’`]/g, "'").trim();
}

function subOf(r: Resource, ...names: string[]): boolean {
  const s = norm(r.subcategory);
  return names.some((n) => s === norm(n));
}

function subHas(r: Resource, ...parts: string[]): boolean {
  const s = norm(r.subcategory);
  return parts.some((p) => s.includes(norm(p)));
}

function catOf(r: Resource, ...names: string[]): boolean {
  return names.includes(r.category);
}

function blob(r: Resource): string {
  return `${r.name_en || ""} ${r.name_he || ""} ${r.name_fr || ""} ${r.search_text || ""} ${r.tags || ""}`.toLowerCase();
}

const RESTAURANT_SUBS = [
  "Asian",
  "Asian & sushi",
  "Barbecue",
  "Burgers",
  "Italian",
  "Meat restaurant",
  "Pizza",
  "Sushi",
];
const CAFE_BAKERY_SUBS = ["Bakery", "Cafe", "Cafe & bagels", "Cafe & bakery"];
const FRENCH_FOOD_SUBS = ["French bakery & prepared food", "French deli"];
const GROCERY_SUBS = ["Supermarket", "Fruit & vegetables", "Gourmet grocery"];

export function isRestaurant(r: Resource): boolean {
  return catOf(r, "Ra'anana Businesses") && subOf(r, ...RESTAURANT_SUBS);
}

export function isCafeBakery(r: Resource): boolean {
  return catOf(r, "Ra'anana Businesses") && (subOf(r, ...CAFE_BAKERY_SUBS) || subOf(r, "Ice cream"));
}

export function isFrenchFood(r: Resource): boolean {
  if (catOf(r, "Ra'anana Businesses") && subOf(r, ...FRENCH_FOOD_SUBS, "Gourmet grocery")) return true;
  const n = blob(r);
  return /l'art du pain|paris bakery|moulin|chez bilou|la rotisserie|le marais|la perle/.test(n);
}

export function isGroceryStore(r: Resource): boolean {
  return catOf(r, "Ra'anana Businesses") && subOf(r, ...GROCERY_SUBS);
}

export function isButcher(r: Resource): boolean {
  return catOf(r, "Ra'anana Businesses") && subOf(r, "Butcher");
}

export function isOrderIn(r: Resource): boolean {
  if (subOf(r, "Restaurant & local delivery", "Food & Delivery")) return true;
  return /^(wolt|10bis|mishloha)\b/i.test(r.name_en || "");
}

export function isGroceryDelivery(r: Resource): boolean {
  if (catOf(r, "Delivery & Online Shopping") && subOf(r, "Groceries")) return true;
  if (catOf(r, "Essential Apps") && subOf(r, "Shopping")) return true;
  return false;
}

export function isTreat(r: Resource): boolean {
  return catOf(r, "Ra'anana Businesses") && subOf(r, "Ice cream");
}

export function isFoodRecord(r: Resource): boolean {
  if (isRestaurant(r) || isCafeBakery(r) || isFrenchFood(r) || isGroceryStore(r) || isButcher(r)) return true;
  if (isOrderIn(r) || isGroceryDelivery(r) || isTreat(r)) return true;
  return false;
}

export const FOLDERS: Folder[] = [
  {
    id: "restaurants",
    icon: "🍽️",
    title: { en: "Eat out", fr: "Au resto", he: "מסעדות" },
    hint: { en: "Burgers, sushi, pizza, grill", fr: "Burgers, sushi, pizza, grill", he: "המבורגר, סושי, פיצה, גריל" },
    group: "food",
    featured: true,
    caveat: "hours",
    match: isRestaurant,
    chips: [
      { id: "burgers", title: { en: "Burgers", fr: "Burgers", he: "המבורגר" }, match: (r) => subOf(r, "Burgers") },
      { id: "asian", title: { en: "Asian & sushi", fr: "Asiatique", he: "אסייתי וסושי" }, match: (r) => subHas(r, "asian", "sushi") },
      { id: "italian", title: { en: "Italian & pizza", fr: "Italien & pizza", he: "איטלקי ופיצה" }, match: (r) => subOf(r, "Italian", "Pizza") },
      { id: "grill", title: { en: "Meat & grill", fr: "Viande & grill", he: "בשר וגריל" }, match: (r) => subOf(r, "Meat restaurant", "Barbecue") },
    ],
  },
  {
    id: "bakeries",
    icon: "🥐",
    title: { en: "Bakeries & cafés", fr: "Boulangeries & cafés", he: "מאפיות ובתי קפה" },
    hint: { en: "Coffee, bread, bagels", fr: "Café, pain, bagels", he: "קפה, לחם, בייגל" },
    group: "food",
    featured: true,
    caveat: "hours",
    match: isCafeBakery,
  },
  {
    id: "groceries",
    icon: "🛒",
    title: { en: "Groceries", fr: "Supermarchés", he: "סופרמרקט" },
    hint: { en: "Supermarkets & produce", fr: "Supermarchés et fruits", he: "סופר וירקות" },
    group: "food",
    featured: true,
    match: (r) => isGroceryStore(r) || isGroceryDelivery(r),
  },
  {
    id: "order-in",
    icon: "🛵",
    title: { en: "Order in", fr: "Livraison resto", he: "משלוחי אוכל" },
    hint: { en: "Wolt, 10bis, Mishloha", fr: "Wolt, 10bis, Mishloha", he: "וולט, תן ביס, משלוחה" },
    group: "food",
    featured: true,
    match: isOrderIn,
  },
  {
    id: "french-food",
    icon: "🇫🇷",
    title: { en: "French food", fr: "Cuisine française", he: "אוכל צרפתי" },
    hint: { en: "Boulangerie, traiteur, deli", fr: "Boulangerie, traiteur, épicerie", he: "מאפייה ודלי צרפתי" },
    group: "food",
    featured: true,
    caveat: "hours",
    match: isFrenchFood,
  },
  {
    id: "butcher",
    icon: "🥩",
    title: { en: "Butcher", fr: "Boucherie", he: "קצבייה" },
    group: "food",
    featured: true,
    caveat: "kosher",
    match: isButcher,
  },
  {
    id: "grocery-delivery",
    icon: "📦",
    title: { en: "Grocery delivery", fr: "Courses en ligne", he: "משלוחי סופר" },
    hint: { en: "Shufersal, Rami Levy, Quik", fr: "Shufersal, Rami Levy, Quik", he: "שופרסל, רמי לוי, קוויק" },
    group: "food",
    match: isGroceryDelivery,
  },
  {
    id: "treats",
    icon: "🍨",
    title: { en: "Treats", fr: "Desserts", he: "קינוחים" },
    group: "food",
    match: isTreat,
  },
  {
    id: "food",
    icon: "🥗",
    title: { en: "All food", fr: "Tout manger", he: "כל האוכל" },
    group: "food",
    match: isFoodRecord,
    caveat: "hours",
  },
  {
    id: "transit",
    icon: "🚌",
    title: { en: "Transit", fr: "Transports", he: "תחבורה" },
    group: "daily",
    match: (r) =>
      subHas(r, "public transport", "rail", "taxi", "bus operator", "airport") ||
      subOf(r, "Public Transportation") ||
      /moovit|rav-kav|gett|israel railways/i.test(r.name_en || ""),
  },
  {
    id: "drive",
    icon: "🚗",
    title: { en: "Drive & park", fr: "Voiture & parking", he: "נהיגה וחניה" },
    group: "daily",
    match: (r) =>
      subHas(r, "driving", "parking", "navigation", "roads") ||
      /waze|pango|cello|google maps/i.test(r.name_en || ""),
  },
  {
    id: "banks",
    icon: "🏦",
    title: { en: "Banks & pay", fr: "Banques & paiement", he: "בנקים ותשלום" },
    group: "daily",
    match: (r) => subHas(r, "banking", "payments", "credit card", "currency") || /^(bit|paybox)\b/i.test(r.name_en || ""),
  },
  {
    id: "health",
    icon: "🩺",
    title: { en: "Health", fr: "Santé", he: "בריאות" },
    group: "daily",
    match: (r) =>
      catOf(r, "Health & Family") ||
      subOf(r, "Healthcare") ||
      subHas(r, "health clinic", "medical center", "health emergency", "urgent care", "health fund"),
  },
  {
    id: "pharmacy",
    icon: "💊",
    title: { en: "Pharmacy", fr: "Pharmacie", he: "בית מרקחת" },
    group: "daily",
    match: (r) => subHas(r, "pharmacy") || /super-pharm|super pharm|good pharm/i.test(r.name_en || ""),
  },
  {
    id: "packages",
    icon: "📬",
    title: { en: "Packages", fr: "Colis", he: "חבילות" },
    group: "daily",
    match: (r) => subHas(r, "package forwarding", "postal") || /dhl|fedex|ups/i.test(r.name_en || ""),
  },
  {
    id: "shops",
    icon: "🛍️",
    title: { en: "Shops", fr: "Commerces", he: "חנויות" },
    group: "daily",
    match: (r) => {
      if (catOf(r, "Ra'anana Businesses") && !isFoodRecord(r) && !subHas(r, "pharmacy")) return true;
      if (subHas(r, "shopping center", "fashion", "electronics", "home &", "apple products")) return true;
      return false;
    },
  },
  {
    id: "home-setup",
    icon: "🏠",
    title: { en: "Home & bills", fr: "Maison & factures", he: "בית וחשבונות" },
    group: "daily",
    match: (r) =>
      subHas(r, "telecom", "electricity", "water", "gas", "housing", "home services", "municipal finance", "arnona", "sanitation"),
  },
  {
    id: "apps",
    icon: "📱",
    title: { en: "Apps", fr: "Applis", he: "אפליקציות" },
    group: "daily",
    match: (r) => catOf(r, "Essential Apps") || r.record_type === "mobile_app",
  },
  {
    id: "schools",
    icon: "🎒",
    title: { en: "Schools", fr: "Écoles", he: "בתי ספר" },
    group: "family",
    match: (r) =>
      catOf(r, "Education & Children") &&
      subHas(r, "school", "kindergarten", "education department", "education ministry", "new immigrant pupils", "special education"),
  },
  {
    id: "kids",
    icon: "🧸",
    title: { en: "Kids & camps", fr: "Enfants & activités", he: "ילדים וחוגים" },
    group: "family",
    match: (r) =>
      subHas(
        r,
        "after-school",
        "childcare",
        "youth",
        "child benefits",
        "student transport",
        "french-speaking children",
        "library",
        "school & family",
      ) || /o jardin|mashov/i.test(r.name_en || ""),
  },
  {
    id: "sports",
    icon: "🏊",
    title: { en: "Sports", fr: "Sport", he: "ספורט" },
    group: "family",
    match: (r) => subHas(r, "sports") || /tennis|swimming|lev hapark/i.test(r.name_en || ""),
  },
  {
    id: "parks",
    icon: "🌳",
    title: { en: "Parks", fr: "Parcs", he: "פארקים" },
    group: "family",
    match: (r) => subHas(r, "parks") || /ra'anana park|ra’anana park/i.test(r.name_en || ""),
  },
  {
    id: "synagogues",
    icon: "✡️",
    title: { en: "Synagogues", fr: "Synagogues", he: "בתי כנסת" },
    group: "family",
    match: (r) => r.record_type === "synagogue" || subOf(r, "Synagogue"),
  },
  {
    id: "community",
    icon: "👥",
    title: { en: "Community", fr: "Communauté", he: "קהילה" },
    group: "family",
    match: (r) =>
      catOf(r, "Religion & Community") && r.record_type !== "synagogue" && !subOf(r, "Synagogue"),
  },
  {
    id: "city-hall",
    icon: "🏛️",
    title: { en: "City hall", fr: "Mairie", he: "עירייה" },
    group: "city",
    match: (r) =>
      catOf(r, "Ra'anana Local Services") &&
      (subHas(r, "municipal", "citizen advice", "business", "planning", "pets", "culture") ||
        /municipality/i.test(r.name_en || "")),
  },
  {
    id: "olim",
    icon: "✈️",
    title: { en: "Olim desk", fr: "Bureau olim", he: "קליטת עלייה" },
    group: "city",
    match: (r) =>
      subHas(r, "new immigrant", "aliyah", "young adults", "olim") ||
      /my aliyah|absorption/i.test(r.name_en || ""),
  },
  {
    id: "government",
    icon: "🇮🇱",
    title: { en: "Government", fr: "État & Alya", he: "ממשלה ועלייה" },
    group: "city",
    match: (r) => catOf(r, "Government, Aliyah & Rights"),
  },
  {
    id: "work",
    icon: "💼",
    title: { en: "Work & Hebrew", fr: "Travail & hébreu", he: "עבודה ועברית" },
    group: "city",
    match: (r) =>
      catOf(r, "Money, Jobs, Language & Community") ||
      subHas(r, "jobs", "language", "learning hebrew"),
  },
  {
    id: "directories",
    icon: "🔎",
    title: { en: "Live search", fr: "Recherche live", he: "חיפוש חי" },
    group: "city",
    match: (r) => catOf(r, "Directories & Live Search"),
  },
  {
    id: "shelters",
    icon: "🛡️",
    title: { en: "Shelters", fr: "Abris", he: "מקלטים" },
    group: "help",
    caveat: "shelter",
    match: (r) => r.record_type === "public_shelter" || catOf(r, "Safety & Public Shelters"),
  },
  {
    id: "emergency-list",
    icon: "📞",
    title: { en: "Important numbers", fr: "Numéros utiles", he: "מספרים חשובים" },
    group: "help",
    match: (r) => catOf(r, "Emergency & Important Numbers"),
  },
];

export const PAGE_LAUNCHERS: Launcher[] = [
  { id: "map", icon: "🗺️", title: { en: "Map", fr: "Carte", he: "מפה" }, group: "daily", to: "/map" },
  { id: "emergency", icon: "🚨", title: { en: "SOS", fr: "Urgence", he: "חירום" }, group: "help", to: "/emergency" },
  { id: "checklists", icon: "✅", title: { en: "Lists", fr: "Listes", he: "רשימות" }, group: "help", to: "/checklists" },
  { id: "glossary", icon: "א", title: { en: "Hebrew", fr: "Hébreu", he: "עברית" }, group: "help", to: "/glossary" },
  { id: "share", icon: "↗️", title: { en: "Share", fr: "Partager", he: "שיתוף" }, group: "help", to: "/share" },
  { id: "settings", icon: "⚙️", title: { en: "Settings", fr: "Réglages", he: "הגדרות" }, group: "help", to: "/settings" },
];

export const QUICK_APPS = ["APP-003", "APP-004", "APP-027", "APP-008", "APP-012", "APP-005"] as const;

export const GROUP_TITLES: Record<FolderGroup, Copy> = {
  food: { en: "Food", fr: "Manger", he: "אוכל" },
  daily: { en: "Daily", fr: "Quotidien", he: "יומיום" },
  family: { en: "Family", fr: "Famille", he: "משפחה" },
  city: { en: "City", fr: "Ville", he: "עיר" },
  help: { en: "Help", fr: "Aide", he: "עזרה" },
};

const folderById = new Map(FOLDERS.map((f) => [f.id, f]));

export function getFolder(id: string | undefined): Folder | undefined {
  if (!id) return undefined;
  return folderById.get(id);
}

export function folderLabel(folder: { title: Copy }, lang: Lang): string {
  return folder.title[lang];
}

export function groupLabel(group: FolderGroup, lang: Lang): string {
  return GROUP_TITLES[group][lang];
}

/** Home daily/family/city/help icons — skip food (shown as featured tiles) and skip the catch-all food folder. */
export function homeLaunchers(group: Exclude<FolderGroup, "food">): Launcher[] {
  const skip = new Set(["food"]);
  const fromFolders: Launcher[] = FOLDERS.filter((f) => f.group === group && !skip.has(f.id)).map((f) => ({
    id: f.id,
    icon: f.icon,
    title: f.title,
    group: f.group,
    to: `/d/${f.id}`,
  }));
  return [...PAGE_LAUNCHERS.filter((p) => p.group === group), ...fromFolders];
}

export function foodHomeFolders(): Folder[] {
  return FOLDERS.filter((f) => f.group === "food" && f.featured);
}

export function foodAllFolders(): Folder[] {
  return FOLDERS.filter((f) => f.group === "food" && f.id !== "food");
}

export function recordsInFolder(folder: Folder): Resource[] {
  return records.filter(folder.match).sort(sortDirectory);
}

export function folderCount(folder: Folder): number {
  return records.filter(folder.match).length;
}

export function sortDirectory(a: Resource, b: Resource): number {
  const pa = a.is_physical_location ? 0 : 1;
  const pb = b.is_physical_location ? 0 : 1;
  if (pa !== pb) return pa - pb;
  const da = a.distance_from_home_km_est ?? 999;
  const db = b.distance_from_home_km_est ?? 999;
  if (da !== db) return da - db;
  return priorityScore(b.priority) - priorityScore(a.priority);
}
