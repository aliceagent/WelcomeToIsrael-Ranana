import { test } from "node:test";
import assert from "node:assert/strict";
import {
  gregorianFromRd,
  holidayForRd,
  rdFromGregorian,
  roshHashanaRd,
  sunsetUtcMs,
  weekdayOfRd,
} from "../src/lib/hebcal.mjs";

function ymd(rd) {
  const g = gregorianFromRd(rd);
  return `${g.year}-${String(g.month).padStart(2, "0")}-${String(g.day).padStart(2, "0")}`;
}

test("Rosh Hashanah lands on known civil dates", () => {
  assert.equal(ymd(roshHashanaRd(5785)), "2024-10-03");
  assert.equal(ymd(roshHashanaRd(5786)), "2025-09-23");
  assert.equal(ymd(roshHashanaRd(5787)), "2026-09-12");
});

test("weekday helper matches known weekdays", () => {
  assert.equal(weekdayOfRd(rdFromGregorian(2023, 1, 1)), 0); // Sunday
  assert.equal(weekdayOfRd(rdFromGregorian(2026, 8, 28)), 5); // Friday
});

test("major holidays resolve for 5786", () => {
  assert.deepEqual(holidayForRd(rdFromGregorian(2025, 10, 2)), { kind: "chag", code: "yom_kippur" });
  assert.deepEqual(holidayForRd(rdFromGregorian(2025, 10, 1)), { kind: "erev", code: "yom_kippur" });
  assert.deepEqual(holidayForRd(rdFromGregorian(2025, 10, 7)), { kind: "chag", code: "sukkot" });
  assert.deepEqual(holidayForRd(rdFromGregorian(2025, 10, 14)), { kind: "chag", code: "shemini_atzeret" });
  assert.deepEqual(holidayForRd(rdFromGregorian(2026, 4, 2)), { kind: "chag", code: "pesach" });
  assert.deepEqual(holidayForRd(rdFromGregorian(2026, 4, 8)), { kind: "chag", code: "pesach_7" });
  assert.deepEqual(holidayForRd(rdFromGregorian(2026, 5, 22)), { kind: "chag", code: "shavuot" });
  assert.deepEqual(holidayForRd(rdFromGregorian(2025, 9, 22)), { kind: "erev", code: "rosh_hashana" });
  assert.equal(holidayForRd(rdFromGregorian(2026, 1, 15)), null);
});

test("no holiday chag ever lands on an impossible weekday", () => {
  // Rosh Hashanah never falls Sun/Wed/Fri (lo ADU rosh).
  for (let hy = 5700; hy <= 5900; hy++) {
    const wd = weekdayOfRd(roshHashanaRd(hy));
    assert.ok(![0, 3, 5].includes(wd), `RH ${hy} on weekday ${wd}`);
  }
});

test("Ra'anana sunset stays inside plausible bounds", () => {
  const lat = 32.184;
  const lng = 34.871;
  // Late June: ~19:50 Israel daylight time (UTC+3) => ~16:50 UTC.
  const june = sunsetUtcMs(2026, 6, 21, lat, lng);
  const juneMin = (june / 60000) % 1440;
  assert.ok(juneMin > 16 * 60 + 35 && juneMin < 17 * 60 + 5, `june sunset ${juneMin}`);
  // Late December: ~16:45 Israel standard time (UTC+2) => ~14:45 UTC.
  const dec = sunsetUtcMs(2026, 12, 21, lat, lng);
  const decMin = (dec / 60000) % 1440;
  assert.ok(decMin > 14 * 60 + 25 && decMin < 15 * 60, `december sunset ${decMin}`);
});
