// Fetch CPI data from BLS Public API and save to data/cpi.json
// Usage:
//   BLS_API_KEY=... node scripts/fetch-cpi.mjs --series cuur|cusr
// Notes:
//   - Keeps December values for 1980–2024
//   - Keeps the most recent available month for the current year, appended as that year

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
  // Fetch in chunks to avoid API server limits (two-decade windows)
  const ranges = [
    { start: 1980, end: 1999 },
    { start: 2000, end: 2019 },
    { start: 2020, end: currentYear },
  ]

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

  // December values 1980–2024
  const decValues = entries
    .filter((r) => r.year >= 1980 && r.year <= 2024 && r.month === 12)
    .map((r) => ({ year: r.year, value: r.value }))
    .sort((a, b) => a.year - b.year)

  let latest = null
  const currentYearEntries = entries.filter((r) => r.year === currentYear)
  if (currentYearEntries.length > 0) {
    currentYearEntries.sort((a, b) => b.month - a.month)
    latest = { year: currentYear, value: currentYearEntries[0].value }
  }

  return { decValues, latest }
}

async function main() {
  const argv = parseArgs(process.argv.slice(2))
  const now = new Date()
  const { id: seriesId, label: seriesLabel } = mapSeriesFlagToId(argv.series)
  const apiKey = process.env.BLS_API_KEY || process.env.BLS_APIKEY || process.env.BLS_KEY

  console.log(`Fetching CPI from BLS in chunks for series=${seriesId}`)
  const { decValues, latest } = await fetchCPI({ seriesId, apiKey })

  const data = latest ? [...decValues, latest] : decValues

  const meta = {
    id: 'cpi',
    title: 'Consumer Price Index (All items, CPI-U)',
    description: 'CPI-U, All items (Dec per year; current year latest month)',
    units: 'Index 1982–84=100',
    frequency: 'Annual (Dec), plus current year latest',
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
    filters: { decOnlyThrough: 2024, includeCurrentYearLatest: true },
  }

  const out = { meta, data }

  const outDir = path.join(process.cwd(), 'data')
  await mkdir(outDir, { recursive: true })
  const outFile = path.join(outDir, 'cpi.json')
  await writeFile(outFile, JSON.stringify(out, null, 2), 'utf8')
  console.log(`Saved ${data.length} rows to data/cpi.json`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
