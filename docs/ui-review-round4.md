# UI review — round 4 (persona testing)

Fourth review pass, run against the round-3 production build. Four new
personas exercised the app through Playwright (390×844, EN/FR/HE), each
with verified, screenshotted evidence:

- **Avi, 68** — low vision, English UI. Measured font sizes, contrast,
  and tap targets; ran the doctor/pharmacy/synagogue/emergency tasks;
  tested OS-level font scaling.
- **Léa, 34** — French-only, ten days in. Systematic French sweep of 22
  pages hunting untranslated strings; nine French search queries; the
  checklist flow end to end.
- **Yoni, 16** — fast and sloppy. Nineteen slang/typo queries, timing
  measurements, back-navigation and scroll restoration, mash-navigation
  stress test.
- **Mika, 41** — Friday noon, clock pinned to 12:00 before Shabbat.
  Hours communication, Shabbat planning, on-call pharmacy, checklist
  persistence, delivery fallback.

What held up from rounds 1–3: search exactness gating and stopwords,
first load at ~600ms interactive, typing latency ~22ms/char, recent
searches, checklist persistence, save/find-again, SOS hero legibility,
dark-mode WhatsApp contrast, clean reflow at 20px root font.

## Item 0 (user request, shipped with this doc): list → map deep links

Folder pages get a **Show on map** button and search results a **Map**
button; `/map` accepts `?d=<folder>&chip=<chip>` and `?q=<query>`,
shows the active filter as a clearable chip, and plots exactly the
filtered list.

## Sprint 1 — search engine + data (items 1–10)

1. **Cross-pass merge re-sort.** `searchWithMeta` concatenates synonym
   passes in pass order and never re-ranks: "gym near me" puts a
   disability charity and a synagogue above the sports department;
   "barber shop" puts ice cream and supermarkets above Midrag. Worse,
   one exact pass anywhere clears the page-level `loose` flag, so the
   noise displays with full confidence. Merge score-aware; when any pass
   is exact, drop the loose hits instead of hiding the banner.
2. **Wide-fuzzy guardrails.** "hummus" fuzzy-matches a sexual-assault
   crisis line via the Hebrew transliteration skeletons; "shwarma" →
   Super-Pharm branches; "coiffeur" → a café; "bus" ↔ "BUG" electronics.
   Crisis/emergency records must never appear on fuzzy-only matches, and
   tenuous loose sets should fall through to the no-results + try-instead
   path (as "felafel" already does).
3. **Synonym and intent coverage.** Missing: "haircut/hair cut";
   "médecin/docteur/hôpital/clinique" (the top French health words are
   absent from the health aliases); "maternelle" (kindergarten);
   "egged/metropoline" (bus operators never surface for "bus kfar
   saba"); "hummus/falafel/shawarma" → eat-out folder + live lookup.
   "kupat holim" mis-routes to the Aliyah-desk chip instead of Health.
   "open now" returns bomb shelters and "grocery open" misses every
   supermarket — treat "open" as an intent token, not a search term.
4. **Checklist demotion.** "phone plan" ranks the Hebrew-learning-plan
   checklist above Golan Telecom. Demote checklist body-text matches
   below actionable records, like the glossary demotion.
5. **Shabbat banner rollover.** The banner says "Shabbat starts at
   18:51" all Friday night — it branches on weekday only, never
   comparing the time to candle-lighting. After candles, switch to the
   "closed until ~{havdalah}" message.
6. **Open until / reopens.** Nothing anywhere states a closing or
   reopening time. Where hours parse, chips should say "Open until
   17:00" / "Reopens Sun 08:00" instead of bare Open/Closed.
7. **Hours data.** `hours_structured` is empty on all 616 records; no
   grocery, bakery, butcher, or pharmacy ever shows an open/closed
   state. Add closed-day support to the hours pipeline and mark the
   kosher food businesses closed on Shabbat (factual); pull real chain
   hours only from official sources where reachable — never invent.
8. **Data fixes.** Super-Pharm Ahuza is double-listed (BUS-049 vs
   BUS-038, ~40m apart); the Easy and Google Maps live-lookup cards have
   untranslated names (DIR-007/DIR-008) despite being the fallback for
   every trade search; the Home Front Command app's French name differs
   from the other two records of the same agency; the Shabbat-planning
   checklist (CHK-016) links to nothing actionable.
9. **Record metadata i18n.** Every record page leaks raw English:
   category breadcrumb, subcategory chip, the languages field, and the
   internal `verification_status` QA note ("…require launch QA") render
   verbatim in FR/HE. Checklists show a legal disclaimer under
   "Horaires:". The Settings privacy note is English-only. Translate the
   first three, hide the QA note, suppress the checklist hours field,
   localize the privacy note.
10. **Hebrew descriptions.** 448 of 561 records with an English
    description have no `description_he` — Hebrew UI serves English text
    on ordinary business cards. Author Hebrew descriptions for the
    food/pharmacy/grocery/delivery records first (~60 records).

## Sprint 2 — UI, accessibility, mechanics (items 11–20)

11. **44px tap targets.** The language switcher (44×36) and every
    `.btn.small` (36px), including the whole "Getting there" row, are
    under the 44px minimum. Raise min-height globally.
12. **Secondary type scale.** Bottom-nav labels, grid captions, chips,
    and status badges all measure 12.5–13.8px. Bump the muted/secondary
    scale to 14px.
13. **WhatsApp green in light mode.** 3.46:1 against the cream surface
    (dark mode was fixed in round 3; light mode wasn't). Darken the
    light-mode token to pass AA.
14. **Topbar title truncation.** "Clalit Shuali Clinic and Pharmacy"
    truncates at default zoom (161px slot). Let the title use freed
    space or shrink gracefully.
15. **Settings layout.** The Home-pin section leads with raw lat/long
    number inputs; the friendlier "Use my location" buttons come after,
    and the separate emergency-address field reads as the same concept.
    Lead with the buttons, move coordinates behind an "advanced"
    disclosure, label the two concepts apart.
16. **Address wipe on init.** A pre-existing `raanana.address` value
    reads back empty after app boot under some storage-state
    combinations (reproduced 3×). Find and fix the init path that
    overwrites it — this field exists to be read to a dispatcher.
17. **Folder scroll restoration.** Back from a record into `/d/…`
    resets scroll to 0 (search restores correctly). Skip the forced
    scroll-to-top on POP navigations.
18. **Leaflet teardown race.** Fast search→record→back cycles throw
    `_leaflet_pos` errors — the cluster layer operates on a map whose
    DOM may already be gone. Guard unmount.
19. **Language switcher position in RTL.** The switcher mirrors with
    the chrome, so the tap position for "back to English" jumps to the
    opposite corner. Pin it to a fixed physical corner.
20. **Shabbat-aware guidance.** The Shabbat page has times but zero
    "what closes when" guidance and no links to groceries/pharmacy/
    delivery; after candle-lighting nothing nudges toward delivery/
    online options. Add a closures note and folder links to the Shabbat
    page, and a delivery banner on food folders once Shabbat is in.
