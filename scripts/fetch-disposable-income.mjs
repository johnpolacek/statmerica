// Real disposable personal income per capita (A229RX0), chained 2017 dollars, SAAR.
// Income after taxes and transfers, adjusted for inflation. Annual value = December.
// Usage: pnpm fetch:disposable-income
import { fetchFredSeries, toAnnual, writeDataset, fredSource } from './lib/fred.mjs'

const rows = await fetchFredSeries('A229RX0')
await writeDataset('disposable_income.json', {
  id: 'disposable_income',
  title: 'Real Disposable Income per Person',
  description: 'Personal income after taxes, including government transfers, per person and adjusted for inflation. Annual value is December.',
  units: 'USD per person, chained 2017 dollars (SAAR)',
  frequency: 'Monthly, annualized by December value',
  source: fredSource('A229RX0', 'U.S. Bureau of Economic Analysis via FRED'),
  series: [{ id: 'A229RX0', label: 'Real Disposable Personal Income: Per Capita' }],
}, toAnnual(rows, { mode: 'end' }))
