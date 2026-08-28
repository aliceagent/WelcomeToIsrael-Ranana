# UI review — walking through the app as a new immigrant

Date: 2026-08-28. Method: full read of every page/component (`src/pages/*`, `src/components/*`, `src/lib/*`) plus the published dataset (`src/data/records.json`, 561 records), role-playing the daily life of a newly arrived family in Ra'anana: feeding the family, kupah appointments, school, bureaucracy, transport, Hebrew, Shabbat, emergencies.

The app's bones are genuinely strong — offline-first, trilingual, one-tap emergency dialing, distance-from-home on every card, shareable everything. The list below is where the experience falls short of what a newcomer reaches for daily, plus concrete UI defects found in code.

## A. Daily-life gaps (highest impact)

1. **"Open now" and structured hours.** Hours exist only as free text (`availability_hours_note`, 377 records) with a blanket "Hours change. Call ahead." caveat. The single most common daily question — *is it open right now?* — is unanswerable. Add structured per-day hours and an Open/Closed/Closes-soon badge on cards and folders, especially Friday-afternoon closing times.

2. **Shabbat & chagim layer.** Nothing in the app knows about Shabbat or holidays — the #1 rhythm a newcomer misjudges. Add candle-lighting/havdalah times, a chagim calendar with "most shops close tomorrow" banners, school-vacation dates, and a "what's open on Shabbat" filter.

3. **"Near me" from where I'm standing.** Every distance is measured from the *home pin* (`RecordCard.Distance`, `sortDirectory`). When you're at the park and need a pharmacy, the app can't help. Add a "use my current location" toggle (geolocation) on Map and folder pages.

4. **Home-pin setup is raw latitude/longitude fields** (`Settings.tsx`). No new immigrant knows their coordinates. Replace with a tap-on-a-map picker or address search (with the existing privacy note). Related bug: after changing the pin, list *ordering* still uses the precomputed `distance_from_home_km_est` from the family default (`sortDirectory` in `directory.ts`) — only the displayed chip recomputes — so "nearest first" sorts from someone else's house.

5. **Emergency: help me *speak*.** One-tap 100/101/102 is excellent, but the next moment a panicked oleh must talk to a Hebrew-speaking dispatcher. Add a "say this" card: key phrases with transliteration, your address auto-rendered in Hebrew big enough to read out, and MDA's English-capable line. Also add a one-tap "nearest shelter now" (geolocation + walking minutes, cached offline) — today `Emergency.tsx` lists 8 shelters nearest *home*.

6. **First-run onboarding.** First launch drops straight into a dense home page. Add a 3-screen setup: pick language → set home pin → "Add to Home Screen" (iOS PWA needs manual instructions) + star your kupah/school/emergency basics.

7. **Turn checklists into journeys.** `Checklists.tsx` is one flat list of 24 items sorted by priority, each with a vague "More →" link (the label is literally the `moreComing` key). Group into guided journeys — Week 1, Health fund, Bank, Car & license, School enrollment — with per-journey progress, ordered steps, and each step deep-linking to the relevant record.

8. **"How to book" on government/health records.** Records show eligibility and phone, but the real-world skill is appointments: MyVisit/GovVisit for Misrad Hapnim/Bituach Leumi, kupah apps for doctors. Add a structured "How to book" field and CTA.

9. **WhatsApp groups directory.** Olim life runs on WhatsApp groups (Ra'anana Anglos, French community, secondhand, gmachim, school class groups). A "Community groups" folder with join links would be used weekly and fits the data model.

10. **Glossary: transliteration + audio.** `glossary_term` cards lead with Hebrew script the audience can't read yet. Show transliteration prominently ("arnona", "mashkanta"), add speech playback, and support transliterated search. Bug: the glossary search placeholder reuses the general `searchHint` ("Electrician, pharmacy, dinner, hardware…") — wrong context.

## B. Language & content correctness

11. **Hebrew UI promises more than the data delivers.** 0 of 561 records have a Hebrew description (`displayDescription` falls back to English), so switching to HE gives Hebrew chrome with English content. Either generate `description_he` or scope the HE toggle honestly.

12. **Emergency hero cards ignore the language setting** — `Emergency.tsx` prints `r.name_en` directly instead of `displayName(r, lang)`.

13. **Broken tel: links for slash-separated numbers.** 4 records (incl. `EMG-006` city hotline and `PHN-001`) store `phone_primary` as "num1 / num2". `Home.tsx` splits on "/", but `Record.tsx` and `RecordCard` pass the whole string to `telHref`, which strips the separator and dials both numbers concatenated. Render one call button per number.

14. **Naming consistency:** bottom nav says "Saved", the page title says "Favorites"; "SOS" vs "Emergency" similarly drifts. Pick one word per concept per language.

## C. Navigation & layout

15. **Orphaned and buried pages.** `/more` is routed but nothing links to it (dead code or missing nav entry). Map, Checklists, Glossary, Share, Settings are reachable only by scrolling the home grid. Consider a real "More" tab or surfacing Map in the bottom nav.

16. **Two competing search boxes.** Home leads with the Ask hero (AI) and the nav has Search; both accept "plumber, kupah, dinner…" style queries with near-identical placeholders. Newcomers won't know which to use. Merge them (search-first with an "Ask the helper" escalation) or visually differentiate their jobs.

17. **Hard result caps with no escape:** Search renders the first 60 hits, Map lists 20 nearest, Food shows 12/40 — none offer "show more". Add incremental loading.

18. **Folder filter state isn't in the URL** (`Folder.tsx` uses local state for chips / Ra'anana-only / physical-only), so back-navigation resets filters and — in an app built around sharing — a filtered list can't be shared.

19. **Distance chip is overloaded**: "approx. 1.2 km · 15 min walk · 4 min drive from home" on every card. Show one primary metric (walk or drive per user profile), full detail on the record page.

20. **Favorites is a flat dump.** No grouping, no ordering, no personal notes. Group by folder and allow a note per save ("our pediatrician", "gan opens 7:30") — that's how a family actually uses a saved list.

## D. Personalization, trust, accessibility

21. **The profile exists but has no UI.** `store.tsx` persists `{drives, kids, kupah, bank}` and `matchesProfile()` is implemented — but nothing lets the user set it (drives/kids are even force-overwritten to `true`). Surface it in Settings and use it: pin *your* kupah and bank, de-noise the "option" records, hide parking apps for non-drivers.

22. **Freshness is a single stamp.** Every record shows "Verified: 2026-08-27" (the ingest date) and `recommended_review_days` is stored but unused. Show real per-record staleness ("hours last checked 6 months ago") and add a "Report a problem / suggest an edit" action (WhatsApp or mailto to the maintainer) on every record page — a family-maintained dataset needs a feedback loop.

23. **Accessibility pass.** Emoji are used as sole icons without `aria-hidden` or labels (food tiles, launchers, quick apps); filter toggle buttons lack `aria-pressed`; language buttons lack `lang` attributes; long distance chips are screen-reader noise. Also color-contrast check the muted text and chips.

24. **No dark mode.** Single light palette (`global.css` has no `prefers-color-scheme`). For a PWA that lives on a phone and gets used at night (delivery, emergencies), add a dark theme keyed off the system setting.

25. **Small mechanical fixes:** SOS chips on Home fall back to a raw `<a href="/emergency">` (full page reload instead of SPA navigation); `autoFocus` on the Search input pops the keyboard immediately and hides the need chips on mobile; Ask history isn't kept (a returning user can't re-open yesterday's answer — cache recent Q&A locally).
