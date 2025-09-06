// Fetch U.S. regular gasoline prices from EIA (monthly by default) and save to data/gas_prices.json
// Usage:
//   EIA_API_KEY=... node scripts/fetch-gas-prices.mjs --series PET.EMM_EPMRR_PTE_NUS_DPG.M
//   (or use weekly: PET.EMM_EPMRR_PTE_NUS_DPG.W)
// Notes:
//   - Defaults to EIA monthly series for U.S. Regular All Formulations retail gas price
//   - Outputs annual averages (USD/gal) for all available years
//   - Appends latest available point (monthly or weekly) as the last row
//   - If EIA data does not reach back to 1979, falls back to BLS average gasoline price series

import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const API_BASE = 'https://api.eia.gov'
const BLS_API_URL = 'https://api.bls.gov/publicAPI/v2/timeseries/data/'

function parseArgs(argv) {
  const args = { series: 'PET.EMM_EPMRR_PTE_NUS_DPG.M' }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--series' && argv[i + 1]) args.series = argv[++i]
  }
  return args
}

function round2(n) { return Number(n.toFixed(2)) }

function parseEiaDate(dateStr) {
  const s = String(dateStr)
  const year = Number(s.slice(0, 4))
  if (s.length === 8) {
    const month = Number(s.slice(4, 6))
    const day = Number(s.slice(6, 8))
    return { year, month, day, iso: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` }
  } else if (s.length === 6) {
    const month = Number(s.slice(4, 6))
    return { year, month, day: 1, iso: `${year}-${String(month).padStart(2, '0')}-01` }
  } else if (s.length === 4) {
    return { year, month: 1, day: 1, iso: `${year}-01-01` }
  }
  return { year: Number.isFinite(year) ? year : null, month: null, day: null, iso: s }
}

async function fetchSeries({ seriesId, apiKey }) {
  // Prefer API v2 compatibility endpoint
  const url = new URL(`${API_BASE}/v2/seriesid/${encodeURIComponent(seriesId)}`)
  if (apiKey) url.searchParams.set('api_key', apiKey)

  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`EIA API request failed: ${res.status} ${res.statusText} ${text}`)
  }
  const json = await res.json()
  // Support both v1 (series[0].data) and v2 (response.data) shapes
  if (Array.isArray(json.series) && json.series.length > 0 && Array.isArray(json.series[0].data)) {
    return json.series[0].data // v1-like shape: [ [date, value], ... ]
  }
  if (json.response && Array.isArray(json.response.data)) {
    // v2 shape: objects with period/value
    return json.response.data.map((row) => [row.period, row.value])
  }
  throw new Error(`EIA API returned unexpected format for id=${seriesId}`)
}

async function fetchBlsGasMonthly({ apiKey, startYear, endYear }) {
  const seriesId = 'APU000074714' // Average price: Gasoline, unleaded regular, per gallon/3.785 liters in U.S. city average
  const body = {
    seriesid: [seriesId],
    startyear: String(startYear),
    endyear: String(endYear),
  }
  if (apiKey) body.registrationkey = apiKey

  const res = await fetch(BLS_API_URL, {
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
  const rows = []
  if (s) {
    for (const d of s.data || []) {
      const period = d.period // e.g., M01..M12
      if (!period || !period.startsWith('M')) continue
      const year = Number(d.year)
      const month = Number(period.slice(1))
      const value = Number(d.value)
      if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(value)) {
        const iso = `${year}-${String(month).padStart(2, '0')}-01`
        rows.push({ year, date: iso, value })
      }
    }
  }
  rows.sort((a, b) => a.date.localeCompare(b.date))
  return rows
}

async function main() {
  const argv = parseArgs(process.argv.slice(2))
  const apiKey = process.env.EIA_API_KEY || process.env.EIA_APIKEY || process.env.EIA_KEY

  if (!apiKey) {
    throw new Error('Missing EIA_API_KEY environment variable')
  }

  console.log(`Fetching gas prices from EIA series=${argv.series}`)
  const rows = await fetchSeries({ seriesId: argv.series, apiKey })

  // Normalize entries and sort by date
  const entries = []
  for (const [dateStr, val] of rows) {
    const num = Number(val)
    if (!Number.isFinite(num)) continue
    const { year, iso } = parseEiaDate(dateStr)
    if (!Number.isFinite(year)) continue
    entries.push({ year, date: iso, value: num })
  }
  entries.sort((a, b) => a.date.localeCompare(b.date))

  // Latest weekly observation
  let latest = null
  if (entries.length > 0) {
    const last = entries[entries.length - 1]
    latest = { year: last.year, date: last.date, value: round2(last.value) }
  }

  // Annual averages across available years (from EIA series)
  const byYear = new Map()
  for (const e of entries) {
    if (!byYear.has(e.year)) byYear.set(e.year, [])
    byYear.get(e.year).push(e.value)
  }
  const years = Array.from(byYear.keys()).sort((a, b) => a - b)
  let annual = []
  for (const y of years) {
    const vals = byYear.get(y) || []
    if (vals.length === 0) continue
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length
    annual.push({ year: y, value: round2(avg) })
  }

  // If coverage does not reach back to 1979, try BLS fallback for earlier years
  const earliestEiaYear = annual.length ? annual[0].year : null
  if (!earliestEiaYear || earliestEiaYear > 1979) {
    try {
      const blsKey = process.env.BLS_API_KEY || process.env.BLS_APIKEY || process.env.BLS_KEY
      const blsEndYear = earliestEiaYear ? earliestEiaYear - 1 : new Date().getFullYear()
      const blsRows = await fetchBlsGasMonthly({ apiKey: blsKey, startYear: 1979, endYear: blsEndYear })
      const blsByYear = new Map()
      for (const r of blsRows) {
        if (!blsByYear.has(r.year)) blsByYear.set(r.year, [])
        blsByYear.get(r.year).push(r.value)
      }
      const blsYears = Array.from(blsByYear.keys()).sort((a, b) => a - b)
      const blsAnnual = []
      for (const y of blsYears) {
        const vals = blsByYear.get(y) || []
        if (vals.length === 0) continue
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length
        blsAnnual.push({ year: y, value: round2(avg), source: 'BLS' })
      }
      // Merge without duplicates, preferring EIA for overlapping years
      const eiaYearsSet = new Set(annual.map(r => r.year))
      const combined = [...blsAnnual.filter(r => !eiaYearsSet.has(r.year)), ...annual]
      combined.sort((a, b) => a.year - b.year)
      annual = combined
    } catch (err) {
      console.warn('BLS fallback failed, proceeding with EIA-only data:', err?.message || err)
    }
  }

  const now = new Date()
  const coverage = annual.length ? { start: annual[0].year, end: annual[annual.length - 1].year } : { start: null, end: null }

  const meta = {
    id: 'gas_prices',
    title: 'Gasoline Price (Regular, Retail)',
    description: 'Annual average USD/gal computed from EIA monthly/weekly series; latest is most recent point. Backfilled with BLS average price where needed to reach 1979.',
    units: 'USD per gallon',
    frequency: 'Annual (avg), plus latest point',
    coverage,
    fetchedAt: now.toISOString(),
    source: {
      name: 'U.S. Energy Information Administration',
      homepage: 'https://www.eia.gov/petroleum/gasdiesel/',
      api: 'https://api.eia.gov/v2/seriesid/',
      attribution: 'Public domain',
    },
    seriesId: argv.series,
    notes: 'Uses EIA U.S. Regular All Formulations retail gasoline price series (monthly or weekly). Annual values are simple averages of period observations. If EIA does not cover pre-1990 period, fills earlier years using BLS series APU000074714 (monthly average price). The last row may represent the current year latest point.'
  }

  const data = latest ? [...annual, { year: latest.year, value: latest.value, latest: true, date: latest.date }] : annual

  const out = { meta, data }

  const outDir = path.join(process.cwd(), 'data')
  await mkdir(outDir, { recursive: true })
  const outFile = path.join(outDir, 'gas_prices.json')
  await writeFile(outFile, JSON.stringify(out, null, 2), 'utf8')
  console.log(`Saved ${data.length} rows to data/gas_prices.json`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})


