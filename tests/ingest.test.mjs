import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("public records omit private origin and home-route URLs", () => {
  const records = JSON.parse(readFileSync(join(root, "src/data/records.json"), "utf8"));
  const meta = JSON.parse(readFileSync(join(root, "src/data/meta.json"), "utf8"));
  assert.ok(records.length >= 552);
  const blob = JSON.stringify(records) + JSON.stringify(meta);
  assert.equal(/eliezer\s*yafe\s*9|9\s*\+?eliezer/i.test(blob), false);
  assert.equal("distance_origin_private" in meta, false);
  for (const r of records) {
    assert.equal("walking_directions_from_home_url" in r, false);
    assert.equal("driving_directions_from_home_url" in r, false);
    assert.ok(r.record_id);
    assert.ok(r.slug);
  }
  const ids = new Set(records.map((r) => r.record_id));
  assert.ok(ids.has("LOC-014"));
  assert.ok(ids.has("DEL-065"));
  assert.ok(ids.has("APP-001"));
});

test("leftover knowledge-base records were merged", () => {
  const records = JSON.parse(readFileSync(join(root, "src/data/records.json"), "utf8"));
  const names = records.map((r) => r.name_en);
  assert.ok(names.includes("Golan Telecom"));
  assert.ok(names.includes("DHL Israel"));
  assert.ok(names.includes("Lev HaPark community and sports center"));
});

test("source files exist for provenance", () => {
  assert.equal(existsSync(join(root, "docs/developer-guide.md")), true);
  assert.equal(existsSync(join(root, "docs/dataset-readme.md")), true);
});
