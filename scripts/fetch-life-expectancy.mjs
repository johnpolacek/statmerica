// Fetch Life Expectancy at birth (US) from World Bank and save to data/life_expectancy.json
// Usage:
//   node scripts/fetch-life-expectancy.mjs
// Notes:
//   - World Bank indicator: SP.DYN.LE00.IN (Life expectancy at birth, total (years))
//   - Coverage typically from 1960 to latest year (e.g., 2022)
//   - We filter to 1979+ and compute YoY percent change

import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const WB_URL = 'https://api.worldbank.org/v2/country/USA/indicator/SP.DYN.LE00.IN?format=json&per_page=1000'

function round2(n) { return Number(n.toFixed(2)) }

async function fetchWorldBank() {
  const res = await fetch(WB_URL)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`World Bank API request failed: ${res.status} ${res.statusText} ${text}`)
  }
  const json = await res.json()
  if (!Array.isArray(json) || !Array.isArray(json[1])) {
    throw new Error('World Bank API returned unexpected shape')
  }
  const rows = []
  for (const r of json[1]) {
    const year = Number(r.date)
    const value = r.value == null ? null : Number(r.value)
    if (Number.isFinite(year) && Number.isFinite(value)) rows.push({ year, value: round2(value) })
  }
  rows.sort((a, b) => a.year - b.year)
  return rows
}

async function main() {
  console.log('Fetching Life Expectancy at birth (US) from World Bank...')
  const rows = await fetchWorldBank()
  const filtered = rows.filter(r => r.year >= 1979)
  const withYoy = []
  for (let i = 0; i < filtered.length; i++) {
    const row = { ...filtered[i] }
    const prev = i > 0 ? filtered[i - 1] : null
    if (prev && prev.value !== 0) {
      row.yoy = round2(((row.value - prev.value) / prev.value) * 100)
    }
    withYoy.push(row)
  }

  const coverage = withYoy.length ? { start: withYoy[0].year, end: withYoy[withYoy.length - 1].year } : { start: null, end: null }
  const meta = {
    id: 'life_expectancy',
    title: 'Life Expectancy at Birth (US)',
    description: 'World Bank SP.DYN.LE00.IN. Annual life expectancy in years; YoY computed as percent change.',
    units: 'Years (value), Percent (yoy)',
    frequency: 'Annual',
    coverage,
    fetchedAt: new Date().toISOString(),
    source: {
      name: 'World Bank',
      homepage: 'https://data.worldbank.org/indicator/SP.DYN.LE00.IN',
      api: WB_URL,
      attribution: 'World Bank Open Data',
    },
    notes: 'Filtered to 1979+. YoY = ((current - previous) / previous) * 100.'
  }

  const out = { meta, data: withYoy }
  const outDir = path.join(process.cwd(), 'data')
  await mkdir(outDir, { recursive: true })
  await writeFile(path.join(outDir, 'life_expectancy.json'), JSON.stringify(out, null, 2), 'utf8')
  console.log(`Saved ${withYoy.length} rows to data/life_expectancy.json`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})


