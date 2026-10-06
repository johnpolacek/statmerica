# Project Wiki Log

`log.md` is the append-only record of meaningful project-wiki activity.

Preferred heading format:

`## [YYYY-MM-DD] type | title`

Keep entries concise and grounded in repo evidence.

## [2026-04-05] bootstrap | initialize statmerica project wiki

- Inspected the repo root, homepage composition, metrics dashboard, data directory, and fetch scripts before creating wiki files.
- Added the minimal durable wiki set: `AGENTS.md`, `index.md`, `log.md`, `product-shape.md`, `data-and-metrics.md`, and `current-status.md`.
- Recorded the current operating posture plainly: the project is worth reconsidering as the 2026 election season approaches, with a concrete review window tied to the 2026 federal election timeline.

## [2026-10-06] update | election-season sprint

- Fixed deficit units and sign handling, removed income-gap extrapolation, and switched rate metrics to point changes.
- Moved fetchers to keyless FRED, refreshed all data through 2025 plus 2026 partial points, and added `fetch:all` and `validate:data`.
- Rebuilt the dashboard on `lib/compare.ts` with equal comparison windows, added `?a=&b=` URLs and `/api/og` preview images.
- Updated `current-status.md` and `data-and-metrics.md`.

## [2026-10-06] update | data quality fixes and four new metrics

- Income gap now uses WID income shares. It had shown about twice the published ratio.
- Household income 1979-1983 now comes from Census Table H-5. Debt / GDP now uses debt held by the public.
- S&P 500 and gas prices are inflation-adjusted with nominal values kept for tooltips.
- Added jobs, grocery prices, real disposable income per person and housing affordability. Cards carry short caveats for known distortions.
