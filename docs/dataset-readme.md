# Ra'anana New Immigrant Master Dataset

- Generated/verified: 2026-08-27
- Records: 552
- Ra’anana physical locations with distance fields: 225
- Languages: English descriptions, French descriptions, Hebrew names/aliases where available
- Formats: XLSX, UTF-8 CSV and JSON

## Distance methodology

Distances are estimated from a private family home pin in Ra'anana using mapped or approximate coordinates, a walking-route factor of 1.18, walking speed of 4.8 km/h, and an off-peak urban driving estimate.

The public app does **not** include the street address. Live walking/driving links are generated on the device from a home pin stored in localStorage.

## Coverage

- Delivery & Online Shopping: 64
- Directories & Live Search: 9
- Education & Children: 18
- Emergency & Important Numbers: 33
- Essential Apps: 35
- Government, Aliyah & Rights: 28
- Health & Family: 24
- Hebrew & Orientation: 45
- Money, Jobs, Language & Community: 30
- Newcomer Checklists: 24
- Ra'anana Businesses: 47
- Ra'anana Local Services: 25
- Religion & Community: 94
- Safety & Public Shelters: 47
- Transport, Utilities & Housing: 29

## Maintenance

Use `record_id` as the stable key. Index `search_text`, multilingual names/descriptions, aliases, tags, phone numbers and addresses. Schedule re-verification using `recommended_review_days`. Business listings, menus, opening hours, kosher certificates, delivery coverage, phone numbers and emergency information are dynamic.

## Accuracy caveats

- Route distances and times are estimates, not live navigation.
- Some coordinates are street-centroid or city-center estimates and are explicitly labelled.
- Public shelter information must be checked against current municipal and Home Front Command instructions.
- The local-business set is a broad starter list rather than a permanent claim to include every storefront; live directories are included for changing coverage.