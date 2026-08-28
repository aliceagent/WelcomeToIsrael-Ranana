/**
 * Pure Hebrew-calendar and sunset math, dependency-free so both the app and
 * the node test-runner can import it. Dates flow through "rata die" day
 * numbers (RD 1 = Jan 1, 1 CE proleptic Gregorian; rd % 7 === 0 is Sunday).
 */

const UNIX_EPOCH_RD = 719163; // Jan 1, 1970

export function rdFromGregorian(year, month, day) {
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000) + UNIX_EPOCH_RD;
}

export function gregorianFromRd(rd) {
  const d = new Date((rd - UNIX_EPOCH_RD) * 86400000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** 0 = Sunday … 6 = Saturday */
export function weekdayOfRd(rd) {
  return ((rd % 7) + 7) % 7;
}

export function isHebrewLeapYear(hy) {
  return (7 * hy + 1) % 19 < 7;
}

// Days from the Hebrew epoch to the molad-based new year of hy (Calendrical
// Calculations formulation; the ADU postponement is folded in here, the
// year-length dechiyot in yearLengthCorrection).
function elapsedDays(hy) {
  const months = Math.floor((235 * hy - 234) / 19);
  const parts = 12084 + 13753 * months;
  let days = 29 * months + Math.floor(parts / 25920);
  if ((3 * (days + 1)) % 7 < 3) days += 1;
  return days;
}

function yearLengthCorrection(hy) {
  const ny0 = elapsedDays(hy - 1);
  const ny1 = elapsedDays(hy);
  const ny2 = elapsedDays(hy + 1);
  if (ny2 - ny1 === 356) return 2;
  if (ny1 - ny0 === 382) return 1;
  return 0;
}

const HEBREW_EPOCH_RD = -1373427;

/** RD of 1 Tishrei of Hebrew year hy. */
export function roshHashanaRd(hy) {
  return HEBREW_EPOCH_RD + elapsedDays(hy) + yearLengthCorrection(hy);
}

export function hebrewYearLength(hy) {
  return roshHashanaRd(hy + 1) - roshHashanaRd(hy);
}

/** Hebrew year containing the given rd. */
export function hebrewYearOfRd(rd) {
  let hy = Math.floor((rd - HEBREW_EPOCH_RD) / 365.2468) + 1;
  while (roshHashanaRd(hy + 1) <= rd) hy += 1;
  while (roshHashanaRd(hy) > rd) hy -= 1;
  return hy;
}

/**
 * Full-closure holidays as kept in Israel (one-day yom tov).
 * kind: "chag" — closed like Shabbat; "erev" — shops close early.
 */
export function holidayForRd(rd) {
  const hy = hebrewYearOfRd(rd);
  const rh = roshHashanaRd(hy);
  const len = hebrewYearLength(hy);
  const cheshvan = len % 10 === 5 ? 30 : 29;
  const kislev = len % 10 === 3 ? 29 : 30;
  const nisan1 = rh + 30 + cheshvan + kislev + 29 + 30 + (isHebrewLeapYear(hy) ? 30 : 0) + 29;

  const chagim = [
    [rh, "rosh_hashana"],
    [rh + 1, "rosh_hashana"],
    [rh + 9, "yom_kippur"],
    [rh + 14, "sukkot"],
    [rh + 21, "shemini_atzeret"],
    [nisan1 + 14, "pesach"],
    [nisan1 + 20, "pesach_7"],
    [nisan1 + 64, "shavuot"],
  ];
  for (const [day, code] of chagim) {
    if (rd === day) return { kind: "chag", code };
  }
  // Erev chag: the day before a chag (RH day 2 follows day 1, so no erev there).
  for (const [day, code] of chagim) {
    if (code !== "rosh_hashana" || day === rh) {
      if (rd === day - 1) return { kind: "erev", code };
    }
  }
  // Erev Rosh Hashanah is the last day of the *previous* Hebrew year.
  if (rd === roshHashanaRd(hy + 1) - 1) return { kind: "erev", code: "rosh_hashana" };
  return null;
}

/**
 * NOAA-style sunset for the civil date (year, month, day) at lat/lng.
 * Returns epoch milliseconds (UTC) or null in polar edge cases.
 */
export function sunsetUtcMs(year, month, day, lat, lng) {
  const rad = Math.PI / 180;
  const dayMs = Date.UTC(year, month - 1, day);
  const n = Math.round(dayMs / 86400000 - 10957.5); // days since J2000 (2000-01-01T12:00Z)
  const jStar = n - lng / 360;
  const M = (357.5291 + 0.98560028 * jStar) % 360;
  const C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
  const lambda = (M + C + 180 + 102.9372) % 360;
  const jTransit = 2451545 + jStar + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * lambda * rad);
  const sinDelta = Math.sin(lambda * rad) * Math.sin(23.4397 * rad);
  const delta = Math.asin(sinDelta);
  const cosH =
    (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * sinDelta) / (Math.cos(lat * rad) * Math.cos(delta));
  if (cosH < -1 || cosH > 1) return null;
  const H = Math.acos(cosH) / rad;
  const jSet = jTransit + H / 360;
  return (jSet - 2440587.5) * 86400000;
}
