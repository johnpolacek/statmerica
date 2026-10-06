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

## Conventions

- Each annual `value` is the year-end value (December or Q4) unless the dataset says otherwise. Gas prices use the yearly average.
- An unfinished year appears as one row with `latest: true` and `asOf`. The site shows it but never scores it.
- Nothing is extrapolated. Years a source has not published are simply absent.
- Rates and shares of GDP are compared as point differences, not percent changes.
- Inflation-adjusted series (S&P 500, gas) store the real value in `value`, the original dollars in `nominal`, and the CPI base month in `meta.realBase`.

## Updating

```bash
pnpm fetch:all      # refresh every dataset, then validate
pnpm validate:data  # checks ranges, signs, gaps, duplicate years and staleness
```

All sources are keyless (FRED CSV, World Bank, local WID exports). See the Data Sources page for each series ID.
