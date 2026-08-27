import recordsJson from "../data/records.json" with { type: "json" };
import metaJson from "../data/meta.json" with { type: "json" };
import type { AppMeta, Resource } from "./types.js";
import { slugifyCategory } from "./format.js";

export const records = recordsJson as Resource[];
export const meta = metaJson as AppMeta;

const byId = new Map(records.map((r) => [r.record_id, r]));
const bySlug = new Map(records.map((r) => [r.slug, r]));

export function getById(id: string): Resource | undefined {
  return byId.get(id);
}

export function getBySlug(slug: string): Resource | undefined {
  return bySlug.get(slug);
}

export function byCategory(category: string): Resource[] {
  return records.filter((r) => r.category === category);
}

export function byType(type: string): Resource[] {
  return records.filter((r) => r.record_type === type);
}

export function categoryFromSlug(slug: string): string | undefined {
  return meta.categories.find((c) => slugifyCategory(c) === slug);
}

export const physicalRecords = records.filter(
  (r) => r.is_physical_location && r.latitude_est != null && r.longitude_est != null,
);
