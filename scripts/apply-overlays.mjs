/**
 * Apply checked-in data overlays to src/data/records.json.
 *
 * Overlay files live in data/overlays/*.json with the shape:
 *   { "patch": [{ "record_id": "...", ...fields }], "add": [{ ...record }] }
 *
 * Patches merge fields into existing records; adds append new records with
 * defaults, computed search_text, and distance estimates from the default
 * home pin. Idempotent: re-running produces identical output.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const recordsPath = join(root, "src/data/records.json");
const metaPath = join(root, "src/data/meta.json");
const overlaysDir = join(root, "data/overlays");

const HOME = { lat: 32.18205, lng: 34.87548 };
const WALK_FACTOR = 1.18;
const WALK_KMH = 4.8;
const DRIVE_FACTOR = 1.25;
const DRIVE_KMH = 24;
const DRIVE_OVERHEAD_MIN = 1.5;

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function distanceFields(lat, lng) {
  const straight = haversineKm(HOME.lat, HOME.lng, lat, lng);
  const walkKm = Math.round(straight * WALK_FACTOR * 10) / 10;
  const walkMin = Math.max(1, Math.round((straight * WALK_FACTOR * 60) / WALK_KMH));
  const driveMin = Math.max(3, Math.round((straight * DRIVE_FACTOR * 60) / DRIVE_KMH + DRIVE_OVERHEAD_MIN));
  return {
    distance_from_home_km_est: walkKm,
    walking_time_from_home_min_est: walkMin,
    driving_time_from_home_min_est_off_peak: driveMin,
    distance_from_home_display: `${walkKm} km est.; ${walkMin} min walk; ${driveMin} min drive off-peak`,
    travel_estimate_status: "Estimated from mapped coordinates; use live directions for current routing.",
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

function slugify(name, id) {
  const base = String(name || "place")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/['’"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base}-${id.toLowerCase()}`;
}

const DEFAULTS = {
  subcategory: null,
  name_he: null,
  name_fr: null,
  description_en: null,
  description_fr: null,
  audience: null,
  priority: null,
  scope: "Ra'anana",
  city: "Ra'anana",
  neighborhood: null,
  address_en: null,
  address_he: null,
  is_raanana: true,
  is_physical_location: true,
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
  hours_structured: null,
  eligibility_requirements: null,
  cost_fee_notes: null,
  delivery_coverage: null,
  search_aliases: null,
  tags: null,
  search_text: null,
  source_url_primary: null,
  source_url_secondary: null,
  source_type: "OpenStreetMap",
  verification_status: "Location from OpenStreetMap; verify details before relying on them",
  last_verified: "2026-08-28",
  recommended_review_days: 180,
  data_confidence: "Medium",
  notes: null,
};

function main() {
  const records = JSON.parse(readFileSync(recordsPath, "utf8"));
  const meta = JSON.parse(readFileSync(metaPath, "utf8"));
  const byId = new Map(records.map((r) => [r.record_id, r]));
  if (!existsSync(overlaysDir)) {
    console.log("overlays: none found");
    return;
  }
  const files = readdirSync(overlaysDir).filter((f) => f.endsWith(".json")).sort();
  let patched = 0;
  let added = 0;
  for (const file of files) {
    const overlay = JSON.parse(readFileSync(join(overlaysDir, file), "utf8"));
    for (const patch of overlay.patch || []) {
      const target = byId.get(patch.record_id);
      if (!target) {
        console.warn(`overlays: patch target ${patch.record_id} not found (${file})`);
        continue;
      }
      Object.assign(target, patch);
      if (target.latitude_est != null && target.longitude_est != null && patch.latitude_est != null) {
        Object.assign(target, distanceFields(target.latitude_est, target.longitude_est));
      }
      target.search_text = searchText(target);
      patched += 1;
    }
    for (const add of overlay.add || []) {
      if (byId.has(add.record_id)) continue; // idempotent
      const record = { ...DEFAULTS, ...add };
      if (!record.slug) record.slug = slugify(record.name_en, record.record_id);
      if (record.latitude_est != null && record.longitude_est != null) {
        Object.assign(record, distanceFields(record.latitude_est, record.longitude_est));
        if (!record.coordinate_confidence) record.coordinate_confidence = "Mapped point / high-confidence (OSM)";
      }
      record.search_text = searchText(record);
      records.push(record);
      byId.set(record.record_id, record);
      added += 1;
    }
  }
  meta.record_count = records.length;
  meta.categories = [...new Set(records.map((r) => r.category))].sort();
  meta.record_types = [...new Set(records.map((r) => r.record_type))].sort();
  writeFileSync(recordsPath, JSON.stringify(records));
  writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  console.log(`overlays: patched ${patched}, added ${added}, total ${records.length}`);
}

main();
