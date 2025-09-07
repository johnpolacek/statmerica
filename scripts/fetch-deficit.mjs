// Fetch Federal Budget Deficit (Fiscal Year) from Treasury Fiscal Data (MTS Table 1)
// Usage:
//   node scripts/fetch-deficit.mjs
// Notes:
//   - Aggregates monthly receipts and outlays by fiscal year (Oct–Sep)
//   - Computes annual deficit = outlays - receipts (negative is surplus)
//   - Adds YoY % change on annual deficit level
//   - Appends current FY latest month FYTD deficit as a final row (latest: true)
//   - Saves to data/deficit.json with a similar shape to other datasets

import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const API_URL = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/mts/mts_table_1'

function round2(n) { return Number(n.toFixed(2)) }

// Parse numeric safely
function toNumber(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// Extract common fields from an MTS Table 1 row with resilience to minor schema differences
function extractRowFields(row) {
  // Known field names (lowercased) used by the API
  const fiscalYear = toNumber(row.record_fiscal_year ?? row.fiscal_year ?? row.fy)
  let fiscalMonth = toNumber(row.record_fiscal_month ?? row.fiscal_month ?? row.month)
  const recordDate = row.record_date || row.date || null

  // Classification description (e.g., "Total: Receipts", "Total: Outlays")
  const classificationDesc = String(row.classification_desc || row.classification || '').toLowerCase()

  // Monthly receipts/outlays
  // Prefer explicit current_month_* fields; fall back to other likely variants if present
  const lc = Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]))
  const currMonthReceipts = toNumber(
    lc.current_month_gross_rcpt_amt ?? lc.current_month_rcpt_amt ?? lc.curr_month_rcpt_amt ?? lc.mth_rcpt_amt ?? lc.rcpt_amt
  )
  const currMonthOutlays = toNumber(
    lc.current_month_gross_outly_amt ?? lc.current_month_outly_amt ?? lc.curr_month_outly_amt ?? lc.mth_outly_amt ?? lc.outly_amt
  )

  // FYTD receipts/outlays (for "latest" computation convenience)
  const fytdReceipts = toNumber(
    lc.current_fytd_gross_rcpt_amt ?? lc.current_fytd_rcpt_amt ?? lc.fytd_rcpt_amt ?? null
  )
  const fytdOutlays = toNumber(
    lc.current_fytd_gross_outly_amt ?? lc.current_fytd_outly_amt ?? lc.fytd_outly_amt ?? null
  )

  // Fallback: map classification_desc month names to fiscal month number (Oct=1, ... , Sep=12)
  if (!Number.isFinite(fiscalMonth)) {
    const desc = classificationDesc
    const map = {
      'october': 1, 'november': 2, 'december': 3, 'january': 4, 'february': 5, 'march': 6,
      'april': 7, 'may': 8, 'june': 9, 'july': 10, 'august': 11, 'september': 12,
    }
    if (desc in map) fiscalMonth = map[desc]
  }

  return { fiscalYear, fiscalMonth, recordDate, currMonthReceipts, currMonthOutlays, fytdReceipts, fytdOutlays, classificationDesc }
}

