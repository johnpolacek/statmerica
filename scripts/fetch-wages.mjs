// Fetch Real Wage Growth: Average Hourly Earnings (production & nonsupervisory, total private)
// adjusted by CPI to constant dollars. Save to data/wages.json
// Usage:
//   FRED_API_KEY=... node scripts/fetch-wages.mjs
// Notes:
//   - AHE (nominal): CES0500000003 (Dollars per hour, monthly, SA)
//   - CPI: CPIAUCSL (Index 1982-84=100, monthly, SA)
//   - We compute annual real wages using December values for 1980–2024 (requires 1979 Dec for base)
//   - For current year, include latest month with YoY vs same month prior year

import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const FRED_OBS_URL = 'https://api.stlouisfed.org/fred/series/observations'
const FRED_CSV_URL = (seriesId) => `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(seriesId)}`

function round2(n) { return Number(n.toFixed(2)) }

function toISO(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function fetchFredObservations({ seriesId, apiKey, start }) {
  // If no API key, fall back to CSV endpoint (no key required)
  if (!apiKey) {
    const res = await fetch(FRED_CSV_URL(seriesId))
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`FRED CSV request failed: ${res.status} ${res.statusText} ${text}`)
    }
    const csv = await res.text()
    const lines = csv.trim().split(/\r?\n/)
    // header: observation_date,<SERIES>
    const rows = []
    for (let i = 1; i < lines.length; i++) {
      const [date, valueStr] = lines[i].split(',')
      if (!date) continue
      const v = valueStr === '.' ? null : Number(valueStr)
      if (!Number.isFinite(v)) continue
      const year = Number(date.slice(0, 4))
      const month = Number(date.slice(5, 7))
      rows.push({ date, year, month, value: v })
    }
    rows.sort((a, b) => a.date.localeCompare(b.date))
    // Apply start filter if provided
    return start ? rows.filter(r => r.date >= start) : rows
  }

  const url = new URL(FRED_OBS_URL)
  url.searchParams.set('series_id', seriesId)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('file_type', 'json')
  if (start) url.searchParams.set('observation_start', start)

  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`FRED API request failed: ${res.status} ${res.statusText} ${text}`)
  }
  const json = await res.json()
  if (!Array.isArray(json.observations)) {
    throw new Error('FRED API returned unexpected shape (no observations)')
  }
  const rows = []
  for (const o of json.observations) {
    const value = Number(o.value)
    if (!Number.isFinite(value)) continue
    const date = o.date // YYYY-MM-DD
    const year = Number(date.slice(0, 4))
    const month = Number(date.slice(5, 7))
    rows.push({ date, year, month, value })
  }
  rows.sort((a, b) => a.date.localeCompare(b.date))
  return rows
}

function pickDecember(rows, year) {
  return rows.find(r => r.year === year && r.month === 12) || null
}

function findNearestOnOrBefore(observations, targetIso) {
  let lo = 0, hi = observations.length - 1, ans = null
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const d = observations[mid].date
    if (d <= targetIso) { ans = observations[mid]; lo = mid + 1 } else { hi = mid - 1 }
  }
  return ans
}

async function main() {
  const apiKey = process.env.FRED_API_KEY || process.env.FRED_KEY || ''
  const start = '1979-01-01' // need 1979 Dec for 1980 base
  console.log('Fetching AHE (AHETPI) and CPI (CPIAUCSL) from FRED...')
  const [ahe, cpi] = await Promise.all([
    fetchFredObservations({ seriesId: 'AHETPI', apiKey, start }),
    fetchFredObservations({ seriesId: 'CPIAUCSL', apiKey, start }),
  ])

  // Build monthly real wage = AHE / (CPI/100)
  const cpiByDate = new Map(cpi.map(r => [r.date, r.value]))
  const monthlyReal = []
  for (const row of ahe) {
    const c = cpiByDate.get(row.date)
    if (typeof c === 'number' && c !== 0) {
      const real = row.value / (c / 100)
      monthlyReal.push({ ...row, real: round2(real) })
    }
  }

  // Annual December levels for 1980–2024
  const decRows = []
  for (let y = 1980; y <= 2024; y++) {
    const aDec = monthlyReal.find(r => r.year === y && r.month === 12)
    const prevDec = monthlyReal.find(r => r.year === y - 1 && r.month === 12)
    if (aDec) {
      const row = { year: y, value: round2(aDec.real) }
      if (prevDec && prevDec.real !== 0) {
        row.yoy = round2(((aDec.real - prevDec.real) / prevDec.real) * 100)
      }
      decRows.push(row)
    }
  }

  // Current year latest month and YoY vs same month previous year
  let latest = null
  if (monthlyReal.length > 0) {
    const last = monthlyReal[monthlyReal.length - 1]
    const lastDate = new Date(last.date)
    const prior = new Date(lastDate)
    prior.setFullYear(prior.getFullYear() - 1)
    const priorRow = findNearestOnOrBefore(monthlyReal, toISO(prior))
    const row = { year: last.year, value: round2(last.real), latest: true, month: last.month }
    if (priorRow && priorRow.real !== 0) {
      row.yoy = round2(((last.real - priorRow.real) / priorRow.real) * 100)
    }
    latest = row
  }

  const data = latest ? [...decRows, latest] : decRows

  const coverage = data.length ? { start: data[0].year, end: data[data.length - 1].year } : { start: null, end: null }
  const meta = {
    id: 'wages',
    title: 'Wages',
    description: 'Real average hourly earnings (production & nonsupervisory, total private) deflated by CPI. December levels for 1980–2024; latest row is most recent month vs same month prior year.',
    units: 'USD (value), Percent (yoy)',
    frequency: 'Annual (Dec), plus latest month',
    coverage,
    fetchedAt: new Date().toISOString(),
    source: {
      name: 'FRED / BLS',
      homepage: 'https://fred.stlouisfed.org/series/AHETPI',
      api: FRED_OBS_URL,
      attribution: 'Public domain',
    },
    series: [
      { id: 'AHETPI', label: 'Average Hourly Earnings of Production & Nonsupervisory Employees: Total Private' },
      { id: 'CPIAUCSL', label: 'CPI-U (SA, 1982-84=100)' },
    ],
    notes: 'Real wage = nominal AHE / (CPI/100). Annual points use December observations. Latest uses most recent month and YoY vs same month previous year.'
  }

  const out = { meta, data }
  const outDir = path.join(process.cwd(), 'data')
  await mkdir(outDir, { recursive: true })
  await writeFile(path.join(outDir, 'wages.json'), JSON.stringify(out, null, 2), 'utf8')
  console.log(`Saved ${data.length} rows to data/wages.json`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})


