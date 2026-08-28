import type { Copy } from "./directory.js";

/**
 * The flat checklist records grouped into the journeys a family actually
 * works through, in rough order of urgency.
 */
export type Journey = { id: string; icon: string; title: Copy; ids: string[] };

export const JOURNEYS: Journey[] = [
  {
    id: "first-days",
    icon: "🛬",
    title: { en: "First days", fr: "Premiers jours", he: "הימים הראשונים" },
    ids: ["CHK-001", "CHK-002", "CHK-003", "CHK-013", "CHK-004"],
  },
  {
    id: "health-family",
    icon: "🩺",
    title: { en: "Health & family", fr: "Santé et famille", he: "בריאות ומשפחה" },
    ids: ["CHK-005", "CHK-006", "CHK-018"],
  },
  {
    id: "money-work",
    icon: "💼",
    title: { en: "Money, work & papers", fr: "Argent, travail, papiers", he: "כסף, עבודה ומסמכים" },
    ids: ["CHK-007", "CHK-019", "CHK-020", "CHK-014", "CHK-015"],
  },
  {
    id: "home-city",
    icon: "🏠",
    title: { en: "Home, car & city", fr: "Maison, voiture, ville", he: "בית, רכב ועיר" },
    ids: ["CHK-008", "CHK-011", "CHK-009", "CHK-010", "CHK-012", "CHK-022", "CHK-023"],
  },
  {
    id: "language-life",
    icon: "🕎",
    title: { en: "Hebrew & Jewish life", fr: "Hébreu et vie juive", he: "עברית וחיי קהילה" },
    ids: ["CHK-021", "CHK-016", "CHK-017", "CHK-024"],
  },
];
