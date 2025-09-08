// Fetch Federal Debt / GDP ratio from FRED (GFDEGDQ188S, % of GDP) and save to data/debt_to_gdp.json
// Usage:
//   node scripts/fetch-debt-to-gdp.mjs
// Notes:
//   - Uses FRED CSV endpoint (no API key required): GFDEGDQ188S (Percent of GDP, quarterly, NSA)
//   - For 1980–2024: use Q4 level and YoY vs prior year's Q4 (requires 1979 Q4)
//   - For current year: latest available quarter level and YoY vs same quarter previous year

import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const FRED_CSV_URL = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=GFDEGDQ188S'

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
  // Expect header like: DATE,GFDEGDQ188S
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
  const prev = rows.find(r => r.year === last.year - 1 && r.quarter === last.quarter)
  const row = { year: last.year, value: last.value, latest: true, quarter: last.quarter }
  if (prev && prev.value !== 0) {
    row.yoy = round2(((last.value - prev.value) / prev.value) * 100)
  }
  return row
}

async function main() {
  const now = new Date()
  console.log('Fetching Federal Debt / GDP (GFDEGDQ188S) from FRED (1979+ for Q4 base)...')
  const csv = await fetchFredCsv()
  const rows = parseFredQuarterly(csv)

  const have1979Q4 = !!pickQuarter(rows, 1979, 4)
  if (!have1979Q4) {
    console.warn('Warning: 1979 Q4 not found; 1980 YoY may be missing.')
  }

  const q4Rows = buildAnnualQ4WithYoy(rows)
  const latest = buildLatest(rows)
  const data = latest ? [...q4Rows, latest] : q4Rows

  const coverage = data.length ? { start: data[0].year, end: data[data.length - 1].year } : { start: null, end: null }
  const meta = {
    id: 'debt_to_gdp',
    title: 'Federal Debt / GDP Ratio',
    description: 'Q4 levels (percent of GDP) with YoY vs prior Q4 for 1980–2024; latest row is most recent quarter with YoY vs same quarter prior year.',
    units: 'Percent (value), Percent (yoy)',
    frequency: 'Annual (Q4), plus current-year latest quarter',
    coverage,
    fetchedAt: now.toISOString(),
    source: {
      name: 'Federal Reserve Bank of St. Louis (FRED)',
      homepage: 'https://fred.stlouisfed.org/series/GFDEGDQ188S',
      api: FRED_CSV_URL,
      attribution: 'Public domain',
    },
    seriesId: 'GFDEGDQ188S',
    notes: 'YoY computed as percent change vs same quarter previous year. Annual points use Q4 values.'
  }

  const out = { meta, data }
  const outDir = path.join(process.cwd(), 'data')
  await mkdir(outDir, { recursive: true })
  await writeFile(path.join(outDir, 'debt_to_gdp.json'), JSON.stringify(out, null, 2), 'utf8')
  console.log(`Saved ${data.length} rows to data/debt_to_gdp.json`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})


