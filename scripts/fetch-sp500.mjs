// S&P 500 year-end close, adjusted for inflation to dollars of the latest CPI-U month.
// `nominal` keeps the quoted index level. FRED's SP500 series only covers the last ten
// years, so earlier year-end closes come from the existing data/sp500.json.
// Annual value = last close of December. Usage: pnpm fetch:sp500
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fetchFredSeries, fetchCpiDeflator, round2, writeDataset, fredSource } from './lib/fred.mjs'

const existing = JSON.parse(await readFile(path.join(process.cwd(), 'data', 'sp500.json'), 'utf8'))
const [rows, deflator] = await Promise.all([fetchFredSeries('SP500'), fetchCpiDeflator()])
const currentYear = new Date().getFullYear()

const lastClose = new Map()
for (const r of rows) lastClose.set(r.year, r) // rows are sorted, so this keeps each year's last close
const firstFullFredYear = rows[0].month === 1 ? rows[0].year : rows[0].year + 1

const toRow = (year, date, nominal) => ({ year, value: round2(deflator.toReal(date, nominal)), nominal: round2(nominal) })

// Stored history: `nominal` once this script has run, `value` in files written before that.
const history = existing.data
  .filter((d) => !d.latest && d.year < firstFullFredYear)
  .map((d) => toRow(d.year, `${d.year}-12-31`, d.nominal ?? d.value))

const recent = []
let latest = null
for (const [year, last] of lastClose) {
  if (year < firstFullFredYear) continue
  if (year < currentYear && last.month === 12) recent.push(toRow(year, last.date, last.value))
  else latest = { ...toRow(year, last.date, last.value), latest: true, asOf: last.date }
}

await writeDataset('sp500.json', {
  id: 'sp500',
  title: 'S&P 500 Index',
  description: 'S&P 500 price index, last close of each year, adjusted for inflation. Dividends excluded.',
  units: `Index level in ${deflator.base} dollars (value); quoted level (nominal)`,
  frequency: 'Daily, annualized by last December close',
  realBase: deflator.base,
  source: fredSource('SP500', 'S&P Dow Jones Indices LLC via FRED; pre-2016 year-end closes from Stooq'),
  series: [{ id: 'SP500', label: 'S&P 500' }, { id: 'CPIAUCNS', label: 'CPI-U, NSA (deflator)' }],
}, [...history, ...recent, ...(latest ? [latest] : [])])
