# Ra'anana New Immigrant Dataset — Developer & Data Guide

**Dataset:** Ra'anana New Immigrant Master Dataset  
**Generated / verified:** 2026-08-27  
**Current record count:** 552  
**Primary audience:** English- and French-speaking new immigrants living in Ra'anana  
**Primary use case:** Searchable web/mobile application that helps a newly arrived family discover essential services, local places, government information, community resources, shopping/delivery options, and practical newcomer guidance.

---

## 1. What this dataset is

This dataset is a structured knowledge base intended to serve as the seed data for a searchable "new immigrant in Ra'anana" application.

It combines several kinds of information in one normalized schema:

- Emergency and important phone numbers
- Public shelters
- Synagogues and religious/community services
- Ra'anana municipal services
- Ra'anana local businesses
- Government, Aliyah and rights information
- Healthcare and family services
- Education and children's resources
- Transportation, parking, utilities and housing resources
- Banking, jobs, language and community resources
- Israeli online shopping and delivery services
- International retailers and forwarding services
- Essential Israeli mobile apps
- Newcomer checklists
- Important Hebrew vocabulary and terminology
- Directory/search resources for categories that change frequently

The key design decision is that **every item is represented as a record with the same 56 fields**, even though not every field applies to every record.

For example:

- A synagogue may use `denomination_nusach`, `address_en`, `google_maps_location_url`, and distance fields.
- An emergency number may use `phone_primary`, `availability_hours_note`, and `action_url`, but have no physical address.
- An online retailer may use `website_url`, `delivery_coverage`, `cost_fee_notes`, and `menu_order_url`, but no Ra'anana distance fields.
- A Hebrew glossary record uses `name_he`, `name_en`, descriptions, aliases and search text, but no contact details.

This unified structure makes it easier to build one search engine and one API instead of maintaining separate schemas for each content type.

---

## 2. Files in the dataset bundle

The master bundle contains several representations of the same underlying data.

### `Raanana_New_Immigrant_Master_Dataset.xlsx`

Best for human review, editing and QA.

It contains the master table plus category-specific views, settings, a coverage dashboard, a data dictionary, and source/maintenance information.

### `Raanana_New_Immigrant_Master_Dataset.csv`

Best for:

- Database import
- Airtable / Notion / CMS import
- Pandas or data-processing scripts
- Bulk QA

The CSV contains the complete master record table as UTF-8 text.

### `Raanana_New_Immigrant_Master_Dataset.json`

Best for web-app development.

The JSON has this top-level structure:

```json
{
  "metadata": { ... },
  "records": [ ... ]
}
```

The `records` array contains the same 552 normalized records as the master spreadsheet.

### `Raanana_New_Immigrant_Dataset_Developer_Guide.md`

This document.

---

## 3. Recommended source of truth

For development, use the following hierarchy:

1. **JSON** — preferred application seed / API ingestion format
2. **CSV** — preferred bulk-edit / import format
3. **Excel** — preferred editorial QA and maintenance interface

Use `record_id` as the permanent database key.

Do **not** use the row number, slug, name, phone number or address as the unique identifier.

---

## 4. JSON top-level structure

The JSON file contains two keys.

### `metadata`

Current metadata includes:

```json
{
  "dataset_name": "Ra'anana New Immigrant Master Dataset",
  "generated_on": "2026-08-27",
  "languages": [
    "English",
    "French",
    "Hebrew names/aliases"
  ],
  "record_count": 552,
  "distance_origin_private": "[redacted — not published in the app]",
  "distance_method": {
    "note": "Approximate route estimates; use live Google Maps links for current routing and traffic.",
    "walking_route_factor": 1.18,
    "walking_speed_kmh": 4.8,
    "driving_route_factor": 1.25,
    "driving_speed_kmh": 24.0,
    "driving_overhead_minutes": 1.5
  },
  "privacy_warning": "...",
  "maintenance_note": "..."
}
```

### `records`

`records` is an array of normalized objects.

Each object contains the same set of keys, with blank/null values where a field is not relevant.

---

# 5. Record schema — all 56 fields

## Identity and classification

### `record_id`
Stable unique identifier.

Example:

```text
DEL-019
```

**Use this as the database primary key.**

Do not change existing IDs after publication unless the underlying record is being intentionally replaced.

---

### `slug`
Human-readable URL/search identifier.

Example:

```text
ivory-del-019
```

Useful for URLs such as:

```text
/resources/ivory-del-019
```

The slug is convenient, but `record_id` remains the true stable identifier.

---

### `record_type`
Normalized object type.

Current values include:

