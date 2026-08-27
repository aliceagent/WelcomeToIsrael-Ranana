# Welcome to Ra'anana

An installable, offline-first living guide for a family that just moved to **Ra'anana** (רעננה). English and French UI, Hebrew names searchable. Every card is shareable.

## Run

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

`npm test` checks that the published catalog has 552+ records and does not contain the private home street.

## Data

Canonical source: `data/raw/Raanana_New_Immigrant_Master_Dataset.json` (gitignored if it still contains a private origin). `npm run ingest` strips home-route URLs, merges a few Knowledge Base leftovers, and writes `src/data/records.json`.

The apps spreadsheet is already inside the master dataset (`APP-001`–`APP-035`). It is kept in `data/raw/` for provenance.

See [docs/dataset-readme.md](docs/dataset-readme.md) and [docs/developer-guide.md](docs/developer-guide.md).

## Privacy

The public app never prints the family street. Distances are estimates from a home pin stored on the device. Live walking/driving links are generated in the browser.
