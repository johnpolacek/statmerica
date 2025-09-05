// Extract US income levels (USD) for P50 and P90 from WID CSVs
// - Scans CSV files under data/wid/ by default (or pass --dir PATH)
// - Looks for indicator codes starting with "aptinc" (average pre-tax income)
// - Prefers age=992 and population='j' per year if multiple variants exist
// - Outputs:
//   - data/us_income_p50.csv (year,value_usd)
//   - data/us_income_p90.csv (year,value_usd)

import { readFile, writeFile } from 'node:fs/promises'
import { promises as fs } from 'node:fs'
import path from 'node:path'

function parseArgs(argv) {
  const args = { dir: 'data/wid', debug: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--dir' && argv[i + 1]) args.dir = argv[++i]
    if (a === '--debug') args.debug = true
  }
  return args
}

async function listCsvFiles(rootDir) {
  const out = []
  async function walk(dir) {
    let entries
    try { entries = await fs.readdir(dir, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      const full = path.join(dir, e.name)
      if (e.isDirectory()) await walk(full)
      else if (e.isFile() && e.name.toLowerCase().endsWith('.csv')) out.push(full)
    }
  }
  await walk(path.isAbsolute(rootDir) ? rootDir : path.join(process.cwd(), rootDir))
  return out
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return { headers: [], rows: [] }
  const headerLine = lines[0]
  const delim = (headerLine.includes(';') && !headerLine.includes(',')) ? ';' : ','
  const splitLine = (line) => line.split(delim).map((s) => s.trim())
  const headers = splitLine(headerLine)
  const rows = []
  for (let i = 1; i < lines.length; i++) rows.push(splitLine(lines[i]))
  return { headers, rows }
}

function findColIdx(headers, candidates) {
  const lower = headers.map((h) => h.toLowerCase())
  for (const c of candidates) {
    const idx = lower.indexOf(c)
    if (idx !== -1) return idx
  }
  return -1
}

function pick(cols, headers, names) {
  const idx = findColIdx(headers, names)
  return idx >= 0 ? cols[idx] : ''
}

function toNum(x) {
  const n = Number(x)
  return Number.isFinite(n) ? n : null
}

function isUS(area) {
  const v = String(area || '').toLowerCase()
  return v === 'us' || v === 'usa' || v === 'united states' || v === 'united-states'
}

function scorePreference(age, pop, variable) {
  const agePref = age === '992' ? 0 : age === '999' ? 1 : 2
  const popOrder = { j: 0, i: 1, m: 2, f: 3, t: 4 }
  const popPref = popOrder[String(pop || '').toLowerCase()] ?? 5
  let varBonus = 0
  const v = String(variable || '').toLowerCase()
  if (v.startsWith('aptinc')) {
    if (v.includes('j992')) varBonus -= 1
    else if (v.includes('i999')) varBonus -= 0.5
  }
  return agePref * 10 + popPref + varBonus
}

async function main() {
  const argv = parseArgs(process.argv.slice(2))
  const debug = argv.debug || process.env.DEBUG_WEALTH === '1'
  const files = await listCsvFiles(argv.dir)
  if (files.length === 0) {
    console.error(`No CSV files under ${argv.dir}`)
    process.exitCode = 1
    return
  }
  if (debug) console.log(`[INCOME] scanning ${files.length} CSV files`)

  const bestP50 = new Map() // year -> { value, pref }
  const bestP90 = new Map()

  for (const file of files) {
    let text
    try { text = await readFile(file, 'utf8') } catch { continue }
    const { headers, rows } = parseCSV(text)
    if (headers.length === 0) continue

    for (const cols of rows) {
      const area = pick(cols, headers, ['area', 'country', 'iso', 'code'])
      if (!isUS(area)) continue
      const variable = String(pick(cols, headers, ['variable', 'indicator', 'series', 'code']) || '').toLowerCase()
      if (!variable.includes('ptinc')) continue // accept aptinc/rptinc/gptinc/etc
      const group = String(pick(cols, headers, ['percentile', 'group', 'fractile', 'p']) || '').toLowerCase()
      const year = toNum(pick(cols, headers, ['year', 'time', 'date']))
      const value = toNum(pick(cols, headers, ['value', 'val', 'v']))
      const age = String(pick(cols, headers, ['age']) || '')
      const pop = String(pick(cols, headers, ['pop']) || '')
      if (!Number.isFinite(year) || !Number.isFinite(value)) continue
      const pref = scorePreference(age, pop, variable)
      if (group === 'p50p50' || group === 'p0p50') {
        const prev = bestP50.get(year)
        if (!prev || pref < prev.pref) bestP50.set(year, { value, pref })
      } else if (group === 'p90p90' || group === 'p90p100') {
        const prev = bestP90.get(year)
        if (!prev || pref < prev.pref) bestP90.set(year, { value, pref })
      }
    }
  }

  const years = Array.from(new Set([...bestP50.keys(), ...bestP90.keys()])).sort((a, b) => a - b)
  const p50Rows = []
  const p90Rows = []
  for (const y of years) {
    const p50 = bestP50.get(y)?.value
    const p90 = bestP90.get(y)?.value
    if (p50 != null) p50Rows.push({ year: y, value_usd: p50 })
    if (p90 != null) p90Rows.push({ year: y, value_usd: p90 })
  }

  const toCsv = (rows) => ['year,value_usd', ...rows.map(r => `${r.year},${r.value_usd}`)].join('\n')
  const outP50 = path.join(process.cwd(), 'data', 'us_income_p50.csv')
  const outP90 = path.join(process.cwd(), 'data', 'us_income_p90.csv')
  await writeFile(outP50, toCsv(p50Rows), 'utf8')
  await writeFile(outP90, toCsv(p90Rows), 'utf8')
  console.log(`Wrote P50 ${p50Rows.length}y to data/us_income_p50.csv; P90 ${p90Rows.length}y to data/us_income_p90.csv`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})


