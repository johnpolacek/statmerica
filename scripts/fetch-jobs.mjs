// Total nonfarm payroll employment (PAYEMS), thousands, seasonally adjusted. Annual value = December.
// Usage: pnpm fetch:jobs
import { fetchFredSeries, toAnnual, writeDataset, fredSource } from './lib/fred.mjs'

const rows = await fetchFredSeries('PAYEMS')
await writeDataset('jobs.json', {
  id: 'jobs',
  title: 'Nonfarm Payroll Jobs',
  description: 'Total nonfarm payroll employment from the BLS establishment survey. Annual value is December.',
  units: 'Thousands of jobs',
  frequency: 'Monthly, annualized by December value',
  source: fredSource('PAYEMS', 'U.S. Bureau of Labor Statistics via FRED'),
  series: [{ id: 'PAYEMS', label: 'All Employees, Total Nonfarm' }],
}, toAnnual(rows, { mode: 'end' }))
