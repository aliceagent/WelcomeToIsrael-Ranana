import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { allCards, recordCard, recordDescription, FOLDERS, PAGES } from "../scripts/share-catalog.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const records = JSON.parse(readFileSync(join(root, "src/data/records.json"), "utf8"));

test("every record, folder, and page has a unique share image path and a real description", () => {
  const cards = allCards();
  const images = new Set();
  const paths = new Set();
  for (const card of cards) {
    assert.ok(card.title, "missing title");
    assert.ok(card.description && card.description.length > 20, `thin description for ${card.path}`);
    assert.ok(card.image.startsWith("/og/") && card.image.endsWith(".png"), card.image);
    assert.equal(images.has(card.image), false, `duplicate image ${card.image}`);
    images.add(card.image);
    assert.equal(paths.has(card.path), false, `duplicate path ${card.path}`);
    paths.add(card.path);
  }
  const ivory = records.find((r) => r.slug === "ivory-del-019");
  assert.ok(ivory);
  const ivoryCard = recordCard(ivory);
  assert.match(ivoryCard.image, /ivory-del-019/);
  assert.match(ivoryCard.title, /Ivory/);
  assert.match(ivoryCard.description, /Computers/);
  assert.ok(FOLDERS.length >= 30);
  assert.ok(PAGES.some((p) => p.path === "/"));
});

test("records without a description still get a written share blurb", () => {
  const blank = records.find((r) => !r.description_en && !r.description_fr);
  const rec = blank || {
    ...records[0],
    description_en: null,
    description_fr: null,
    name_en: "Test Place",
    record_type: "local_business",
    is_raanana: true,
    subcategory: "Pizza",
    phone_primary: null,
  };
  const desc = recordDescription(rec);
  assert.ok(desc.length > 24);
  assert.match(desc, /Test Place|Ra'anana|directory|Call /);
});

test("build pipeline generates per-item OG images and absolute share tags", () => {
  const prerender = readFileSync(join(root, "scripts/prerender.mjs"), "utf8");
  const pkg = readFileSync(join(root, "package.json"), "utf8");
  const html = readFileSync(join(root, "index.html"), "utf8");
  const genOg = readFileSync(join(root, "scripts/gen-og.mjs"), "utf8");
  assert.match(pkg, /gen-og\.mjs/);
  assert.match(prerender, /twitter:image/);
  assert.match(prerender, /siteOrigin/);
  assert.match(html, /summary_large_image/);
  assert.match(html, /og:image:width/);
  assert.match(html, /og\/default\.png/);
  assert.match(genOg, /card\.image === "\/og\/default\.png"/);
  assert.equal(existsSync(join(root, "scripts/fonts/Heebo-Bold.ttf")), true);
  assert.equal(existsSync(join(root, "scripts/gen-og.mjs")), true);
});

test("home share card is the illustrated welcome photo, not a generated template", () => {
  const pngPath = join(root, "public/og/default.png");
  assert.equal(existsSync(pngPath), true);
  const png = readFileSync(pngPath);
  assert.equal(png.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), true);
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  assert.ok(png.length > 200_000, "home card should be the photo, not the small generated template");
  assert.equal(existsSync(join(root, "scripts/assets/welcome-share.jpg")), true);
});