- `information_resource`
- `synagogue`
- `online_retailer_or_delivery`
- `physical_service`
- `local_business`
- `public_shelter`
- `glossary_term`
- `mobile_app`
- `important_phone_or_emergency_service`
- `checklist`
- `directory`

Use this field for UI templates and behavior.

For example:

- `synagogue` → show nusach, address, map, distance
- `mobile_app` → emphasize website/action URL and purpose
- `important_phone_or_emergency_service` → emphasize phone and availability
- `glossary_term` → emphasize Hebrew name and explanation

---

### `category`
Primary user-facing grouping.

Current categories include:

- Delivery & Online Shopping
- Directories & Live Search
- Education & Children
- Emergency & Important Numbers
- Essential Apps
- Government, Aliyah & Rights
- Health & Family
- Hebrew & Orientation
- Money, Jobs, Language & Community
- Newcomer Checklists
- Ra'anana Businesses
- Ra'anana Local Services
- Religion & Community
- Safety & Public Shelters
- Transport, Utilities & Housing

This should be one of the main search filters in the app.

---

### `subcategory`
More specific grouping within a category.

Examples:

- Synagogue
- Public shelter
- Groceries
- Supermarket
- Banking
- Healthcare
- Electronics
- Telecom
- Aliyah
- Jobs
- Mikvah
- International marketplace
- Package forwarding

This is appropriate for secondary filters and category navigation.

---

## Names and descriptions

### `name_en`
English display name.

### `name_he`
Hebrew display name.

### `name_fr`
French display name.

Not every record has all three languages.

Recommended display logic:

```text
if user_language == "fr" and name_fr exists:
    display name_fr
else if user_language == "he" and name_he exists:
    display name_he
else:
    display name_en
```

Keep Hebrew names searchable even when the UI is English or French.

---

### `description_en`
English explanation of the resource.

### `description_fr`
French explanation.

French coverage is intended to make the dataset useful to French-speaking newcomers, but some records may still require additional translation QA before production launch.

---

### `audience`
Who the resource is primarily useful for.

Examples:

- Families
- New olim
- Households and online shoppers
- Drivers
- Parents
- French speakers

Use as a ranking signal or optional filter.

---

### `priority`
Editorial importance for a newcomer.

Examples currently include:

- Critical
- Essential
- High
- Recommended
- Useful
- Optional
- Community resource
- Useful local
- High local value

This is editorial metadata, not an absolute objective score.

For an app, it is best to map these strings into your own numeric rank, for example:

```text
Critical = 100
Essential = 90
High = 80
High local value = 75
Recommended = 70
Useful local = 65
Useful = 60
Community resource = 55
Optional = 30
```

Do not assume all values are from a closed enum unless you normalize them during ingestion.

---

## Geography and scope

### `scope`
Geographic/service scope.

Examples:

- Ra'anana
- Israel
- Israel / mobile
- Israel / online
- Israel / international
- International
- Regional
- International forwarding

This is useful for distinguishing local services from national or online resources.

---

### `city`
Physical city where applicable.

Most physical local records are in Ra'anana.

Some nearby records may be in Kfar Saba or Herzliya.

---

### `neighborhood`
Neighborhood or local-area hint when available.

This field is not complete for every physical record.

---

### `address_en`
English/transliterated address.

### `address_he`
Hebrew address.

Use both in full-text search.

---

### `is_raanana`
Boolean indicating that the record is local to Ra'anana.

Recommended application use:

- "Near me in Ra'anana" filter
- Local homepage section
- Decide whether distance-from-home fields apply

---

### `is_physical_location`
Boolean indicating that the record corresponds to a visitable physical location.

A resource can be Ra'anana-specific without having a physical location, so do not assume:

```text
is_raanana == is_physical_location
```

---

## Contact details

### `phone_primary`
Primary phone number.

### `phone_secondary`
Secondary number.

### `whatsapp_sms`
WhatsApp or SMS contact where available.

### `email`
Email address.

Phone values should be treated as strings, not integers, because Israeli phone numbers may include:

- leading zeroes
- `+972`
- `*` short codes
- dashes

Never parse them as numeric database values.

---

### `languages`
Known or likely language support.

Examples may include:

- Hebrew-first
- English
- French
- English/French support

This is a helpful discovery field, not a contractual guarantee that every staff member speaks that language.

Show a verification caveat where appropriate.

---

## Service-specific fields

### `service_type`
General service/content type.

This is more descriptive than `record_type` and is useful in result cards.

---

### `denomination_nusach`
Used primarily for synagogue/religious records.

Examples might include:

- Orthodox
- Ashkenazi
- Sephardi
- Edot HaMizrach
- mixed/community styles

If blank, the tradition was not confidently available in the source data.

