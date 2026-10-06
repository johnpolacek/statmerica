// Real average hourly earnings, production and nonsupervisory employees, total private.
// Real wage = AHETPI / (CPIAUCSL / 100), in 1982-84 dollars. Annual value = December.
// Usage: pnpm fetch:wages
import { fetchFredSeries, toAnnual, writeDataset, fredSource } from './lib/fred.mjs'

const [ahe, cpi] = await Promise.all([fetchFredSeries('AHETPI'), fetchFredSeries('CPIAUCSL')])
const cpiByDate = new Map(cpi.map((r) => [r.date, r.value]))
const real = ahe
  .filter((r) => cpiByDate.has(r.date))
  .map((r) => ({ ...r, value: r.value / (cpiByDate.get(r.date) / 100) }))

await writeDataset('wages.json', {
  id: 'wages',
  title: 'Real Average Hourly Earnings',
  description: 'Average hourly earnings of production and nonsupervisory employees (total private), deflated by CPI-U. Annual value is December.',
  units: 'USD per hour, 1982-84 dollars',
  frequency: 'Monthly, annualized by December value',
  source: fredSource('AHETPI', 'U.S. Bureau of Labor Statistics via FRED'),
  series: [{ id: 'AHETPI', label: 'Average Hourly Earnings (nominal)' }, { id: 'CPIAUCSL', label: 'CPI-U, SA (deflator)' }],
}, toAnnual(real, { mode: 'end' }))
