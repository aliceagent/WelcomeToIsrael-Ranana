import type { Lang, Resource } from "./types.js";

const PRIORITY_SCORE: Record<string, number> = {
  Critical: 100,
  "Critical local": 98,
  Essential: 90,
  "Essential local": 88,
  "Essential for new olim": 88,
  "Essential if driving": 86,
  "Essential if using transit": 86,
  "Essential convenience": 84,
  "Essential for international orders": 84,
  High: 80,
  "High local value": 75,
  "High for home setup": 75,
  "High for families": 74,
  "High when applicable": 72,
  "High when relevant": 72,
  "High for French citizens": 72,
  "High for U.S. citizens": 72,
  Recommended: 70,
  "Useful local": 65,
  Useful: 60,
  "Useful for families": 60,
  "Useful for French speakers": 60,
  "Useful for French shoppers": 60,
  "Community resource": 55,
  "Bank option": 50,
  "Health fund option": 50,
  "Card-provider option": 50,
  "Install if instructed": 45,
  "Install/use if instructed": 45,
  Optional: 30,
};

export function priorityScore(p: string | null): number {
  if (!p) return 40;
  return PRIORITY_SCORE[p] ?? 40;
}

const PRIORITY_LABELS: Record<string, { fr: string; he: string }> = {
  Critical: { fr: "Vital", he: "קריטי" },
  "Critical local": { fr: "Vital sur place", he: "קריטי מקומי" },
  Essential: { fr: "Essentiel", he: "חיוני" },
  "Essential local": { fr: "Essentiel sur place", he: "חיוני מקומי" },
  "Essential for new olim": { fr: "Essentiel pour les olim", he: "חיוני לעולים חדשים" },
  "Essential if driving": { fr: "Essentiel si vous conduisez", he: "חיוני לנהגים" },
  "Essential if using transit": { fr: "Essentiel en transports", he: "חיוני בתחבורה ציבורית" },
  "Essential convenience": { fr: "Confort essentiel", he: "נוחות חיונית" },
  "Essential for international orders": { fr: "Essentiel pour les commandes à l'étranger", he: "חיוני להזמנות מחו״ל" },
  High: { fr: "Important", he: "חשוב" },
  "High local value": { fr: "Très utile sur place", he: "ערך מקומי גבוה" },
  "High for home setup": { fr: "Important pour s'installer", he: "חשוב להתארגנות בבית" },
  "High for families": { fr: "Important pour les familles", he: "חשוב למשפחות" },
  "High when applicable": { fr: "Important le cas échéant", he: "חשוב במקרים רלוונטיים" },
  "High when relevant": { fr: "Important si concerné", he: "חשוב כשרלוונטי" },
  "High for French citizens": { fr: "Important pour les citoyens français", he: "חשוב לאזרחים צרפתים" },
  "High for U.S. citizens": { fr: "Important pour les citoyens américains", he: "חשוב לאזרחים אמריקאים" },
  Recommended: { fr: "Recommandé", he: "מומלץ" },
  "Useful local": { fr: "Utile sur place", he: "שימושי מקומי" },
  Useful: { fr: "Utile", he: "שימושי" },
  "Useful for families": { fr: "Utile pour les familles", he: "שימושי למשפחות" },
  "Useful for French speakers": { fr: "Utile pour les francophones", he: "שימושי לדוברי צרפתית" },
  "Useful for French shoppers": { fr: "Utile pour les acheteurs francophones", he: "שימושי לקונים דוברי צרפתית" },
  "Community resource": { fr: "Ressource communautaire", he: "משאב קהילתי" },
  "Bank option": { fr: "Option bancaire", he: "אפשרות בנק" },
  "Health fund option": { fr: "Option de caisse maladie", he: "אפשרות קופת חולים" },
  "Card-provider option": { fr: "Option de carte", he: "אפשרות חברת אשראי" },
  "Install if instructed": { fr: "À installer si demandé", he: "להתקין לפי הנחיה" },
  "Install/use if instructed": { fr: "À installer / utiliser si demandé", he: "להתקין או להשתמש לפי הנחיה" },
  Optional: { fr: "Facultatif", he: "רשות" },
};

