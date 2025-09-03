// Compare wealth gap levels from FRED DFA vs alternative (WID/RTI) inputs
// Wealth gap level = (Top 10% share) − (Bottom 50% share)
// - DFA (FRED): Top 10% = Top 1% + Next 9%; Bottom 50% direct
// - Alt (WID/RTI): provide annual Top 10% and Bottom 50% shares via CSV/JSON
// Output: data/wealth_gap_compare.json with time series and stats

import { writeFile, readFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const FRED_API_BASE = 'https://api.stlouisfed.org/fred'
// DFA series IDs (Top 1%, Next 9%, Bottom 50%)
const DFA_TOP1 = 'WFRBST01134'
const DFA_NEXT9 = 'WFRBSN09161'
const DFA_BOTTOM50 = 'WFRBSB50189'

function parseArgs(argv) {
  const args = { csvTop: null, csvBottom: null, fileTop: null, fileBottom: null, start: 1979, debug: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--csv-top' && argv[i + 1]) args.csvTop = argv[++i]
    if (a === '--csv-bottom' && argv[i + 1]) args.csvBottom = argv[++i]
    if (a === '--file-top' && argv[i + 1]) args.fileTop = argv[++i]
    if (a === '--file-bottom' && argv[i + 1]) args.fileBottom = argv[++i]
    if (a === '--start' && argv[i + 1]) args.start = Number(argv[++i])
    if (a === '--debug') args.debug = true
  }
  return args
}

async function fetchText(src) {
  if (!src) return null
  if (/^https?:\/\//i.test(src)) {
    const res = await fetch(src)
    if (!res.ok) throw new Error(`Failed to fetch ${src}: ${res.status} ${res.statusText}`)
    return await res.text()
  }
  const abs = path.isAbsolute(src) ? src : path.join(process.cwd(), src)
  return readFile(abs, 'utf8')
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return []
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const yearIdx = headers.findIndex((h) => ['year', 'time', 'date'].includes(h))
  const valueIdx = headers.findIndex((h) => ['value', 'share', 'val', 'v'].includes(h))
  const results = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    if (cols.length < 2) continue
    const y = yearIdx >= 0 ? Number(cols[yearIdx]) : Number(cols[0])
    const v = valueIdx >= 0 ? Number(cols[valueIdx]) : Number(cols[1])
    if (!Number.isFinite(y) || !Number.isFinite(v)) continue
    results.push({ year: y, value: v })
  }
  return results
}

function parseMaybeJSON(text) {
  try {
    const json = JSON.parse(text)
    if (Array.isArray(json)) return json
    if (json && Array.isArray(json.data)) return json.data
  } catch {}
  return null
}

async function ensureFredApiKey() {
  const key = process.env.FRED_API_KEY || process.env.FRED_KEY || process.env.FREDAPIKEY
  if (!key) throw new Error('Missing FRED API key. Set FRED_API_KEY')
  return key
}

async function fredGet(pathname, params, debug) {
  const apiKey = await ensureFredApiKey()
  const url = new URL(FRED_API_BASE + pathname)
  for (const [k, v] of Object.entries(params || {})) {
    if (v != null) url.searchParams.set(k, String(v))
  }
  url.searchParams.set('file_type', 'json')
  url.searchParams.set('api_key', apiKey)
  if (debug) console.log(`[FRED] GET ${url.toString()}`)
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`FRED request failed: ${res.status} ${res.statusText} ${text}`)
  }
  return res.json()
}

async function fredObservations(seriesId, startDate = '1979-01-01', debug) {
  const json = await fredGet('/series/observations', { series_id: seriesId, observation_start: startDate }, debug)
  return (json.observations || [])
    .filter((o) => o.value != null && o.value !== '.')
    .map((o) => ({ date: o.date, value: Number(o.value) }))
}

function extractAnnualLastByYear(observations) {
  const byYear = new Map()
  const lastDate = new Map()
  for (const o of observations) {
    const y = Number(o.date.slice(0, 4))
    const prev = lastDate.get(y)
    if (!prev || o.date > prev) {
      lastDate.set(y, o.date)
      byYear.set(y, o.value)
    }
  }
  return byYear
}

function round2(n) {
  return Number(n.toFixed(2))
}

function computeStats(pairs) {
  // pairs: [{year, a, b, delta}]
  const n = pairs.length
  if (n === 0) return { n: 0 }
  let sumAbs = 0, sumSq = 0, sum = 0
  let sumA = 0, sumB = 0, sumAA = 0, sumBB = 0, sumAB = 0
  for (const p of pairs) {
    sumAbs += Math.abs(p.delta)
    sumSq += p.delta * p.delta
    sum += p.delta
    sumA += p.a
    sumB += p.b
    sumAA += p.a * p.a
    sumBB += p.b * p.b
    sumAB += p.a * p.b
  }
  const mae = sumAbs / n
  const mse = sumSq / n
  const rmse = Math.sqrt(mse)
  const meanError = sum / n
  const meanA = sumA / n
  const meanB = sumB / n
  const cov = sumAB / n - meanA * meanB
  const varA = sumAA / n - meanA * meanA
  const varB = sumBB / n - meanB * meanB
  const corr = (varA > 0 && varB > 0) ? cov / Math.sqrt(varA * varB) : null
  return { n, mae: round2(mae), rmse: round2(rmse), meanError: round2(meanError), corr: corr != null ? round2(corr) : null }
}

