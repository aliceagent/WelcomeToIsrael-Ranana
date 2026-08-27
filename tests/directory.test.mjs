import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const records = JSON.parse(readFileSync(join(root, "src/data/records.json"), "utf8"));

const RESTAURANT_SUBS = new Set([
  "Asian",
  "Asian & sushi",
  "Barbecue",
  "Burgers",
  "Italian",
  "Meat restaurant",
  "Pizza",
  "Sushi",
]);
const CAFE_BAKERY_SUBS = new Set(["Bakery", "Cafe", "Cafe & bagels", "Cafe & bakery", "Ice cream"]);
const FRENCH_SUBS = new Set(["French bakery & prepared food", "French deli", "Gourmet grocery"]);
const GROCERY_SUBS = new Set(["Supermarket", "Fruit & vegetables", "Gourmet grocery"]);

function biz(subSet) {
  return records.filter((r) => r.category === "Ra'anana Businesses" && subSet.has(r.subcategory));
}

test("food directory folders have local coverage", () => {
  assert.ok(biz(RESTAURANT_SUBS).length >= 12, "eat-out restaurants");
  assert.ok(biz(CAFE_BAKERY_SUBS).length >= 8, "bakeries and cafes");
  assert.ok(biz(GROCERY_SUBS).length >= 6, "grocery stores");
  assert.ok(biz(FRENCH_SUBS).length >= 4, "french food");
  assert.equal(biz(new Set(["Butcher"])).length, 1);
  const orderIn = records.filter(
    (r) =>
      r.subcategory === "Restaurant & local delivery" ||
      r.subcategory === "Food & Delivery" ||
      /^(Wolt|10bis|Mishloha)\b/i.test(r.name_en || ""),
  );
  assert.ok(orderIn.length >= 3, "order-in apps");
  const groceryDelivery = records.filter(
    (r) =>
      (r.category === "Delivery & Online Shopping" && r.subcategory === "Groceries") ||
      (r.category === "Essential Apps" && r.subcategory === "Shopping"),
  );
  assert.ok(groceryDelivery.length >= 10, "grocery delivery");
});

test("app is not gated on kids or driving questions", () => {
  const home = readFileSync(join(root, "src/pages/Home.tsx"), "utf8");
  const settings = readFileSync(join(root, "src/pages/Settings.tsx"), "utf8");
  const store = readFileSync(join(root, "src/lib/store.tsx"), "utf8");
  assert.equal(home.includes("Onboarding"), false);
  assert.equal(settings.includes("weHaveKids") || settings.includes("weDrive"), false);
  assert.match(store, /drives: true, kids: true/);
});
