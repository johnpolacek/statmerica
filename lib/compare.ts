import { METRICS, type ChangeKind, type MetricDef } from "@/lib/metrics"
import { getSelection, termsForParty, type Party, type Selection, type Term } from "@/lib/terms"

export const TERM_YEARS = 4

export type TermPoint = {
  label: string
  year: number | null
  // Level at the end of this term year. Always null for party aggregates,
  // since averaging levels from different decades is meaningless.
  level: number | null
  // Original dollars for inflation-adjusted metrics.
  nominal?: number | null
  // Change from the prior year's level, in the metric's change kind.
  change: number | null
  // Set when the point is an in-progress year, e.g. "Aug 2026".
  partial?: string
}

export type SideResult = {
  id: string
  name: string
  label: string
  party: Party
  isParty: boolean
  points: TermPoint[]
  // Leading term years with complete data. Only these are scored.
  completeYears: number
  // Level at the end of the year before the term began (terms only).
  baseline: number | null
  // Level at the end of the comparison window (terms only).
  windowEnd: number | null
  windowChange: number | null
  // Party aggregates: number of terms averaged into windowChange.
  memberCount?: number
}

export type Winner = "A" | "B" | "tie" | "none"

export type Comparison = {
  metric: MetricDef
  a: SideResult
  b: SideResult
  // Number of complete term years both sides are measured over.
  window: number
  winner: Winner
}

export type Scorecard = {
  a: { name: string; party: Party; wins: string[] }
  b: { name: string; party: Party; wins: string[] }
  ties: string[]
  skipped: string[]
}

export function changeBetween(from: number | null, to: number | null, kind: ChangeKind): number | null {
  if (from == null || to == null) return null
  if (kind === "diff") return to - from
  if (from === 0) return null
  return ((to - from) / Math.abs(from)) * 100
}

type RowIndex = {
  complete: Map<number, number>
  nominal: Map<number, number>
  latest: { year: number; value: number; nominal?: number; asOf?: string } | null
}

const indexCache = new WeakMap<MetricDef, RowIndex>()

function indexRows(metric: MetricDef) {
  let idx = indexCache.get(metric)
  if (!idx) {
    const complete = new Map<number, number>()
    const nominal = new Map<number, number>()
    let latest: RowIndex["latest"] = null
    for (const r of metric.rows) {
      if (r.latest) latest = { year: r.year, value: r.value, nominal: r.nominal, asOf: r.asOf }
      else {
        complete.set(r.year, r.value)
        if (typeof r.nominal === "number") nominal.set(r.year, r.nominal)
      }
    }
    idx = { complete, nominal, latest }
    indexCache.set(metric, idx)
  }
  return idx
}

export function formatAsOf(metric: MetricDef, asOf: string | undefined, year: number): string {
  if (!asOf) return `${year} so far`
  const [y, m, d] = asOf.split("-").map(Number)
  const month = new Date(Date.UTC(y, m - 1, d || 1)).toLocaleString("en-US", { month: "short", timeZone: "UTC" })
  switch (metric.latestPeriod) {
    case "quarter":
      return `Q${Math.floor((m - 1) / 3) + 1} ${y}`
    case "day":
      return `${month} ${d}, ${y}`
    case "ytd-average":
      return `Jan–${month} ${y} avg`
    default:
      return `${month} ${y}`
  }
}

function termSeries(metric: MetricDef, term: Term) {
  const { complete, nominal, latest } = indexRows(metric)
  const baseline = complete.get(term.start - 1) ?? null
  const points: TermPoint[] = []
  let completeYears = 0
  let counting = baseline != null

  for (let i = 0; i < TERM_YEARS; i++) {
    const year = term.start + i
    let level = complete.get(year) ?? null
    let nominalLevel = nominal.get(year) ?? null
    let partial: string | undefined
    if (level == null && latest && latest.year === year) {
      level = latest.value
      nominalLevel = latest.nominal ?? null
      partial = formatAsOf(metric, latest.asOf, year)
    }
    const prev = i === 0 ? baseline : points[i - 1].level
    points.push({ label: `Year ${i + 1}`, year, level, nominal: nominalLevel, change: changeBetween(prev, level, metric.changeKind), partial })
    if (counting && complete.has(year)) completeYears++
    else counting = false
  }

  const windowChangeFor = (n: number) => (n > 0 && completeYears >= n ? changeBetween(baseline, complete.get(term.start + n - 1) ?? null, metric.changeKind) : null)
  const windowEndFor = (n: number) => (n > 0 && completeYears >= n ? complete.get(term.start + n - 1) ?? null : null)
  return { points, completeYears, baseline, windowChangeFor, windowEndFor }
}

