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

test("IKEA-style duplicate website/action/menu URLs are collapsed in the record page", () => {
  const src = readFileSync(join(root, "src/pages/Record.tsx"), "utf8");
  assert.match(src, /sameUrl\(r\.action_url, r\.website_url\)/);
  assert.match(src, /sameUrl\(r\.menu_order_url/);
  const ikea = records.find((r) => r.record_id === "DEL-023");
  assert.ok(ikea);
  assert.equal(ikea.website_url, ikea.action_url);
  assert.equal(ikea.website_url, ikea.menu_order_url);
});

test("app is not gated on kids or driving questions", () => {
  const home = readFileSync(join(root, "src/pages/Home.tsx"), "utf8");
  const settings = readFileSync(join(root, "src/pages/Settings.tsx"), "utf8");
  const store = readFileSync(join(root, "src/lib/store.tsx"), "utf8");
  assert.equal(home.includes("Onboarding"), false);
  assert.equal(settings.includes("weHaveKids") || settings.includes("weDrive"), false);
  assert.match(store, /drives: true, kids: true/);
});

test("tab bar uses matched SVG icons instead of tiny unicode glyphs", () => {
  const layout = readFileSync(join(root, "src/components/Layout.tsx"), "utf8");
  const css = readFileSync(join(root, "src/styles/global.css"), "utf8");
  const icons = readFileSync(join(root, "src/components/Icons.tsx"), "utf8");
  assert.match(layout, /HomeIcon/);
  assert.match(layout, /SearchIcon/);
  assert.match(layout, /SavedIcon/);
  assert.match(icons, /viewBox="0 0 24 24"/);
  assert.equal(layout.includes("⌕"), false);
  assert.equal(layout.includes("⌂"), false);
  assert.match(css, /\.bottom-nav \.ico[\s\S]*width:\s*28px/);
  assert.match(css, /\.app-icon \.well[\s\S]*width:\s*64px/);
});

test("nested screens have a fixed back button in the header", () => {
  const layout = readFileSync(join(root, "src/components/Layout.tsx"), "utf8");
  const css = readFileSync(join(root, "src/styles/global.css"), "utf8");
  const record = readFileSync(join(root, "src/pages/Record.tsx"), "utf8");
  const folder = readFileSync(join(root, "src/pages/Folder.tsx"), "utf8");
  const nav = readFileSync(join(root, "src/lib/nav.ts"), "utf8");
  assert.match(layout, /back-btn/);
  assert.match(layout, /navigate\(-1\)/);
  assert.match(css, /\.topbar[\s\S]*position:\s*fixed/);
  assert.match(css, /\.back-btn[\s\S]*min-width:\s*44px/);
  assert.match(css, /a \{ color: inherit; text-decoration: none; \}/);
  assert.equal(record.includes("←"), false);
  assert.equal(folder.includes("crumb"), false);
  assert.match(nav, /folderForRecord/);
});

test("route changes scroll the window back to the top", () => {
  const layout = readFileSync(join(root, "src/components/Layout.tsx"), "utf8");
  assert.match(layout, /scrollTo\(0, 0\)/);
  assert.match(layout, /loc\.pathname/);
});

test("at least 30 I-need shortcuts point at real folders or pages", () => {
  const needsSrc = readFileSync(join(root, "src/lib/needs.ts"), "utf8");
  const dirSrc = readFileSync(join(root, "src/lib/directory.ts"), "utf8");
  const tos = [...needsSrc.matchAll(/\bto: "([^"]+)"/g)].map((m) => m[1]);
  assert.ok(tos.length >= 30, `only ${tos.length} needs`);
  for (const to of tos) {
    if (to.startsWith("/d/")) {
      const id = to.slice(3);
      assert.match(dirSrc, new RegExp(`id: "${id}"`), `missing folder ${id}`);
    }
  }
  assert.match(needsSrc, /electrician/);
  assert.match(needsSrc, /hardware/);
  assert.match(needsSrc, /pharmacy/);
  assert.match(needsSrc, /dinner/i);
  assert.match(dirSrc, /id: "home-help"/);
  const home = readFileSync(join(root, "src/pages/Home.tsx"), "utf8");
  assert.match(home, /NeedChips/);
});
