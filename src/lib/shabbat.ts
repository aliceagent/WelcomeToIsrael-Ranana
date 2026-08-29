import {
  gregorianFromRd,
  holidayForRd,
  rdFromGregorian,
  sunsetUtcMs,
  weekdayOfRd,
  type HolidayCode,
} from "./hebcal.mjs";
import type { HomePin, Lang } from "./types.js";

export const HOLIDAY_NAMES: Record<HolidayCode, { en: string; fr: string; he: string }> = {
  rosh_hashana: { en: "Rosh Hashanah", fr: "Roch Hachana", he: "ראש השנה" },
  yom_kippur: { en: "Yom Kippur", fr: "Yom Kippour", he: "יום כיפור" },
  sukkot: { en: "Sukkot", fr: "Souccot", he: "סוכות" },
  shemini_atzeret: { en: "Shemini Atzeret / Simchat Torah", fr: "Chemini Atseret / Simhat Torah", he: "שמיני עצרת / שמחת תורה" },
  pesach: { en: "Pesach", fr: "Pessah", he: "פסח" },
  pesach_7: { en: "Pesach (7th day)", fr: "Pessah (7e jour)", he: "שביעי של פסח" },
  shavuot: { en: "Shavuot", fr: "Chavouot", he: "שבועות" },
};

const CANDLE_OFFSET_MIN = 20;
const HAVDALAH_OFFSET_MIN = 40;

type JDay = { year: number; month: number; day: number; rd: number; weekday: number };

/** The civil date currently in effect in Israel, wherever the device is. */
export function jerusalemDay(now: Date = new Date()): JDay {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const year = get("year");
  const month = get("month");
  const day = get("day");
  const rd = rdFromGregorian(year, month, day);
  return { year, month, day, rd, weekday: weekdayOfRd(rd) };
}

/** Minutes since midnight, Israel wall clock. */
export function jerusalemMinutes(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jerusalem",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return get("hour") * 60 + get("minute");
}

export function isChag(now: Date = new Date()): boolean {
  return holidayForRd(jerusalemDay(now).rd)?.kind === "chag";
}

/** Shabbat or a full holiday: the days most of the city is closed. */
export function isRestDay(now: Date = new Date()): boolean {
  const d = jerusalemDay(now);
  return d.weekday === 6 || holidayForRd(d.rd)?.kind === "chag";
}

export function formatJerusalemTime(ms: number, lang: Lang): string {
  const locale = lang === "he" ? "he-IL" : lang === "fr" ? "fr-FR" : "en-GB";
  return new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Jerusalem",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ms));
}

export type ShabbatNotice = {
  kind: "eve" | "rest";
  name: { en: string; fr: string; he: string } | null;
  timeMs: number | null;
};

export type Ymd = { year: number; month: number; day: number; rd: number };

export type ShabbatTimes = {
  friday: Ymd;
  saturday: Ymd;
  candlesMs: number | null;
  havdalahMs: number | null;
};

/** Candle-lighting/havdalah times for the Shabbat whose Saturday is satRd. */
export function shabbatTimesForRd(satRd: number, pin: HomePin): ShabbatTimes {
  const satG = gregorianFromRd(satRd);
  const friG = gregorianFromRd(satRd - 1);
  const friSunset = sunsetUtcMs(friG.year, friG.month, friG.day, pin.lat, pin.lng);
  const satSunset = sunsetUtcMs(satG.year, satG.month, satG.day, pin.lat, pin.lng);
  return {
    friday: { ...friG, rd: satRd - 1 },
    saturday: { ...satG, rd: satRd },
    candlesMs: friSunset != null ? friSunset - CANDLE_OFFSET_MIN * 60000 : null,
    havdalahMs: satSunset != null ? satSunset + HAVDALAH_OFFSET_MIN * 60000 : null,
  };
}

