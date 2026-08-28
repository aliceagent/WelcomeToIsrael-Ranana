/**
 * Search-quality acceptance run (not part of `node --test`).
 *
 *   node tests/search-quality.mjs [--no-build]
 *
 * Builds the app, serves dist on 4181 and drives the real pages with
 * Playwright, asserting on the result cards a person would actually see.
 */
import { execSync, spawn } from "node:child_process";
import { createRequire } from "node:module";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 4181;
const BASE = `http://127.0.0.1:${PORT}`;
const SYNAGOGUE_COUNT = 84;

let failures = 0;

function check(label, ok, detail = "") {
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail && !ok ? ` — ${detail}` : ""}`);
}

async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(BASE);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`preview server never came up on ${PORT}`);
}

/** Card titles plus their type chip, in the order they appear on the page. */
async function cards(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForSelector(".card h3, .no-results, .empty", { timeout: 15000 });
  return page.$$eval(".card", (nodes) =>
    nodes.map((n) => ({
      title: n.querySelector("h3")?.textContent?.trim() || "",
      chips: [...n.querySelectorAll(".chip")].map((c) => c.textContent.trim()),
    })),
  );
}

const titlesOf = (list) => list.map((c) => c.title);
const has = (list, re) => titlesOf(list).some((t) => re.test(t));
const firstIndex = (list, re) => titlesOf(list).findIndex((t) => re.test(t));

async function run(page) {
  // a. A Hebrew word for "taxi" must not surface the sexual-assault crisis lines.
  const taxi = await cards(page, "/search?q=" + encodeURIComponent("מונית"));
  check(
    "a1  q=מונית has no sexual-assault crisis line",
    !has(taxi, /sexual assault|תקיפה מינית|agression sexuelle/i),
    titlesOf(taxi).join(" | "),
  );
  check("a2  q=מונית surfaces a taxi option", has(taxi, /gett|taxi|monit|מונית/i), titlesOf(taxi).join(" | "));

  // b. A trade query leads with the directory that finds tradespeople.
  const electrician = await cards(page, "/search?q=electrician");
  check("b1  q=electrician leads with Midrag", /midrag/i.test(electrician[0]?.title || ""), titlesOf(electrician).join(" | "));
  check(
    "b2  q=electrician does not lead with the electric utility",
    !/israel electric/i.test(electrician[0]?.title || ""),
    titlesOf(electrician).join(" | "),
  );

  // c. The typo path still answers, and says the matches are approximate.
  const typo = await cards(page, "/search?q=electrition");
  check("c1  q=electrition still reaches Midrag", has(typo, /midrag/i), titlesOf(typo).join(" | "));
  const notice = await page.locator(".banner", { hasText: "close matches" }).count();
  check("c2  q=electrition shows the close-matches notice", notice > 0);

  // d. Stopwords must not turn "bus to tel aviv" into a restaurant search.
  const bus = await cards(page, "/search?q=" + encodeURIComponent("bus to tel aviv"));
  check("d1  q=bus to tel aviv has no Wok to Walk", !has(bus, /wok to walk/i), titlesOf(bus).join(" | "));
  check(
    "d2  q=bus to tel aviv surfaces transit",
    has(bus, /moovit|rav-kav|rav kav|bus|train|railway|maps/i),
    titlesOf(bus).join(" | "),
  );

  // e. Ordinary queries keep working.
  const pizza = await cards(page, "/search?q=pizza");
  check("e1  q=pizza still leads with Pizza Cheese", /pizza cheese/i.test(pizza[0]?.title || ""), titlesOf(pizza).join(" | "));
  const pharmacy = await cards(page, "/search?q=" + encodeURIComponent("בית מרקחת"));
  check("e2  q=בית מרקחת returns at least 5 results", pharmacy.length >= 5, `got ${pharmacy.length}`);

  // f. A French medical query answers with clinics, not a flashcard.
  const pediatre = await cards(page, "/search?q=" + encodeURIComponent("pédiatre"));
  const care = firstIndex(pediatre, /clalit|maccabi|meuhedet|leumit|schneider|tipat halav/i);
  const glossary = pediatre.findIndex((c) => c.chips.some((chip) => /hebrew term|terme hébreu|מונח/i.test(chip)));
  check(
    "f   q=pédiatre puts a health fund above any glossary card",
    care >= 0 && (glossary === -1 || care < glossary),
    `care=${care} glossary=${glossary} :: ${titlesOf(pediatre).join(" | ")}`,
  );

  // g. Synagogues can be filtered by nusach.
  const synagogues = await cards(page, "/d/synagogues");
  const chip = page.locator(".filters button", { hasText: "Sephardi" });
  const chipCount = await chip.count();
  check("g1  /d/synagogues renders nusach chips", chipCount > 0);
  check("g2  /d/synagogues lists the full set", synagogues.length === SYNAGOGUE_COUNT, `got ${synagogues.length}`);
  if (chipCount > 0) {
    await chip.first().click();
    await page.waitForFunction(
      (full) => document.querySelectorAll(".card").length < full,
      SYNAGOGUE_COUNT,
      { timeout: 5000 },
    ).catch(() => {});
    const filtered = await page.$$eval(".card", (nodes) => nodes.length);
    check("g3  Sephardi chip narrows the list", filtered > 0 && filtered < synagogues.length, `got ${filtered}`);
  }
}

async function main() {
  if (!process.argv.includes("--no-build")) {
    console.log("building…");
    execSync("npm run build", { cwd: root, stdio: "inherit" });
  }
  const server = spawn("npx", ["vite", "preview", "--host", "127.0.0.1", "--port", String(PORT)], {
    cwd: root,
    stdio: "ignore",
    detached: true,
  });
  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
    const context = await browser.newContext();
    await context.addInitScript(() => {
      localStorage.setItem("raanana.onboarded", "1");
    });
    const page = await context.newPage();
    await run(page);
  } finally {
    if (browser) await browser.close();
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      server.kill("SIGTERM");
    }
  }
  console.log(failures === 0 ? "\nall search-quality checks passed" : `\n${failures} check(s) failed`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
