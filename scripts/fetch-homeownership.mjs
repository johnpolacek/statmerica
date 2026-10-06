// Homeownership rate (RHORUSQ156N), not seasonally adjusted. Annual value = Q4.
// Usage: pnpm fetch:homeownership
import { fetchFredSeries, toAnnual, writeDataset, fredSource } from './lib/fred.mjs'

const rows = await fetchFredSeries('RHORUSQ156N')
await writeDataset('homeownership.json', {
  id: 'homeownership',
  title: 'Homeownership Rate',
  description: 'Share of occupied housing units that are owner-occupied. Annual value is Q4.',
  units: 'Percent',
  frequency: 'Quarterly, annualized by Q4 value',
  source: fredSource('RHORUSQ156N', 'U.S. Census Bureau via FRED'),
  series: [{ id: 'RHORUSQ156N', label: 'Homeownership Rate for the United States' }],
}, toAnnual(rows, { mode: 'end', finalMonth: 10 }))
