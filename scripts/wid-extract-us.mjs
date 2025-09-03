// Extract US Top 10% (p90p100) and Bottom 50% (p0p50) wealth shares from WID CSVs
// - Scans CSV files under data/wid/ by default (or pass --dir PATH)
// - Looks for indicator codes containing "shweal" and groups p90p100 / p0p50
// - Writes simple annual CSVs: data/us_top10.csv, data/us_bottom50.csv

import { writeFile, readFile } from 'node:fs/promises'
import path from 'node:path'
import { promises as fs } from 'node:fs'

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
  // Auto-detect delimiter: WID uses ';' commonly
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
  for (const cand of candidates) {
    const idx = lower.indexOf(cand)
    if (idx !== -1) return idx
  }
  return -1
}

function isUs(val) {
  const v = String(val || '').toLowerCase()
  return v === 'us' || v === 'usa' || v === 'united states' || v === 'united-states'
}

function pickValue(cols, headers) {
  const idx = findColIdx(headers, ['value', 'val', 'v', 'share'])
  if (idx === -1) return null
  const num = Number(cols[idx])
  return Number.isFinite(num) ? num : null
}

function pickYear(cols, headers) {
  const idx = findColIdx(headers, ['year', 'time', 'date'])
  if (idx === -1) return null
  const y = Number(String(cols[idx]).slice(0, 4))
  return Number.isFinite(y) ? y : null
}

function pickIndicator(cols, headers) {
  // Try various columns that might carry the code/name
  const idx = findColIdx(headers, ['indicator', 'variable', 'series', 'code'])
  if (idx !== -1) return String(cols[idx]).toLowerCase()
  return ''
}

function pickGroup(cols, headers) {
  const idx = findColIdx(headers, ['percentile', 'group', 'fractile', 'p'])
  if (idx !== -1) return String(cols[idx]).toLowerCase()
  // If group is embedded in indicator code (e.g., shweal_p90p100_z), we’ll detect via indicator
  return ''
}

function pickArea(cols, headers) {
  const idx = findColIdx(headers, ['area', 'country', 'iso', 'code', 'geo'])
  if (idx !== -1) return String(cols[idx])
  return ''
}

function matchesTop10(indicator, group) {
  const s = indicator || ''
  const g = group || ''
  // Strict: must be a wealth share series (shweal) and Top 10% group
  return s.startsWith('shweal') && (s.includes('p90p100') || g.includes('p90p100'))
}

function matchesBottom50(indicator, group) {
  const s = indicator || ''
  const g = group || ''
  // Strict: must be a wealth share series (shweal) and Bottom 50% group
  return s.startsWith('shweal') && (s.includes('p0p50') || s.includes('p00p50') || g.includes('p0p50') || g.includes('p00p50'))
}

function scorePreference(age, pop, variable) {
  // Prefer age 992, then 999, then others; prefer pop 'j' (joined), then 'i', 'm', 'f', 't'
  const agePref = (age === '992') ? 0 : (age === '999' ? 1 : 2)
  const popOrder = { j: 0, i: 1, m: 2, f: 3, t: 4 }
  const popPref = popOrder[String(pop || '').toLowerCase()] ?? 5
  // Prefer more explicit variable code ending with desired suffix (e.g., shwealj992)
  let varBonus = 0
  const v = String(variable || '').toLowerCase()
  if (v.startsWith('shweal')) {
    if (v.includes('j992')) varBonus -= 1
    else if (v.includes('i999')) varBonus -= 0.5
  }
  return agePref * 10 + popPref + varBonus
}

async function main() {
  const argv = parseArgs(process.argv.slice(2))
  const debug = argv.debug || process.env.DEBUG_WEALTH === '1'

  const csvFiles = await listCsvFiles(argv.dir)
  if (csvFiles.length === 0) {
    console.error(`No CSV files found under ${argv.dir}. Unzip WID files into ${argv.dir}/ and rerun.`)
    process.exitCode = 1
    return
  }
  if (debug) console.log(`[WID] scanning ${csvFiles.length} CSV files`)

  const topMap = new Map()
  const botMap = new Map()

  for (const file of csvFiles) {
    let text
    try { text = await readFile(file, 'utf8') } catch { continue }
    const { headers, rows } = parseCSV(text)
    if (headers.length === 0) continue
    const idxAge = findColIdx(headers, ['age'])
    const idxPop = findColIdx(headers, ['pop'])
    for (const cols of rows) {
      const area = pickArea(cols, headers)
      if (!isUs(area)) continue
      const indicator = pickIndicator(cols, headers)
      const group = pickGroup(cols, headers)
      if (!indicator.startsWith('shweal')) continue
      const year = pickYear(cols, headers)
      const value = pickValue(cols, headers)
      if (!Number.isFinite(year) || !Number.isFinite(value)) continue
      const age = idxAge >= 0 ? String(cols[idxAge]) : ''
      const pop = idxPop >= 0 ? String(cols[idxPop]) : ''
      const pref = scorePreference(age, pop, indicator)
      if (matchesTop10(indicator, group)) {
        const prev = topMap.get(year)
        if (!prev || pref < prev.pref) topMap.set(year, { value, pref })
      } else if (matchesBottom50(indicator, group)) {
        const prev = botMap.get(year)
        if (!prev || pref < prev.pref) botMap.set(year, { value, pref })
      }
    }
  }

  const years = Array.from(new Set([...topMap.keys(), ...botMap.keys()])).sort((a, b) => a - b)
  const topRows = []
  const botRows = []
  for (const y of years) {
    if (topMap.has(y)) topRows.push({ year: y, value: topMap.get(y).value })
    if (botMap.has(y)) botRows.push({ year: y, value: botMap.get(y).value })
  }

  if (debug) console.log(`[WID] extracted top=${topRows.length} years bottom=${botRows.length} years`)

  const toCsv = (rows) => ['year,value,value_pp', ...rows.map((r) => `${r.year},${r.value},${(r.value * 100).toFixed(4)}`)].join('\n')
  const outTop = path.join(process.cwd(), 'data', 'us_top10.csv')
  const outBot = path.join(process.cwd(), 'data', 'us_bottom50.csv')
  await writeFile(outTop, toCsv(topRows), 'utf8')
  await writeFile(outBot, toCsv(botRows), 'utf8')
  console.log(`Wrote ${topRows.length}y to data/us_top10.csv and ${botRows.length}y to data/us_bottom50.csv`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})


