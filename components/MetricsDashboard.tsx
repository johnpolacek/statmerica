"use client"

import { useMemo, useState } from "react"
import MetricCard from "@/components/MetricCard"
import AdministrationSelect from "@/components/AdministrationSelect"
import { administrations, type MetricSummary } from "@/lib/metrics"
import cpi from "@/data/cpi.json"
import incomeGap from "@/data/income_gap.json"
import gas from "@/data/gas_prices.json"
import deficit from "@/data/deficit.json"
import unemployment from "@/data/unemployment.json"
import sp500 from "@/data/sp500.json"
import { CircleCheckBig } from "lucide-react"

type CpiDataPoint = { year: number; value: number; yoy?: number; month?: number; latest?: boolean }
type CpiJson = { meta: { title: string; units: string; description?: string }; data: CpiDataPoint[] }

type AdminSeries = (number | null)[]

type AdminComputed = {
  label: string
  series: AdminSeries
  average: number | null
  party: "D" | "R" | "U"
}

const getParty = (value: string): "D" | "R" | "U" => (administrations.find(a => a.value === value)?.party as any) ?? (value === "party-D" ? "D" : value === "party-R" ? "R" : "U")
const partyText = (p: "D" | "R" | "U") => (p === "R" ? "text-red-600" : p === "D" ? "text-blue-600" : "text-muted-foreground")

const TERM_MAP: Record<string, [number, number]> = {
  "reagan-1": [1981, 1984],
  "reagan-2": [1985, 1988],
  "ghwbush-1": [1989, 1992],
  "clinton-1": [1993, 1996],
  "clinton-2": [1997, 2000],
  "gwbush-1": [2001, 2004],
  "gwbush-2": [2005, 2008],
  "obama-1": [2009, 2012],
  "obama-2": [2013, 2016],
  "trump-1": [2017, 2020],
  "biden-1": [2021, 2024],
  "trump-2": [2025, 2028],
}

const getTermYears = (value: string): number[] => {
  const span = TERM_MAP[value]
  if (!span) return []
  const [start, end] = span
  return [start, start + 1, start + 2, start + 3].filter(y => y <= end)
}

