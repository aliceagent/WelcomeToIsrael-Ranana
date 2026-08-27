import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const records = JSON.parse(readFileSync(join(root, "src/data/records.json"), "utf8"));
const meta = JSON.parse(readFileSync(join(root, "src/data/meta.json"), "utf8"));

export const SITE_FALLBACK = "https://welcome-to-raanana.vercel.app";

export function siteOrigin() {
  const env = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (env) return `https://${String(env).replace(/^https?:\/\//, "")}`;
  return SITE_FALLBACK;
}

const TYPE_LABEL = {
  important_phone_or_emergency_service: "Emergency number",
  synagogue: "Synagogue",
  public_shelter: "Public shelter",
  local_business: "Local place",
  physical_service: "Local service",
  online_retailer_or_delivery: "Delivery / shop",
  mobile_app: "App",
  information_resource: "Guide",
  glossary_term: "Hebrew term",
  checklist: "Checklist",
  directory: "Live directory",
};

export const FOLDERS = [
  { id: "restaurants", title: "Eat out", he: "מסעדות", kicker: "Food · Ra'anana", description: "Burgers, sushi, pizza, and grill in Ra'anana — hours to recheck before you go.", kind: "food" },
  { id: "bakeries", title: "Bakeries & cafés", he: "מאפיות ובתי קפה", kicker: "Food · Ra'anana", description: "Coffee, bread, bagels, and cafés in Ra'anana.", kind: "food" },
  { id: "groceries", title: "Groceries", he: "סופרמרקט", kicker: "Food · Ra'anana", description: "Supermarkets, produce, and grocery delivery for Ra'anana.", kind: "food" },
  { id: "order-in", title: "Order in", he: "משלוחי אוכל", kicker: "Food · Ra'anana", description: "Wolt, 10bis, Mishloha and local restaurant delivery.", kind: "food" },
  { id: "french-food", title: "French food", he: "אוכל צרפתי", kicker: "Food · Ra'anana", description: "Boulangeries, traiteurs, and French delis in Ra'anana.", kind: "food" },
  { id: "butcher", title: "Butcher", he: "קצבייה", kicker: "Food · Ra'anana", description: "Kosher butchers in Ra'anana. Confirm kashrut before you rely on it.", kind: "food" },
  { id: "grocery-delivery", title: "Grocery delivery", he: "משלוחי סופר", kicker: "Food · Ra'anana", description: "Shufersal, Rami Levy, Quik and other grocery delivery.", kind: "food" },
  { id: "treats", title: "Treats", he: "קינוחים", kicker: "Food · Ra'anana", description: "Ice cream and desserts in Ra'anana.", kind: "food" },
  { id: "food", title: "All food", he: "כל האוכל", kicker: "Food · Ra'anana", description: "Restaurants, bakeries, groceries, and delivery for daily life in Ra'anana.", kind: "food" },
  { id: "transit", title: "Transit", he: "תחבורה", kicker: "Daily · Ra'anana", description: "Buses, rail, Rav-Kav, Moovit, Gett and getting around.", kind: "place" },
  { id: "drive", title: "Drive & park", he: "נהיגה וחניה", kicker: "Daily · Ra'anana", description: "Waze, Pango, parking and driving apps for Ra'anana.", kind: "place" },
  { id: "banks", title: "Banks & pay", he: "בנקים ותשלום", kicker: "Daily · Ra'anana", description: "Banks, bit, PayBox and paying for everyday life in Israel.", kind: "app" },
  { id: "health", title: "Health", he: "בריאות", kicker: "Daily · Ra'anana", description: "Clinics, hospitals, and dentist help near Ra'anana — kupah first, Midrag for a dentist.", kind: "place" },
  { id: "pharmacy", title: "Pharmacy", he: "בית מרקחת", kicker: "Daily · Ra'anana", description: "Super-Pharm, Good Pharm and pharmacies in Ra'anana.", kind: "place" },
  { id: "packages", title: "Packages", he: "חבילות", kicker: "Daily · Ra'anana", description: "DHL, FedEx, UPS and package forwarding.", kind: "place" },
  { id: "shops", title: "Shops", he: "חנויות", kicker: "Daily · Ra'anana", description: "Local shops and errands in Ra'anana.", kind: "place" },
  { id: "home-help", title: "Handyman", he: "בעל מקצוע", kicker: "Daily · Ra'anana", description: "Electrician, plumber, hardware — start with Midrag or Home Center.", kind: "place" },
  { id: "phone-net", title: "Phone & internet", he: "טלפון ואינטרנט", kicker: "Daily · Ra'anana", description: "SIM, fiber, HOT, Cellcom, Partner and Golan.", kind: "place" },
  { id: "pets", title: "Pets", he: "חיות מחמד", kicker: "Family · Ra'anana", description: "Municipal vet, licensing, and pet setup in Ra'anana.", kind: "place" },
  { id: "home-setup", title: "Home & bills", he: "בית וחשבונות", kicker: "Daily · Ra'anana", description: "Electricity, water, gas, arnona and getting the house running.", kind: "place" },
  { id: "apps", title: "Apps", he: "אפליקציות", kicker: "Daily · Israel", description: "WhatsApp, Waze, bit and the other apps you actually need.", kind: "app" },
  { id: "schools", title: "Kids & school", he: "בית ספר וילדים", kicker: "Family · Ra'anana", description: "Schools, kindergarten, camps and after-school in one place.", kind: "place" },
  { id: "kids", title: "Kids & camps", he: "ילדים וחוגים", kicker: "Family · Ra'anana", description: "After-school, camps, libraries and kids' activities.", kind: "place" },
  { id: "sports", title: "Sports", he: "ספורט", kicker: "Family · Ra'anana", description: "Pools, tennis and sports in Ra'anana.", kind: "place" },
  { id: "parks", title: "Parks", he: "פארקים", kicker: "Family · Ra'anana", description: "Ra'anana Park and green space for families.", kind: "place" },
  { id: "synagogues", title: "Synagogues", he: "בתי כנסת", kicker: "Family · Ra'anana", description: "Synagogues and minyanim in Ra'anana.", kind: "place" },
  { id: "community", title: "Community", he: "קהילה", kicker: "Family · Ra'anana", description: "Community and religious life beyond the synagogue list.", kind: "place" },
  { id: "city-hall", title: "City hall", he: "עירייה", kicker: "City · Ra'anana", description: "Municipality, 107, and city services in Ra'anana.", kind: "place" },
  { id: "olim", title: "Olim desk", he: "קליטת עלייה", kicker: "City · Ra'anana", description: "Absorption, aliyah help and the local olim desk.", kind: "place" },
  { id: "government", title: "Government", he: "ממשלה ועלייה", kicker: "City · Israel", description: "Misrad hapnim, Bituach Leumi, and national rights.", kind: "place" },
  { id: "work", title: "Work & Hebrew", he: "עבודה ועברית", kicker: "City · Ra'anana", description: "Jobs, ulpan and Hebrew for settling in.", kind: "place" },
  { id: "directories", title: "Live search", he: "חיפוש חי", kicker: "City · Israel", description: "Midrag, Google Maps and live directories when we don't have the shop yet.", kind: "app" },
  { id: "shelters", title: "Shelters", he: "מקלטים", kicker: "Help · Ra'anana", description: "Public shelters near home. Recheck the physical door before you rely on it.", kind: "sos" },
  { id: "emergency-list", title: "Important numbers", he: "מספרים חשובים", kicker: "Help · Israel", description: "100, 101, 102, 104, 107 and the numbers to keep on the phone.", kind: "sos" },
];

