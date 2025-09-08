// Fetch U.S. Homeownership Rate from FRED (RHORUSQ156N: Quarterly, Percent)
// Build annual series using Q4 values for 1980–2024 (needs 1979 Q4), plus latest quarter
// Usage:
//   node scripts/fetch-homeownership.mjs

import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const FRED_CSV_URL = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=RHORUSQ156N'

function round2(n) { return Number(n.toFixed(2)) }

function toQuarterFromDate(dateStr) {
  const year = Number(dateStr.slice(0, 4))
  const month = Number(dateStr.slice(5, 7))
  const quarter = month <= 3 ? 1 : month <= 6 ? 2 : month <= 9 ? 3 : 4
  return { year, quarter }
}

async function fetchFredCsv() {
  const res = await fetch(FRED_CSV_URL)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`FRED request failed: ${res.status} ${res.statusText} ${text}`)
  }
  return await res.text()
}

function parseQuarterly(csvText) {
  const lines = csvText.trim().split(/\r?\n/)
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const [date, valueStr] = lines[i].split(',')
    if (!date) continue
    const v = valueStr === '.' ? null : Number(valueStr)
    if (!Number.isFinite(v)) continue
    const { year, quarter } = toQuarterFromDate(date)
    rows.push({ date, year, quarter, value: round2(v) })
  }
  rows.sort((a, b) => a.date.localeCompare(b.date))
  return rows
}

function pickQuarter(rows, year, quarter) {
  return rows.find(r => r.year === year && r.quarter === quarter) || null
}

async function main() {
  const csv = await fetchFredCsv()
  const q = parseQuarterly(csv)

  // Annual Q4 values for 1980–2024
  const annual = []
  for (let y = 1980; y <= 2024; y++) {
    const q4 = pickQuarter(q, y, 4)
    const prevQ4 = pickQuarter(q, y - 1, 4)
    if (q4) {
      const row = { year: y, value: q4.value }
      if (prevQ4 && prevQ4.value !== 0) {
        row.yoy = round2(((q4.value - prevQ4.value) / prevQ4.value) * 100)
      }
      annual.push(row)
    }
  }

  // Latest quarter vs same quarter previous year
  let latest = null
  if (q.length) {
    const last = q[q.length - 1]
    const prev = q.find(r => r.year === last.year - 1 && r.quarter === last.quarter)
    const row = { year: last.year, value: last.value, latest: true, quarter: last.quarter }
    if (prev && prev.value !== 0) {
      row.yoy = round2(((last.value - prev.value) / prev.value) * 100)
    }
    latest = row
  }

  const data = latest ? [...annual, latest] : annual
  const coverage = data.length ? { start: data[0].year, end: data[data.length - 1].year } : { start: null, end: null }

  const meta = {
    id: 'homeownership',
    title: 'Homeownership',
    description: 'U.S. Homeownership Rate (percent). Annual uses Q4 values; current year uses latest quarter. YoY computed vs prior Q4/same quarter previous year.',
    units: 'Percent (value), Percent (yoy)',
    frequency: 'Annual (Q4), plus latest quarter',
    coverage,
    fetchedAt: new Date().toISOString(),
    source: {
      name: 'Federal Reserve Bank of St. Louis (FRED)',
      homepage: 'https://fred.stlouisfed.org/series/RHORUSQ156N',
      api: FRED_CSV_URL,
      attribution: 'Public domain',
    },
    seriesId: 'RHORUSQ156N',
    notes: 'Quarterly series from FRED (Census). Annualized by Q4 for historical comparison; latest quarter appended with YoY vs same quarter previous year.'
  }

  const out = { meta, data }
  const outDir = path.join(process.cwd(), 'data')
  await mkdir(outDir, { recursive: true })
  await writeFile(path.join(outDir, 'homeownership.json'), JSON.stringify(out, null, 2), 'utf8')
  console.log(`Saved ${data.length} rows to data/homeownership.json`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})


