# Data

This directory contains pre-fetched datasets used by the app.

## JSON schema (convention)

Each dataset file should follow this structure:

```json
{
  "meta": {
    "id": "string",
    "title": "string",
    "description": "string",
    "units": "string",
    "frequency": "string",
    "coverage": { "start": 1980, "end": 2025 },
    "fetchedAt": "ISO-8601",
    "source": {
      "name": "string",
      "homepage": "url",
      "api": "url",
      "attribution": "string"
    },
    "series": [{ "id": "string", "label": "string" }],
    "filters": { }
  },
  "data": {
    "<seriesId>": [{ "year": 1980, "value": 0 }]
  },
  "latest": {
    "<seriesId>": { "year": 2025, "month": 8, "value": 0 }
  }
}
```

- `data` contains annual points per series (normalized as `{year, value}`) using the chosen convention for each dataset (e.g., December-only for CPI).
- `latest` is optional and can store a most-recent in-progress value for the current year per series.

## CPI (Consumer Price Index)

- File: `cpi.json`
- Source: U.S. Bureau of Labor Statistics (BLS) Public API v2
- Update:

```bash
pnpm run fetch:cpi
```

- Convention for CPI:
  - `data`: December value per year for 1980–2024
  - `latest`: the most recent available month for the current year (per series)
  - Series include:
    - `CUUR0000SA0` (All items, not seasonally adjusted)
    - `CUSR0000SA0` (All items, seasonally adjusted)