Do not infer denomination from the synagogue name alone.

---

### `kosher_status`
Kosher information or caveat.

This is **dynamic information**.

A kosher certificate can change, expire or be replaced. The app should display a warning such as:

> Kosher information may change. Verify the current certificate directly with the business or local rabbinate.

---

## URLs and actions

### `website_url`
Main website.

### `action_url`
Direct action page when useful.

Examples:

- Register
- Order
- Apply
- Schedule
- Download
- Search

### `menu_order_url`
Menu or direct-order page where available.

Despite the field name, it can also be used for a retailer's order page when a separate ordering URL exists.

### `google_maps_location_url`
Google Maps link for the location.

### `walking_directions_from_home_url`
Live Google Maps directions from the configured private home origin using walking mode.

### `driving_directions_from_home_url`
Live Google Maps driving directions from the configured private home origin.

**Important:** the two home-direction URLs currently contain the family's home address in the URL query.

Do not expose these fields in a public application without intentionally accepting that privacy tradeoff.

A production public application should instead generate route URLs dynamically from the authenticated user's saved address or current location.

---

# 6. Distance-from-home fields

The dataset currently uses a private family home origin in Ra'anana (street address redacted from this public copy).

The relevant fields are:

### `latitude_est`
Latitude used for distance estimates.

### `longitude_est`
Longitude used for distance estimates.

The `_est` suffix matters: some coordinates are exact enough for routing, while others are approximated.

---

### `coordinate_confidence`
Explains how reliable the coordinate is.

Current examples include:

- Mapped point / high-confidence estimate
- Street interpolation estimate
- Street-centroid estimate
- Approximate station coordinate
- Approximate park entrance coordinate
- Ra'anana city-center fallback; verify address
- No address; distance unavailable

**Use this field when deciding whether to show an exact-looking distance.**

For low-confidence records, the UI should say "approximately" or omit the numeric distance and provide the live map search link instead.

---

### `distance_from_home_km_est`
Estimated route distance in kilometers.

This is not a live Google Maps route calculation.

---

### `walking_time_from_home_min_est`
Estimated walking time in minutes.

Current model assumptions:

- straight-line distance converted to approximate street distance
- walking route factor: `1.18`
- walking speed: `4.8 km/h`

---

### `driving_time_from_home_min_est_off_peak`
Estimated off-peak driving time.

Current model assumptions include:

- route factor: `1.25`
- assumed urban speed: `24 km/h`
- driving overhead: `1.5 minutes`
- minimum displayed driving time: `3 minutes`

This is **not live traffic data**.

---

### `distance_from_home_display`
Human-readable combined text.

Example:

```text
0.9 km est.; 13 min walk; 4 min drive off-peak
```

Use the numeric fields for sorting. Use `distance_from_home_display` only for convenient display.

---

### `travel_estimate_status`
Explains whether distance/time fields apply and how they were calculated.

Examples:

```text
Estimated from mapped/approximated coordinates; use live directions links for current routing and traffic.
```

or

```text
Outside Ra'anana or online/phone-only; home-distance fields intentionally left blank.
```

---

# 7. Operational fields

### `availability_hours_note`
Opening-hours or availability notes.

This data is dynamic and should not be trusted indefinitely.

---

### `eligibility_requirements`
Eligibility or prerequisites.

Examples might include:

- new-immigrant status
- specific age
- health-fund membership
- Israeli ID
- resident status

Some records intentionally leave this blank pending further enrichment.

---

### `cost_fee_notes`
Cost information or fee caveat.

This is a placeholder/enrichment field and should be maintained carefully because prices change.

---

### `delivery_coverage`
Used primarily for retailers/delivery services.

Examples:

- Israel
- Israel-wide
- International
- Depends on item / checkout

Shipping coverage should always be considered dynamic.

---

# 8. Search fields

### `search_aliases`
Alternative terms, spellings, translations and synonyms.

Example concepts might include:

```text
delivery; livraison; משלוחים; online shopping; achats en ligne; קניות אונליין
```

This field is extremely useful for multilingual discovery.

---

### `tags`
Comma-separated editorial tags.

Examples:

```text
delivery, shopping, online, Israel, international, newcomer
```

Recommended use:

- facets
- suggested categories
- search boosting
- recommendation logic

---

### `search_text`
Denormalized full-text search field.

This combines information such as:

- English name
- Hebrew name
- French name
- descriptions
- category
- subcategory
- aliases
- tags
- address
- service keywords

This is the easiest field to index in a basic full-text engine.

For a production system, also index the component fields separately so exact matches can receive stronger ranking.

---

# 9. Source and trust fields

### `source_url_primary`
Primary research/source URL.

