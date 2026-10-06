// Fetch the federal deficit (fiscal year) as a share of GDP, back to 1979, from FRED.
// Notes:
// - FYFSGDA188S: Federal Surplus or Deficit [-] as Percent of GDP (negative = deficit)
// - FYFSD: Federal Surplus or Deficit [-] in MILLIONS of dollars (negative = deficit)
// - Output `value` is the deficit as % of GDP, sign flipped so deficits are positive
//   and surpluses are negative. Signs are preserved, never absolute-valued.
// - Output `usdBillions` is the deficit in billions (same sign convention).

import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const FRED_CSV_URL = (id) => `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`

function round2(n) { return Number(n.toFixed(2)) }

async function fetchFredAnnual(seriesId) {
  const res = await fetch(FRED_CSV_URL(seriesId))
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`FRED request failed for ${seriesId}: ${res.status} ${res.statusText} ${text}`)
  }
  const lines = (await res.text()).trim().split(/\r?\n/)
  const byYear = new Map()
  for (let i = 1; i < lines.length; i++) {
    const [dateStr, valueStr] = lines[i].split(',')
    const year = Number(dateStr?.slice(0, 4))
    const v = Number(valueStr)
    if (!Number.isFinite(year) || valueStr === '.' || !Number.isFinite(v)) continue
    byYear.set(year, v)
  }
  return byYear
}

async function main() {
  console.log('Fetching federal deficit (% of GDP and USD) from FRED...')
  const [pctOfGdp, usdMillions] = await Promise.all([
    fetchFredAnnual('FYFSGDA188S'),
    fetchFredAnnual('FYFSD'),
  ])

  const data = [...pctOfGdp.entries()]
    .filter(([year]) => year >= 1979)
    .sort((a, b) => a[0] - b[0])
    .map(([year, surplusPct]) => {
      const row = { year, value: round2(-surplusPct) }
      const usd = usdMillions.get(year)
      if (typeof usd === 'number') row.usdBillions = round2(-usd / 1000)
      return row
    })

  const out = {
    meta: {
      id: 'deficit',
      title: 'Federal Deficit (% of GDP, Fiscal Year)',
      description: 'Federal deficit as a percent of GDP. Positive values are deficits, negative values are surpluses.',
      units: 'Percent of GDP for value, USD billions for usdBillions',
      frequency: 'Annual (FY)',
      coverage: { start: data[0]?.year ?? null, end: data.at(-1)?.year ?? null },
      fetchedAt: new Date().toISOString(),
      source: {
        name: 'FRED (FYFSGDA188S, FYFSD)',
        homepage: 'https://fred.stlouisfed.org/series/FYFSGDA188S',
        api: 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=FYFSGDA188S',
        attribution: 'Federal Reserve Bank of St. Louis; U.S. Office of Management and Budget',
      },
      series: [{ id: 'FYFSGDA188S', label: 'Federal Surplus or Deficit as Percent of GDP (sign flipped)' }],
      notes: 'FRED reports surpluses as positive and deficits as negative. Signs are flipped so a deficit is positive. FYFSD is reported in millions and converted to billions.',
    },
    data,
  }

  const outDir = path.join(process.cwd(), 'data')
  await mkdir(outDir, { recursive: true })
  await writeFile(path.join(outDir, 'deficit.json'), JSON.stringify(out, null, 2), 'utf8')
  console.log(`Wrote data/deficit.json with ${data.length} rows (${out.meta.coverage.start}-${out.meta.coverage.end})`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
