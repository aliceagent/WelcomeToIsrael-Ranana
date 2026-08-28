# Round-two review — after the big release

Date: 2026-08-28, hours after the 24-item release, the Shabbat page, and the map rebuild went live. Method: fresh code read plus hard measurements of the dataset, bundle, PWA config, and API surface. Round one fixed how the app *presents*; round two is dominated by what the app *contains* and what keeps it healthy.

## What the measurements say

- **Bundle**: one 2.3 MB JS chunk. `records.json` alone is 1.5 MB and ships inside it, up front, alongside React, Leaflet + markercluster, @hebcal/core, and the AI SDK. First load pays for everything.
- **No CI**: zero GitHub workflows. Every merge so far was protected only by checks run locally.
- **Offline map is empty**: no workbox `runtimeCaching`, so OSM tiles and Google Fonts are never cached; the offline map renders gray.
- **Coordinates are estimates**: of 228 physical records, only **7** have high-confidence mapped points; 211 are street-centroid/interpolation estimates and 7 sit on a city-center fallback (a visibly wrong pin). The new map makes this quality visible.
- **Data gaps the map counts exposed**: 2 mappable pharmacies, 2 parks, 0 pools/playgrounds, and the "Kids & school" pins are 7 *municipal offices* — not one actual school or gan. Lev HaPark, the municipal pool, and the tennis center have no coordinates at all. Only 97/228 physical records have a phone number.
- **Ask endpoint is unguarded**: `/api/ask` is public with no rate limit or message-length cap — anyone can burn the Kimi budget.
- **No `prefers-reduced-motion`** anywhere in the stylesheet.

## The plan

### Tier 0 — Protect the product (do first, small)

1. **CI on GitHub Actions**: `tsc -b`, `node --test`, full build on every PR/push to main. The repo currently has no safety net at all.
2. **Code-split the bundle**: lazy-load the Map, Ask, and Shabbat routes (Leaflet, AI SDK, hebcal each load only when visited) and fetch `records.json` as a separate cached asset instead of baking 1.5 MB into the entry chunk. Target: first paint under ~600 KB.
3. **Offline runtime caching**: workbox `runtimeCaching` — CacheFirst with expiry for OSM tiles (map keeps working where you've been), stale-while-revalidate for fonts.
4. **Harden `/api/ask`**: cap message length and history size, add a simple per-IP rate limit, return the existing graceful "helper offline" state when throttled.

### Tier 1 — Data sprint (the biggest lever now)

5. **Fix the three missing coordinates** (Lev HaPark, municipal pool, tennis center) — minutes of work, unblocks the Sports section.
6. **Add the everyday places the counts exposed**: real pharmacy branches (Super-Pharm/Good Pharm), the city's parks and playgrounds, actual schools and ganim (the weakest area for a family with kids), bank and post-office branches. Target ~60–80 new mappable records.
7. **Coordinate accuracy pass**: verify the top ~50 most-used places against real map points; until then, render low-confidence pins with an "approx." treatment (the `isLowConfidence` helper already exists but the map ignores it).
8. **Phone-number sprint**: 131 physical places have no phone; the Call button is the app's most valuable action.
9. **Structured hours for the top ~50 places**: add an `hours` field to the dataset schema + ingest; the Open-now badge and a future "open now" map filter are already built and waiting for data.
10. **Hebrew descriptions** (standing item from round one): still 0 of 561.

### Tier 2 — Deepen the new features

11. **Shabbat page: look ahead** — the next four weeks' parshiot and an upcoming-chagim timeline with dates and times (the calendar engine already computes all of it).
12. **Map follow-ups**: a "you are here" dot when Near-me is on; tapping a list card highlights its pin; an "Open now" chip once hours data lands.
13. **Journeys: link the steps** — checklist descriptions name apps and offices ("install Home Front Command", "register with a health fund") but nothing is tappable; deep-link each step to its record, and nudge from Home while Week 1 is incomplete.
14. **Family sync**: saved places, notes, and checklist progress live in one phone's localStorage. Add export/import via a share link or file so both parents see the same state — the honest v1 of sync with no backend.
15. **Type Hebrew without a Hebrew keyboard**: generate latin-transliteration search aliases from `name_he` at ingest so "misrad", "tipat halav", "makolet" hit even where no alias was hand-written.
16. **Surface the SOS address card**: it only helps if it's filled in — add it to onboarding or nudge from the Emergency page (partially done: the empty state links to Settings; make onboarding mention it).

### Tier 3 — Polish

17. **`prefers-reduced-motion` guards** for the spinner and transition animations.
18. **Focus management**: move focus to the page title on route change; add a skip-to-content link.
19. **PWA shortcuts** in the manifest (long-press app icon → SOS / Map / Shabbat).
20. **Bundle hygiene follow-through**: audit @hebcal/core tree-shaking and drop the unused `--leaf`/legacy tokens.

## Suggested order

Tier 0 in one sitting (it protects everything after it), then the data sprint as its own effort — it's research + data entry more than code, and it multiplies the value of every feature shipped today. Tiers 2–3 slot in behind.
