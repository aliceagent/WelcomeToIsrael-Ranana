import type { Lang, Resource } from "./types.js";
import { getFolder, isFoodRecord, type Folder } from "./directory.js";
import { t } from "./i18n.js";

export type MapCategory = {
  id: string;
  icon: string;
  color: string;
  label: (lang: Lang) => string;
};

function folderLabelFn(id: string, fallback: string): (lang: Lang) => string {
  return (lang) => {
    const folder: Folder | undefined = getFolder(id);
    return folder ? folder.title[lang] : fallback;
  };
}

/** Marker/legend categories: chip color + emoji identify a pin at a glance. */
export const MAP_CATEGORIES: MapCategory[] = [
  { id: "shelters", icon: "🛡️", color: "#b3372a", label: folderLabelFn("shelters", "Shelters") },
  { id: "food", icon: "🍽️", color: "#c4703e", label: (lang) => t(lang, "food") },
  { id: "health", icon: "🩺", color: "#0e7490", label: folderLabelFn("health", "Health") },
  { id: "schools", icon: "🎒", color: "#7c5cb0", label: folderLabelFn("schools", "Kids & school") },
  { id: "synagogues", icon: "✡️", color: "#1c4a3c", label: folderLabelFn("synagogues", "Synagogues") },
  { id: "shops", icon: "🛍️", color: "#3d6ea8", label: folderLabelFn("shops", "Shops") },
  { id: "city", icon: "🏛️", color: "#6d6f5e", label: folderLabelFn("city-hall", "City hall") },
];

const OTHER: MapCategory = { id: "other", icon: "📍", color: "#8a8d7d", label: () => "•" };

const byId = new Map(MAP_CATEGORIES.map((c) => [c.id, c]));

function matches(folderId: string, r: Resource): boolean {
  return getFolder(folderId)?.match(r) ?? false;
}

/** Best single category for a physical record, in priority order. */
export function mapCategory(r: Resource): MapCategory {
  if (r.record_type === "public_shelter") return byId.get("shelters")!;
  if (r.record_type === "synagogue" || r.subcategory === "Synagogue") return byId.get("synagogues")!;
  if (isFoodRecord(r)) return byId.get("food")!;
  if (matches("pharmacy", r) || matches("health", r)) return byId.get("health")!;
  if (matches("schools", r)) return byId.get("schools")!;
  if (matches("shops", r) || matches("home-help", r)) return byId.get("shops")!;
  if (r.category === "Ra'anana Local Services" || matches("city-hall", r)) return byId.get("city")!;
  return OTHER;
}
