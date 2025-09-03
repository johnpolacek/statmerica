// Fetch Unemployment Rate (U-3) from BLS and save to data/unemployment.json
// Usage:
//   BLS_API_KEY=... node scripts/fetch-unemployment.mjs --series lns
// Notes:
//   - Default series: LNS14000000 (Unemployment rate, 16 years and over, SA)
//   - value = unemployment rate level (percent)
//   - yoy = percent change in level vs prior December (not percentage points)
//   - Data convention: 1980–2024 use December values; latest = most recent month current year

import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const API_URL = 'https://api.bls.gov/publicAPI/v2/timeseries/data/'

function parseArgs(argv) {
  const args = { series: 'lns' }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--series' && argv[i + 1]) args.series = argv[++i]
  }
  return args
}

function mapSeriesFlagToId(flag) {
  switch ((flag || 'lns').toLowerCase()) {
    case 'lns':
    default:
      return { id: 'LNS14000000', label: 'Unemployment rate (SA, 16+)' }
  }
}

function toMonthNumber(period) {
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
      if (Number.isFinite(yr) && Number.isFinite(month) && Number.isFinite(value)) {
        entries.push({ year: yr, month, value })
      }
    }
  }
  return entries
}

async function fetchUnemployment({ seriesId, apiKey }) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const startFetchYear = 1979

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

  const map = new Map()
  for (const e of allEntries) {
    map.set(`${e.year}-${String(e.month).padStart(2, '0')}`, e)
  }
  const entries = Array.from(map.values())

  const getVal = (y, m) => entries.find((r) => r.year === y && r.month === m)?.value ?? null

  // December levels and YoY for 1980–2024
  const decRows = []
  for (let y = 1980; y <= 2024; y++) {
    const curr = getVal(y, 12)
    const prev = getVal(y - 1, 12)
    if (curr != null) {
      const row = { year: y, value: Number(curr.toFixed(2)) }
      if (prev != null && prev !== 0) {
        const pct = ((curr - prev) / prev) * 100
        row.yoy = Number(pct.toFixed(2))
      }
      decRows.push(row)
    }
  }

  // Current year latest vs same month previous year
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
  const { id: seriesId, label: seriesLabel } = mapSeriesFlagToId(argv.series)
  const apiKey = process.env.BLS_API_KEY || process.env.BLS_APIKEY || process.env.BLS_KEY

  console.log(`Fetching Unemployment Rate (BLS) for series=${seriesId}`)
  const { decRows, latest } = await fetchUnemployment({ seriesId, apiKey })
  const data = latest ? [...decRows, latest] : decRows

  const meta = {
    id: 'unemployment',
    title: 'Unemployment Rate (U-3, SA)',
    description: 'value = percent; yoy = percent change. December values for 1980–2024; latest is most recent month.',
    units: 'Percent (value, yoy)',
    frequency: 'Monthly (stored as annual Dec + latest)',
    coverage: { start: 1980, end: new Date().getFullYear() },
    fetchedAt: new Date().toISOString(),
    source: {
      name: 'U.S. Bureau of Labor Statistics',
      homepage: 'https://www.bls.gov/cps/',
      api: API_URL,
      attribution: 'Public domain',
    },
    seriesId,
    seriesLabel,
    notes: 'YoY uses Dec vs prior Dec for historical years; latest uses current month vs same month previous year. Lower is better.'
  }

  const out = { meta, data }
  const outDir = path.join(process.cwd(), 'data')
  await mkdir(outDir, { recursive: true })
  const outFile = path.join(outDir, 'unemployment.json')
  await writeFile(outFile, JSON.stringify(out, null, 2), 'utf8')
  console.log(`Saved ${data.length} rows to data/unemployment.json`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})


