# Round-three review — persona field tests

Date: 2026-08-28, after the search-clarity release. Method: four AI personas drove the built app end-to-end with Playwright (mobile viewport, screenshots, timings, DOM measurements): **Chantal** (French-speaking religious mother, FR UI), **Mark** (Anglo handyman dad, search stress-tests), **Savta Rivka** (native Hebrew speaker, RTL + readability audit), and **Tom** (dark-mode teen, speed runs). ~40 ranked findings consolidated into the 20 below.

## The headline discoveries

- Search's fuzzy matching produces **dangerous** collisions, not just noise: "מונית" (taxi) returned sexual-assault crisis hotlines (מונית≈מינית), "electrician" ranked the Israel Electric *hazard emergency line* first, "dud shemesh" surfaced Home Front Command.
- The trilingual promise still leaks: all 24 checklists are untranslated in FR **and** HE; priority/status chips render as 12.5px English everywhere; RTL bidi scrambles slash-separated phone numbers on the SOS page of all places.
- The Google Fonts `<link>` render-blocks first paint (~13s when the font host stalls) — all three measuring personas hit it independently; an offline-first PWA must not hard-depend on a font CDN.
- Confirmed strong: dark-mode token coverage, RTL chrome, the Shabbat page in all three languages, sticky search mechanics, jank-free interactions (60–110ms route flips, zero errors under mashing).

## The 20 items

### Sprint 1 — search engine & data language (high stakes)
1. **Exactness gating**: drop fuzzy-only hits whenever exact/prefix matches exist; if *only* fuzzy hits exist, cap at 5 and label them "close matches". Kills electrician→IEC-emergency and מונית→crisis-line while keeping typo recovery.
2. **No fuzzy for Hebrew tokens** (dense space, 1-edit collisions like מונית/מינית); prefix matching stays.
3. **Stopword handling**: "to/the/de/la…" must not match ("bus to tel aviv" → Wok to Walk).
4. **Multi-word OR-fallback discipline**: single-token matches from the OR retry count as loose.
5. **Synonym gaps**: water heater/boiler/dud shemesh→plumber; gym/fitness→sports; taxi/מונית→Gett; מכולת→grocery; מספרה→hairdresser; pédiatre→kupot+Tipat Halav+Schneider; garderie→childcare; cacher/casher→kosher; pharmacie de garde→pharmacy; locksmith/aircon→Midrag (+THIN_TRADE so the live section appears).
6. **Demote glossary flashcards** in results (pédiatre's only "result" was a vocabulary card — and saving it saves the flashcard).
7. **Nusach chips on Synagogues** (84 records, no filter today) + index `denomination_nusach` for search ("בית כנסת ספרדי").
8. **Checklist translations**: `name_he` + `name_fr` for all 24, plus the 18 missing Hebrew descriptions (overlay).
9. **Priority-label i18n**: translate the finite priority set ("Essential local"…) for FR/HE chips.
10. **Loose-results hint** on the search page so junk never masquerades as confident results.

### Sprint 2 — visual, RTL, and mechanics
11. **Phone bidi isolation**: "107 / *9107" renders scrambled in RTL — wrap all phone renderings in LTR-isolated spans (SOS heroes, card chips, record pages).
12. **Glossary duplicate**: HE mode prints each term twice (dedicated Hebrew block + title); hide the redundant title.
13. **Short header titles**: /ask reuses its 33-char hero sentence as the topbar title and truncates in all three languages.
14. **Clipped "Courses" tile**: home food tile overflows the 390px viewport in FR; add min-width guards.
15. **Scroll affordance**: chip rows hard-clip with no fade/peek hint.
16. **Landscape map**: fixed bottom nav overlaps pins; constrain map height in landscape.
17. **Dark-mode leftovers**: white Leaflet zoom controls; hardcoded WhatsApp green fails AA contrast on dark (3.8:1).
18. **Record action-row diet**: up to 9 buttons (5 of them directions variants); group navigation into a compact secondary row.
19. **Copy honesty & feedback**: "Call ahead" shown on phoneless records; search-results Share gives no "copied" feedback; category share text is hardcoded English.
20. **Non-blocking fonts** + open/closed dimming on folder lists (the Friday-deadline view Mark needed).

Full persona reports and evidence live in the session scratchpad (persona-chantal/mark/rivka/tom).
