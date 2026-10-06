// Housing affordability: the monthly mortgage payment on a median-priced new home as a
// share of median household income.
// - Price: median sales price of new houses sold (MSPUS), Q4. The longest free national series.
// - Rate: 30-year fixed mortgage rate (MORTGAGE30US), December average.
// - Loan: 80% of price (20% down), 30 years, principal and interest only.
// - Income: nominal median household income (MEHOINUSA646N) for the same year.
// A year is complete only when all three exist, so there is no partial-year row.
// Usage: pnpm fetch:housing-affordability
import { fetchFredSeries, round2, writeDataset, fredSource } from './lib/fred.mjs'

const [prices, rates, incomes] = await Promise.all([
  fetchFredSeries('MSPUS'),
  fetchFredSeries('MORTGAGE30US'),
  fetchFredSeries('MEHOINUSA646N'),
])

const q4Price = new Map(prices.filter((r) => r.month === 10).map((r) => [r.year, r.value]))
const decRate = new Map()
for (const r of rates.filter((r) => r.month === 12)) {
  if (!decRate.has(r.year)) decRate.set(r.year, [])
  decRate.get(r.year).push(r.value)
}
const income = new Map(incomes.map((r) => [r.year, r.value]))

// FRED income starts in 1984. Earlier years use Census Table H-5 current-dollar medians, which never change.
const H5_NOMINAL = { 1979: 16460, 1980: 17710, 1981: 19070, 1982: 20170, 1983: 20890 }
for (const [y, v] of Object.entries(H5_NOMINAL)) if (!income.has(Number(y))) income.set(Number(y), v)

const payment = (principal, annualRatePct) => {
  const r = annualRatePct / 100 / 12
  return (principal * r) / (1 - (1 + r) ** -360)
}

const data = []
for (const year of [...q4Price.keys()].sort((a, b) => a - b)) {
  const price = q4Price.get(year)
  const rateList = decRate.get(year)
  const inc = income.get(year)
  if (year < 1979 || !price || !rateList || !inc) continue
  const rate = rateList.reduce((s, v) => s + v, 0) / rateList.length
  const share = (payment(price * 0.8, rate) / (inc / 12)) * 100
  data.push({ year, value: round2(share), price, rate: round2(rate), income: inc })
}

await writeDataset('housing_affordability.json', {
  id: 'housing_affordability',
  title: 'Mortgage Payment as Share of Income',
  description: 'Monthly principal and interest on a median-priced new home, 20% down, 30-year fixed, as a percent of median household income.',
  units: 'Percent of monthly median household income',
  frequency: 'Annual (Q4 price, December rate)',
  source: fredSource('MSPUS', 'U.S. Census Bureau and HUD; Freddie Mac; via FRED'),
  series: [
    { id: 'MSPUS', label: 'Median Sales Price of Houses Sold' },
    { id: 'MORTGAGE30US', label: '30-Year Fixed Rate Mortgage Average' },
    { id: 'MEHOINUSA646N', label: 'Median Household Income (nominal)' },
  ],
  notes: 'Uses new-home prices, which can differ from existing-home prices. 1979-1983 income from Census Table H-5.',
}, data)
