// Income Gap: how many times more the average top-10% adult earns than the average bottom-50% adult.
// ratio = (top 10% income share / 0.10) / (bottom 50% income share / 0.50)
// Source: WID pre-tax national income shares, adults, equal split (sptincj992), read from
// the local WID export in data/wid/WID_data_US.csv. Refresh that file from wid.world to update.
// Nothing is extrapolated. Usage: pnpm fetch:income-gap

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { round2, writeDataset } from './lib/fred.mjs'

const csv = await readFile(path.join(process.cwd(), 'data', 'wid', 'WID_data_US.csv'), 'utf8')
const top10 = new Map()
const bottom50 = new Map()
for (const line of csv.split(/\r?\n/)) {
  const [country, variable, percentile, year, value] = line.split(';')
  if (country !== 'US' || variable !== 'sptincj992') continue
  const y = Number(year)
  const v = Number(value)
  if (!Number.isFinite(y) || !Number.isFinite(v)) continue
  if (percentile === 'p90p100') top10.set(y, v)
  if (percentile === 'p0p50') bottom50.set(y, v)
}

const data = [...top10.keys()]
  .filter((y) => y >= 1979 && bottom50.has(y))
  .sort((a, b) => a - b)
  .map((year) => ({
    year,
    value: round2(top10.get(year) / 0.1 / (bottom50.get(year) / 0.5)),
    top10Share: top10.get(year),
    bottom50Share: bottom50.get(year),
  }))

await writeDataset('income_gap.json', {
  id: 'income_gap',
  title: 'Income Gap (Top 10% / Bottom 50%)',
  description: 'Average pre-tax income of the top 10% divided by that of the bottom 50%, adults, equal split.',
  units: 'Ratio',
  frequency: 'Annual',
  source: {
    name: 'World Inequality Database',
    homepage: 'https://wid.world/country/usa/',
    api: 'https://wid.world/data/',
    attribution: 'World Inequality Database (WID.world), series sptincj992',
  },
  series: [{ id: 'sptincj992', label: 'Pre-tax national income share, p90p100 and p0p50' }],
  notes: 'Computed from income shares so it matches WID published ratios. No extrapolated years.',
}, data)