async function main() {
  const argv = parseArgs(process.argv.slice(2))
  const debug = argv.debug || process.env.DEBUG_WEALTH === '1'

  if (!(argv.csvTop || argv.fileTop) || !(argv.csvBottom || argv.fileBottom)) {
    console.error('Usage: node scripts/compare-wealth-gap.mjs --csv-top URL|--file-top PATH --csv-bottom URL|--file-bottom PATH [--start 1979] [--debug]')
    process.exitCode = 1
    return
  }

  // Load alternative (WID/RTI) annual series
  const [topText, bottomText] = await Promise.all([
    fetchText(argv.csvTop || argv.fileTop),
    fetchText(argv.csvBottom || argv.fileBottom),
  ])
  const altTop = parseMaybeJSON(topText) || parseCSV(topText)
  const altBot = parseMaybeJSON(bottomText) || parseCSV(bottomText)
  if (debug) console.log(`[ALT] parsed top=${altTop.length} rows bottom=${altBot.length} rows`)
  const altTopByYear = new Map(altTop.map((r) => [r.year, r.value]))
  const altBotByYear = new Map(altBot.map((r) => [r.year, r.value]))
  const altYears = Array.from(new Set([...altTopByYear.keys(), ...altBotByYear.keys()]))
    .filter((y) => y >= argv.start)
    .sort((a, b) => a - b)
  const altGap = new Map()
  for (const y of altYears) {
    const t = altTopByYear.get(y)
    const b = altBotByYear.get(y)
    if (t != null && b != null) altGap.set(y, round2(t - b))
  }
  // Unit harmonization: WID values are typically fractions (e.g., 0.65). DFA is in percent.
  // If alt shares look fractional, convert gap to percentage points by *100.
  const sampleAltVals = Array.from(altTopByYear.values()).slice(0, 5)
  const looksFraction = sampleAltVals.length > 0 && sampleAltVals.every((v) => Math.abs(v) <= 2)
  if (looksFraction) {
    for (const [y, v] of Array.from(altGap.entries())) altGap.set(y, round2(v * 100))
  }

  // Load DFA from FRED
  const [top1Obs, next9Obs, bot50Obs] = await Promise.all([
    fredObservations(DFA_TOP1, `${argv.start}-01-01`, debug),
    fredObservations(DFA_NEXT9, `${argv.start}-01-01`, debug),
    fredObservations(DFA_BOTTOM50, `${argv.start}-01-01`, debug),
  ])
  if (debug) console.log(`[DFA] top1=${top1Obs.length} next9=${next9Obs.length} bot50=${bot50Obs.length}`)
  const top10ByDate = new Map()
  for (const o of top1Obs) top10ByDate.set(o.date, (top10ByDate.get(o.date) || 0) + o.value)
  for (const o of next9Obs) top10ByDate.set(o.date, (top10ByDate.get(o.date) || 0) + o.value)
  const bot50ByDate = new Map(bot50Obs.map((o) => [o.date, o.value]))
  const allDates = Array.from(new Set([...top10ByDate.keys(), ...bot50ByDate.keys()])).sort()
  const gapByDate = []
  for (const d of allDates) {
    const t = top10ByDate.get(d)
    const b = bot50ByDate.get(d)
    if (t != null && b != null) gapByDate.push({ date: d, value: t - b })
  }
  const dfaAnnual = extractAnnualLastByYear(gapByDate)

  // Align and compare
  const compareYears = Array.from(new Set([...dfaAnnual.keys(), ...altGap.keys()]))
    .filter((y) => y >= argv.start)
    .sort((a, b) => a - b)
  const pairs = []
  for (const y of compareYears) {
    const a = dfaAnnual.get(y)
    const b = altGap.get(y)
    if (a != null && b != null) pairs.push({ year: y, a: round2(a), b: round2(b), delta: round2(b - a) })
  }

  const stats = computeStats(pairs)
  const report = {
    meta: {
      comparedFromYear: argv.start,
      fetchedAt: new Date().toISOString(),
      sources: {
        dfa: { provider: 'Federal Reserve (FRED DFA)', top1: DFA_TOP1, next9: DFA_NEXT9, bottom50: DFA_BOTTOM50 },
        alt: { provider: 'WID/RTI (user-provided CSV/JSON)', top: argv.csvTop || argv.fileTop, bottom: argv.csvBottom || argv.fileBottom },
      },
    },
    stats,
    series: pairs,
  }

  const outDir = path.join(process.cwd(), 'data')
  await mkdir(outDir, { recursive: true })
  const outFile = path.join(outDir, 'wealth_gap_compare.json')
  await writeFile(outFile, JSON.stringify(report, null, 2), 'utf8')
  console.log(`Saved comparison for ${pairs.length} years to data/wealth_gap_compare.json`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})


