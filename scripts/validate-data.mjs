// Sanity checks for data/*.json. Catches unit, sign, gap and staleness mistakes
// before they reach the site. Exits non-zero on any error.
// Usage: pnpm validate:data

import { readFile } from 'node:fs/promises'
import path from 'node:path'

// Plausible ranges for every annual `value`, in each dataset's own units.
const RULES = {
  'cpi.json': { min: 70, max: 450 },
  'debt_to_gdp.json': { min: 20, max: 130 },
  'disposable_income.json': { min: 15000, max: 80000 },
  'groceries.json': { min: 60, max: 450 },
  'housing_affordability.json': { min: 10, max: 70 },
  'jobs.json': { min: 85000, max: 200000 },
  // Deficit as % of GDP. Must go negative in the late-1990s surplus years.
  'deficit.json': { min: -4, max: 20, mustInclude: [[2000, (v) => v < 0]] },
  'gas_prices.json': { min: 1.5, max: 7 },
  'gdp.json': { min: 5000, max: 40000 },
  'homeownership.json': { min: 60, max: 70 },
  'household_income.json': { min: 55000, max: 110000 },
  'income_gap.json': { min: 5, max: 30 },
  'life_expectancy.json': { min: 72, max: 82 },
  'sp500.json': { min: 300, max: 12000 },
  'unemployment.json': { min: 2.5, max: 15 },
  'wages.json': { min: 5, max: 20 },
}

// Largest plausible year-over-year move, as a share of the prior value.
const MAX_YOY_SHARE = {
  'deficit.json': null, // crosses zero, skip
  'sp500.json': 0.6,
  'gas_prices.json': 0.6,
  'unemployment.json': 1.5,
  'housing_affordability.json': 0.6, // mortgage rates doubled in 2022
}

const MAX_STALE_DAYS = 120
const errors = []
const warnings = []

for (const [file, rule] of Object.entries(RULES)) {
  const json = JSON.parse(await readFile(path.join(process.cwd(), 'data', file), 'utf8'))
  const rows = json.data
  const fail = (msg) => errors.push(`${file}: ${msg}`)

  if (!Array.isArray(rows) || rows.length === 0) { fail('no rows'); continue }

  const complete = rows.filter((r) => !r.latest && !r.estimated)
  const years = complete.map((r) => r.year)
  if (new Set(years).size !== years.length) fail('duplicate complete years')
  for (let i = 1; i < years.length; i++) {
    if (years[i] !== years[i - 1] + 1) fail(`gap or disorder between ${years[i - 1]} and ${years[i]}`)
  }
  if (years[0] > 1980) fail(`coverage starts at ${years[0]}, need 1980 or earlier`)

  for (const r of rows) {
    if (typeof r.value !== 'number' || !Number.isFinite(r.value)) fail(`${r.year}: non-numeric value`)
    else if (r.value < rule.min || r.value > rule.max) fail(`${r.year}: value ${r.value} outside ${rule.min}..${rule.max}`)
    if (r.estimated) fail(`${r.year}: estimated rows are not allowed`)
  }

  const latestRows = rows.filter((r) => r.latest)
  if (latestRows.length > 1) fail('more than one latest row')
  if (latestRows[0] && latestRows[0].year !== years.at(-1) + 1) fail(`latest row ${latestRows[0].year} should directly follow the last complete year ${years.at(-1)}`)

  for (const [year, check] of rule.mustInclude ?? []) {
    const row = complete.find((r) => r.year === year)
    if (!row || !check(row.value)) fail(`${year}: failed sign/shape check (value ${row?.value})`)
  }

  const maxShare = file in MAX_YOY_SHARE ? MAX_YOY_SHARE[file] : 0.35
  if (maxShare != null) {
    for (let i = 1; i < complete.length; i++) {
      const prev = complete[i - 1].value
      const share = Math.abs(complete[i].value - prev) / Math.abs(prev)
      if (share > maxShare) warnings.push(`${file}: ${complete[i].year} moved ${(share * 100).toFixed(0)}% in one year`)
    }
  }

  const fetchedAt = Date.parse(json.meta?.fetchedAt ?? '')
  const ageDays = (Date.now() - fetchedAt) / 86_400_000
  if (!Number.isFinite(ageDays)) fail('missing meta.fetchedAt')
  else if (ageDays > MAX_STALE_DAYS) warnings.push(`${file}: fetched ${Math.round(ageDays)} days ago`)

  if (json.meta?.realBase) {
    const old = complete.find((r) => r.year === 1990)
    if (!old || typeof old.nominal !== 'number' || !(old.value > old.nominal)) fail('1990 real value should exceed nominal')
  }

  const last = latestRows[0] ?? complete.at(-1)
  console.log(`✓ ${file.padEnd(24)} ${years[0]}–${years.at(-1)}${latestRows[0] ? ` + latest ${latestRows[0].year}` : ''}  last=${last.value}`)
}

for (const w of warnings) console.warn(`! ${w}`)
if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`)
  process.exit(1)
}
console.log(`\nData OK (${warnings.length} warnings)`)