### `source_url_secondary`
Secondary or corroborating source.

### `source_type`
Classification of the source.

Examples:

- Official government website
- Official provider website
- Official retailer website
- Municipal listing
- Established nonprofit
- Directory / earlier curated listing

Use source type as one ranking signal for trust.

---

### `verification_status`
Human-readable caveat explaining how the information was verified and what still needs checking.

This field should be preserved in the database even if it is not shown prominently to end users.

It is very useful for administrative QA.

---

### `last_verified`
Date of the research/verification pass.

Current dataset date:

```text
2026-08-27
```

Store this as a proper date in the database.

---

### `recommended_review_days`
Recommended number of days between reviews.

This is one of the most important maintenance fields.

Suggested logic:

```text
next_review_date = last_verified + recommended_review_days
```

Then flag records where:

```text
current_date >= next_review_date
```

---

### `data_confidence`
Editorial confidence level.

Treat this as an internal ranking/QA field.

Possible values include levels such as High, Medium or lower-confidence records depending on source quality.

---

### `notes`
Free-form additional caveats or context.

Do not discard this during ingestion.

---

# 10. Excel workbook structure

The Excel workbook currently contains 23 sheets.

### `README`
Human-readable summary and warnings.

### `Settings`
Contains distance/routing settings and the current private home origin.

**Do not publish this sheet publicly without removing the private address.**

### `Coverage Dashboard`
Summary of dataset coverage by category and record type.

### `Data Dictionary`
Field-by-field explanation of the schema.

### `All Records`
The canonical master table.

This is the spreadsheet representation of the JSON `records` array.

### Category-specific sheets

These are filtered/editorial views of `All Records`:

- Important Numbers
- Public Shelters
- Synagogues
- Religious Services
- Raanana Local
- Raanana Businesses
- Government & Aliyah
- Health & Family
- Education & Children
- Transport & Home
- Money Jobs Community
- Delivery - Israel
- Delivery - International
- Essential Apps
- Newcomer Checklist
- Hebrew Glossary
- Directories

Do not import all sheets independently or you will create duplicates.

For application ingestion, import **All Records only** or use the JSON/CSV master file.

### `Sources & Maintenance`
Source registry showing source URL, source type, categories, verification date, refresh interval and risk.

This is primarily for data maintenance rather than app display.

---

# 11. Current dataset coverage

At the time of generation, the dataset contains 552 records.

Approximate category counts:

| Category | Records |
|---|---:|
| Religion & Community | 94 |
| Delivery & Online Shopping | 64 |
| Ra'anana Businesses | 47 |
| Safety & Public Shelters | 47 |
| Hebrew & Orientation | 45 |
| Essential Apps | 35 |
| Emergency & Important Numbers | 33 |
| Money, Jobs, Language & Community | 30 |
| Transport, Utilities & Housing | 29 |
| Government, Aliyah & Rights | 28 |
| Ra'anana Local Services | 25 |
| Health & Family | 24 |
| Newcomer Checklists | 24 |
| Education & Children | 18 |
| Directories & Live Search | 9 |

Current record-type counts include:

| Record type | Records |
|---|---:|
| information_resource | 117 |
| synagogue | 84 |
| online_retailer_or_delivery | 64 |
| physical_service | 47 |
| local_business | 47 |
| public_shelter | 47 |
| glossary_term | 45 |
| mobile_app | 35 |
| important_phone_or_emergency_service | 33 |
| checklist | 24 |
| directory | 9 |

The dataset currently has approximately:

- 234 Ra'anana-local records
- 225 physical locations with distance/travel estimates

---

# 12. Recommended database model

For a first version, one main table is sufficient.

Example conceptual schema:

```text
resources
---------
record_id PRIMARY KEY
slug
record_type
category
subcategory
name_en
name_he
name_fr
description_en
description_fr
...
```

Because the source schema is intentionally wide, a document database can also work very well.

Good options include:

- PostgreSQL / Supabase
- Firebase / Firestore
- MongoDB
- SQLite for an offline prototype
- Algolia / Typesense / Meilisearch for the search layer

A relational database plus a search index is likely the most flexible architecture.

---

# 13. Recommended ingestion behavior

When importing:

1. Parse `record_id` as a string.
2. Parse `is_raanana` and `is_physical_location` as booleans.
3. Parse latitude/longitude and distance values as nullable decimals.
4. Parse walking/driving minute values as nullable integers or decimals.
5. Parse `recommended_review_days` as nullable integer.
6. Parse `last_verified` as a date.
7. Keep phone fields as strings.
8. Treat empty strings as `null` if that matches your application conventions.
9. Preserve all three language fields.
10. Preserve source and verification metadata.

