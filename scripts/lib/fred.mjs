// Shared helpers for building annual datasets from FRED's keyless CSV endpoint.
//
// Annual convention: a year is "complete" once its final period is published
// (December for monthly series, Q4 for quarterly, the last trading day of
// December for daily). The newest observation in an incomplete year becomes a
// single `latest: true` row so the site can show it without scoring it.

import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

export const round2 = (n) => Number(n.toFixed(2))

export async function fetchFredSeries(seriesId) {
  const res = await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(seriesId)}`)
  if (!res.ok) throw new Error(`FRED ${seriesId} failed: ${res.status} ${res.statusText}`)
  const lines = (await res.text()).trim().split(/\r?\n/)
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const [date, raw] = lines[i].split(',')
    const value = Number(raw)
    if (!date || raw === '.' || raw === '' || !Number.isFinite(value)) continue
    rows.push({ date, year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)), value })
  }
  return rows.sort((a, b) => a.date.localeCompare(b.date))
}

// Pick one value per year.
// - mode 'end': value of the final period (Dec / Q4 / last December trading day)
// - mode 'average': mean of all observations in the year (complete once December exists)
export function toAnnual(rows, { mode = 'end', startYear = 1979, finalMonth = 12 } = {}) {
  const byYear = new Map()
  for (const r of rows) {
    if (r.year < startYear) continue
    if (!byYear.has(r.year)) byYear.set(r.year, [])
    byYear.get(r.year).push(r)
  }

  const data = []
  let latest = null
  for (const [year, obs] of [...byYear.entries()].sort((a, b) => a[0] - b[0])) {
    const last = obs.at(-1)
    const complete = last.month >= finalMonth
    const pick = (key) => (mode === 'average' ? obs.reduce((s, o) => s + o[key], 0) / obs.length : last[key])
    const row = { year, value: round2(pick('value')) }
    // Inflation-adjusted series keep their original dollars alongside the real value.
    if (typeof last.nominal === 'number') row.nominal = round2(pick('nominal'))
    if (complete) data.push(row)
    else latest = { ...row, latest: true, asOf: last.date }
  }
  if (latest) data.push(latest)
  return data
}

// Converts nominal dollars to dollars of the latest CPI-U month (NSA).
// Months without a published CPI yet (e.g. this month's stock closes) use the latest CPI.
export async function fetchCpiDeflator() {
  const cpi = await fetchFredSeries('CPIAUCNS')
  const byMonth = new Map(cpi.map((r) => [r.date.slice(0, 7), r.value]))
  const latest = cpi.at(-1)
  return {
    base: latest.date.slice(0, 7),
    toReal: (date, nominal) => (nominal * latest.value) / (byMonth.get(date.slice(0, 7)) ?? latest.value),
  }
}

export async function writeDataset(fileName, meta, data) {
  const complete = data.filter((d) => !d.latest)
  const out = {
    meta: {
      ...meta,
      coverage: { start: complete[0]?.year ?? null, end: complete.at(-1)?.year ?? null },
      fetchedAt: new Date().toISOString(),
    },
    data,
  }
  const outDir = path.join(process.cwd(), 'data')
  await mkdir(outDir, { recursive: true })
  await writeFile(path.join(outDir, fileName), JSON.stringify(out, null, 2) + '\n', 'utf8')
  const latest = data.find((d) => d.latest)
  console.log(`Wrote data/${fileName}: ${out.meta.coverage.start}-${out.meta.coverage.end}${latest ? ` + latest ${latest.asOf}` : ''}`)
}

export function fredSource(seriesId, attribution) {
  return {
    name: `FRED (${seriesId})`,
    homepage: `https://fred.stlouisfed.org/series/${seriesId}`,
    api: `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}`,
    attribution,
  }
}
