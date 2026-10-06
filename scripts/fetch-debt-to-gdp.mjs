// Federal debt held by the public as % of GDP (FYGFGDQ188S). Annual value = Q4.
// Excludes debt the government owes itself, such as Social Security trust fund holdings.
// Usage: pnpm fetch:debt-to-gdp
import { fetchFredSeries, toAnnual, writeDataset, fredSource } from './lib/fred.mjs'

const rows = await fetchFredSeries('FYGFGDQ188S')
await writeDataset('debt_to_gdp.json', {
  id: 'debt_to_gdp',
  title: 'Federal Debt Held by the Public to GDP',
  description: 'Federal debt held by the public as a percent of GDP. Annual value is Q4.',
  units: 'Percent of GDP',
  frequency: 'Quarterly, annualized by Q4 value',
  source: fredSource('FYGFGDQ188S', 'Federal Reserve Bank of St. Louis; U.S. Treasury'),
  series: [{ id: 'FYGFGDQ188S', label: 'Federal Debt Held by the Public as Percent of GDP' }],
}, toAnnual(rows, { mode: 'end', finalMonth: 10 }))
