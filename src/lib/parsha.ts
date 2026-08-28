import { HDate, Sedra } from "@hebcal/core";
import { holidayForRd } from "./hebcal.mjs";
import { HOLIDAY_NAMES } from "./shabbat.js";

export type ParshaInfo = {
  /** Transliterated name(s), e.g. "Nitzavim–Vayeilech" */
  translit: string;
  /** Hebrew name(s), e.g. "ניצבים–וילך" */
  he: string;
  /** Set when the Shabbat carries a holiday reading instead of a weekly portion */
  holiday: { en: string; fr: string; he: string } | null;
  /** Hebrew date of that Shabbat, rendered in Hebrew */
  hebrewDate: string;
};

/** Hebrew script for hebcal's transliterated parsha names (keys normalized). */
const HE_NAMES: Record<string, string> = {
  bereshit: "בראשית",
  noach: "נח",
  lechlecha: "לך־לך",
  vayera: "וירא",
  chayeisara: "חיי שרה",
  toldot: "תולדות",
  vayetzei: "ויצא",
  vayishlach: "וישלח",
  vayeshev: "וישב",
  miketz: "מקץ",
  vayigash: "ויגש",
  vayechi: "ויחי",
  shemot: "שמות",
  vaera: "וארא",
  bo: "בא",
  beshalach: "בשלח",
  yitro: "יתרו",
  mishpatim: "משפטים",
  terumah: "תרומה",
  tetzaveh: "תצוה",
  kitisa: "כי תשא",
  vayakhel: "ויקהל",
  pekudei: "פקודי",
  vayikra: "ויקרא",
  tzav: "צו",
  shmini: "שמיני",
  tazria: "תזריע",
  metzora: "מצורע",
  achreimot: "אחרי מות",
  kedoshim: "קדושים",
  emor: "אמור",
  behar: "בהר",
  bechukotai: "בחוקותי",
  bamidbar: "במדבר",
  nasso: "נשא",
  behaalotcha: "בהעלותך",
  shlach: "שלח לך",
  korach: "קורח",
  chukat: "חוקת",
  balak: "בלק",
  pinchas: "פינחס",
  matot: "מטות",
  masei: "מסעי",
  devarim: "דברים",
  vaetchanan: "ואתחנן",
  eikev: "עקב",
  reeh: "ראה",
  shoftim: "שופטים",
  kiteitzei: "כי תצא",
  kitavo: "כי תבוא",
  nitzavim: "ניצבים",
  vayeilech: "וילך",
  haazinu: "האזינו",
  vezothaberakhah: "וזאת הברכה",
};

const CHOL_HAMOED = {
  en: "Shabbat Chol HaMoed",
  fr: "Chabbat Hol Hamoed",
  he: "שבת חול המועד",
};

function norm(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, "");
}

const sedraCache = new Map<number, Sedra>();

function sedraFor(hyear: number): Sedra {
  let sedra = sedraCache.get(hyear);
  if (!sedra) {
    sedra = new Sedra(hyear, true); // Israel reading schedule
    sedraCache.set(hyear, sedra);
  }
  return sedra;
}

/** Weekly portion (Israel schedule) for the Shabbat on the given civil date. */
export function parshaFor(g: { year: number; month: number; day: number; rd: number }): ParshaInfo {
  const hd = new HDate(new Date(g.year, g.month - 1, g.day));
  const reading = sedraFor(hd.getFullYear()).lookup(hd);
  const translit = reading.parsha.join("–");
  const hebrewDate = hd.renderGematriya(true);

  if (reading.chag) {
    const chag = holidayForRd(g.rd);
    if (chag) return { translit, he: translit, holiday: HOLIDAY_NAMES[chag.code], hebrewDate };
    if (/chol ha-?moed/i.test(translit)) return { translit, he: translit, holiday: CHOL_HAMOED, hebrewDate };
    return { translit, he: translit, holiday: { en: translit, fr: translit, he: translit }, hebrewDate };
  }

  const he = reading.parsha.map((p) => HE_NAMES[norm(p)] ?? p).join("–");
  return { translit, he, holiday: null, hebrewDate };
}
