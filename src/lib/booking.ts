import type { Copy } from "./directory.js";

/**
 * The appointment culture nobody explains to a newcomer: which service is
 * booked where. `via` names a directory record worth opening (e.g. MyVisit).
 */
export const BOOKING_HINTS: Record<string, { copy: Copy; via?: string }> = {
  "GOV-014": {
    copy: {
      en: "Book a slot on MyVisit before going — walk-ins are usually turned away.",
      fr: "Réservez un créneau sur MyVisit avant d'y aller — sans rendez-vous, on vous refusera souvent.",
      he: "קובעים תור מראש ב־MyVisit — בלי תור לרוב לא מקבלים.",
    },
    via: "GOV-015",
  },
  "GOV-016": {
    copy: {
      en: "Most branch visits need a MyVisit appointment; many claims can be filed online instead.",
      fr: "La plupart des visites exigent un rendez-vous MyVisit ; beaucoup de démarches se font en ligne.",
      he: "לרוב צריך תור ב־MyVisit; הרבה תביעות אפשר להגיש אונליין.",
    },
    via: "GOV-015",
  },
  "GOV-020": {
    copy: {
      en: "Licensing offices take appointments through gov.il — book before you go.",
      fr: "Les bureaux de licences prennent rendez-vous via gov.il — réservez avant d'y aller.",
      he: "במשרד הרישוי קובעים תור דרך gov.il.",
    },
  },
  "GOV-021": {
    copy: {
      en: "Start the licence conversion online at gov.il, then book the office visit.",
      fr: "Commencez la conversion du permis en ligne sur gov.il, puis prenez rendez-vous.",
      he: "מתחילים את המרת הרישיון אונליין ב־gov.il ואז קובעים תור.",
    },
  },
  "GOV-026": {
    copy: {
      en: "Take a queue number in the Israel Post app before you go — it saves the long line.",
      fr: "Prenez un numéro dans l'appli Israel Post avant d'y aller — cela évite la file.",
      he: "מוציאים מספר בתור באפליקציית דואר ישראל לפני שמגיעים.",
    },
  },
  "HLT-001": {
    copy: {
      en: "Doctors are booked in the Clalit app or website — install it right after you register.",
      fr: "Les rendez-vous médicaux se prennent dans l'appli Clalit — installez-la dès l'inscription.",
      he: "תורים לרופאים קובעים באפליקציית כללית.",
    },
  },
  "HLT-002": {
    copy: {
      en: "Doctors are booked in the Maccabi app or website — install it right after you register.",
      fr: "Les rendez-vous médicaux se prennent dans l'appli Maccabi — installez-la dès l'inscription.",
      he: "תורים לרופאים קובעים באפליקציית מכבי.",
    },
  },
  "HLT-003": {
    copy: {
      en: "Doctors are booked in the Meuhedet app or website — install it right after you register.",
      fr: "Les rendez-vous médicaux se prennent dans l'appli Meuhedet — installez-la dès l'inscription.",
      he: "תורים לרופאים קובעים באפליקציית מאוחדת.",
    },
  },
  "HLT-004": {
    copy: {
      en: "Doctors are booked in the Leumit app or website — install it right after you register.",
      fr: "Les rendez-vous médicaux se prennent dans l'appli Leumit — installez-la dès l'inscription.",
      he: "תורים לרופאים קובעים באפליקציית לאומית.",
    },
  },
  "HLT-006": {
    copy: {
      en: "Walk-in urgent care — you can check waiting times on the TEREM site before leaving home.",
      fr: "Soins urgents sans rendez-vous — le temps d'attente est visible sur le site TEREM.",
      he: "מגיעים בלי תור; אפשר לבדוק עומס באתר טרם.",
    },
  },
  "HLT-011": {
    copy: {
      en: "Appointments go through your local Tipat Halav branch — call or ask your kupah.",
      fr: "Les rendez-vous passent par votre centre Tipat Halav — appelez ou demandez à votre koupah.",
      he: "תורים דרך טיפת חלב השכונתית או הקופה.",
    },
  },
};
