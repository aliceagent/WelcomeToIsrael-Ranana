import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const indexPath = join(dist, "index.html");

if (!existsSync(indexPath)) {
  console.log("prerender: skip (no dist/index.html)");
  process.exit(0);
}

const index = readFileSync(indexPath, "utf8");
const records = JSON.parse(readFileSync(join(root, "src/data/records.json"), "utf8"));
const meta = JSON.parse(readFileSync(join(root, "src/data/meta.json"), "utf8"));

function page(title, description, path, image = "/og/default.png") {
  return index
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/property="og:title" content="[^"]*"/, `property="og:title" content="${escapeHtml(title)}"`)
    .replace(/property="og:description" content="[^"]*"/, `property="og:description" content="${escapeHtml(description)}"`)
    .replace(/name="description" content="[^"]*"/, `name="description" content="${escapeHtml(description)}"`)
    .replace(/property="og:image" content="[^"]*"/, `property="og:image" content="${image}"`)
    .replace("<head>", `<head>\n    <link rel="canonical" href="${path}" />`);
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function writeRoute(urlPath, html) {
  const file = join(dist, urlPath.replace(/^\//, ""), urlPath === "/" ? "index.html" : "index.html");
  const dir = urlPath === "/" ? dist : join(dist, urlPath.replace(/^\//, ""));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
}

writeRoute("/", page("Welcome to Ra'anana", "Living guide for new families in Ra'anana.", "/"));
writeRoute("/emergency", page("Emergency — Welcome to Ra'anana", "Critical numbers and nearby shelters.", "/emergency"));
writeRoute("/share", page("Share kit — Welcome to Ra'anana", "Share the Ra'anana living guide.", "/share"));

for (const rec of records) {
  const title = `${rec.name_en || rec.name_he || rec.record_id} — Ra'anana`;
  const desc = rec.description_en || rec.description_fr || "Welcome to Ra'anana";
  writeRoute(`/e/${rec.slug}`, page(title, desc, `/e/${rec.slug}`));
}

function slugify(category) {
  return category.toLowerCase().replace(/['’]/g, "").replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

for (const c of meta.categories) {
  writeRoute(`/c/${slugify(c)}`, page(`${c} — Ra'anana`, `Browse ${c} in the Ra'anana living guide.`, `/c/${slugify(c)}`));
}

console.log(`prerender: ${records.length} record pages`);