const mean = (values: number[]) => (values.length ? values.reduce((s, v) => s + v, 0) / values.length : null)

function buildSide(metric: MetricDef, sel: Selection) {
  if (sel.kind === "term") {
    const s = termSeries(metric, sel)
    return {
      completeYears: s.completeYears,
      finish: (n: number): SideResult => ({
        id: sel.id,
        name: sel.name,
        label: sel.label,
        party: sel.party,
        isParty: false,
        points: s.points,
        completeYears: s.completeYears,
        baseline: s.baseline,
        windowEnd: s.windowEndFor(n),
        windowChange: s.windowChangeFor(n),
      }),
    }
  }

  const members = termsForParty(sel.party).map((t) => termSeries(metric, t))
  const completeYears = Math.max(0, ...members.map((m) => m.completeYears))
  const points: TermPoint[] = Array.from({ length: TERM_YEARS }, (_, i) => ({
    label: `Year ${i + 1}`,
    year: null,
    level: null,
    change: mean(members.flatMap((m) => (m.points[i].change != null && !m.points[i].partial ? [m.points[i].change as number] : []))),
  }))

  return {
    completeYears,
    finish: (n: number): SideResult => {
      const changes = members.flatMap((m) => {
        const c = m.windowChangeFor(n)
        return c == null ? [] : [c]
      })
      return {
        id: sel.id,
        name: sel.name,
        label: sel.name,
        party: sel.party,
        isParty: true,
        points,
        completeYears,
        baseline: null,
        windowEnd: null,
        windowChange: mean(changes),
        memberCount: changes.length,
      }
    },
  }
}

export function compareMetric(metric: MetricDef, a: Selection, b: Selection): Comparison {
  const sideA = buildSide(metric, a)
  const sideB = buildSide(metric, b)
  const window = Math.min(sideA.completeYears, sideB.completeYears, TERM_YEARS)
  const resA = sideA.finish(window)
  const resB = sideB.finish(window)

  let winner: Winner = "none"
  if (resA.windowChange != null && resB.windowChange != null) {
    const ra = Math.round(resA.windowChange * 100)
    const rb = Math.round(resB.windowChange * 100)
    if (ra === rb) winner = "tie"
    else if (metric.better === "higher") winner = ra > rb ? "A" : "B"
    else winner = ra < rb ? "A" : "B"
  }

  return { metric, a: resA, b: resB, window, winner }
}

export function compareAll(aId: string, bId: string): { a: Selection; b: Selection; comparisons: Comparison[]; scorecard: Scorecard } | null {
  const a = getSelection(aId)
  const b = getSelection(bId)
  if (!a || !b) return null
  const comparisons = METRICS.map((m) => compareMetric(m, a, b))
  const scorecard: Scorecard = {
    a: { name: a.name, party: a.party, wins: [] },
    b: { name: b.name, party: b.party, wins: [] },
    ties: [],
    skipped: [],
  }
  for (const c of comparisons) {
    if (c.winner === "A") scorecard.a.wins.push(c.metric.title)
    else if (c.winner === "B") scorecard.b.wins.push(c.metric.title)
    else if (c.winner === "tie") scorecard.ties.push(c.metric.title)
    else scorecard.skipped.push(c.metric.title)
  }
  return { a, b, comparisons, scorecard }
}

export function formatChange(metric: MetricDef, v: number | null, digits = 1): string {
  if (v == null || !Number.isFinite(v)) return "–"
  const sign = v > 0 ? "+" : v < 0 ? "-" : ""
  const abs = Math.abs(v).toFixed(digits)
  return metric.changeKind === "pct" ? `${sign}${abs}%` : `${sign}${abs} ${metric.diffUnit ?? ""}`.trim()
}

export function windowLabel(window: number): string {
  if (window === 0) return "No comparable data yet"
  if (window === TERM_YEARS) return "Full term"
  return window === 1 ? "First year only" : `First ${window} years only`
}
