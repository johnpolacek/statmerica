// CPI-U food at home, not seasonally adjusted (CUUR0000SAF11). Annual value = December index.
// Usage: pnpm fetch:groceries
import { fetchFredSeries, toAnnual, writeDataset, fredSource } from './lib/fred.mjs'

const rows = await fetchFredSeries('CUUR0000SAF11')
await writeDataset('groceries.json', {
  id: 'groceries',
  title: 'Grocery Prices (CPI Food at Home)',
  description: 'Consumer price index for food bought at grocery stores, not seasonally adjusted. Annual value is December.',
  units: 'Index (1982-84=100)',
  frequency: 'Monthly, annualized by December value',
  source: fredSource('CUUR0000SAF11', 'U.S. Bureau of Labor Statistics via FRED'),
  series: [{ id: 'CUUR0000SAF11', label: 'CPI-U: Food at Home, U.S. City Average, NSA' }],
}, toAnnual(rows, { mode: 'end' }))
