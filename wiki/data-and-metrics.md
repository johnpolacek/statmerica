# Data And Metrics

## Summary

Statmerica relies on prefetched local datasets plus repo-local fetch scripts rather than a live runtime data pipeline.

## Data Directory

The `data/` directory contains 16 JSON datasets, including jobs (PAYEMS), grocery prices (CPI food at home), real disposable income per person (A229RX0) and housing affordability, plus:

- CPI
- gas prices
- deficit
- unemployment
- GDP
- debt to GDP
- household income
- wages
- life expectancy
- homeownership
- income gap
- market data

It also includes the WID export in `data/wid/` and a `data/README.md` that documents the JSON-file conventions.

## Script Surface

The repo includes fetch and transform scripts for:

- CPI
- gas prices
- deficit
- GDP
- homeownership
- household income
- income gap
- life expectancy
- S&P 500 and NASDAQ
- unemployment
- wages
- WID extraction

This means the project already has a meaningful offline data-refresh workflow even if the public app surface is still relatively small.

## Dashboard Logic

Comparison logic lives in `lib/compare.ts`, metric definitions in `lib/metrics.ts`, and terms in `lib/terms.ts`. The dashboard and the `/api/og` preview image both use the same functions.

- Each term's change runs from the year before it began to the end of the comparison window.
- The window is the number of complete years both sides have. A term in progress is compared over its complete years only.
- Rows marked `latest: true` are partial years. They appear in charts as hollow points and are never scored.
- Rates and shares of GDP (unemployment, homeownership, debt/GDP, deficit/GDP) use point differences. Life expectancy uses years. Everything else uses percent change.
- Party views average each member term's change. They never average levels across decades.
- The deficit is stored as % of GDP with surpluses negative. An earlier version took the absolute value, which counted surpluses as deficits.

## Refresh And Validation

- `pnpm fetch:all` runs every fetcher, then `scripts/validate-data.mjs`. No API keys are needed.
- Most series come from FRED's keyless CSV endpoint via `scripts/lib/fred.mjs`.
- BLS API key in `.env` was rejected on 2026-10-06 and Stooq began blocking scripts, so CPI, unemployment, gas and S&P 500 moved to FRED.
- FRED's SP500 only covers ten years. Older year-end closes are kept from the stored file.
- The income gap is computed from WID income shares (sptincj992): (top 10% share / 0.10) / (bottom 50% share / 0.50). An earlier version divided WID average-income values and showed about twice the published ratio. WID data currently ends in 2023. Nothing is extrapolated.
- Household income for 1979-1983 comes from Census Historical Income Table H-5. FRED's series starts in 1984. The previous backfill from WID growth was about 6% off in 1980.
- Debt / GDP uses debt held by the public (FYGFGDQ188S), not gross debt.
- S&P 500 and gas prices are adjusted for inflation to dollars of the latest CPI-U month. Each row keeps a `nominal` field for tooltips.
- Housing affordability is the mortgage payment on a median new home (MSPUS, Q4), 20% down, 30-year rate (MORTGAGE30US, December average), as a share of nominal median household income. New-home prices are the only long free national series.

## Practical Interpretation

The strongest durable asset in this repo today is not the v0-generated shell. It is the combination of:

- structured metric datasets
- repeatable fetch scripts
- an administration-comparison framing that could become more timely during election season
