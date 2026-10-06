// Average retail price of regular unleaded gasoline, U.S. city average (APU000074714),
// adjusted for inflation to dollars of the latest CPI-U month. `nominal` keeps pump prices.
// Annual value = average of the monthly prices. The latest row is the year-to-date average.
// Usage: pnpm fetch:gas
import { fetchFredSeries, fetchCpiDeflator, toAnnual, writeDataset, fredSource } from './lib/fred.mjs'

const [rows, deflator] = await Promise.all([fetchFredSeries('APU000074714'), fetchCpiDeflator()])
const real = rows.map((r) => ({ ...r, nominal: r.value, value: deflator.toReal(r.date, r.value) }))

await writeDataset('gas_prices.json', {
  id: 'gas_prices',
  title: 'Gas Prices (Regular, U.S. City Average)',
  description: 'Average retail price of regular unleaded gasoline, adjusted for inflation. Annual value is the average of monthly prices.',
  units: `USD per gallon in ${deflator.base} dollars (value); pump price (nominal)`,
  frequency: 'Monthly, annualized by average',
  realBase: deflator.base,
  source: fredSource('APU000074714', 'U.S. Bureau of Labor Statistics via FRED'),
  series: [{ id: 'APU000074714', label: 'Average Price: Gasoline, Unleaded Regular' }, { id: 'CPIAUCNS', label: 'CPI-U, NSA (deflator)' }],
}, toAnnual(real, { mode: 'average' }))
