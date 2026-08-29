/**
 * Shabbat banner rollover and the open/closed chip.
 *
 * These live in TypeScript modules that import each other with .js
 * specifiers, so the test bundles them with esbuild (already present as a
 * Vite dependency) and imports the bundle.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(mkdtempSync(join(tmpdir(), "raanana-test-")), "lib.mjs");
const entry = join(dirname(out), "entry.ts");
writeFileSync(
  entry,
  [
    `export { shabbatNotice, upcomingShabbat, jerusalemDay } from ${JSON.stringify(join(root, "src/lib/shabbat.js"))};`,
    `export { openState, openStateDetail } from ${JSON.stringify(join(root, "src/lib/hours.js"))};`,
  ].join("\n"),
);
await build({
  entryPoints: [entry],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: out,
  logLevel: "error",
  loader: { ".json": "json" },
});
const { shabbatNotice, upcomingShabbat, openState, openStateDetail } = await import(out);

const PIN = { lat: 32.18205, lng: 34.87548 };
/** 28 Aug 2026 is a Friday; Israel is UTC+3 in August. */
const israel = (y, m, d, hh, mm = 0) => new Date(Date.UTC(y, m - 1, d, hh - 3, mm));

test("Friday before candle-lighting still counts down to Shabbat", () => {
  const noon = israel(2026, 8, 28, 12);
  const notice = shabbatNotice(noon, PIN);
  assert.equal(notice.kind, "eve");
  assert.equal(notice.name, null);
  const candles = upcomingShabbat(noon, PIN).candlesMs;
  assert.equal(notice.timeMs, candles);
});

test("Friday after candle-lighting says closed until havdalah, not 'starts at'", () => {
  const noon = israel(2026, 8, 28, 12);
  const candles = upcomingShabbat(noon, PIN).candlesMs;
  const havdalah = upcomingShabbat(noon, PIN).havdalahMs;
  // One minute after candles, and the 19:30 the round-4 review caught.
  for (const at of [new Date(candles + 60000), israel(2026, 8, 28, 19, 30)]) {
    const notice = shabbatNotice(at, PIN);
    assert.equal(notice.kind, "rest", `at ${at.toISOString()}`);
    assert.equal(notice.timeMs, havdalah);
    assert.ok(notice.timeMs > candles);
  }
});

test("Shabbat itself and plain weekdays are unchanged", () => {
  const shabbat = shabbatNotice(israel(2026, 8, 29, 10), PIN);
  assert.equal(shabbat.kind, "rest");
  assert.equal(shabbatNotice(israel(2026, 8, 26, 10), PIN), null); // Wednesday
});

test("erev chag rolls over at candle-lighting too", () => {
  // 1 Oct 2025 is erev Yom Kippur (Israel is UTC+3 in early October).
  const before = shabbatNotice(new Date(Date.UTC(2025, 9, 1, 9)), PIN);
  assert.equal(before.kind, "eve");
  assert.equal(before.name.en, "Yom Kippur");
  const after = shabbatNotice(new Date(Date.UTC(2025, 9, 1, 17)), PIN);
  assert.equal(after.kind, "rest");
  assert.equal(after.name.en, "Yom Kippur");
  assert.ok(after.timeMs > before.timeMs);
});

const base = {
  record_id: "TST-001",
  record_type: "local_business",
  category: "Ra'anana Businesses",
  availability_hours_note: null,
  hours_structured: null,
  closed_days: null,
};

test("open chip states the closing time, closed chip the next opening", () => {
  const shop = { ...base, hours_structured: [{ days: [0, 1, 2, 3, 4], open: "08:00", close: "17:00" }] };
  // Sunday 30 Aug 2026, 16:40 Israel time.
  const openNow = openStateDetail(shop, israel(2026, 8, 30, 16, 40));
  assert.equal(openNow.state, "open");
  assert.equal(openNow.closesAt, "17:00");

  const afterClose = openStateDetail(shop, israel(2026, 8, 30, 18));
  assert.equal(afterClose.state, "closed");
  assert.deepEqual(afterClose.opensAt, { weekday: 1, time: "08:00", today: false });

  const beforeOpen = openStateDetail(shop, israel(2026, 8, 30, 7));
  assert.equal(beforeOpen.state, "closed");
  assert.deepEqual(beforeOpen.opensAt, { weekday: 0, time: "08:00", today: true });

  // Friday: shut, and the next opening is Sunday — never Saturday.
  const friday = openStateDetail(shop, israel(2026, 8, 28, 12));
  assert.equal(friday.state, "closed");
  assert.equal(friday.opensAt.weekday, 0);
});

test("a Shabbat-closed record says closed on Shabbat and nothing the rest of the week", () => {
  const kosherShop = { ...base, closed_days: [6] };
  const shabbat = openStateDetail(kosherShop, israel(2026, 8, 29, 10));
  assert.equal(shabbat.state, "closed");
  assert.equal(shabbat.closedFor, "shabbat");
  assert.equal(shabbat.opensAt, undefined, "no opening time is claimed");
  // No weekday hours are known, so no badge at all rather than a guess.
  assert.equal(openStateDetail(kosherShop, israel(2026, 8, 26, 10)), null);
  assert.equal(openState(kosherShop, israel(2026, 8, 26, 10)), null);
});

test("24/7 notes and unknown hours keep their old answers", () => {
  assert.equal(openState({ ...base, availability_hours_note: "Open 24/7" }, israel(2026, 8, 29, 3)), "always");
  assert.equal(openState({ ...base, availability_hours_note: "Call ahead." }, israel(2026, 8, 26, 10)), null);
  const parsed = { ...base, availability_hours_note: "Sunday–Thursday 09:00–16:00; closed Friday." };
  assert.equal(openState(parsed, israel(2026, 8, 30, 10)), "open");
  assert.equal(openStateDetail(parsed, israel(2026, 8, 30, 10)).closesAt, "16:00");
});

test("the Shabbat-closed records in the dataset are the ones we can vouch for", async () => {
  const { readFileSync } = await import("node:fs");
  const records = JSON.parse(readFileSync(join(root, "src/data/records.json"), "utf8"));
  const closed = records.filter((r) => r.closed_days?.includes(6)).map((r) => r.record_id).sort();
  assert.deepEqual(closed, ["BUS-001", "BUS-002", "BUS-013", "BUS-030", "BUS-031", "BUS-033"]);
  // Tiv Taam is famously open on Shabbat: it must never be marked closed.
  const tivTaam = records.find((r) => r.record_id === "BUS-034");
  assert.ok(!tivTaam.closed_days, "Tiv Taam must not be marked closed on Shabbat");
});