/** The current Shabbat (when it's Shabbat in Israel now) or the upcoming one. */
export function upcomingShabbat(now: Date, pin: HomePin): ShabbatTimes {
  const today = jerusalemDay(now);
  return shabbatTimesForRd(today.rd + ((6 - today.weekday + 7) % 7), pin);
}

/** First days of upcoming chagim (multi-day runs collapse to their start). */
export function upcomingChagim(now: Date, limit = 8): { code: HolidayCode; rd: number }[] {
  const start = jerusalemDay(now).rd;
  const out: { code: HolidayCode; rd: number }[] = [];
  for (let rd = start; rd < start + 420 && out.length < limit; rd++) {
    const h = holidayForRd(rd);
    if (h?.kind !== "chag") continue;
    const prev = holidayForRd(rd - 1);
    if (prev?.kind === "chag" && prev.code === h.code) continue;
    out.push({ code: h.code, rd });
  }
  return out;
}

/** Candle-lighting time on the eve before the given day. */
export function eveCandlesForRd(rd: number, pin: HomePin): number | null {
  const eve = gregorianFromRd(rd - 1);
  const sunset = sunsetUtcMs(eve.year, eve.month, eve.day, pin.lat, pin.lng);
  return sunset != null ? sunset - CANDLE_OFFSET_MIN * 60000 : null;
}

/** "Friday, 4 Sep" (or the locale's equivalent) for a civil date in Israel. */
export function formatJerusalemDate(g: { year: number; month: number; day: number }, lang: Lang): string {
  const locale = lang === "he" ? "he-IL" : lang === "fr" ? "fr-FR" : "en-GB";
  return new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Jerusalem",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(Date.UTC(g.year, g.month - 1, g.day, 12)));
}

function restDayAt(rd: number): boolean {
  return weekdayOfRd(rd) === 6 || holidayForRd(rd)?.kind === "chag";
}

/**
 * Havdalah at the end of the run of rest days starting at `startRd` — a chag
 * running into Shabbat, or Rosh Hashanah's two days, end together.
 */
function restEndMs(startRd: number, pin: HomePin): number | null {
  let last = startRd;
  for (let i = 0; i < 2 && restDayAt(last + 1); i++) last += 1;
  const g = gregorianFromRd(last);
  const sunset = sunsetUtcMs(g.year, g.month, g.day, pin.lat, pin.lng);
  return sunset != null ? sunset + HAVDALAH_OFFSET_MIN * 60000 : null;
}

/**
 * What the home screen should say now: candle-lighting notice on Friday and
 * erev chag *before* candles, a "closed until ~havdalah" notice once candles
 * have passed and through Shabbat and chagim, nothing on a plain weekday.
 */
export function shabbatNotice(now: Date, pin: HomePin): ShabbatNotice | null {
  const d = jerusalemDay(now);
  const hol = holidayForRd(d.rd);

  // Rest ends after the last consecutive rest day (RH day two, chag into Shabbat…).
  if (d.weekday === 6 || hol?.kind === "chag") {
    return {
      kind: "rest",
      name: hol?.kind === "chag" ? HOLIDAY_NAMES[hol.code] : null,
      timeMs: restEndMs(d.rd, pin),
    };
  }

  if (d.weekday === 5 || hol?.kind === "erev") {
    const sunset = sunsetUtcMs(d.year, d.month, d.day, pin.lat, pin.lng);
    const candlesMs = sunset != null ? sunset - CANDLE_OFFSET_MIN * 60000 : null;
    const name = hol?.kind === "erev" ? HOLIDAY_NAMES[hol.code] : null;
    // Friday 19:30 is not "Shabbat starts at 18:51" — the shops already shut.
    if (candlesMs != null && now.getTime() >= candlesMs) {
      return { kind: "rest", name, timeMs: restEndMs(d.rd + 1, pin) };
    }
    return { kind: "eve", name, timeMs: candlesMs };
  }

  return null;
}
