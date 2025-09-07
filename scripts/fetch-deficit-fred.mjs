// Fetch Federal Budget Deficit (Fiscal Year) back to 1979 using FRED series FYFSD
// Then compute YoY on the deficit level and write to data/deficit.json
// Notes:
// - FYFSD (Federal Surplus or Deficit [-], Fiscal Year, Billions of Dollars)
// - FRED values are negative for deficits; we convert to positive "deficit" levels
// - Output units: USD (billions) for value, Percent for yoy

import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const FRED_CSV_URL = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=FYFSD'

function round2(n) { return Number(n.toFixed(2)) }

async function fetchFyfdsCsv() {
  const res = await fetch(FRED_CSV_URL)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`FRED request failed: ${res.status} ${res.statusText} ${text}`)
  }
  return await res.text()
}

function parseFRED(csvText) {
  const lines = csvText.trim().split(/\r?\n/)
  // Expect header like: DATE,FYFSD
  const out = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue
    const [dateStr, valueStr] = line.split(',')
    if (!dateStr) continue
    const year = Number(dateStr.slice(0, 4))
    if (!Number.isFinite(year)) continue
    const v = valueStr === '.' ? null : Number(valueStr)
    if (!Number.isFinite(v)) continue
    // Convert to positive deficit level in billions
    const deficitBillions = v < 0 ? -v : v
    out.push({ year, value: round2(deficitBillions) })
  }
  // Filter coverage to 1979+
  return out.filter(r => r.year >= 1979)
}

function addYoy(rows) {
  const withYoy = []
  for (let i = 0; i < rows.length; i++) {
    const row = { ...rows[i] }
    const prev = i > 0 ? rows[i - 1] : null
    if (prev && typeof prev.value === 'number' && prev.value !== 0) {
      row.yoy = round2(((row.value - prev.value) / prev.value) * 100)
    }
    withYoy.push(row)
  }
  return withYoy
}

async function main() {
  const now = new Date()
  console.log('Fetching Federal Deficit (FY) back to 1979 from FRED (FYFSD)...')
  const csv = await fetchFyfdsCsv()
  const base = parseFRED(csv)
  const data = addYoy(base)

  const coverage = data.length ? { start: data[0].year, end: data[data.length - 1].year } : { start: null, end: null }
  const meta = {
    id: 'deficit',
    title: 'Federal Budget Deficit (Fiscal Year)',
    description: 'Annual deficit level from FRED FYFSD (surplus/deficit), transformed to positive deficit magnitudes. YoY computed on deficit level.',
    units: 'USD (billions) for value, Percent for yoy',
    frequency: 'Annual (FY)',
    coverage,
    fetchedAt: now.toISOString(),
    source: {
      name: 'FRED (FYFSD) — Federal Surplus or Deficit (-), Fiscal Year',
      homepage: 'https://fred.stlouisfed.org/series/FYFSD',
      api: FRED_CSV_URL,
      attribution: 'Federal Reserve Bank of St. Louis',
    },
    notes: 'FYFSD is negative for deficits; values converted to positive deficit magnitudes in billions. YoY computed on level. Coverage begins in 1947; filtered to 1979+.'
  }

  const out = { meta, data }
  const outDir = path.join(process.cwd(), 'data')
  await mkdir(outDir, { recursive: true })
  await writeFile(path.join(outDir, 'deficit.json'), JSON.stringify(out, null, 2), 'utf8')
  console.log(`Saved ${data.length} rows to data/deficit.json (1979+ coverage)`) 
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})


