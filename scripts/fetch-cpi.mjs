// CPI-U, all items, not seasonally adjusted (CUUR0000SA0, published on FRED as CPIAUCNS).
// Annual value = December index level. Usage: pnpm fetch:cpi
import { fetchFredSeries, toAnnual, writeDataset, fredSource } from './lib/fred.mjs'

const rows = await fetchFredSeries('CPIAUCNS')
await writeDataset('cpi.json', {
  id: 'cpi',
  title: 'Consumer Price Index (CPI-U, NSA)',
  description: 'CPI for All Urban Consumers, all items, U.S. city average, not seasonally adjusted. Annual value is the December index.',
  units: 'Index (1982-84=100)',
  frequency: 'Monthly, annualized by December value',
  source: fredSource('CPIAUCNS', 'U.S. Bureau of Labor Statistics via FRED'),
  series: [{ id: 'CUUR0000SA0', label: 'All items, U.S. city average, NSA' }],
}, toAnnual(rows, { mode: 'end' }))
