// Unemployment rate, U-3, seasonally adjusted (LNS14000000, published on FRED as UNRATE).
// Annual value = December rate. Usage: pnpm fetch:unemployment
import { fetchFredSeries, toAnnual, writeDataset, fredSource } from './lib/fred.mjs'

const rows = await fetchFredSeries('UNRATE')
await writeDataset('unemployment.json', {
  id: 'unemployment',
  title: 'Unemployment Rate (U-3, SA)',
  description: 'Civilian unemployment rate, 16 years and over, seasonally adjusted. Annual value is the December rate.',
  units: 'Percent',
  frequency: 'Monthly, annualized by December value',
  source: fredSource('UNRATE', 'U.S. Bureau of Labor Statistics via FRED'),
  series: [{ id: 'LNS14000000', label: 'Unemployment Rate' }],
}, toAnnual(rows, { mode: 'end' }))