export const PAGES = [
  { id: "home", path: "/", title: "Welcome to Ra'anana", he: "ברוכים הבאים לרעננה", kicker: "Daily directory", description: "Restaurants, groceries, schools, health, transit, and emergency numbers for English and French speakers in Ra'anana. Works offline.", kind: "home" },
  { id: "food", path: "/food", title: "Food in Ra'anana", he: "אוכל ברעננה", kicker: "Eat · Order · Shop", description: "Restaurants, bakeries, groceries, French food, and delivery — the daily food map for Ra'anana.", kind: "food" },
  { id: "ask", path: "/ask", title: "How do you need help in Israel?", he: "איך אפשר לעזור לכם בישראל?", kicker: "Ask · Directory", description: "Ask a question. We search the Ra'anana directory first, then answer with jump-to cards and general Israel help.", kind: "place" },
  { id: "search", path: "/search", title: "Search Ra'anana", he: "חיפוש", kicker: "Directory", description: "Find an electrician, pharmacy, dinner, school, or clinic in the Ra'anana directory.", kind: "place" },
  { id: "saved", path: "/saved", title: "Saved places", he: "שמורים", kicker: "Your list", description: "The Ra'anana places and apps you starred for later.", kind: "place" },
  { id: "emergency", path: "/emergency", title: "Need help now", he: "חירום", kicker: "SOS", description: "Police 100, MDA 101, Fire 102, Home Front 104, city 107, and nearby shelters.", kind: "sos" },
  { id: "map", path: "/map", title: "Map", he: "מפה", kicker: "Around home", description: "Places from the Ra'anana directory on a map, with walking and driving estimates.", kind: "place" },
  { id: "checklists", path: "/checklists", title: "Checklists", he: "רשימות", kicker: "Getting started", description: "Week-one lists for a family settling in Ra'anana.", kind: "place" },
  { id: "glossary", path: "/glossary", title: "Hebrew terms", he: "עברית", kicker: "Orientation", description: "Everyday Hebrew words for bills, health, and city life.", kind: "place" },
  { id: "share", path: "/share", title: "Share this guide", he: "שיתוף", kicker: "Welcome to Ra'anana", description: "Send the Ra'anana daily directory — food, apps, schools, and emergency numbers.", kind: "home" },
  { id: "settings", path: "/settings", title: "Settings", he: "הגדרות", kicker: "Welcome to Ra'anana", description: "Language and home pin for the Ra'anana daily directory.", kind: "place" },
  { id: "more", path: "/more", title: "More", he: "עוד", kicker: "Welcome to Ra'anana", description: "Map, checklists, glossary, and settings.", kind: "place" },
];

