// Fetch CPI data from BLS Public API and save to data/cpi.json
// Usage:
//   BLS_API_KEY=... node scripts/fetch-cpi.mjs --series cuur|cusr
// Notes:
//   - Outputs both YoY percent change and raw index level
//   - For 1980–2024: December level and YoY vs prior December (requires 1979 Dec)
//   - For current year: latest month level and YoY vs same month previous year

import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const API_URL = 'https://api.bls.gov/publicAPI/v2/timeseries/data/'

function parseArgs(argv) {
  const args = { series: 'cuur' } // default to NSA for annual comparisons
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--series' && argv[i + 1]) args.series = argv[++i]
  }
  return args
}

function mapSeriesFlagToId(flag) {
  switch ((flag || 'cuur').toLowerCase()) {
    case 'cusr':
      return { id: 'CUSR0000SA0', label: 'All items (SA)' }
    case 'cuur':
    default:
      return { id: 'CUUR0000SA0', label: 'All items (NSA)' }
  }
}

function toMonthNumber(period) {
  // period like 'M01'..'M12', 'M13' is annual average (skip)
  if (!period || !period.startsWith('M')) return null
  const m = period.slice(1)
  if (m === '13') return null
  return m.padStart(2, '0')
}

async function fetchRange({ startYear, endYear, seriesId, apiKey }) {
  const body = {
    seriesid: [seriesId],
    startyear: String(startYear),
    endyear: String(endYear),
  }
  if (apiKey) body.registrationkey = apiKey

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`BLS API request failed: ${res.status} ${res.statusText} ${text}`)
  }

  const json = await res.json()
  if (json.status && json.status !== 'REQUEST_SUCCEEDED') {
    throw new Error(`BLS API returned status ${json.status}: ${JSON.stringify(json)}`)
  }

  const s = (json.Results?.series || [])[0]
  const entries = []
  if (s) {
    for (const d of s.data || []) {
      const mmStr = toMonthNumber(d.period)
      if (!mmStr) continue
      const yr = Number(d.year)
      const month = parseInt(mmStr, 10)
      const value = Number(d.value)
      entries.push({ year: yr, month, value })
    }
  }
  return entries
}

async function fetchCPI({ seriesId, apiKey }) {
  const now = new Date()
  const currentYear = now.getFullYear()
  // We need 1979 for prior-December base
  const startFetchYear = 1979
  // Fetch in 10-year chunks to avoid API result limits
  const ranges = []
  for (let start = startFetchYear; start <= currentYear; start += 10) {
    const end = Math.min(start + 9, currentYear)
    ranges.push({ start, end })
  }

  const allEntries = []
  for (const r of ranges) {
    const part = await fetchRange({ startYear: r.start, endYear: r.end, seriesId, apiKey })
    allEntries.push(...part)
  }

  // De-duplicate same year-month if overlaps
  const map = new Map()
  for (const e of allEntries) {
    map.set(`${e.year}-${String(e.month).padStart(2, '0')}`, e)
  }
  const entries = Array.from(map.values())

  // Helper to get value by (year, month)
  const getVal = (y, m) => entries.find((r) => r.year === y && r.month === m)?.value ?? null

  // December levels and YoY for 1980–2024
  const decRows = []
  for (let y = 1980; y <= 2024; y++) {
    const curr = getVal(y, 12)
    const prev = getVal(y - 1, 12) // requires 1979
    if (curr != null) {
      const row = { year: y, value: Number(curr.toFixed(2)) }
      if (prev != null && prev !== 0) {
        const pct = ((curr - prev) / prev) * 100
        row.yoy = Number(pct.toFixed(2))
      }
      decRows.push(row)
    }
  }

  // Current year latest YoY vs same month previous year
  let latest = null
  const thisYearMonths = entries.filter((r) => r.year === currentYear).map((r) => r.month)
  if (thisYearMonths.length > 0) {
    const maxMonth = Math.max(...thisYearMonths)
    const curr = getVal(currentYear, maxMonth)
    const prev = getVal(currentYear - 1, maxMonth)
    if (curr != null) {
      const row = { year: currentYear, value: Number(curr.toFixed(2)), latest: true, month: maxMonth }
      if (prev != null && prev !== 0) {
        const pct = ((curr - prev) / prev) * 100
        row.yoy = Number(pct.toFixed(2))
      }
      latest = row
    }
  }

  return { decRows, latest }
}

async function main() {
  const argv = parseArgs(process.argv.slice(2))
  const now = new Date()
  const { id: seriesId, label: seriesLabel } = mapSeriesFlagToId(argv.series)
  const apiKey = process.env.BLS_API_KEY || process.env.BLS_APIKEY || process.env.BLS_KEY

  console.log(`Fetching CPI value+yoy from BLS in 10-year chunks for series=${seriesId}`)
  const { decRows, latest } = await fetchCPI({ seriesId, apiKey })

  const data = latest ? [...decRows, latest] : decRows

  const meta = {
    id: 'cpi',
    title: 'Consumer Price Index (CPI-U, All items)',
    description: 'Rows use value = index level and yoy = percent change. December values; latest row is most recent month.',
    units: 'Index (value, 1982-84=100), Percent (yoy)',
    frequency: 'Annual (Dec), plus current-year latest month',
    coverage: { start: 1980, end: now.getFullYear() },
    fetchedAt: new Date().toISOString(),
    source: {
      name: 'U.S. Bureau of Labor Statistics',
      homepage: 'https://www.bls.gov/cpi/',
      api: API_URL,
      attribution: 'Public domain',
    },
    seriesId,
    seriesLabel,
    notes: 'yoy = (current / prior - 1) * 100 using December values for 1980–2024, and latest available month vs same month prior year for the current year. value holds the CPI index level.',
  }

  const out = { meta, data }

  const outDir = path.join(process.cwd(), 'data')
  await mkdir(outDir, { recursive: true })
  const outFile = path.join(outDir, 'cpi.json')
  await writeFile(outFile, JSON.stringify(out, null, 2), 'utf8')
  console.log(`Saved ${data.length} rows (value + yoy) to data/cpi.json`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
