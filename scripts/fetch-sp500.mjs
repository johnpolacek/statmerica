// Fetch S&P 500 index from FRED and save to data/sp500.json
// Usage:
//   FRED_API_KEY=... node scripts/fetch-sp500.mjs --series SP500
// Notes:
//   - Uses FRED daily series (default: SP500)
//   - For 1980–2024: last trading day in December level and YoY vs prior December
//   - For current year: latest available close and YoY vs nearest available date one year earlier

import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

function parseArgs(argv) { return {} }

function round2(n) { return Number(n.toFixed(2)) }

function toISO(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toUnix(dateStr) {
  return Math.floor(new Date(dateStr).getTime() / 1000)
}

// Remove FRED/Yahoo complexity; use Stooq as single canonical source for S&P 500

async function fetchStooqObservations() {
  // Stooq S&P 500 daily CSV
  const url = 'https://stooq.com/q/d/l/?s=^spx&i=d'
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Stooq request failed: ${res.status} ${res.statusText} ${text}`)
  }
  const csv = await res.text()
  const lines = csv.trim().split(/\r?\n/)
  // header: Date,Open,High,Low,Close,Volume
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const [date, open, high, low, close] = lines[i].split(',')
    if (!date || !close) continue
    const val = Number(close)
    if (!Number.isFinite(val)) continue
    const year = Number(date.slice(0, 4))
    rows.push({ date, year, value: val })
  }
  rows.sort((a, b) => a.date.localeCompare(b.date))
  return rows
}

// Yahoo removed (auth required). FRED removed (licensing/coverage limits here). Stooq is sufficient.

function pickLastTradingDayOfDecember(observations, year) {
  // Find last observation in December of given year
  const prefix = `${year}-12-`
  const decRows = observations.filter(r => r.date.startsWith(prefix))
  if (decRows.length === 0) return null
  return decRows[decRows.length - 1]
}

function findNearestOnOrBefore(observations, targetIso) {
  // Binary search for last observation on or before target date
  let lo = 0, hi = observations.length - 1, ans = null
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const d = observations[mid].date
    if (d <= targetIso) {
      ans = observations[mid]
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return ans
}

async function main() {
  parseArgs(process.argv.slice(2))
  const now = new Date()
  const start = '1979-01-01' // need 1979 Dec for 1980 YoY base
  console.log('Fetching S&P 500 (daily) from Stooq...')
  let obs = await fetchStooqObservations()
  let sourceTag = 'Stooq'

  const getVal = (iso) => obs.find(r => r.date === iso)?.value ?? null

  // 1980–2024: last trading day in December
  const decRows = []
  for (let y = 1980; y <= 2024; y++) {
    const lastDec = pickLastTradingDayOfDecember(obs, y)
    const lastPrevDec = pickLastTradingDayOfDecember(obs, y - 1)
    if (lastDec) {
      const row = { year: y, value: round2(lastDec.value) }
      if (lastPrevDec) {
        const pct = ((lastDec.value - lastPrevDec.value) / lastPrevDec.value) * 100
        row.yoy = round2(pct)
      }
      decRows.push(row)
    }
  }

  // Current year latest close and YoY vs ~same date prior year
  let latest = null
  if (obs.length > 0) {
    const last = obs[obs.length - 1]
    const lastDate = new Date(last.date)
    const prior = new Date(lastDate)
    prior.setFullYear(prior.getFullYear() - 1)
    const priorRow = findNearestOnOrBefore(obs, toISO(prior))
    const row = { year: last.year, value: round2(last.value), latest: true, date: last.date }
    if (priorRow && priorRow.value !== 0) {
      row.yoy = round2(((last.value - priorRow.value) / priorRow.value) * 100)
    }
    latest = row
  }

  const data = latest ? [...decRows, latest] : decRows

  const coverage = data.length ? { start: data[0].year, end: data[data.length - 1].year } : { start: null, end: null }
  const SERIES_META = {
    SP500: {
      title: 'S&P 500 Index',
      homepage: 'https://fred.stlouisfed.org/series/SP500',
    },
    NASDAQCOM: {
      title: 'NASDAQ Index',
      homepage: 'https://fred.stlouisfed.org/series/NASDAQCOM',
    },
    DJIA: {
      title: 'Dow Jones Industrial Average',
      homepage: 'https://fred.stlouisfed.org/series/DJIA',
    },
  }
  const seriesInfo = { title: 'S&P 500 Index', homepage: 'https://stooq.com' }

  const meta = {
    id: 'sp500',
    title: seriesInfo.title,
    description: 'December closes with YoY vs prior December; latest row is most recent close with YoY vs ~same date prior year.',
    units: 'Index level (value), Percent (yoy)',
    frequency: 'Annual (Dec), plus latest close',
    coverage,
    fetchedAt: new Date().toISOString(),
    source: {
      name: 'Stooq',
      homepage: 'https://stooq.com',
      api: 'https://stooq.com/q/d/l/',
      attribution: 'Stooq free data',
    },
    seriesId: '^spx',
    notes: 'Annual points are last trading day in December. Latest is most recent close. YoY for latest is computed vs nearest available date one year earlier.'
  }

  const out = { meta, data }

  const outDir = path.join(process.cwd(), 'data')
  await mkdir(outDir, { recursive: true })
  await writeFile(path.join(outDir, 'sp500.json'), JSON.stringify(out, null, 2), 'utf8')
  console.log(`Saved ${data.length} rows to data/sp500.json`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})