async function fetchAllMtsRows() {
  // Request without fields to avoid schema drift errors; page through results
  const pageSize = 10000
  let page = 1
  const rows = []
  // Request only from 1980 onward for consistent coverage
  const base = new URL(API_URL)
  base.searchParams.set('filter', 'record_fiscal_year:gte:1979,record_type_cd:eq:MTH,table_nbr:eq:1')
  base.searchParams.set('sort', 'record_fiscal_year,src_line_nbr')
  base.searchParams.set('page[size]', String(pageSize))

  // Loop pages until no data
  while (true) {
    base.searchParams.set('page[number]', String(page))
    const res = await fetch(base.toString())
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Treasury Fiscal Data API request failed: ${res.status} ${res.statusText} ${text}`)
    }
    const json = await res.json()
    const data = Array.isArray(json.data) ? json.data : []
    rows.push(...data)
    if (data.length < pageSize) break
    page += 1
    if (page > 200) break // safety guard
  }
  return rows
}

function buildAnnualDeficit(rows) {
  // Aggregate monthly receipts/outlays by fiscal year
  const byFy = new Map()
  for (const raw of rows) {
    const r = extractRowFields(raw)
    if (!Number.isFinite(r.fiscalYear) || !Number.isFinite(r.fiscalMonth)) continue
    if (!byFy.has(r.fiscalYear)) byFy.set(r.fiscalYear, { receipts: 0, outlays: 0, months: new Set(), monthly: [] })
    const fy = byFy.get(r.fiscalYear)

    const isTotalReceipts = r.classificationDesc.includes('total') && r.classificationDesc.includes('receipt')
    const isTotalOutlays = r.classificationDesc.includes('total') && r.classificationDesc.includes('outlay')

    // Only aggregate totals rows
    if (isTotalReceipts && Number.isFinite(r.currMonthReceipts)) fy.receipts += r.currMonthReceipts
    if (isTotalOutlays && Number.isFinite(r.currMonthOutlays)) fy.outlays += r.currMonthOutlays

    // Keep per-month entries for FYTD computation (only totals rows)
    if (isTotalReceipts || isTotalOutlays) {
      fy.months.add(r.fiscalMonth)
      fy.monthly.push({
        month: r.fiscalMonth,
        receipts: isTotalReceipts ? (r.currMonthReceipts ?? null) : null,
        outlays: isTotalOutlays ? (r.currMonthOutlays ?? null) : null,
        fytdReceipts: isTotalReceipts ? (r.fytdReceipts ?? null) : null,
        fytdOutlays: isTotalOutlays ? (r.fytdOutlays ?? null) : null,
      })
    }
  }

  // Build annual series (value in USD billions)
  const years = Array.from(byFy.keys()).sort((a, b) => a - b)
  const annual = []
  for (const y of years) {
    const agg = byFy.get(y)
    if (!agg) continue
    // Only include if at least one month present; ideally all 12 months
    const deficitUsd = agg.outlays - agg.receipts
    const valueBillions = round2(deficitUsd / 1e9) // API amounts are in US dollars; convert to billions
    annual.push({ year: y, value: valueBillions })
  }

  // Compute YoY on the deficit level
  const withYoy = []
  for (let i = 0; i < annual.length; i++) {
    const row = { ...annual[i] }
    const prev = i > 0 ? annual[i - 1] : null
    if (prev && typeof prev.value === 'number' && prev.value !== 0) {
      row.yoy = round2(((row.value - prev.value) / prev.value) * 100)
    }
    withYoy.push(row)
  }

  return { withYoy, byFy }
}

function computeLatestFytd(rows, byFy) {
  if (!rows.length) return null
  // Determine latest fiscal year and month present
  const allYears = Array.from(byFy.keys())
  if (allYears.length === 0) return null
  const latestFy = Math.max(...allYears)
  const aggLatest = byFy.get(latestFy)
  if (!aggLatest) return null
  const monthsPresent = aggLatest.monthly.map(m => m.month).filter((m) => Number.isFinite(m))
  if (monthsPresent.length === 0) return null
  const latestMonth = Math.max(...monthsPresent)

  // Sum monthly up to latest month
  let rSum = 0
  let oSum = 0
  for (const m of aggLatest.monthly) {
    if (m.month <= latestMonth) {
      if (Number.isFinite(m.receipts)) rSum += m.receipts
      if (Number.isFinite(m.outlays)) oSum += m.outlays
    }
  }
  const fytdReceipts = rSum
  const fytdOutlays = oSum

  if (!Number.isFinite(fytdReceipts) || !Number.isFinite(fytdOutlays)) return null
  const deficitFytd = fytdOutlays - fytdReceipts
  const valueBillions = round2(deficitFytd / 1e9)

  // Compute YoY vs prior FY same month if possible
  let yoy = null
  const priorAgg = byFy.get(latestFy - 1)
  if (priorAgg) {
    let rSum = 0
    let oSum = 0
    for (const m of priorAgg.monthly) {
      if (m.month <= latestMonth) {
        if (Number.isFinite(m.receipts)) rSum += m.receipts
        if (Number.isFinite(m.outlays)) oSum += m.outlays
      }
    }
    const priorDeficit = oSum - rSum
    const priorValueBillions = priorDeficit / 1e9
    if (priorValueBillions !== 0) {
      yoy = round2(((valueBillions - priorValueBillions) / priorValueBillions) * 100)
    }
  }

  const row = { year: latestFy, value: valueBillions, latest: true, month: latestMonth }
  if (yoy != null) row.yoy = yoy
  return row
}

async function main() {
  const now = new Date()
  console.log('Fetching Federal Budget Deficit (FY) from Treasury Fiscal Data MTS Table 1...')
  const rows = await fetchAllMtsRows()
  const { withYoy, byFy } = buildAnnualDeficit(rows)
  const latest = computeLatestFytd(rows, byFy)

  const data = latest ? [...withYoy, latest] : withYoy

  const coverage = data.length ? { start: data[0].year, end: data[data.length - 1].year } : { start: null, end: null }
  const meta = {
    id: 'deficit',
    title: 'Federal Budget Deficit (Fiscal Year)',
    description: 'Annual deficit computed as outlays minus receipts, aggregated by fiscal year (Oct–Sep). Latest row is current FY to date.',
    units: 'USD (billions) for value, Percent for yoy',
    frequency: 'Annual (FY), plus current FY-to-date latest month',
    coverage,
    fetchedAt: now.toISOString(),
    source: {
      name: 'U.S. Department of the Treasury — Fiscal Data (MTS Table 1)',
      homepage: 'https://fiscaldata.treasury.gov/',
      api: API_URL,
      attribution: 'Public domain',
    },
    notes: 'API amounts are in US dollars; values converted to billions. YoY computed on deficit level. Latest is FYTD vs prior FY same month when available.'
  }

  const out = { meta, data }
  const outDir = path.join(process.cwd(), 'data')
  await mkdir(outDir, { recursive: true })
  await writeFile(path.join(outDir, 'deficit.json'), JSON.stringify(out, null, 2), 'utf8')
  console.log(`Saved ${data.length} rows to data/deficit.json`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})


