import type { Lang, Resource } from "./types.js";
import { getFolder } from "./directory.js";

export type MapCategory = {
  id: string;
  icon: string;
  color: string;
  label: (lang: Lang) => string;
  match: (r: Resource) => boolean;
};

function fromFolder(id: string, color: string, fallbackIcon = "📍"): MapCategory {
  const folder = getFolder(id);
  return {
    id,
    icon: folder?.icon ?? fallbackIcon,
    color,
    label: (lang) => folder?.title[lang] ?? id,
    match: (r) => folder?.match(r) ?? false,
  };
}

/**
 * Fine-grained map sections, driven by the folder system so icons, labels,
 * and matching stay defined in one place. Chip rows mirror this split.
 */
export const MAP_CATEGORIES: MapCategory[] = [
  // Food & everyday
  fromFolder("restaurants", "#c4703e"),
  fromFolder("bakeries", "#b58433"),
  fromFolder("groceries", "#5a8a3a"),
  fromFolder("butcher", "#a03d3d"),
  fromFolder("treats", "#c26a8a"),
  fromFolder("french-food", "#4a5fa5"),
  fromFolder("pharmacy", "#2a8f74"),
  // Life & city
  fromFolder("health", "#0e7490"),
  fromFolder("schools", "#7c5cb0"),
  fromFolder("parks", "#3e8a4e"),
  fromFolder("sports", "#2f7fa8"),
  fromFolder("shops", "#3d6ea8"),
  fromFolder("banks", "#28607f"),
  fromFolder("home-help", "#8a6d3b"),
  fromFolder("synagogues", "#1c4a3c"),
  fromFolder("community", "#8a5a86"),
  fromFolder("city-hall", "#6d6f5e"),
  fromFolder("shelters", "#b3372a"),
];

/** Chip layout: first row food & daily, second row life & city. */
export const MAP_ROWS: string[][] = [
  ["restaurants", "bakeries", "groceries", "butcher", "treats", "french-food", "pharmacy"],
  ["health", "schools", "parks", "sports", "shops", "banks", "home-help", "synagogues", "community", "city-hall", "shelters"],
];

const OTHER: MapCategory = { id: "other", icon: "📍", color: "#8a8d7d", label: () => "•", match: () => true };

const byId = new Map(MAP_CATEGORIES.map((c) => [c.id, c]));

export function getMapCategory(id: string): MapCategory | undefined {
  return byId.get(id);
}

/**
 * Pin glyph: the most specific matching section wins, so a French bakery
 * draws 🥐 while still appearing under both the bakeries and French chips.
 */
const GLYPH_ORDER = [
  "shelters",
  "synagogues",
  "pharmacy",
  "butcher",
  "treats",
  "bakeries",
  "restaurants",
  "french-food",
  "groceries",
  "health",
  "schools",
  "parks",
  "sports",
  "banks",
  "home-help",
  "shops",
  "city-hall",
  "community",
];

export function mapCategory(r: Resource): MapCategory {
  for (const id of GLYPH_ORDER) {
    const cat = byId.get(id);
    if (cat?.match(r)) return cat;
  }
  return OTHER;
}
