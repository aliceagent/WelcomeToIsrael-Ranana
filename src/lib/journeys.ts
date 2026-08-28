import type { Copy } from "./directory.js";

/**
 * The flat checklist records grouped into the journeys a family actually
 * works through, in rough order of urgency.
 */
export type Journey = { id: string; icon: string; title: Copy; ids: string[] };

/**
 * Directory records worth opening while working a checklist topic —
 * the "install this / register there" targets its description names.
 */
export const RELATED_RECORDS: Record<string, string[]> = {
  "CHK-001": ["APP-001", "APP-003"],
  "CHK-002": ["GOV-014", "GOV-003", "HLT-001", "HLT-002", "EDU-001"],
  "CHK-003": ["GOV-016", "GOV-021", "APP-024", "EDU-018"],
  "CHK-004": ["EMG-005", "APP-001"],
  "CHK-005": ["HLT-001", "HLT-002", "HLT-003", "HLT-004", "HLT-011"],
  "CHK-006": ["EDU-001", "EDU-002", "EDU-003", "EDU-008", "EDU-005"],
  "CHK-007": ["FIN-002", "FIN-003", "FIN-004", "FIN-005"],
  "CHK-008": ["MUN-001", "EMG-006", "APP-035"],
  "CHK-009": ["APP-009", "APP-008", "EDU-016"],
  "CHK-010": ["GOV-020", "GOV-021", "APP-004", "APP-005"],
  "CHK-011": ["TRN-015", "MUN-001", "TRN-023", "TRN-025"],
  "CHK-012": ["GOV-019", "GOV-018", "DEL-065"],
  "CHK-013": ["GOV-014", "GOV-004"],
  "CHK-014": ["GOV-027"],
  "CHK-015": ["GOV-028"],
  "CHK-016": ["REL-008"],
  "CHK-017": ["REL-008", "GLO-038"],
  "CHK-018": ["APP-003"],
  "CHK-019": ["GOV-001"],
  "CHK-020": ["GOV-023", "GOV-012"],
  "CHK-021": ["EDU-018", "GLO-016"],
  "CHK-022": ["MUN-005"],
};

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