export default function MetricsDashboard() {
  const [adminA, setAdminA] = useState("trump-1")
  const [adminB, setAdminB] = useState("biden-1")

  const cpiJson = cpi as unknown as CpiJson
  const igJson = incomeGap as unknown as { data: { year: number; value: number; yoy?: number }[]; meta: { title?: string; units?: string } }
  const gasJson = gas as unknown as { data: { year: number; value: number; yoy?: number; latest?: boolean }[]; meta: { title?: string; units?: string } }
  const deficitJson = deficit as unknown as { data: { year: number; value: number; yoy?: number; latest?: boolean }[]; meta: { title?: string; units?: string } }
  const unempJson = unemployment as unknown as { data: { year: number; value: number; yoy?: number; latest?: boolean }[]; meta: { title?: string; units?: string } }
  const sp500Json = sp500 as unknown as { data: { year: number; value: number; yoy?: number; latest?: boolean }[]; meta: { title?: string; units?: string } }

  // Build year maps for CPI: yoy (for plotting) and value (raw index for tooltip)
  const cpiYoyByYear = useMemo(() => new Map<number, number>(cpiJson.data.filter(d => typeof d.yoy === 'number').map(d => [d.year, d.yoy as number])), [cpiJson.data])
  const cpiValueByYear = useMemo(() => new Map<number, number>(cpiJson.data.map(d => [d.year, d.value])), [cpiJson.data])

  // Build year maps for Income Gap: yoy (for plotting) and value (ratio raw for tooltip)
  const igYoyByYear = useMemo(() => new Map<number, number>(igJson.data.filter(d => typeof d.yoy === 'number').map(d => [d.year, d.yoy as number])), [igJson.data])
  const igValueByYear = useMemo(() => new Map<number, number>(igJson.data.map(d => [d.year, d.value])), [igJson.data])

  // Build year maps for Gas: yoy (for plotting) and value (USD/gal for tooltip)
  const gasYoyByYear = useMemo(() => new Map<number, number>(gasJson.data.filter(d => typeof d.yoy === 'number').map(d => [d.year, d.yoy as number])), [gasJson.data])
  const gasValueByYear = useMemo(() => new Map<number, number>(gasJson.data.map(d => [d.year, d.value])), [gasJson.data])

  // Build year maps for Deficit: yoy (for plotting) and value (USD billions for tooltip)
  const defYoyByYear = useMemo(() => new Map<number, number>(deficitJson.data.filter(d => typeof d.yoy === 'number').map(d => [d.year, d.yoy as number])), [deficitJson.data])
  const defValueByYear = useMemo(() => new Map<number, number>(deficitJson.data.map(d => [d.year, d.value])), [deficitJson.data])

  // Build year maps for Unemployment: yoy (for plotting) and value (percent for tooltip)
  const unempYoyByYear = useMemo(() => new Map<number, number>(unempJson.data.filter(d => typeof d.yoy === 'number').map(d => [d.year, d.yoy as number])), [unempJson.data])
  const unempValueByYear = useMemo(() => new Map<number, number>(unempJson.data.map(d => [d.year, d.value])), [unempJson.data])

  // Build year maps for S&P 500: yoy and raw index level
  const spYoyByYear = useMemo(() => new Map<number, number>(sp500Json.data.filter(d => typeof d.yoy === 'number').map(d => [d.year, d.yoy as number])), [sp500Json.data])
  const spValueByYear = useMemo(() => new Map<number, number>(sp500Json.data.map(d => [d.year, d.value])), [sp500Json.data])

  const getAdminLabel = (value: string) => {
    if (value === "party-D") return "Democrats"
    if (value === "party-R") return "Republicans"
    return administrations.find(a => a.value === value)?.label ?? value
  }

  const buildSeriesForAdmin = (value: string, yearToValue: Map<number, number>): AdminSeries => {
    if (value === "party-D" || value === "party-R") {
      const targetParty = value === "party-D" ? "D" : "R"
      const terms = administrations.filter(a => (a as any).party === targetParty).map(a => a.value)
      const yearOfTermValues: number[][] = [[], [], [], []]
      for (const term of terms) {
        const years = getTermYears(term)
        years.forEach((y, idx) => {
          const v = yearToValue.get(y)
          if (typeof v === "number") yearOfTermValues[idx].push(v)
        })
      }
      const averaged: AdminSeries = yearOfTermValues.map(arr => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null))
      return averaged
    }
    const years = getTermYears(value)
    return years.map(y => yearToValue.get(y) ?? null)
  }

  // Series for CPI (YoY plotted) and raw index values (tooltip)
  const cpiSeriesA = buildSeriesForAdmin(adminA, cpiYoyByYear)
  const cpiSeriesB = buildSeriesForAdmin(adminB, cpiYoyByYear)
  const cpiRawA = buildSeriesForAdmin(adminA, cpiValueByYear)
  const cpiRawB = buildSeriesForAdmin(adminB, cpiValueByYear)

  // Series for Income Gap (YoY plotted) and raw ratio (tooltip)
  const igSeriesA = buildSeriesForAdmin(adminA, igYoyByYear)
  const igSeriesB = buildSeriesForAdmin(adminB, igYoyByYear)
  const igRawA = buildSeriesForAdmin(adminA, igValueByYear)
  const igRawB = buildSeriesForAdmin(adminB, igValueByYear)

  // Series for Gas (YoY plotted) and raw USD/gal (tooltip)
  const gasSeriesA = buildSeriesForAdmin(adminA, gasYoyByYear)
  const gasSeriesB = buildSeriesForAdmin(adminB, gasYoyByYear)
  const gasRawA = buildSeriesForAdmin(adminA, gasValueByYear)
  const gasRawB = buildSeriesForAdmin(adminB, gasValueByYear)

  // Series for Deficit (YoY plotted) and raw USD billions (tooltip)
  const defSeriesA = buildSeriesForAdmin(adminA, defYoyByYear)
  const defSeriesB = buildSeriesForAdmin(adminB, defYoyByYear)
  const defRawA = buildSeriesForAdmin(adminA, defValueByYear)
  const defRawB = buildSeriesForAdmin(adminB, defValueByYear)

  // Series for Unemployment (YoY plotted) and raw percent (tooltip)
  const unempSeriesA = buildSeriesForAdmin(adminA, unempYoyByYear)
  const unempSeriesB = buildSeriesForAdmin(adminB, unempYoyByYear)
  const unempRawA = buildSeriesForAdmin(adminA, unempValueByYear)
  const unempRawB = buildSeriesForAdmin(adminB, unempValueByYear)

  // Series for S&P 500 (YoY plotted) and raw index level (tooltip)
  const spSeriesA = buildSeriesForAdmin(adminA, spYoyByYear)
  const spSeriesB = buildSeriesForAdmin(adminB, spYoyByYear)
  const spRawA = buildSeriesForAdmin(adminA, spValueByYear)
  const spRawB = buildSeriesForAdmin(adminB, spValueByYear)

  // Helper to compute 4-year percent change from raw series (start -> end)
  const fourYearChange = (series: AdminSeries): number | null => {
    const start = series.find(v => v != null) as number | undefined
    const end = [...series].reverse().find(v => v != null) as number | undefined
    if (start == null || end == null || start === 0) return null
    return ((end - start) / start) * 100
  }

  // Helper to compute range change using the year BEFORE the first term year as baseline.
  // If the selection is a party aggregate, fall back to simple start->end change.
  const rangeChangeWithBaseline = (
    adminValue: string,
    rawSeriesForAdmin: AdminSeries,
    yearToRawMap: Map<number, number>
  ): number | null => {
    if (adminValue === "party-D" || adminValue === "party-R") {
      return fourYearChange(rawSeriesForAdmin)
    }
    const years = getTermYears(adminValue)
    if (!years.length) return null
    const firstIdx = rawSeriesForAdmin.findIndex(v => v != null)
    if (firstIdx === -1) return null
    const earliestYearWithData = years[firstIdx]
    const baselineYear = earliestYearWithData - 1
    const baseline = yearToRawMap.get(baselineYear)
    const lastIdxRev = [...rawSeriesForAdmin].reverse().findIndex(v => v != null)
    if (lastIdxRev === -1) return null
    const lastIdx = rawSeriesForAdmin.length - 1 - lastIdxRev
    const endYear = years[lastIdx]
    const end = yearToRawMap.get(endYear)
    if (baseline == null || end == null || baseline === 0) return null
    return ((end - baseline) / baseline) * 100
  }

  const formatPct = (v: number | null) => (v == null ? "–" : `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`)

  // Compute 4-year change labels for each metric using raw values
  const cpiChangeA = rangeChangeWithBaseline(adminA, cpiRawA, cpiValueByYear)
  const cpiChangeB = rangeChangeWithBaseline(adminB, cpiRawB, cpiValueByYear)
  const igChangeA = rangeChangeWithBaseline(adminA, igRawA, igValueByYear)
  const igChangeB = rangeChangeWithBaseline(adminB, igRawB, igValueByYear)
  const gasChangeA = rangeChangeWithBaseline(adminA, gasRawA, gasValueByYear)
  const gasChangeB = rangeChangeWithBaseline(adminB, gasRawB, gasValueByYear)
  const defChangeA = rangeChangeWithBaseline(adminA, defRawA, defValueByYear)
  const defChangeB = rangeChangeWithBaseline(adminB, defRawB, defValueByYear)
  const unempChangeA = rangeChangeWithBaseline(adminA, unempRawA, unempValueByYear)
  const unempChangeB = rangeChangeWithBaseline(adminB, unempRawB, unempValueByYear)
  const spChangeA = rangeChangeWithBaseline(adminA, spRawA, spValueByYear)
  const spChangeB = rangeChangeWithBaseline(adminB, spRawB, spValueByYear)

  const avg = (series: AdminSeries) => {
    const values = series.filter((v): v is number => v != null)
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
  }

  const adminAComputed: AdminComputed = {
    label: getAdminLabel(adminA),
    series: cpiSeriesA,
    average: avg(cpiSeriesA),
    party: getParty(adminA),
  }

  const adminBComputed: AdminComputed = {
    label: getAdminLabel(adminB),
    series: cpiSeriesB,
    average: avg(cpiSeriesB),
    party: getParty(adminB),
  }

  const stripYears = (label: string) => label.replace(/\s*\([^)]*\)\s*$/, "")
  const adminAName = stripYears(adminAComputed.label)
  const adminBName = stripYears(adminBComputed.label)

  const termLabelsCpi = ["1st Year", "2nd Year", "3rd Year", "4th Year"]
  const cpiChartData = termLabelsCpi.map((label, i) => ({
    year: label,
    adminA: cpiSeriesA[i] ?? null,
    adminB: cpiSeriesB[i] ?? null,
    adminAValue: cpiRawA[i] ?? null,
    adminBValue: cpiRawB[i] ?? null,
  }))

  // For CPI level over term, lower 4-year change is better
  const adminAWinsCpi = cpiChangeA != null && cpiChangeB != null && cpiChangeA < cpiChangeB ? 1 : 0
  const adminBWinsCpi = cpiChangeA != null && cpiChangeB != null && cpiChangeB < cpiChangeA ? 1 : 0

  const latestYear = Math.max(...cpiJson.data.map(d => d.year))
  const latestCpiYoy = cpiJson.data.find(d => d.year === latestYear)?.yoy ?? 0
  const yoyLabel = `${(latestCpiYoy as number) >= 0 ? "+" : ""}${(latestCpiYoy as number).toFixed(2)}%`
  const trend: MetricSummary["trend"] = Math.abs(latestCpiYoy as number) < 1 ? "stable" : (latestCpiYoy as number) > 0 ? "up" : "down"

  // Latest raw values for collapsed summaries
  const latestCpiRaw = cpiValueByYear.get(latestYear) ?? null
  const latestSpRaw = (() => {
    const years = sp500Json.data.map(d => d.year)
    const maxYear = years.length ? Math.max(...years) : null
    return maxYear != null ? spValueByYear.get(maxYear) ?? null : null
  })()
  const latestIgRaw = (() => {
    const years = igJson.data.map(d => d.year)
    const maxYear = years.length ? Math.max(...years) : null
    return maxYear != null ? igValueByYear.get(maxYear) ?? null : null
  })()
  const latestGasRaw = (() => {
    const years = gasJson.data.map(d => d.year)
    const maxYear = years.length ? Math.max(...years) : null
    return maxYear != null ? gasValueByYear.get(maxYear) ?? null : null
  })()
  const latestDefRaw = (() => {
    const years = deficitJson.data.map(d => d.year)
    const maxYear = years.length ? Math.max(...years) : null
    return maxYear != null ? defValueByYear.get(maxYear) ?? null : null
  })()
  const latestUnempRaw = (() => {
    const years = unempJson.data.map(d => d.year)
    const maxYear = years.length ? Math.max(...years) : null
    return maxYear != null ? unempValueByYear.get(maxYear) ?? null : null
  })()

  const formatNumber = (v: number | null, digits = 1) => (v == null ? "–" : v.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits }))
  const formatCurrency = (v: number | null, digits = 2) => (v == null ? "–" : `$${v.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits })}`)
  const formatInteger = (v: number | null) => (v == null ? "–" : v.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 }))
  const formatPercentRaw = (v: number | null, digits = 1) => (v == null ? "–" : `${v.toFixed(digits)}%`)
  const formatUsdBillionsCompact = (v: number | null): string => {
    if (v == null || !Number.isFinite(v as number)) return "–"
    const num = v as number // value is already in billions
    if (Math.abs(num) >= 1000) {
      return `${(num / 1000).toFixed(1)}Tn`
    }
    return `${num.toFixed(1)}Bn`
  }

  // Income Gap YoY current value and trend
  const latestIgYear = Math.max(...igJson.data.map(d => d.year))
  const latestIg = igJson.data.find(d => d.year === latestIgYear)?.yoy ?? 0
  const igTrend: MetricSummary["trend"] = Math.abs(latestIg as number) < 1 ? "stable" : (latestIg as number) > 0 ? "up" : "down"

  // Gas YoY current value and trend
  const latestGasYearWithYoy = Math.max(...gasJson.data.filter(d => typeof d.yoy === 'number').map(d => d.year))
  const latestGas = gasJson.data.find(d => d.year === latestGasYearWithYoy)?.yoy ?? 0
  const gasTrend: MetricSummary["trend"] = Math.abs(latestGas as number) < 1 ? "stable" : (latestGas as number) > 0 ? "up" : "down"

  // Deficit YoY current value and trend
  const latestDefYearWithYoy = Math.max(...deficitJson.data.filter(d => typeof d.yoy === 'number').map(d => d.year))
  const latestDef = deficitJson.data.find(d => d.year === latestDefYearWithYoy)?.yoy ?? 0
  const defTrend: MetricSummary["trend"] = Math.abs(latestDef as number) < 1 ? "stable" : (latestDef as number) > 0 ? "up" : "down"

  // Unemployment YoY current value and trend
  const latestUnempYearWithYoy = Math.max(...unempJson.data.filter(d => typeof d.yoy === 'number').map(d => d.year))
  const latestUnemp = unempJson.data.find(d => d.year === latestUnempYearWithYoy)?.yoy ?? 0
  const unempTrend: MetricSummary["trend"] = Math.abs(latestUnemp as number) < 1 ? "stable" : (latestUnemp as number) > 0 ? "up" : "down"

  // S&P 500 YoY current value and trend (latest available yoy row)
  const spYoyYears = sp500Json.data.filter(d => typeof d.yoy === 'number').map(d => d.year)
  const latestSpYearWithYoy = spYoyYears.length ? Math.max(...spYoyYears) : null
  const latestSp = latestSpYearWithYoy != null ? (sp500Json.data.find(d => d.year === latestSpYearWithYoy)?.yoy ?? 0) : 0
  const spTrend: MetricSummary["trend"] = Math.abs(latestSp as number) < 1 ? "stable" : (latestSp as number) > 0 ? "up" : "down"

  // Determine wins for Income Gap and Gas (lower 4-year change is better)
  const adminAWinsIg = igChangeA != null && igChangeB != null && igChangeA < igChangeB ? 1 : 0
  const adminBWinsIg = igChangeA != null && igChangeB != null && igChangeB < igChangeA ? 1 : 0
  const adminAWinsGas = gasChangeA != null && gasChangeB != null && gasChangeA < gasChangeB ? 1 : 0
  const adminBWinsGas = gasChangeA != null && gasChangeB != null && gasChangeB < gasChangeA ? 1 : 0

  const adminAWinsDef = defChangeA != null && defChangeB != null && defChangeA < defChangeB ? 1 : 0
  const adminBWinsDef = defChangeA != null && defChangeB != null && defChangeB < defChangeA ? 1 : 0
  // For Unemployment, lower 4-year change is better (lower rate)
  const adminAWinsUnemp = unempChangeA != null && unempChangeB != null && unempChangeA < unempChangeB ? 1 : 0
  const adminBWinsUnemp = unempChangeA != null && unempChangeB != null && unempChangeB < unempChangeA ? 1 : 0

  // For S&P 500, higher 4-year change is better
  const adminAWinsSp = spChangeA != null && spChangeB != null && spChangeA > spChangeB ? 1 : 0
  const adminBWinsSp = spChangeA != null && spChangeB != null && spChangeB > spChangeA ? 1 : 0

  const adminAWinsTotal = adminAWinsCpi + adminAWinsIg + adminAWinsGas + adminAWinsDef + adminAWinsUnemp + adminAWinsSp
  const adminBWinsTotal = adminBWinsCpi + adminBWinsIg + adminBWinsGas + adminBWinsDef + adminBWinsUnemp + adminBWinsSp

  const adminAMetricsList: string[] = []
  const adminBMetricsList: string[] = []
  if (adminAWinsCpi) adminAMetricsList.push("Inflation (CPI YoY)")
  if (adminBWinsCpi) adminBMetricsList.push("Inflation (CPI YoY)")
  if (adminAWinsIg) adminAMetricsList.push("Income Gap YoY")
  if (adminBWinsIg) adminBMetricsList.push("Income Gap YoY")
  if (adminAWinsGas) adminAMetricsList.push("Gas Prices YoY")
  if (adminBWinsGas) adminBMetricsList.push("Gas Prices YoY")
  if (adminAWinsDef) adminAMetricsList.push("Deficit YoY")
  if (adminBWinsDef) adminBMetricsList.push("Deficit YoY")
  if (adminAWinsUnemp) adminAMetricsList.push("Unemployment YoY")
  if (adminBWinsUnemp) adminBMetricsList.push("Unemployment YoY")
  const spTitleShort = ((sp500Json.meta as any)?.title || "Stock Index").replace(/ Index$/, "")
  if (adminAWinsSp) adminAMetricsList.push(`${spTitleShort} YoY`)
  if (adminBWinsSp) adminBMetricsList.push(`${spTitleShort} YoY`)

  // Sort Final Scorecard metrics by character count (descending)
  adminAMetricsList.sort((a, b) => b.length - a.length)
  adminBMetricsList.sort((a, b) => b.length - a.length)

  // Build card configs to render within metrics.map
  const termLabels = ["1st Year", "2nd Year", "3rd Year", "4th Year"]
  const igChartData = termLabels.map((label, i) => ({ year: label, adminA: igSeriesA[i] ?? null, adminB: igSeriesB[i] ?? null, adminAValue: igRawA[i] ?? null, adminBValue: igRawB[i] ?? null }))
  const gasChartData = termLabels.map((label, i) => ({ year: label, adminA: gasSeriesA[i] ?? null, adminB: gasSeriesB[i] ?? null, adminAValue: gasRawA[i] ?? null, adminBValue: gasRawB[i] ?? null }))
  const defChartData = termLabels.map((label, i) => ({ year: label, adminA: defSeriesA[i] ?? null, adminB: defSeriesB[i] ?? null, adminAValue: defRawA[i] ?? null, adminBValue: defRawB[i] ?? null }))
  const unempChartData = termLabels.map((label, i) => ({ year: label, adminA: unempSeriesA[i] ?? null, adminB: unempSeriesB[i] ?? null, adminAValue: unempRawA[i] ?? null, adminBValue: unempRawB[i] ?? null }))
  const spChartData = termLabels.map((label, i) => ({ year: label, adminA: spSeriesA[i] ?? null, adminB: spSeriesB[i] ?? null, adminAValue: spRawA[i] ?? null, adminBValue: spRawB[i] ?? null }))

  const cards = [
    {
      title: "Inflation Rate",
      value: yoyLabel,
      trend,
      change: `4yr ${formatPct(cpiChangeA)} vs ${formatPct(cpiChangeB)}`,
      summaryRaw: formatNumber(latestCpiRaw, 1),
      collapsedRawA: formatNumber(([...cpiRawA].reverse().find(v => v != null) as number | null) ?? null, 1),
      collapsedRawB: formatNumber(([...cpiRawB].reverse().find(v => v != null) as number | null) ?? null, 1),
      collapsedYoyA: formatPct(cpiChangeA),
      collapsedYoyB: formatPct(cpiChangeB),
      chartData: cpiChartData,
      adminAStart: cpiRawA.find(v => v != null) ?? null,
      adminAEnd: [...cpiRawA].reverse().find(v => v != null) ?? null,
      adminBStart: cpiRawB.find(v => v != null) ?? null,
      adminBEnd: [...cpiRawB].reverse().find(v => v != null) ?? null,
      adminAValueLabel: formatPct(cpiChangeA),
      adminBValueLabel: formatPct(cpiChangeB),
      methodBadge: "CPI YoY",
      valueLabel: "Index",
      winnerSide: adminAWinsCpi ? "A" : adminBWinsCpi ? "B" : "none",
      explanation:
        "The Consumer Price Index (CPI) tracks price changes in a typical basket of goods and services change over time. High CPI growth means prices are rising faster, eroding wages and savings. Lower CPI growth is better and indicates easing inflation and improved affordability.",
      dataSource: "U.S. Bureau of Labor Statistics",
      dataSourceUrl: "/data-sources#cpi",
    },
    {
      title: (sp500Json.meta as any)?.title || "Stock Index",
      value: `${latestSp >= 0 ? "+" : ""}${(latestSp as number).toFixed(2)}%`,
      trend: spTrend,
      change: `4yr ${formatPct(spChangeA)} vs ${formatPct(spChangeB)}`,
      summaryRaw: formatInteger(latestSpRaw),
      collapsedRawA: formatInteger((([...spRawA].reverse().find(v => v != null) as number | null) ?? null)),
      collapsedRawB: formatInteger((([...spRawB].reverse().find(v => v != null) as number | null) ?? null)),
      collapsedYoyA: formatPct(spChangeA),
      collapsedYoyB: formatPct(spChangeB),
      chartData: spChartData,
      adminAStart: spRawA.find(v => v != null) ?? null,
      adminAEnd: [...spRawA].reverse().find(v => v != null) ?? null,
      adminBStart: spRawB.find(v => v != null) ?? null,
      adminBEnd: [...spRawB].reverse().find(v => v != null) ?? null,
      adminAValueLabel: formatPct(spChangeA),
      adminBValueLabel: formatPct(spChangeB),
      methodBadge: `${((sp500Json.meta as any)?.title || 'Stock Index')} YoY`,
      valueLabel: "Index",
      winnerSide: adminAWinsSp ? "A" : adminBWinsSp ? "B" : "none",
      explanation: "YoY percent change in the stock index. Higher growth is better.",
      dataSource: "FRED",
      dataSourceUrl: "/data-sources#nasdaq",
    },
    {
      title: "Weath Gap",
      value: `${latestIg >= 0 ? "+" : ""}${(latestIg as number).toFixed(2)}%`,
      trend: igTrend,
      change: `4yr ${formatPct(igChangeA)} vs ${formatPct(igChangeB)}`,
      summaryRaw: formatNumber(latestIgRaw, 2),
      collapsedRawA: formatNumber((([...igRawA].reverse().find(v => v != null) as number | null) ?? null), 2),
      collapsedRawB: formatNumber((([...igRawB].reverse().find(v => v != null) as number | null) ?? null), 2),
      collapsedYoyA: formatPct(igChangeA),
      collapsedYoyB: formatPct(igChangeB),
      chartData: igChartData,
      adminAStart: igRawA.find(v => v != null) ?? null,
      adminAEnd: [...igRawA].reverse().find(v => v != null) ?? null,
      adminBStart: igRawB.find(v => v != null) ?? null,
      adminBEnd: [...igRawB].reverse().find(v => v != null) ?? null,
      adminAValueLabel: formatPct(igChangeA),
      adminBValueLabel: formatPct(igChangeB),
      methodBadge: "Income Gap YoY",
      valueLabel: "Ratio",
      winnerSide: adminAWinsIg ? "A" : adminBWinsIg ? "B" : "none",
      explanation: "YoY percent change in income gap (P90/P50 ratio). Measures how fast the 90th percentile income grows relative to the median income. 2024-2025 extrapolated using last 3 years growth.",
      dataSource: "World Inequality Database",
      dataSourceUrl: "/data-sources#income-gap",
    },
    {
      title: "Gas Prices",
      value: `${latestGas >= 0 ? "+" : ""}${(latestGas as number).toFixed(2)}%`,
      trend: gasTrend,
      change: `4yr ${formatPct(gasChangeA)} vs ${formatPct(gasChangeB)}`,
      summaryRaw: formatCurrency(latestGasRaw, 2),
      collapsedRawA: formatCurrency((([...gasRawA].reverse().find(v => v != null) as number | null) ?? null), 2),
      collapsedRawB: formatCurrency((([...gasRawB].reverse().find(v => v != null) as number | null) ?? null), 2),
      collapsedYoyA: formatPct(gasChangeA),
      collapsedYoyB: formatPct(gasChangeB),
      chartData: gasChartData,
      adminAStart: gasRawA.find(v => v != null) ?? null,
      adminAEnd: [...gasRawA].reverse().find(v => v != null) ?? null,
      adminBStart: gasRawB.find(v => v != null) ?? null,
      adminBEnd: [...gasRawB].reverse().find(v => v != null) ?? null,
      adminAValueLabel: formatPct(gasChangeA),
      adminBValueLabel: formatPct(gasChangeB),
      methodBadge: "Gas YoY",
      valueLabel: "USD/gal",
      winnerSide: adminAWinsGas ? "A" : adminBWinsGas ? "B" : "none",
      explanation: "YoY percent change in average retail price of regular gasoline. Lower YoY is better as it indicates slower price increases.",
      dataSource: "U.S. Energy Information Administration",
      dataSourceUrl: "/data-sources#gas",
    },
    {
      title: "Federal Deficit",
      value: `${latestDef >= 0 ? "+" : ""}${(latestDef as number).toFixed(2)}%`,
      trend: defTrend,
      change: `4yr ${formatPct(defChangeA)} vs ${formatPct(defChangeB)}`,
      summaryRaw: `$${formatUsdBillionsCompact(latestDefRaw)}`,
      collapsedRawA: `$${formatUsdBillionsCompact((([...defRawA].reverse().find(v => v != null) as number | null) ?? null))}`,
      collapsedRawB: `$${formatUsdBillionsCompact((([...defRawB].reverse().find(v => v != null) as number | null) ?? null))}`,
      collapsedYoyA: formatPct(defChangeA),
      collapsedYoyB: formatPct(defChangeB),
      chartData: defChartData,
      adminAStart: defRawA.find(v => v != null) ?? null,
      adminAEnd: [...defRawA].reverse().find(v => v != null) ?? null,
      adminBStart: defRawB.find(v => v != null) ?? null,
      adminBEnd: [...defRawB].reverse().find(v => v != null) ?? null,
      adminAValueLabel: formatPct(defChangeA),
      adminBValueLabel: formatPct(defChangeB),
      methodBadge: "Deficit YoY",
      valueLabel: "USD",
      winnerSide: adminAWinsDef ? "A" : adminBWinsDef ? "B" : "none",
      explanation: "YoY percent change in the federal budget deficit (outlays minus receipts). Lower is better.",
      dataSource: "U.S. Department of the Treasury — Fiscal Data",
      dataSourceUrl: "/data-sources#deficit",
    },
    {
      title: "Unemployment",
      value: `${latestUnemp >= 0 ? "+" : ""}${(latestUnemp as number).toFixed(2)}%`,
      trend: unempTrend,
      change: `4yr ${formatPct(unempChangeA)} vs ${formatPct(unempChangeB)}`,
      summaryRaw: formatPercentRaw(latestUnempRaw, 1),
      collapsedRawA: formatPercentRaw((([...unempRawA].reverse().find(v => v != null) as number | null) ?? null), 1),
      collapsedRawB: formatPercentRaw((([...unempRawB].reverse().find(v => v != null) as number | null) ?? null), 1),
      collapsedYoyA: formatPct(unempChangeA),
      collapsedYoyB: formatPct(unempChangeB),
      chartData: unempChartData,
      adminAStart: unempRawA.find(v => v != null) ?? null,
      adminAEnd: [...unempRawA].reverse().find(v => v != null) ?? null,
      adminBStart: unempRawB.find(v => v != null) ?? null,
      adminBEnd: [...unempRawB].reverse().find(v => v != null) ?? null,
      adminAValueLabel: formatPct(unempChangeA),
      adminBValueLabel: formatPct(unempChangeB),
      methodBadge: "Unemployment YoY",
      valueLabel: "Percent",
      winnerSide: adminAWinsUnemp ? "A" : adminBWinsUnemp ? "B" : "none",
      explanation: "YoY percent change in the unemployment rate (U-3, seasonally adjusted). Lower is better.",
      dataSource: "U.S. Bureau of Labor Statistics (CPS)",
      dataSourceUrl: "/data-sources#unemployment",
    },
  ]

  return (
    <section className="w-full pt-90 sm:pt-72 lg:pt-0">
      <div className="w-full">
        <div className="bg-gradient-to-br from-background/90 via-background/90 to-background/50">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 max-w-6xl mx-auto py-6">
            <AdministrationSelect value={adminA} onChange={setAdminA} />
            <span className="text-sm text-muted-foreground">vs</span>
            <AdministrationSelect value={adminB} onChange={setAdminB} />
          </div>
        </div>
        <div>
          {cards.map((metric, index) => (
            <div key={index}>
              <div className="border-y border-dashed border-foreground/20 bg-gradient-to-t from-background/70 to-transparent">
                <div className="max-w-6xl mx-auto border-x border-dashed border-foreground/20 relative z-50">
                  <MetricCard
                    title={metric.title}
                    value={metric.value}
                    trend={metric.trend}
                    change={metric.change}
                    summaryRaw={(metric as any).summaryRaw}
                    defaultCollapsed
                    collapsedRawA={(metric as any).collapsedRawA}
                    collapsedRawB={(metric as any).collapsedRawB}
                    collapsedYoyA={(metric as any).collapsedYoyA}
                    collapsedYoyB={(metric as any).collapsedYoyB}
                    adminALabel={adminAComputed.label}
                    adminBLabel={adminBComputed.label}
                    chartDataOverride={metric.chartData as any}
                    adminTrendsOverride={{ adminA: { trend: metric.trend, change: metric.adminAValueLabel }, adminB: { trend: metric.trend, change: metric.adminBValueLabel } }}
                    adminRangesOverride={{
                      adminAStart: metric.adminAStart,
                      adminAEnd: metric.adminAEnd,
                      adminBStart: metric.adminBStart,
                      adminBEnd: metric.adminBEnd,
                    }}
                    winnerSide={(metric as any).winnerSide ?? (adminAWinsTotal > adminBWinsTotal ? "A" : adminBWinsTotal > adminAWinsTotal ? "B" : "none")}
                    isPercent
                    adminAValueLabel={metric.adminAValueLabel}
                    adminBValueLabel={metric.adminBValueLabel}
                    partyA={adminAComputed.party}
                    partyB={adminBComputed.party}
                    explanation={metric.explanation}
                    methodBadge={metric.methodBadge}
                    dataSource={metric.dataSource}
                    dataSourceUrl={metric.dataSourceUrl}
                    valueLabel={(metric as any).valueLabel}
                  />
                </div>
              </div>
              {index !== cards.length - 1 && (
                <div className="w-full max-w-6xl h-6 mx-auto border-x border-dashed border-foreground/20 bg-gradient-to-tl from-background/50 via-transparent to-background/50"></div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 border-y border-dashed border-foreground/20">
          <div className="max-w-4xl mx-auto border-x border-dashed border-foreground/20 py-4 bg-background">
            <div className="text-center border-b border-dashed border-foreground/20 pb-4">
              <div className="text-lg font-mono">Final Scorecard</div>
            </div>
            <div className="text-center">
              <div className="grid grid-cols-2">
                <div className="border-r border-dashed border-foreground/20 p-8">
                  <div className={`text-3xl font-bold ${partyText(adminAComputed.party)}`}>{adminAName}</div>
                  <div className="text-center py-2 space-y-1">
                    {adminAMetricsList.map((metric, index) => (
                      <div key={index} className="w-full flex items-center justify-center gap-2 font-bold"><CircleCheckBig className={partyText(adminAComputed.party)} /> {metric}</div>
                    ))}
                  </div>
                </div>
                <div className="p-8">
                  <div className={`text-3xl font-bold ${partyText(adminBComputed.party)}`}>{adminBName}</div>
                  <div className="text-center py-2 space-y-1">
                    {adminBMetricsList.map((metric, index) => (
                      <div key={index} className="w-full flex items-center justify-center gap-2 font-bold"><CircleCheckBig className={partyText(adminBComputed.party)} /> {metric}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
