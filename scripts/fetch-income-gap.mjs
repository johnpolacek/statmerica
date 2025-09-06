// Build Income Gap (P90 vs P50) from annual USD CSVs, 1979–2025
// Inputs (default): data/us_income_p50.csv, data/us_income_p90.csv
// Output: data/income_gap.json with ratio level (P90/P50), YoY %, raw USD levels, and coverage

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return []
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const yearIdx = headers.indexOf('year')
  const valIdx = headers.findIndex((h) => h === 'value_usd' || h === 'value')
  const out = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    const y = Number(cols[yearIdx])
    const v = Number(cols[valIdx])
    if (Number.isFinite(y) && Number.isFinite(v)) out.push({ year: y, value: v })
  }
  return out
}

function round2(n) { return Number(n.toFixed(2)) }

// Compute simple last-3-years average growth rate for extrapolation
function computeGrowthRate(series, n = 3) {
  if (series.length < n + 1) return 0
  const recent = series.slice(-n - 1)
  let totalGrowth = 0
  let count = 0
  for (let i = 1; i < recent.length; i++) {
    const curr = recent[i].value
    const prev = recent[i - 1].value
    if (prev !== 0) {
      totalGrowth += (curr - prev) / prev
      count++
    }
  }
  return count > 0 ? totalGrowth / count : 0
}

async function main() {
  const p50Path = path.join(process.cwd(), 'data', 'us_income_p50.csv')
  const p90Path = path.join(process.cwd(), 'data', 'us_income_p90.csv')
  const [p50Text, p90Text] = await Promise.all([readFile(p50Path, 'utf8'), readFile(p90Path, 'utf8')])
  const p50 = parseCSV(p50Text)
  const p90 = parseCSV(p90Text)
  
  // Add 2024-2025 extrapolation using last 3 years growth
  const p50Growth = computeGrowthRate(p50.filter(r => r.year >= 2020))
  const p90Growth = computeGrowthRate(p90.filter(r => r.year >= 2020))
  
  const lastP50 = p50[p50.length - 1]
  const lastP90 = p90[p90.length - 1]
  
  if (lastP50 && lastP90 && lastP50.year === lastP90.year) {
    const lastYear = lastP50.year
    for (let extraYear = lastYear + 1; extraYear <= 2025; extraYear++) {
      const extraP50 = lastP50.value * Math.pow(1 + p50Growth, extraYear - lastYear)
      const extraP90 = lastP90.value * Math.pow(1 + p90Growth, extraYear - lastYear)
      p50.push({ year: extraYear, value: round2(extraP50) })
      p90.push({ year: extraYear, value: round2(extraP90) })
    }
  }

  const p50ByYear = new Map(p50.map(r => [r.year, r.value]))
  const p90ByYear = new Map(p90.map(r => [r.year, r.value]))
  const years = Array.from(new Set([...p50ByYear.keys(), ...p90ByYear.keys()])).sort((a, b) => a - b)
  
  // Build levels with value=ratio, p90_usd, p50_usd, and yoy=% change in ratio
  const levels = []
  for (const y of years) {
    if (y < 1980) continue // Start YoY data from 1980
    const a = p90ByYear.get(y)
    const b = p50ByYear.get(y)
    const prevA = p90ByYear.get(y - 1)
    const prevB = p50ByYear.get(y - 1)
    
    if (a != null && b != null && b !== 0) {
      const ratio = a / b
      let yoy = null
      
      // Compute YoY change in ratio
      if (prevA != null && prevB != null && prevB !== 0) {
        const prevRatio = prevA / prevB
        if (prevRatio !== 0) {
          yoy = round2(((ratio - prevRatio) / prevRatio) * 100)
        }
      }
      
      const level = { year: y, value: round2(ratio), p90_usd: round2(a), p50_usd: round2(b) }
      if (yoy !== null) level.yoy = yoy
      levels.push(level)
    }
  }

  const now = new Date()
  const coverage = levels.length ? { start: levels[0].year, end: levels[levels.length - 1].year } : { start: null, end: null }
  const out = {
    meta: {
      id: 'income_gap',
      title: 'Income Gap (P90 / P50)',
      description: 'Rows use value = ratio level and yoy = percent change; includes raw USD p90_usd and p50_usd.',
      units: 'Ratio (value), Percent (yoy), USD (p90_usd, p50_usd)',
      frequency: 'Annual',
      coverage,
      fetchedAt: now.toISOString(),
      notes: 'Contains ratio level, p90_usd, p50_usd and YoY change in ratio. 2024-2025 extrapolated using last 3 years growth.'
    },
    data: levels,
  }

  const outDir = path.join(process.cwd(), 'data')
  await mkdir(outDir, { recursive: true })
  await writeFile(path.join(outDir, 'income_gap.json'), JSON.stringify(out, null, 2), 'utf8')
  console.log(`Saved ${levels.length} rows to data/income_gap.json`)
}

main().catch((err) => { console.error(err); process.exitCode = 1 })


