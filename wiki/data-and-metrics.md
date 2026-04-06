# Data And Metrics

## Summary

Statmerica relies on prefetched local datasets plus repo-local fetch scripts rather than a live runtime data pipeline.

## Data Directory

The `data/` directory already contains JSON datasets such as:

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

It also includes CSV files for U.S. income percentiles and a `data/README.md` that documents the JSON-file conventions.

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

The metrics dashboard imports prefetched data files directly and builds:

- year maps for each metric
- administration-term comparison series
- party-level aggregate series
- four-year change calculations and metric summaries

`lib/metrics.ts` also carries administration labeling and some placeholder or hardcoded comparison logic, which suggests the project is part real-data dashboard and part still-evolving prototype.

## Practical Interpretation

The strongest durable asset in this repo today is not the v0-generated shell. It is the combination of:

- structured metric datasets
- repeatable fetch scripts
- an administration-comparison framing that could become more timely during election season
