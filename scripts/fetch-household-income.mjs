// Real median household income, constant dollars.
// - 1984 onward: FRED MEHOINUSA672N (Census CPS ASEC).
// - 1979-1983: Census Historical Income Table H-5 (all races), which starts in 1967.
//   Values are scaled by the two sources' ratio in 1984 so the dollar basis always matches.
// Usage: pnpm fetch:household-income

import { execFileSync } from 'node:child_process'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fetchFredSeries, round2, writeDataset, fredSource } from './lib/fred.mjs'

const H5_URL = 'https://www2.census.gov/programs-surveys/cps/tables/time-series/historical-income-households/h05.xlsx'

// Read the first "All Races" block of Table H-5: year -> real median income.
async function fetchCensusH5() {
  const res = await fetch(H5_URL)
  if (!res.ok) throw new Error(`Census H-5 failed: ${res.status} ${res.statusText}`)
  const dir = await mkdtemp(path.join(os.tmpdir(), 'h5-'))
  const file = path.join(dir, 'h05.xlsx')
  try {
    await writeFile(file, Buffer.from(await res.arrayBuffer()))
    const read = (entry) => execFileSync('unzip', ['-p', file, entry], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 })
    const strings = [...read('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
      [...m[1].matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((t) => t[1]).join(''),
    )
    const rows = [...read('xl/worksheets/sheet1.xml').matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((r) =>
      [...r[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>(?:<v>([^<]*)<\/v>)?<\/c>)/g)].reduce((acc, [, col, attrs, v]) => {
        acc[col] = v == null ? '' : /t="s"/.test(attrs) ? strings[Number(v)] : v
        return acc
      }, {}),
    )
    const byYear = new Map()
    let started = false
    for (const row of rows) {
      const label = String(row.A ?? '')
      const year = Number(label.slice(0, 4))
      if (/^\d{4}/.test(label)) {
        started = true
        // Break years appear twice. Keep the first row, which uses the current method.
        if (!byYear.has(year)) byYear.set(year, Number(row.D))
      } else if (started && label.trim()) {
        break // end of the "All Races" block
      }
    }
    return byYear
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

const [fred, h5] = await Promise.all([fetchFredSeries('MEHOINUSA672N'), fetchCensusH5()])
const fredByYear = new Map(fred.map((r) => [r.year, r.value]))
const scale = fredByYear.get(1984) / h5.get(1984)
if (!Number.isFinite(scale) || Math.abs(scale - 1) > 0.05) throw new Error(`Census H-5 and FRED disagree in 1984 (scale ${scale})`)

const data = []
for (let year = 1979; year < 1984; year++) {
  if (!h5.has(year)) throw new Error(`Census H-5 missing ${year}`)
  data.push({ year, value: round2(h5.get(year) * scale) })
}
for (const [year, value] of [...fredByYear.entries()].sort((a, b) => a[0] - b[0])) {
  if (year >= 1984) data.push({ year, value: round2(value) })
}

await writeDataset('household_income.json', {
  id: 'household_income',
  title: 'Real Median Household Income',
  description: 'Median household income in constant dollars from the Census Current Population Survey.',
  units: 'USD (constant dollars of the latest release year)',
  frequency: 'Annual',
  source: fredSource('MEHOINUSA672N', 'U.S. Census Bureau via FRED; 1979-1983 from Census Historical Income Table H-5'),
  series: [{ id: 'MEHOINUSA672N', label: 'Real Median Household Income in the United States' }],
  notes: `1979-1983 come from Census Table H-5, scaled to FRED by their 1984 ratio (${scale.toFixed(4)}).`,
}, data)
