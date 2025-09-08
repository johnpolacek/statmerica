// Build Household Income metric: Median Household Income (inflation-adjusted) back to 1979
// Strategy:
// - Use FRED MEHOINUSA672N (Real Median Household Income, 1984+) in 2023 dollars
// - Backfill 1979–1983 by chaining growth from `data/us_income_p50.csv` (P50 individual income, USD)
// - Output annual real income level and YoY %, title: "Household Income"

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const FRED_CSV_URL = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=MEHOINUSA672N'

function round2(n) { return Number(n.toFixed(2)) }

async function fetchFredCsv() {
  const res = await fetch(FRED_CSV_URL)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`FRED request failed: ${res.status} ${res.statusText} ${text}`)
  }
  return await res.text()
}

function parseFredAnnual(csvText) {
  // Columns: observation_date,MEHOINUSA672N with YYYY-01-01
  const lines = csvText.trim().split(/\r?\n/)
  const out = []
  for (let i = 1; i < lines.length; i++) {
    const [dateStr, valueStr] = lines[i].split(',')
    if (!dateStr) continue
    const year = Number(dateStr.slice(0, 4))
    const v = valueStr === '.' ? null : Number(valueStr)
    if (!Number.isFinite(year) || !Number.isFinite(v)) continue
    out.push({ year, value: round2(v) })
  }
  out.sort((a, b) => a.year - b.year)
  return out
}

function parseCsvSimple(text) {
  const lines = text.trim().split(/\r?\n/)
  const header = lines[0].split(',').map(h => h.trim().toLowerCase())
  const idxYear = header.indexOf('year')
  const idxVal = header.findIndex(h => h === 'value_usd' || h === 'value')
  const out = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    const y = Number(cols[idxYear])
    const v = Number(cols[idxVal])
    if (Number.isFinite(y) && Number.isFinite(v)) out.push({ year: y, value: v })
  }
  out.sort((a, b) => a.year - b.year)
  return out
}

async function main() {
  const now = new Date()
  console.log('Fetching Household Income (real median) and backfilling 1979–1983...')
  const fredCsv = await fetchFredCsv()
  const fred = parseFredAnnual(fredCsv) // starts at 1984

  // Read P50 individual income to estimate 1979–1983 growth for backfill
  const p50Path = path.join(process.cwd(), 'data', 'us_income_p50.csv')
  const p50Text = await readFile(p50Path, 'utf8').catch(() => '')
  const p50 = p50Text ? parseCsvSimple(p50Text) : []
  const p50Map = new Map(p50.map(r => [r.year, r.value]))

  // Build combined series
  const combined = [...fred] // 1984+

  // Backfill 1983->1979 using P50 growth rates chained from 1984 known real median
  const base1984 = combined.find(r => r.year === 1984)
  if (base1984) {
    // Compute growth for P50 between y and y+1: g(y+1) = p50(y+1)/p50(y)
    // Walk backward from 1984 to 1979 applying inverse growth
    let estimate = base1984.value
    for (let y = 1983; y >= 1979; y--) {
      const pCurr = p50Map.get(y + 1)
      const pPrev = p50Map.get(y)
      if (pCurr && pPrev && pPrev !== 0) {
        const growth = pCurr / pPrev
        estimate = estimate / growth
        combined.unshift({ year: y, value: round2(estimate) })
      }
    }
  }

  // Compute YoY
  combined.sort((a, b) => a.year - b.year)
  const withYoy = []
  for (let i = 0; i < combined.length; i++) {
    const row = { ...combined[i] }
    const prev = i > 0 ? combined[i - 1] : null
    if (prev && prev.value !== 0) {
      row.yoy = round2(((row.value - prev.value) / prev.value) * 100)
    }
    withYoy.push(row)
  }

  const coverage = withYoy.length ? { start: withYoy[0].year, end: withYoy[withYoy.length - 1].year } : { start: null, end: null }
  const meta = {
    id: 'household_income',
    title: 'Household Income',
    description: 'Median household income adjusted for inflation (real). Uses FRED MEHOINUSA672N for 1984+ and backfills 1979–1983 chaining growth from P50 individual income.',
    units: 'USD (value), Percent (yoy)',
    frequency: 'Annual',
    coverage,
    fetchedAt: now.toISOString(),
    source: {
      name: 'FRED (Census via FRED) + WID (P50 growth for backfill)',
      homepage: 'https://fred.stlouisfed.org/series/MEHOINUSA672N',
      api: FRED_CSV_URL,
      attribution: 'Public domain; backfill heuristic uses P50 growth as proxy.',
    },
    notes: 'Real median household income (constant dollars). 1984+ from FRED MEHOINUSA672N. 1979–1983 backfilled by chaining inverse growth of P50 individual income to approximate earlier real household income.'
  }

  const out = { meta, data: withYoy }
  const outDir = path.join(process.cwd(), 'data')
  await mkdir(outDir, { recursive: true })
  await writeFile(path.join(outDir, 'household_income.json'), JSON.stringify(out, null, 2), 'utf8')
  console.log(`Saved ${withYoy.length} rows to data/household_income.json`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})


