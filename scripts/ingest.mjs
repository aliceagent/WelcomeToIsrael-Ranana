/**
 * Ingest the master dataset into a public client bundle.
 * Strips the private home origin and home-route URLs, then merges
 * Knowledge Base leftovers that were not remapped into the master.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rawMaster = join(root, "data/raw/Raanana_New_Immigrant_Master_Dataset.json");
const outRecords = join(root, "src/data/records.json");
const outMeta = join(root, "src/data/meta.json");

const PRIVATE_FIELDS = [
  "walking_directions_from_home_url",
  "driving_directions_from_home_url",
];

const STREET_LEAK = /eliezer\s*yafe\s*9|9\s*\+?eliezer|origin=9\+/i;

function blankToNull(value) {
  if (value === "" || value === undefined) return null;
  return value;
}

function emptyRecord(overrides) {
  return {
    record_id: "",
    slug: "",
    record_type: "information_resource",
    category: "",
    subcategory: null,
    name_en: null,
    name_he: null,
    name_fr: null,
    description_en: null,
    description_fr: null,
    audience: null,
    priority: null,
    scope: null,
    city: null,
    neighborhood: null,
    address_en: null,
    address_he: null,
    is_raanana: false,
    is_physical_location: false,
    phone_primary: null,
    phone_secondary: null,
    whatsapp_sms: null,
    email: null,
    languages: null,
    service_type: null,
    denomination_nusach: null,
    kosher_status: null,
    website_url: null,
    action_url: null,
    menu_order_url: null,
    google_maps_location_url: null,
    latitude_est: null,
    longitude_est: null,
    coordinate_confidence: null,
    distance_from_home_km_est: null,
    walking_time_from_home_min_est: null,
    driving_time_from_home_min_est_off_peak: null,
    distance_from_home_display: null,
    travel_estimate_status: null,
    availability_hours_note: null,
    eligibility_requirements: null,
    cost_fee_notes: null,
    delivery_coverage: null,
    search_aliases: null,
    tags: null,
    search_text: null,
    source_url_primary: null,
    source_url_secondary: null,
    source_type: null,
    verification_status: null,
    last_verified: "2026-08-27",
    recommended_review_days: 90,
    data_confidence: "Medium",
    notes: null,
    ...overrides,
  };
}

function searchText(r) {
  return [
    r.name_en,
    r.name_he,
    r.name_fr,
    r.description_en,
    r.description_fr,
    r.category,
    r.subcategory,
    r.search_aliases,
    r.tags,
    r.address_en,
    r.address_he,
    r.phone_primary,
    r.service_type,
  ]
    .filter(Boolean)
    .join(" | ");
}

const leftovers = [
  emptyRecord({
    record_id: "LOC-014",
    slug: "lev-hapark-community-center-loc-014",
    record_type: "physical_service",
    category: "Ra'anana Local Services",
    subcategory: "Sports",
    name_en: "Lev HaPark community and sports center",
    name_he: "לב הפארק",
    name_fr: "Centre communautaire et sportif Lev HaPark",
    description_en: "Community activities and sports facilities; programs change by season.",
    description_fr: "Activités communautaires et installations sportives ; les programmes changent selon la saison.",
    audience: "Families",
    priority: "Useful local",
    scope: "Ra'anana",
    city: "Ra'anana",
    address_en: "3 Yair Stern Street",
    is_raanana: true,
    is_physical_location: true,
    phone_primary: "09-770-0700",
    website_url: "https://www.raanana.muni.il/",
    google_maps_location_url:
      "https://www.google.com/maps/search/?api=1&query=Lev+HaPark+Yair+Stern+3+Raanana",
    coordinate_confidence: "Street-centroid estimate",
    distance_from_home_km_est: 2.8,
    walking_time_from_home_min_est: 35,
    driving_time_from_home_min_est_off_peak: 10,
    distance_from_home_display: "2.8 km est.; 35 min walk; 10 min drive off-peak",
    travel_estimate_status: "Estimated from street-level coordinates; use live directions for current routing.",
    tags: "sports, community center, classes",
    search_aliases: "Lev HaPark; לב הפארק; piscine; sport; community center",
    source_url_primary: "https://www.raanana.muni.il/",
    source_type: "Municipal listing",
    verification_status: "Official municipal listing; verify schedules",
    recommended_review_days: 90,
  }),
  emptyRecord({
    record_id: "LOC-015",
    slug: "municipal-swimming-center-loc-015",
    record_type: "physical_service",
    category: "Ra'anana Local Services",
    subcategory: "Sports",
    name_en: "Municipal swimming center",
    name_he: "הבריכה העירונית",
    name_fr: "Centre de natation municipal",
    description_en: "Municipal swimming facilities and classes; verify membership, hours and seasonal schedule.",
    description_fr: "Piscine municipale et cours ; vérifier adhésion, horaires et calendrier saisonnier.",
    audience: "Families",
    priority: "Useful local",
    scope: "Ra'anana",
    city: "Ra'anana",
    address_en: "1 Yair Stern Street",
    is_raanana: true,
    is_physical_location: true,
    phone_primary: "09-770-0700",
    website_url: "https://www.raanana.muni.il/",
    google_maps_location_url:
      "https://www.google.com/maps/search/?api=1&query=Municipal+swimming+center+Yair+Stern+1+Raanana",
    coordinate_confidence: "Street-centroid estimate",
    distance_from_home_km_est: 2.8,
    walking_time_from_home_min_est: 35,
    driving_time_from_home_min_est_off_peak: 10,
    distance_from_home_display: "2.8 km est.; 35 min walk; 10 min drive off-peak",
    travel_estimate_status: "Estimated from street-level coordinates; use live directions for current routing.",
    tags: "swimming, pool, sports, piscine",
    search_aliases: "pool; piscine; בריכה; swimming",
    source_url_primary: "https://www.raanana.muni.il/",
    source_type: "Municipal listing",
    verification_status: "Official municipal listing; verify schedules",
  }),
  emptyRecord({
    record_id: "LOC-016",
    slug: "municipal-tennis-center-loc-016",
    record_type: "physical_service",
    category: "Ra'anana Local Services",
    subcategory: "Sports",
    name_en: "Municipal tennis center",
    name_he: "מרכז הטניס העירוני",
    name_fr: "Centre de tennis municipal",
    description_en: "Tennis courts, lessons and programs.",
    description_fr: "Courts de tennis, cours et programmes.",
    audience: "Families",
    priority: "Useful local",
    scope: "Ra'anana",
    city: "Ra'anana",
    address_en: "72 HaGanah Street",
    is_raanana: true,
    is_physical_location: true,
    phone_primary: "09-774-3828",
    website_url: "https://www.raanana.muni.il/",
    google_maps_location_url:
      "https://www.google.com/maps/search/?api=1&query=Municipal+tennis+center+Haganah+72+Raanana",
    coordinate_confidence: "Street-centroid estimate",
    distance_from_home_km_est: 2.3,
    walking_time_from_home_min_est: 29,
    driving_time_from_home_min_est_off_peak: 9,
    distance_from_home_display: "2.3 km est.; 29 min walk; 9 min drive off-peak",
    travel_estimate_status: "Estimated from street-level coordinates; use live directions for current routing.",
    tags: "tennis, sports, lessons",
    search_aliases: "tennis; טניס",
    source_url_primary: "https://www.raanana.muni.il/",
    source_type: "Municipal listing",
    verification_status: "Official municipal listing; verify schedules",
  }),
  emptyRecord({
    record_id: "EDU-019",
    slug: "o-jardin-francais-edu-019",
    record_type: "information_resource",
    category: "Education & Children",
    subcategory: "French-speaking children",
    name_en: "O Jardin Français",
    name_he: "או ז'רדן פרנסה",
    name_fr: "O Jardin Français",
    description_en:
      "French-language educational and cultural activities for children in the Ra'anana–Herzliya area. Confirm current age groups and schedule.",
    description_fr:
      "Activités éducatives et culturelles en français pour enfants dans la région de Ra'anana–Herzliya. Vérifier les groupes d'âge et le calendrier.",
    audience: "French speakers",
    priority: "Useful for French speakers",
    scope: "Ra'anana",
    city: "Ra'anana",
    is_raanana: true,
    is_physical_location: false,
    email: "isabelle.yohanna@jardinfrancais.org",
    languages: "French",
    website_url: "https://www.jardinfrancais.org/",
    tags: "French, children, education, culture",
    search_aliases: "Jardin Francais; français; French school; enfants",
    source_url_primary: "https://www.jardinfrancais.org/",
    source_type: "Established nonprofit",
    verification_status: "Official organization website; verify current program location",
    recommended_review_days: 180,
  }),
  emptyRecord({
    record_id: "LOC-017",
    slug: "raanana-young-olim-programs-loc-017",
    record_type: "information_resource",
    category: "Ra'anana Local Services",
    subcategory: "Young adults",
    name_en: "Ra'anana young olim programs",
    name_he: "תוכניות עולים צעירים רעננה",
    name_fr: "Programmes pour jeunes olim de Ra'anana",
    description_en: "Municipal programs and events for young immigrants; availability can change.",
    description_fr: "Programmes et événements municipaux pour jeunes immigrants ; l'offre change.",
    audience: "New olim",
    priority: "Useful",
    scope: "Ra'anana",
    city: "Ra'anana",
    is_raanana: true,
    is_physical_location: false,
    languages: "English, French, Spanish, Hebrew",
    website_url: "https://www.raanana.muni.il/cityhall/olim/",
    tags: "young olim, events, community",
    search_aliases: "young olim; jeunes olim; עולים צעירים",
    source_url_primary: "https://www.raanana.muni.il/cityhall/olim/",
    source_type: "Municipal listing",
    verification_status: "Official municipal portal; verify current programs",
  }),
  emptyRecord({
    record_id: "TRN-030",
    slug: "golan-telecom-trn-030",
    record_type: "information_resource",
    category: "Transport, Utilities & Housing",
    subcategory: "Telecom",
    name_en: "Golan Telecom",
    name_he: "גולן טלקום",
    name_fr: "Golan Telecom",
    description_en: "Mobile-phone plans; compare coverage, roaming and customer service.",
    description_fr: "Forfaits mobiles ; comparer couverture, roaming et service client.",
    audience: "Households",
    priority: "Useful",
    scope: "Israel",
    is_raanana: false,
    is_physical_location: false,
    website_url: "https://www.golantelecom.co.il/",
    tags: "mobile, SIM, roaming",
    search_aliases: "Golan; גולן; SIM; cell phone",
    source_url_primary: "https://www.golantelecom.co.il/",
    source_type: "Official provider website",
    verification_status: "Official provider; plan terms dynamic",
  }),
  emptyRecord({
    record_id: "DEL-065",
    slug: "dhl-israel-del-065",
    record_type: "online_retailer_or_delivery",
    category: "Delivery & Online Shopping",
    subcategory: "Package forwarding",
    name_en: "DHL Israel",
    name_he: "DHL ישראל",
    name_fr: "DHL Israël",
    description_en: "International courier tracking, customs processing and delivery support.",
    description_fr: "Suivi de colis international, douane et livraison.",
    audience: "Households and online shoppers",
    priority: "Useful",
    scope: "International",
    is_raanana: false,
    is_physical_location: false,
    website_url: "https://www.dhl.com/il-en/home.html",
    delivery_coverage: "International",
    tags: "courier, international delivery, customs, tracking",
    search_aliases: "DHL; courier; colis; משלוח בינלאומי",
    source_url_primary: "https://www.dhl.com/il-en/home.html",
    source_type: "Official provider website",
    verification_status: "Official courier website; fees and brokerage vary",
    recommended_review_days: 180,
  }),
  emptyRecord({
    record_id: "DEL-066",
    slug: "fedex-israel-del-066",
    record_type: "online_retailer_or_delivery",
    category: "Delivery & Online Shopping",
    subcategory: "Package forwarding",
    name_en: "FedEx Israel",
    name_he: "FedEx ישראל",
    name_fr: "FedEx Israël",
    description_en: "International courier tracking, customs processing and delivery support.",
    description_fr: "Suivi de colis international, douane et livraison.",
    audience: "Households and online shoppers",
    priority: "Useful",
    scope: "International",
    website_url: "https://www.fedex.com/en-il/home.html",
    delivery_coverage: "International",
    tags: "courier, international delivery, customs, tracking",
    search_aliases: "FedEx; courier; colis",
    source_url_primary: "https://www.fedex.com/en-il/home.html",
    source_type: "Official provider website",
    verification_status: "Official courier website; fees and brokerage vary",
    recommended_review_days: 180,
  }),
  emptyRecord({
    record_id: "DEL-067",
    slug: "ups-israel-del-067",
    record_type: "online_retailer_or_delivery",
    category: "Delivery & Online Shopping",
    subcategory: "Package forwarding",
    name_en: "UPS Israel",
    name_he: "UPS ישראל",
    name_fr: "UPS Israël",
    description_en: "International courier tracking, customs processing and delivery support.",
    description_fr: "Suivi de colis international, douane et livraison.",
    audience: "Households and online shoppers",
    priority: "Useful",
    scope: "International",
    website_url: "https://www.ups.com/il/en/Home.page",
    delivery_coverage: "International",
    tags: "courier, international delivery, customs, tracking",
    search_aliases: "UPS; courier; colis",
    source_url_primary: "https://www.ups.com/il/en/Home.page",
    source_type: "Official provider website",
    verification_status: "Official courier website; fees and brokerage vary",
    recommended_review_days: 180,
  }),
];

for (const r of leftovers) {
  r.search_text = searchText(r);
}

function sanitize(record) {
  const next = { ...record };
  for (const field of PRIVATE_FIELDS) {
    delete next[field];
  }
  for (const [key, value] of Object.entries(next)) {
    if (typeof value === "string") {
      if (STREET_LEAK.test(value) && (key.includes("url") || key.includes("origin") || key === "notes" || key === "travel_estimate_status" || key === "distance_method")) {
        next[key] = key.includes("url") ? null : "Estimated from a private home pin; use live directions on device.";
      }
      if (next[key] === "") next[key] = null;
    }
  }
  if (typeof next.search_text === "string") {
    next.search_text = next.search_text.replace(/9\s*Eliezer Yafe[^|]*/gi, "").trim();
  }
  return next;
}

