// Fetch Real GDP (chained 2017 USD, SAAR) from FRED (GDPC1) and save to data/gdp.json
// Usage:
//   node scripts/fetch-gdp.mjs
// Notes:
//   - Uses FRED CSV endpoint (no API key required): GDPC1 (Billions of Chained 2017 Dollars)
//   - For 1980–2024: use Q4 level and YoY vs prior year's Q4 (requires 1979 Q4)
//   - For current year: latest available quarter level and YoY vs same quarter previous year

import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const FRED_CSV_URL = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=GDPC1'

function round2(n) { return Number(n.toFixed(2)) }

async function fetchFredCsv() {
  const res = await fetch(FRED_CSV_URL)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`FRED request failed: ${res.status} ${res.statusText} ${text}`)
  }
  return await res.text()
}

function parseFredQuarterly(csvText) {
  // Expect header like: DATE,GDPC1
  const lines = csvText.trim().split(/\r?\n/)
  const out = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue
    const [dateStr, valueStr] = line.split(',')
    if (!dateStr) continue
    const year = Number(dateStr.slice(0, 4))
    const month = Number(dateStr.slice(5, 7))
    if (!Number.isFinite(year) || !Number.isFinite(month)) continue
    const v = valueStr === '.' ? null : Number(valueStr)
    if (!Number.isFinite(v)) continue
    // FRED quarterly dates are first month of quarter: 01, 04, 07, 10
    const quarter = month === 1 ? 1 : month === 4 ? 2 : month === 7 ? 3 : month === 10 ? 4 : null
    if (!quarter) continue
    out.push({ date: dateStr, year, quarter, value: round2(v) })
  }
  out.sort((a, b) => a.date.localeCompare(b.date))
  return out
}

function pickQuarter(rows, year, quarter) {
  return rows.find(r => r.year === year && r.quarter === quarter) || null
}

function buildAnnualQ4WithYoy(rows) {
  const out = []
  for (let y = 1980; y <= 2024; y++) {
    const q4 = pickQuarter(rows, y, 4)
    const prevQ4 = pickQuarter(rows, y - 1, 4)
    if (q4) {
      const row = { year: y, value: q4.value }
      if (prevQ4 && prevQ4.value !== 0) {
        row.yoy = round2(((q4.value - prevQ4.value) / prevQ4.value) * 100)
      }
      out.push(row)
    }
  }
  return out
}

function buildLatest(rows) {
  if (!rows.length) return null
  const last = rows[rows.length - 1]
  // Same quarter previous year for YoY
  const prev = rows.find(r => r.year === last.year - 1 && r.quarter === last.quarter)
  const row = { year: last.year, value: last.value, latest: true, quarter: last.quarter }
  if (prev && prev.value !== 0) {
    row.yoy = round2(((last.value - prev.value) / prev.value) * 100)
  }
  return row
}

async function main() {
  const now = new Date()
  console.log('Fetching Real GDP (GDPC1) from FRED (1979+ for Q4 base)...')
  const csv = await fetchFredCsv()
  const rows = parseFredQuarterly(csv)

  // Ensure we have 1979 Q4 present for 1980 YoY base
  const have1979Q4 = !!pickQuarter(rows, 1979, 4)
  if (!have1979Q4) {
    console.warn('Warning: 1979 Q4 not found; 1980 YoY may be missing.')
  }

  const decLike = buildAnnualQ4WithYoy(rows)
  const latest = buildLatest(rows)
  const data = latest ? [...decLike, latest] : decLike

  const coverage = data.length ? { start: data[0].year, end: data[data.length - 1].year } : { start: null, end: null }
  const meta = {
    id: 'gdp',
    title: 'Real GDP (Chained 2017 $, SAAR)',
    description: 'Q4 levels with YoY vs prior Q4 for 1980–2024; latest row is most recent quarter with YoY vs same quarter prior year. value = billions of chained 2017 dollars (SAAR).',
    units: 'USD (billions, SAAR) for value, Percent (yoy)',
    frequency: 'Annual (Q4), plus current-year latest quarter',
    coverage,
    fetchedAt: now.toISOString(),
    source: {
      name: 'Federal Reserve Bank of St. Louis (FRED) / BEA',
      homepage: 'https://fred.stlouisfed.org/series/GDPC1',
      api: FRED_CSV_URL,
      attribution: 'Public domain',
    },
    seriesId: 'GDPC1',
    notes: 'Real GDP (billions of chained 2017 dollars, SAAR). Annual points use Q4 values to align with other annual comparisons; latest is the most recent quarter. YoY computed against same quarter previous year.'
  }

  const out = { meta, data }
  const outDir = path.join(process.cwd(), 'data')
  await mkdir(outDir, { recursive: true })
  await writeFile(path.join(outDir, 'gdp.json'), JSON.stringify(out, null, 2), 'utf8')
  console.log(`Saved ${data.length} rows to data/gdp.json`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})


