import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { allCards, siteOrigin } from "./share-catalog.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const indexPath = join(dist, "index.html");

if (!existsSync(indexPath)) {
  console.log("prerender: skip (no dist/index.html)");
  process.exit(0);
}

const index = readFileSync(indexPath, "utf8");
const origin = siteOrigin();

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function abs(path) {
  if (!path) return `${origin}/og/default.png`;
  if (path.startsWith("http")) return path;
  return `${origin}${path}`;
}

function page(card) {
  const title = card.title.includes("Ra'anana") ? card.title : `${card.title} — Ra'anana`;
  const description = card.description;
  const image = abs(card.image);
  const url = abs(card.path === "/" ? "/" : card.path);
  const alt = card.path === "/"
    ? "A family holding a Welcome to Ra'anana sign, with falafel, hummus, and the city behind them"
    : `${card.title}${card.he ? ` · ${card.he}` : ""}`;
  return index
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/property="og:title" content="[^"]*"/, `property="og:title" content="${escapeHtml(title)}"`)
    .replace(/property="og:description" content="[^"]*"/, `property="og:description" content="${escapeHtml(description)}"`)
    .replace(/name="description" content="[^"]*"/, `name="description" content="${escapeHtml(description)}"`)
    .replace(/property="og:image" content="[^"]*"/g, `property="og:image" content="${escapeHtml(image)}"`)
    .replace(/property="og:url" content="[^"]*"/, `property="og:url" content="${escapeHtml(url)}"`)
    .replace(/property="og:image:alt" content="[^"]*"/, `property="og:image:alt" content="${escapeHtml(alt)}"`)
    .replace(/name="twitter:title" content="[^"]*"/, `name="twitter:title" content="${escapeHtml(title)}"`)
    .replace(/name="twitter:description" content="[^"]*"/, `name="twitter:description" content="${escapeHtml(description)}"`)
    .replace(/name="twitter:image" content="[^"]*"/, `name="twitter:image" content="${escapeHtml(image)}"`)
    .replace("<head>", `<head>\n    <link rel="canonical" href="${card.path}" />`);
}

function writeRoute(urlPath, html) {
  const dir = urlPath === "/" ? dist : join(dist, urlPath.replace(/^\//, ""));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
}

const cards = allCards();
for (const card of cards) writeRoute(card.path, page(card));

console.log(`prerender: ${cards.length} share pages`);
