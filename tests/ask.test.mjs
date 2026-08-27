import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import MiniSearch from "minisearch";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const records = JSON.parse(readFileSync(join(root, "src/data/records.json"), "utf8"));

test("ask bot searches the directory and never ships a Kimi key", () => {
  const agent = readFileSync(join(root, "src/server/ask-agent.ts"), "utf8");
  const handle = readFileSync(join(root, "src/server/handle-ask.ts"), "utf8");
  const home = readFileSync(join(root, "src/pages/Home.tsx"), "utf8");
  const app = readFileSync(join(root, "src/App.tsx"), "utf8");
  const vercel = readFileSync(join(root, "vercel.json"), "utf8");
  const vite = readFileSync(join(root, "vite.config.ts"), "utf8");
  const gitignore = readFileSync(join(root, ".gitignore"), "utf8");
  assert.match(agent, /searchDirectory/);
  assert.match(agent, /moonshotai/);
  assert.match(handle, /createAgentUIStreamResponse/);
  assert.match(home, /AskBar/);
  assert.match(app, /path="\/ask"/);
  assert.match(vercel, /api\//);
  assert.match(vite, /navigateFallbackDenylist/);
  assert.match(vite, /api/);
  assert.match(gitignore, /\.env\.local/);
  assert.equal(existsSync(join(root, "api/ask.ts")), true);
  assert.equal(existsSync(join(root, ".env.example")), true);
  const tracked = [
    agent,
    handle,
    home,
    app,
    readFileSync(join(root, "src/pages/Ask.tsx"), "utf8"),
    readFileSync(join(root, ".env.example"), "utf8"),
  ].join("\n");
  assert.equal(tracked.includes("sk-kimi-"), false);
});

test("directory search still finds plumber and school listings for the ask bot", () => {
  const index = new MiniSearch({
    fields: ["name_en", "search_aliases", "subcategory", "category", "tags", "description_en", "search_text"],
    storeFields: ["record_id"],
    idField: "record_id",
  });
  index.addAll(records);
  const school = index.search("school");
  assert.ok(school.length >= 3, "school hits");
  const health = records.filter((r) => r.category === "Health & Family");
  assert.ok(health.length >= 5, "health records");
  const trades = records.filter((r) => /midrag/i.test(r.name_en || "") || /home center/i.test(r.name_en || ""));
  assert.ok(trades.length >= 1, "handyman live lookup");
});