Do not assume every field is populated.

---

# 14. Recommended search implementation

The web app should support searches such as:

```text
"French synagogue"
"pharmacy near home"
"buy a refrigerator"
"emergency number"
"school registration"
"where can I buy kosher meat"
"Amazon Israel delivery"
"mikvah"
"מקווה"
"livraison courses"
"Rav Kav"
```

## Minimum fields to index

Index:

- `search_text`
- `name_en`
- `name_he`
- `name_fr`
- `description_en`
- `description_fr`
- `search_aliases`
- `tags`
- `category`
- `subcategory`
- `address_en`
- `address_he`
- `phone_primary`

## Suggested field weights

Example:

```text
name_*              weight 10
search_aliases      weight 8
subcategory         weight 7
category            weight 6
tags                 weight 6
description_*       weight 4
address_*           weight 3
search_text         weight 2
```

Then boost by:

- priority
- Ra'anana locality
- exact language match
- data confidence
- freshness

---

# 15. Multilingual search behavior

The application should treat English, French and Hebrew as equivalent discovery languages.

For example, all of these should be able to lead to grocery-delivery records:

```text
grocery delivery
supermarket delivery
livraison courses
livraison supermarché
משלוח סופר
משלוחי מזון
```

`search_aliases` and `search_text` already provide a useful multilingual base.

For better production search, consider:

- lowercasing Latin text
- accent-insensitive French matching
- Hebrew final-letter normalization where helpful
- apostrophe normalization for Ra'anana / Raanana / Ra’anana
- transliteration aliases
- typo tolerance
- prefix matching

Useful city aliases include:

```text
Ra'anana
Raanana
Ra’anana
Ranana
רעננה
```

---

# 16. Suggested UI filters

Useful filter controls include:

### Location

- Ra'anana only
- Physical locations only
- Near home
- Online / national
- International

### Category

Use `category`.

### Type

Use `record_type` and/or `subcategory`.

### Language

Use `languages` plus multilingual name/description availability.

### Distance

For local physical records:

- < 5 min walk
- < 10 min walk
- < 20 min walk
- < 5 min drive
- sort by distance

### Religious services

- Nusach / denomination
- Kosher status
- Synagogue
- Mikvah

### Priority

- Critical
- Essential
- High
- Recommended

### Freshness

- Verified recently
- Needs review

---

# 17. Suggested result-card layouts

Different record types should render differently.

## Emergency number

Display prominently:

```text
Name
Phone
What it is for
Availability
Call button
Source / last verified
```

## Local business

Display:

```text
Name
Category / subcategory
Description
Address
Distance from home
Walking time
Driving time
Phone
Website
Menu/order
Open Google Maps
```

## Synagogue

Display:

```text
Name English
Name Hebrew
Nusach / denomination
Address
Distance from home
Walking directions
Known language notes
Phone/contact if available
Verification caveat
```

## Online retailer

Display:

```text
Name
What it sells
Delivery coverage
Website
Order link
Fees/shipping note
Language notes
Verification date
```

## Government/resource page

Display:

```text
Service name
What problem it solves
Eligibility / requirements
Phone
Website / action button
Language availability
Source
Last verified
```

---

# 18. Search-result ranking recommendation

A practical ranking formula might consider:

```text
text relevance
+ exact name match
+ category match
+ priority boost
+ Ra'anana local boost
+ proximity boost
+ language boost
+ freshness boost
+ confidence boost
```

Do **not** rank only by proximity.

For example, the Home Front Command may be much more important than a nearby store even though it has no local physical address.

---

# 19. Data freshness and maintenance

This dataset should not be treated as static.

High-change fields include:

- phone numbers
- opening hours
- menus
- prices
- delivery coverage
- addresses
- business existence
- school-registration procedures
- service eligibility
- app availability
- public transportation details
- synagogue schedules
- kosher certification
- government processes
- emergency guidance

Use:

- `last_verified`
- `recommended_review_days`
- `verification_status`
- `source_url_primary`
- `source_url_secondary`
- `data_confidence`

A maintenance service can calculate:

```text
next_review_date = last_verified + recommended_review_days
```

Then place expired records into an admin review queue.

---

# 20. Suggested maintenance tiers

A good operating model is:

### Tier 1 — critical safety data
Review very frequently.

Examples:

- emergency numbers
- Home Front Command information
- public shelters
- municipal emergency guidance

### Tier 2 — dynamic local data
Review every 30–90 days.

Examples:

- restaurants
- stores
- menus
- kosher status
- opening hours
- delivery coverage

### Tier 3 — institutional services
Review every 90–180 days.

Examples:

