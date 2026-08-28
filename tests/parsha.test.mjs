import { test } from "node:test";
import assert from "node:assert/strict";
import { HDate, Sedra } from "@hebcal/core";
import { rdFromGregorian } from "../src/lib/hebcal.mjs";

function lookup(y, m, d, israel = true) {
  const hd = new HDate(new Date(y, m - 1, d));
  return new Sedra(hd.getFullYear(), israel).lookup(hd);
}

test("Israel parsha schedule matches known 5786 dates", () => {
  assert.deepEqual(lookup(2025, 10, 18).parsha, ["Bereshit"]);
  assert.deepEqual(lookup(2026, 3, 28).parsha, ["Tzav"]); // Shabbat HaGadol
  assert.equal(lookup(2026, 4, 4).chag, true); // Shabbat Chol HaMoed Pesach
  assert.deepEqual(lookup(2026, 5, 16).parsha, ["Bamidbar"]); // before Shavuot
  assert.deepEqual(lookup(2026, 7, 18).parsha, ["Devarim"]); // Shabbat Chazon
  assert.deepEqual(lookup(2026, 8, 29).parsha, ["Ki Tavo"]);
  assert.deepEqual(lookup(2026, 9, 5).parsha, ["Nitzavim", "Vayeilech"]);
  assert.equal(lookup(2026, 9, 12).chag, true); // Rosh Hashanah on Shabbat
  assert.deepEqual(lookup(2026, 9, 19).parsha, ["Ha'azinu"]);
});

test("Israel schedule diverges from diaspora when Pesach VIII is Shabbat", () => {
  // 22 Nisan 5782 (Apr 23, 2022): a regular Shabbat in Israel, Pesach VIII abroad.
  assert.deepEqual(lookup(2022, 4, 23, true).parsha, ["Achrei Mot"]);
  assert.equal(lookup(2022, 4, 23, false).chag, true);
});

test("hebcal.mjs day numbering agrees with @hebcal/core", () => {
  const hd = new HDate(new Date(2026, 7, 29));
  assert.equal(hd.abs(), rdFromGregorian(2026, 8, 29));
});