export function priorityLabel(p: string | null, lang: Lang): string | null {
  if (!p) return null;
  if (lang === "en") return p;
  return PRIORITY_LABELS[p]?.[lang] ?? p;
}

export function displayName(r: Resource, lang: Lang): string {
  if (lang === "fr" && r.name_fr) return r.name_fr;
  if (lang === "he" && r.name_he) return r.name_he;
  return r.name_en || r.name_he || r.name_fr || r.record_id;
}

export function displayDescription(r: Resource, lang: Lang): string {
  if (lang === "fr" && r.description_fr) return r.description_fr;
  if (lang === "he" && r.description_he) return r.description_he;
  return r.description_en || r.description_fr || "";
}

export function slugifyCategory(category: string): string {
  return category
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const CATEGORY_ICONS: Record<string, string> = {
  "Delivery & Online Shopping": "🛍️",
  "Directories & Live Search": "🔎",
  "Education & Children": "🎒",
  "Emergency & Important Numbers": "🚨",
  "Essential Apps": "📱",
  "Government, Aliyah & Rights": "🏛️",
  "Health & Family": "🩺",
  "Hebrew & Orientation": "א",
  "Money, Jobs, Language & Community": "💼",
  "Newcomer Checklists": "✅",
  "Ra'anana Businesses": "🏪",
  "Ra'anana Local Services": "🌳",
  "Religion & Community": "✡️",
  "Safety & Public Shelters": "🛡️",
  "Transport, Utilities & Housing": "🚌",
};

export const TYPE_LABELS: Record<string, { en: string; fr: string; he: string }> = {
  important_phone_or_emergency_service: { en: "Emergency number", fr: "Numéro d'urgence", he: "מספר חירום" },
  synagogue: { en: "Synagogue", fr: "Synagogue", he: "בית כנסת" },
  public_shelter: { en: "Public shelter", fr: "Abri public", he: "מקלט ציבורי" },
  local_business: { en: "Local business", fr: "Commerce local", he: "עסק מקומי" },
  physical_service: { en: "Local service", fr: "Service local", he: "שירות מקומי" },
  online_retailer_or_delivery: { en: "Delivery / shop", fr: "Livraison / boutique", he: "חנות / משלוח" },
  mobile_app: { en: "App", fr: "Applis", he: "אפליקציה" },
  information_resource: { en: "Guide", fr: "Ressource", he: "מידע" },
  glossary_term: { en: "Hebrew term", fr: "Terme hébreu", he: "מונח" },
  checklist: { en: "Checklist", fr: "Liste", he: "רשימה" },
  directory: { en: "Live directory", fr: "Annuaire", he: "מדריך חי" },
};

export const HUBS = {
  emergency: {
    categories: ["Emergency & Important Numbers", "Safety & Public Shelters"],
  },
  arrived: {
    categories: ["Newcomer Checklists", "Essential Apps", "Government, Aliyah & Rights"],
  },
  around: {
    categories: ["Ra'anana Local Services", "Ra'anana Businesses", "Religion & Community", "Health & Family"],
  },
  shopping: {
    categories: ["Delivery & Online Shopping", "Directories & Live Search"],
  },
  family: {
    categories: ["Education & Children", "Health & Family"],
  },
  israel: {
    categories: ["Hebrew & Orientation", "Government, Aliyah & Rights", "Transport, Utilities & Housing", "Money, Jobs, Language & Community"],
  },
} as const;

/**
 * English (or French) fallback text rendered inside a Hebrew RTL page needs an
 * explicit LTR island or punctuation/numbers scramble.
 */
export function descriptionDir(r: Resource, lang: Lang): "ltr" | undefined {
  if (lang !== "he") return undefined;
  if (r.description_he) return undefined; // real Hebrew renders RTL
  return displayDescription(r, lang) ? "ltr" : undefined;
}