function main() {
  if (!existsSync(rawMaster)) {
    if (existsSync(outRecords)) {
      console.log("ingest: raw master missing; using existing src/data/records.json");
      return;
    }
    throw new Error(`Missing ${rawMaster} and no existing records.json`);
  }

  const source = JSON.parse(readFileSync(rawMaster, "utf8"));
  const cleaned = source.records.map(sanitize);
  const existing = new Set(cleaned.map((r) => r.record_id));
  for (const extra of leftovers) {
    if (!existing.has(extra.record_id)) cleaned.push(sanitize(extra));
  }

  for (const rec of cleaned) {
    const blob = JSON.stringify(rec);
    if (STREET_LEAK.test(blob)) {
      throw new Error(`Private origin leaked in ${rec.record_id}`);
    }
  }

  const categories = [...new Set(cleaned.map((r) => r.category))].sort();
  const types = [...new Set(cleaned.map((r) => r.record_type))].sort();

  const meta = {
    dataset_name: "Welcome to Ra'anana",
    generated_on: source.metadata?.generated_on ?? "2026-08-27",
    record_count: cleaned.length,
    languages: ["en", "fr", "he"],
    distance_method: source.metadata?.distance_method ?? null,
    home_default: {
      lat: 32.18205,
      lng: 34.87548,
      label: "Ra'anana",
    },
    install_first: [
      "APP-001",
      "APP-003",
      "APP-004",
      "APP-005",
      "APP-008",
      "APP-009",
      "APP-019",
      "APP-012",
      "APP-024",
      "APP-014",
    ],
    emergency_strip: ["EMG-001", "EMG-002", "EMG-003", "EMG-005"],
    categories,
    record_types: types,
    privacy_note:
      "Home street address is not published. Distances are estimates from a family home pin. Live directions are generated on-device.",
  };

  // Resolve emergency strip by phone if IDs differ
  const byPhone = new Map();
  for (const r of cleaned) {
    if (r.phone_primary) byPhone.set(String(r.phone_primary).replace(/\s/g, ""), r.record_id);
  }
  meta.emergency_strip = ["100", "101", "102", "104", "107 / *9107"]
    .map((p) => {
      const compact = p.split("/")[0].trim();
      return (
        cleaned.find((r) => (r.phone_primary || "").startsWith(compact) && r.category === "Emergency & Important Numbers")
          ?.record_id || null
      );
    })
    .filter(Boolean);

  mkdirSync(dirname(outRecords), { recursive: true });
  writeFileSync(outRecords, JSON.stringify(cleaned));
  writeFileSync(outMeta, JSON.stringify(meta, null, 2));
  console.log(`ingest: wrote ${cleaned.length} records, ${categories.length} categories`);
}

main();