- government pages
- health funds
- banks
- utilities
- schools

### Tier 4 — stable orientation content
Review less frequently.

Examples:

- Hebrew glossary terms
- general newcomer checklists

---

# 21. Privacy and security

This is especially important.

The original research dataset contained a private home origin (street address redacted from this public copy).

It appears in:

- JSON metadata
- Excel Settings sheet
- walking route URLs
- driving route URLs
- distance calculations

## If the application is private to the family

It can remain as-is if desired.

## If the application will be public

Recommended approach:

1. Remove `distance_origin_private` from published data.
2. Remove or regenerate `walking_directions_from_home_url`.
3. Remove or regenerate `driving_directions_from_home_url`.
4. Do not publish home coordinates.
5. Let each user save their own home address in a private profile.
6. Calculate distance dynamically on the server/client.
7. Generate route URLs only when the user requests directions.

Prefer storing a user's home location separately from the public content database.

---

# 22. Accuracy caveats

The dataset is intended to be useful and comprehensive, but it is not a legal or official master registry.

Important caveats:

### Business coverage
The local-business collection is a broad starter directory. It should not be marketed as an eternal list of every business in Ra'anana.

Businesses open, close, relocate and change names.

### Coordinates
Some local coordinates are estimated from:

- street centers
- interpolated street points
- approximate known locations
- city-center fallback

Always consult `coordinate_confidence`.

### Travel times
Walking and driving times are planning estimates.

Use the included Google Maps links for live routes and current traffic.

### Public shelters
Do not rely solely on the static dataset during an emergency.

Users should always follow current Home Front Command and Ra'anana Municipality instructions.

### Kosher status
Always verify the current certification.

### Medical/legal/government information
The dataset should help users find the right service, not substitute for professional or official advice.

---

# 23. Recommended API shape

A simple REST API could expose:

```text
GET /resources
GET /resources/:record_id
GET /search?q=
GET /categories
GET /categories/:category
GET /nearby?lat=&lng=&radius=
GET /synagogues
GET /important-numbers
GET /delivery
GET /newcomer-checklists
```

Example filters:

```text
GET /resources?category=Health%20%26%20Family
GET /resources?is_raanana=true
GET /resources?record_type=synagogue
GET /resources?subcategory=Supermarket
GET /resources?language=French
```

---

# 24. Example normalized record

A record conceptually looks like this:

```json
{
  "record_id": "DEL-019",
  "slug": "ivory-del-019",
  "record_type": "online_retailer_or_delivery",
  "category": "Delivery & Online Shopping",
  "subcategory": "Electronics",
  "name_en": "Ivory",
  "name_he": "אייבורי",
  "name_fr": "Ivory",
  "description_en": "Computers, phones, gaming, electronics and accessories.",
  "description_fr": "Informatique, téléphones, gaming, électronique et accessoires.",
  "scope": "Israel",
  "website_url": "https://www.ivory.co.il/",
  "delivery_coverage": "Israel",
  "search_aliases": "delivery; livraison; משלוחים; ...",
  "source_url_primary": "https://www.ivory.co.il/",
  "last_verified": "2026-08-27",
  "recommended_review_days": 60,
  "data_confidence": "Medium"
}
```

The real record contains all 56 schema keys.

---

# 25. Recommended application navigation

A useful newcomer homepage could be organized around problems rather than data categories.

For example:

### I just arrived

- First-week checklist
- Aliyah paperwork
- Health fund
- Bank
- Mobile phone
- Apps to install

### I need help now

- Emergency numbers
- Police
- Ambulance
- Fire
- Home Front Command
- Municipality
- Nearby shelters

### Around Ra'anana

- Synagogues
- Supermarkets
- Pharmacies
- Restaurants
- Electronics
- Home goods
- Schools
- Municipal services

### Shopping & delivery

- Israeli retailers
- Groceries
- Food delivery
- International retailers
- Package forwarding

### Family & children

- Schools
- Healthcare
- Activities
- Municipal services
- Child-related benefits

### Learn how Israel works

- Hebrew glossary
- Government services
- Transportation
- Banking
- Utilities
- Taxes and rights resources

This creates a more intuitive experience than exposing the raw database taxonomy directly.

---

# 26. Recommended "Ask the dataset" functionality

Because the content is highly structured, it is well suited to natural-language search.

Example user queries:

```text
Where is the nearest synagogue to my house?
```

Filter:

```text
record_type = synagogue
is_raanana = true
```

Sort:

```text
distance_from_home_km_est ASC
```

---

```text
What French-speaking resources are available?
```

Search:

```text
languages + description_fr + search_aliases + tags
```

---

```text
Where can I buy a laptop?
```

