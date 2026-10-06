// Real GDP (GDPC1), billions of chained 2017 dollars, SAAR. Annual value = Q4 level.
// Usage: pnpm fetch:gdp
import { fetchFredSeries, toAnnual, writeDataset, fredSource } from './lib/fred.mjs'

const rows = await fetchFredSeries('GDPC1')
await writeDataset('gdp.json', {
  id: 'gdp',
  title: 'Real GDP (Chained 2017 $, SAAR)',
  description: 'Real gross domestic product. Annual value is the Q4 level.',
  units: 'USD billions (chained 2017 dollars, SAAR)',
  frequency: 'Quarterly, annualized by Q4 value',
  source: fredSource('GDPC1', 'U.S. Bureau of Economic Analysis via FRED'),
  series: [{ id: 'GDPC1', label: 'Real GDP' }],
}, toAnnual(rows, { mode: 'end', finalMonth: 10 }))