export function slugifyCategory(category) {
  return category.toLowerCase().replace(/['’]/g, "").replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function kindForRecord(rec) {
  if (rec.record_type === "important_phone_or_emergency_service" || rec.record_type === "public_shelter") return "sos";
  if (rec.record_type === "mobile_app") return "app";
  const blob = `${rec.category || ""} ${rec.subcategory || ""} ${rec.name_en || ""}`;
  if (/restaurant|cafe|bakery|grocery|pizza|sushi|butcher|ice cream|food|deli|grill/i.test(blob)) return "food";
  if (rec.record_type === "online_retailer_or_delivery") return "app";
  return "place";
}

export function recordDescription(rec) {
  const type = TYPE_LABEL[rec.record_type] || "Listing";
  const where = rec.is_raanana ? "in Ra'anana" : rec.city ? `in ${rec.city}` : "in the Ra'anana directory";
  const base = (rec.description_en || rec.description_fr || "").replace(/\s+/g, " ").trim();
  if (base.length >= 28) return base;
  const name = rec.name_en || rec.name_he || rec.record_id;
  const extra = rec.subcategory ? `${rec.subcategory} ` : "";
  const phone = rec.phone_primary ? ` Call ${rec.phone_primary}.` : "";
  if (base) return `${base} ${name} is a ${extra}${type} ${where}.${phone}`.replace(/\s+/g, " ").trim();
  return `${name} — ${extra}${type} ${where}.${phone} From Welcome to Ra'anana.`.replace(/\s+/g, " ").trim();
}

export function recordCard(rec) {
  const type = TYPE_LABEL[rec.record_type] || rec.category || "Listing";
  const kickerParts = [type];
  if (rec.subcategory && rec.subcategory !== type) kickerParts.push(rec.subcategory);
  if (rec.is_raanana) kickerParts.push("Ra'anana");
  return {
    id: `e-${rec.slug}`,
    path: `/e/${rec.slug}`,
    image: `/og/e/${rec.slug}.png`,
    title: rec.name_en || rec.name_he || rec.record_id,
    he: rec.name_he && rec.name_he !== rec.name_en ? rec.name_he : "",
    kicker: kickerParts.slice(0, 3).join(" · "),
    description: recordDescription(rec),
    kind: kindForRecord(rec),
  };
}

export function allCards() {
  const cards = [];
  for (const p of PAGES) {
    cards.push({
      id: `p-${p.id}`,
      path: p.path,
      image: p.id === "home" ? "/og/default.png" : `/og/p/${p.id}.png`,
      title: p.title,
      he: p.he,
      kicker: p.kicker,
      description: p.description,
      kind: p.kind,
    });
  }
  for (const f of FOLDERS) {
    cards.push({
      id: `d-${f.id}`,
      path: `/d/${f.id}`,
      image: `/og/d/${f.id}.png`,
      title: f.title,
      he: f.he,
      kicker: f.kicker,
      description: f.description,
      kind: f.kind,
    });
  }
  for (const c of meta.categories) {
    const slug = slugifyCategory(c);
    cards.push({
      id: `c-${slug}`,
      path: `/c/${slug}`,
      image: `/og/c/${slug}.png`,
      title: c,
      he: "",
      kicker: "Category · Ra'anana",
      description: `Browse ${c} in Welcome to Ra'anana — the daily directory for English and French speakers.`,
      kind: "place",
    });
  }
  for (const rec of records) cards.push(recordCard(rec));
  return cards;
}

export { records, meta };
