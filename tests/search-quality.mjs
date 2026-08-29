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
const q = (query) => "/search?q=" + encodeURIComponent(query);

/** The "Open <folder>" chip a query maps to, as a path (null when absent). */
async function needChip(page) {
  const link = page.locator("a.need-chip.inline").first();
  return (await link.count()) ? new URL(await link.getAttribute("href"), BASE).pathname : null;
}

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

  // ---- round 4, item 1: passes merge on merit, not in pass order ----
  const gym = await cards(page, q("gym near me"));
  check(
    "h1  q=gym near me puts the sports department in the top three",
    firstIndex(gym, /sports department/i) >= 0 && firstIndex(gym, /sports department/i) < 3,
    titlesOf(gym).join(" | "),
  );
  check(
    "h2  q=gym near me shows no charity or synagogue",
    !has(gym, /akim|synagogue|beit knesset|safra/i),
    titlesOf(gym).join(" | "),
  );

  const barber = await cards(page, q("barber shop"));
  const midragBarber = firstIndex(barber, /midrag/i);
  check("h3  q=barber shop puts Midrag in the top three", midragBarber >= 0 && midragBarber < 3, titlesOf(barber).join(" | "));
  check(
    "h4  q=barber shop has no ice cream, butcher or supermarket above Midrag",
    !barber.slice(0, midragBarber < 0 ? barber.length : midragBarber).some((c) => /golda|basar|shufersal|rami levy|victory|l'art du pain/i.test(c.title)),
    titlesOf(barber).join(" | "),
  );

  // ---- item 2: wide-fuzzy guardrails ----
  const hummus = await cards(page, q("hummus"));
  check(
    "i1  q=hummus never surfaces a crisis line",
    !has(hummus, /sexual assault|crisis|mikvah/i),
    titlesOf(hummus).join(" | "),
  );
  check("i2  q=hummus offers the eat-out folder", (await needChip(page)) === "/d/restaurants", `chip ${await needChip(page)}`);
  check(
    "i3  q=hummus offers the live directories",
    has(hummus, /midrag|easy|google maps/i),
    titlesOf(hummus).join(" | "),
  );

  for (const spelling of ["shwarma", "shawarma"]) {
    await cards(page, q(spelling));
    const empty = await page.locator(".no-results").count();
    const shown = await page.$$eval(".card h3", (n) => n.map((x) => x.textContent.trim()));
    check(
      `i4  q=${spelling} falls through to the try-instead path, not pharmacies or shelters`,
      empty > 0 && !shown.some((t) => /super-pharm|shelter|synagogue|shaar/i.test(t)),
      shown.join(" | "),
    );
  }

  const coiffeur = await cards(page, q("coiffeur"));
  check(
    "i5  q=coiffeur leads with a directory, not a café",
    /midrag|easy|google maps/i.test(coiffeur[0]?.title || ""),
    titlesOf(coiffeur).join(" | "),
  );

  const busCard = await cards(page, q("carte de bus"));
  const transitAt = firstIndex(busCard, /moovit|rav-kav/i);
  const bugAt = firstIndex(busCard, /^bug/i);
  check(
    "i6  q=carte de bus ranks Moovit/Rav-Kav above the BUG electronics shop",
    transitAt >= 0 && (bugAt === -1 || transitAt < bugAt),
    `transit=${transitAt} bug=${bugAt} :: ${titlesOf(busCard).join(" | ")}`,
  );

  // ---- item 3: synonym and intent coverage ----
  const medecin = await cards(page, q("médecin"));
  check("j1  q=médecin offers the Health folder", (await needChip(page)) === "/d/health", `chip ${await needChip(page)}`);
  check(
    "j2  q=médecin leads with a health fund, not the ambulance service",
    /clalit|maccabi|meuhedet|leumit|kupat holim/i.test(medecin[0]?.title || ""),
    titlesOf(medecin).join(" | "),
  );

  await cards(page, q("kupat holim"));
  check("j3  q=kupat holim offers Health, not the Aliyah desk", (await needChip(page)) === "/d/health", `chip ${await needChip(page)}`);

  const maternelle = await cards(page, q("maternelle"));
  check(
    "j4  q=maternelle surfaces kindergarten registration",
    has(maternelle, /kindergarten|gan\b|maternelle/i),
    titlesOf(maternelle).join(" | "),
  );

  const kfarSaba = await cards(page, q("bus kfar saba"));
  check(
    "j5  q=bus kfar saba surfaces the bus operators",
    has(kfarSaba, /egged/i) && has(kfarSaba, /metropoline/i),
    titlesOf(kfarSaba).join(" | "),
  );

  const haircut = await cards(page, q("haircut"));
  check("j6  q=haircut reaches the trades directory", has(haircut, /midrag|easy/i), titlesOf(haircut).join(" | "));

  const groceryOpen = await cards(page, q("grocery open"));
  check(
    "j7  q=grocery open searches groceries, not the word 'open'",
    has(groceryOpen, /shufersal|rami levy|victory|carrefour|tiv taam/i) && !has(groceryOpen, /open university/i),
    titlesOf(groceryOpen).join(" | "),
  );

  const openNow = await cards(page, q("open now"));
  check("j8  q=open now no longer answers with bomb shelters", !has(openNow, /shelter/i), titlesOf(openNow).join(" | "));

  await cards(page, q("synagogue"));
  check("j9  q=synagogue offers the Synagogues folder", (await needChip(page)) === "/d/synagogues", `chip ${await needChip(page)}`);

  // ---- item 4: checklists sink below places that can act ----
  const phone = await cards(page, q("phone plan"));
  check(
    "k1  q=phone plan leads with the telecom, not the Hebrew-learning checklist",
    /golan|cellcom|partner|hot|pelephone/i.test(phone[0]?.title || ""),
    titlesOf(phone).join(" | "),
  );

  // ---- item 6: the chip says when it closes / when it reopens ----
  await page.clock.install({ time: new Date("2026-09-01T07:00:00Z") }); // Tuesday 10:00 in Israel
  await page.goto(`${BASE}/e/ministry-of-aliyah-and-integration-emg-019`, { waitUntil: "networkidle" });
  await page.waitForSelector(".chips .chip", { timeout: 15000 });
  const openChips = await page.$$eval(".chips .chip", (n) => n.map((x) => x.textContent.trim()));
  check("l1  Tuesday 10:00 shows the closing time", openChips.some((c) => /Open until 16:00/i.test(c)), openChips.join(" | "));

  await page.clock.setFixedTime(new Date("2026-09-01T15:00:00Z")); // Tuesday 18:00 in Israel
  await page.goto(`${BASE}/e/ministry-of-aliyah-and-integration-emg-019`, { waitUntil: "networkidle" });
  await page.waitForSelector(".chips .chip", { timeout: 15000 });
  const shutChips = await page.$$eval(".chips .chip", (n) => n.map((x) => x.textContent.trim()));
  check("l2  Tuesday evening shows when it reopens", shutChips.some((c) => /Reopens\s+\S+\s+08:00/i.test(c)), shutChips.join(" | "));

  // A kosher chain with no recorded weekday hours: closed on Shabbat, silent otherwise.
  await page.clock.setFixedTime(new Date("2026-09-05T09:00:00Z")); // Shabbat, 12:00 in Israel
  // A map on the page keeps tiles loading, so wait for the DOM, not the network.
  await page.goto(`${BASE}/e/shufersal-deal-ra-anana-bus-031`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".chips .chip", { timeout: 15000 });
  const shabbatChips = await page.$$eval(".chips .chip", (n) => n.map((x) => x.textContent.trim()));
  check("l3  a kosher supermarket reads as closed on Shabbat", shabbatChips.some((c) => /Closed for Shabbat/i.test(c)), shabbatChips.join(" | "));
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