Search `search_text` for:

```text
laptop computer electronics מחשב ordinateur informatique
```

Then boost local Ra'anana businesses over national online retailers while still showing both.

---

```text
I have an emergency. Who do I call?
```

Strongly prioritize:

```text
category = Emergency & Important Numbers
priority = Critical
```

Do not allow generic semantic similarity to outrank official emergency services.

---

# 27. Recommended future schema additions

For a more mature application, consider adding the following fields later.

### Business/location enrichment

```text
opening_hours_structured
open_now
postal_code
neighborhood_id
exact_coordinates_verified
wheelchair_accessible
parking_notes
```

### Restaurants

```text
cuisine
meal_type
price_level
kosher_certificate_authority
kosher_certificate_expiry
reservation_url
wolt_url
tenbis_url
```

### Synagogues

```text
shacharit_times_weekday
mincha_times
maariv_times
shabbat_schedule_url
rabbi_name
women_section
wheelchair_accessible
english_friendly
french_friendly
children_programming
```

Keep prayer times dynamic rather than hardcoded whenever possible.

### Stores

```text
store_type
brands
online_ordering
home_delivery
pickup_available
```

### Services

```text
appointment_required
booking_url
languages_structured
eligibility_structured
```

### Maintenance

```text
created_at
updated_at
reviewed_by
source_last_checked_at
status_active
superseded_by_record_id
```

---

# 28. Recommended normalization before production

Some fields are currently editorial free text and should be converted to controlled enums in a production database.

Candidates include:

- `priority`
- `languages`
- `coordinate_confidence`
- `data_confidence`
- `verification_status`
- `scope`
- `kosher_status`

Keep the original text as a display/caveat field if needed, while adding normalized equivalents.

Example:

```json
{
  "data_confidence": "Medium",
  "data_confidence_score": 0.65
}
```

---

# 29. Do not duplicate category sheets during ingestion

The Excel workbook has one canonical record table and multiple convenience views.

If you import:

- `All Records`
- `Synagogues`
- `Important Numbers`
- `Delivery - Israel`
- etc.

as separate tables and concatenate them, you will duplicate records.

Correct approach:

```text
Import All Records only
```

or simply ingest the JSON `records` array.

The category sheets are for humans, not separate datasets.

---

# 30. How to update a record

When information changes:

1. Find the record by `record_id`.
2. Update only the affected fields.
3. Update `source_url_primary` / `source_url_secondary` if needed.
4. Set `last_verified` to the verification date.
5. Update `verification_status`.
6. Adjust `data_confidence` if appropriate.
7. Keep the same `record_id` unless it is genuinely a different entity.

If a business closes, it is better to mark it inactive in a future `status_active` field than to silently reuse its ID for a different business.

---

# 31. How to add a new record

Recommended process:

1. Choose a `record_type`.
2. Choose a `category` and `subcategory`.
3. Assign a new unique `record_id`.
4. Create a slug.
5. Add multilingual names/descriptions where possible.
6. Add contact/location/action fields.
7. Add multilingual aliases and tags.
8. Generate `search_text`.
9. Add source URLs.
10. Add verification metadata.
11. If it is a Ra'anana physical location, geocode it and generate distance/routing fields.
12. Add it to the master table only; category views can be regenerated from the master.

---

# 32. How to treat missing data

A blank value generally means:

```text
not applicable
```

or

```text
not confidently available in this research pass
```

Do not automatically interpret a blank as "no".

For example:

```text
kosher_status = blank
```

means:

```text
unknown / not recorded
```

not:

```text
not kosher
```

The same principle applies to language support, phone numbers, websites, denomination and delivery coverage.

---

# 33. Suggested TypeScript shape

A practical application interface could begin like this:

