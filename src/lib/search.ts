import MiniSearch from "minisearch";
import type { Resource } from "./types.js";
import { priorityScore } from "./format.js";
import { expandQuery, isThinTradeQuery, LIVE_LOOKUP_IDS } from "./needs.js";
import { getById } from "./data.js";

function fold(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[׳']/g, "")
    .replace(/raanana|ra’anana|ra`anana|ranana/gi, "raanana")
    .toLowerCase();
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
    ],
    storeFields: ["record_id"],
    idField: "record_id",
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
      },
      prefix: true,
      fuzzy: 0.2,
    },
    processTerm: (term) => fold(term),
  });
  index.addAll(records);
}

function searchOnce(query: string, combineWith: "AND" | "OR" = "AND"): Resource[] {
  if (!index || !query.trim()) return [];
  let raw = index.search(fold(query), { combineWith });
  if (raw.length === 0 && combineWith === "AND" && query.trim().split(/\s+/).length > 1) {
    raw = index.search(fold(query), { combineWith: "OR" });
  }
  const emergency = /emergenc|urgence|חירום|rocket|alert|מקלט|shelter|ambulance|police/i.test(query);
  return raw
    .map((hit) => {
      const rec = byId.get(String(hit.id));
      if (!rec) return null;
      let score = hit.score;
      score += priorityScore(rec.priority) / 20;
      if (rec.is_raanana) score += 2;
      if (emergency && rec.category === "Emergency & Important Numbers") score += 50;
      if (emergency && rec.record_type === "public_shelter") score += 20;
      return { rec, score };
    })
    .filter((x): x is { rec: Resource; score: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.rec);
}

export function searchRecords(query: string): Resource[] {
  const queries = expandQuery(query);
  const seen = new Set<string>();
  const merged: Resource[] = [];
  queries.forEach((q) => {
    for (const rec of searchOnce(q)) {
      if (seen.has(rec.record_id)) continue;
      seen.add(rec.record_id);
      merged.push(rec);
    }
  });
  if (isThinTradeQuery(query) || merged.length === 0) {
    for (const id of LIVE_LOOKUP_IDS) {
      const rec = getById(id);
      if (rec && !seen.has(rec.record_id)) {
        seen.add(rec.record_id);
        merged.push(rec);
      }
    }
  }
  return merged;
}