```ts
export interface NewImmigrantResource {
  record_id: string;
  slug: string;
  record_type: string;
  category: string;
  subcategory?: string | null;

  name_en?: string | null;
  name_he?: string | null;
  name_fr?: string | null;
  description_en?: string | null;
  description_fr?: string | null;

  audience?: string | null;
  priority?: string | null;
  scope?: string | null;

  city?: string | null;
  neighborhood?: string | null;
  address_en?: string | null;
  address_he?: string | null;
  is_raanana: boolean;
  is_physical_location: boolean;

  phone_primary?: string | null;
  phone_secondary?: string | null;
  whatsapp_sms?: string | null;
  email?: string | null;
  languages?: string | null;

  service_type?: string | null;
  denomination_nusach?: string | null;
  kosher_status?: string | null;

  website_url?: string | null;
  action_url?: string | null;
  menu_order_url?: string | null;
  google_maps_location_url?: string | null;
  walking_directions_from_home_url?: string | null;
  driving_directions_from_home_url?: string | null;

  latitude_est?: number | null;
  longitude_est?: number | null;
  coordinate_confidence?: string | null;
  distance_from_home_km_est?: number | null;
  walking_time_from_home_min_est?: number | null;
  driving_time_from_home_min_est_off_peak?: number | null;
  distance_from_home_display?: string | null;
  travel_estimate_status?: string | null;

  availability_hours_note?: string | null;
  eligibility_requirements?: string | null;
  cost_fee_notes?: string | null;
  delivery_coverage?: string | null;

  search_aliases?: string | null;
  tags?: string | null;
  search_text?: string | null;

  source_url_primary?: string | null;
  source_url_secondary?: string | null;
  source_type?: string | null;
  verification_status?: string | null;
  last_verified?: string | null;
  recommended_review_days?: number | null;
  data_confidence?: string | null;
  notes?: string | null;
}
```

---

# 34. Suggested search architecture for an MVP

A straightforward implementation would be:

```text
JSON / CSV
   ↓
PostgreSQL / Supabase
   ↓
Search index (Postgres FTS, Typesense, Meilisearch or Algolia)
   ↓
API
   ↓
Web app
```

For a small family-only prototype, even client-side JSON search can work because 552 records is small.

For a public and growing application, use a database and search index.

---

# 35. Suggested AI/RAG use

The dataset can also power a conversational interface.

Example:

> "We just moved here and need to register the kids for school. What do we do?"

Recommended process:

1. Retrieve records from `Education & Children`, `Government, Aliyah & Rights`, and `Ra'anana Local Services`.
2. Prefer records with official sources.
3. Prefer recently verified records.
4. Generate a concise answer.
5. Display the relevant phone, website/action URL and source link.
6. Warn when procedures may have changed.

For emergencies, use deterministic category/priority routing before any semantic RAG behavior.

---

# 36. Important safety rule for the app

For high-stakes information, the app should act as a **navigation layer to authoritative services**, not the final authority.

This particularly applies to:

- rocket/emergency instructions
- public shelters
- medical emergencies
- government rights/eligibility
- legal/tax issues
- school registration deadlines
- kosher certification

Always surface the official source and verification date.

---

# 37. Suggested MVP features

A strong first version of the web app could include:

1. Universal multilingual search
2. Category browsing
3. English / French language toggle
4. "Near home" sorting for Ra'anana locations
5. Walking and driving directions buttons
6. Tap-to-call important numbers
7. Emergency mode
8. Favorites
9. Newcomer checklist
10. Essential apps list
11. Synagogue directory
12. Shopping & delivery directory
13. Government/Aliyah resource directory
14. "Needs verification" admin flag
15. Source links on every record

---

# 38. Recommended second-phase features

Later improvements could include:

- User-editable home location
- Current GPS-based "near me"
- Live Google Maps travel-time API
- Current opening hours
- User submissions and corrections
- Admin moderation
- Push alerts for important changes
- Personalized onboarding by family profile
- Saved preferred synagogue / school / health fund
- French/English/Hebrew UI
- WhatsApp share buttons
- AI question answering grounded only in verified records
- Automated source re-checking

---

# 39. Key implementation rules to remember

If you remember only ten things, remember these:

1. **`record_id` is the stable primary key.**
2. **The JSON `records` array or Excel `All Records` sheet is the canonical dataset.**
3. **Do not combine category sheets or you will create duplicates.**
4. **Blank values mean unknown/not applicable, not automatically "no."**
5. **Phone numbers are strings.**
6. **Distance/time fields are estimates, not live navigation.**
7. **Use `coordinate_confidence` before showing precise-looking distances.**
8. **Use `recommended_review_days` + `last_verified` for maintenance.**
9. **Preserve sources and verification metadata.**
10. **Remove the private home address and home-route URLs before any public deployment.**

---

# 40. Final recommendation

Treat this dataset as a **living knowledge base**, not a finished static directory.

The current 552 records provide enough structured coverage to build and test the application, search UX, categories, multilingual behavior, distance sorting and onboarding flows.

The long-term product should have two layers:

### Curated knowledge layer

Stable and high-value newcomer content:

- emergency numbers
- government resources
- Aliyah information
- health services
- apps
- glossary
- checklists

### Dynamic local directory layer

Frequently changing content:

- restaurants
- stores
- synagogue schedules
- opening hours
- menus
- local services
- delivery availability

Keep the same normalized record model across both layers, but refresh the dynamic layer much more frequently.

That approach will allow the project to grow from a family resource into a robust searchable guide for English- and French-speaking newcomers to Ra'anana.
