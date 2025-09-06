"use client"

import { useMemo, useState } from "react"
import MetricCard from "@/components/MetricCard"
import AdministrationSelect from "@/components/AdministrationSelect"
import { administrations, type MetricSummary } from "@/lib/metrics"
import cpi from "@/data/cpi.json"
import incomeGap from "@/data/income_gap.json"
import gas from "@/data/gas_prices.json"
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

  // Build year maps for CPI: yoy (for plotting) and value (raw index for tooltip)
  const cpiYoyByYear = useMemo(() => new Map<number, number>(cpiJson.data.filter(d => typeof d.yoy === 'number').map(d => [d.year, d.yoy as number])), [cpiJson.data])
  const cpiValueByYear = useMemo(() => new Map<number, number>(cpiJson.data.map(d => [d.year, d.value])), [cpiJson.data])

  // Build year maps for Income Gap: yoy (for plotting) and value (ratio raw for tooltip)
  const igYoyByYear = useMemo(() => new Map<number, number>(igJson.data.filter(d => typeof d.yoy === 'number').map(d => [d.year, d.yoy as number])), [igJson.data])
  const igValueByYear = useMemo(() => new Map<number, number>(igJson.data.map(d => [d.year, d.value])), [igJson.data])

  // Build year maps for Gas: yoy (for plotting) and value (USD/gal for tooltip)
  const gasYoyByYear = useMemo(() => new Map<number, number>(gasJson.data.filter(d => typeof d.yoy === 'number').map(d => [d.year, d.yoy as number])), [gasJson.data])
  const gasValueByYear = useMemo(() => new Map<number, number>(gasJson.data.map(d => [d.year, d.value])), [gasJson.data])

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

  // Helper to compute 4-year percent change from raw series (start -> end)
  const fourYearChange = (series: AdminSeries): number | null => {
    const start = series.find(v => v != null) as number | undefined
    const end = [...series].reverse().find(v => v != null) as number | undefined
    if (start == null || end == null || start === 0) return null
    return ((end - start) / start) * 100
  }

  const formatPct = (v: number | null) => (v == null ? "–" : `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`)

  // Compute 4-year change labels for each metric using raw values
  const cpiChangeA = fourYearChange(cpiRawA)
  const cpiChangeB = fourYearChange(cpiRawB)
  const igChangeA = fourYearChange(igRawA)
  const igChangeB = fourYearChange(igRawB)
  const gasChangeA = fourYearChange(gasRawA)
  const gasChangeB = fourYearChange(gasRawB)

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

  // Income Gap YoY current value and trend
  const latestIgYear = Math.max(...igJson.data.map(d => d.year))
  const latestIg = igJson.data.find(d => d.year === latestIgYear)?.yoy ?? 0
  const igTrend: MetricSummary["trend"] = Math.abs(latestIg as number) < 1 ? "stable" : (latestIg as number) > 0 ? "up" : "down"

  // Gas YoY current value and trend
  const latestGasYearWithYoy = Math.max(...gasJson.data.filter(d => typeof d.yoy === 'number').map(d => d.year))
  const latestGas = gasJson.data.find(d => d.year === latestGasYearWithYoy)?.yoy ?? 0
  const gasTrend: MetricSummary["trend"] = Math.abs(latestGas as number) < 1 ? "stable" : (latestGas as number) > 0 ? "up" : "down"

  // Determine wins for Income Gap and Gas (lower 4-year change is better)
  const adminAWinsIg = igChangeA != null && igChangeB != null && igChangeA < igChangeB ? 1 : 0
  const adminBWinsIg = igChangeA != null && igChangeB != null && igChangeB < igChangeA ? 1 : 0
  const adminAWinsGas = gasChangeA != null && gasChangeB != null && gasChangeA < gasChangeB ? 1 : 0
  const adminBWinsGas = gasChangeA != null && gasChangeB != null && gasChangeB < gasChangeA ? 1 : 0

  const adminAWinsTotal = adminAWinsCpi + adminAWinsIg + adminAWinsGas
  const adminBWinsTotal = adminBWinsCpi + adminBWinsIg + adminBWinsGas

  const adminAMetricsList: string[] = []
  const adminBMetricsList: string[] = []
  if (adminAWinsCpi) adminAMetricsList.push("Inflation (CPI YoY)")
  if (adminBWinsCpi) adminBMetricsList.push("Inflation (CPI YoY)")
  if (adminAWinsIg) adminAMetricsList.push("Income Gap YoY")
  if (adminBWinsIg) adminBMetricsList.push("Income Gap YoY")
  if (adminAWinsGas) adminAMetricsList.push("Gas Prices YoY")
  if (adminBWinsGas) adminBMetricsList.push("Gas Prices YoY")

  // Build card configs to render within metrics.map
  const termLabels = ["1st Year", "2nd Year", "3rd Year", "4th Year"]
  const igChartData = termLabels.map((label, i) => ({ year: label, adminA: igSeriesA[i] ?? null, adminB: igSeriesB[i] ?? null, adminAValue: igRawA[i] ?? null, adminBValue: igRawB[i] ?? null }))
  const gasChartData = termLabels.map((label, i) => ({ year: label, adminA: gasSeriesA[i] ?? null, adminB: gasSeriesB[i] ?? null, adminAValue: gasRawA[i] ?? null, adminBValue: gasRawB[i] ?? null }))

  const cards = [
    {
      title: "Inflation Rate",
      value: yoyLabel,
      trend,
      change: `4yr ${formatPct(cpiChangeA)} vs ${formatPct(cpiChangeB)}`,
      chartData: cpiChartData,
      adminAStart: cpiRawA.find(v => v != null) ?? null,
      adminAEnd: [...cpiRawA].reverse().find(v => v != null) ?? null,
      adminBStart: cpiRawB.find(v => v != null) ?? null,
      adminBEnd: [...cpiRawB].reverse().find(v => v != null) ?? null,
      adminAValueLabel: formatPct(cpiChangeA),
      adminBValueLabel: formatPct(cpiChangeB),
      methodBadge: "CPI YoY",
      valueLabel: "Index",
      explanation:
        "The Consumer Price Index (CPI) tracks price changes in a typical basket of goods and services change over time. High CPI growth means prices are rising faster, eroding wages and savings. Lower CPI growth is better and indicates easing inflation and improved affordability.",
      dataSource: "U.S. Bureau of Labor Statistics",
      dataSourceUrl: "/data-sources#cpi",
    },
    {
      title: "Weath Gap",
      value: `${latestIg >= 0 ? "+" : ""}${(latestIg as number).toFixed(2)}%`,
      trend: igTrend,
      change: `4yr ${formatPct(igChangeA)} vs ${formatPct(igChangeB)}`,
      chartData: igChartData,
      adminAStart: igRawA.find(v => v != null) ?? null,
      adminAEnd: [...igRawA].reverse().find(v => v != null) ?? null,
      adminBStart: igRawB.find(v => v != null) ?? null,
      adminBEnd: [...igRawB].reverse().find(v => v != null) ?? null,
      adminAValueLabel: formatPct(igChangeA),
      adminBValueLabel: formatPct(igChangeB),
      methodBadge: "Income Gap YoY",
      valueLabel: "Ratio",
      explanation: "YoY percent change in income gap (P90/P50 ratio). Measures how fast the 90th percentile income grows relative to the median income. 2024-2025 extrapolated using last 3 years growth.",
      dataSource: "World Inequality Database",
      dataSourceUrl: "/data-sources#income-gap",
    },
    {
      title: "Gas Prices",
      value: `${latestGas >= 0 ? "+" : ""}${(latestGas as number).toFixed(2)}%`,
      trend: gasTrend,
      change: `4yr ${formatPct(gasChangeA)} vs ${formatPct(gasChangeB)}`,
      chartData: gasChartData,
      adminAStart: gasRawA.find(v => v != null) ?? null,
      adminAEnd: [...gasRawA].reverse().find(v => v != null) ?? null,
      adminBStart: gasRawB.find(v => v != null) ?? null,
      adminBEnd: [...gasRawB].reverse().find(v => v != null) ?? null,
      adminAValueLabel: formatPct(gasChangeA),
      adminBValueLabel: formatPct(gasChangeB),
      methodBadge: "Gas YoY",
      valueLabel: "USD/gal",
      explanation: "YoY percent change in average retail price of regular gasoline. Lower YoY is better as it indicates slower price increases.",
      dataSource: "U.S. Energy Information Administration",
      dataSourceUrl: "/data-sources#gas",
    },
  ]

  const overallWinnerName = adminAWinsTotal > adminBWinsTotal ? adminAName : adminBWinsTotal > adminAWinsTotal ? adminBName : "Tie"
  const overallWinnerParty = adminAWinsTotal > adminBWinsTotal ? adminAComputed.party : adminBWinsTotal > adminAWinsTotal ? adminBComputed.party : "U"

  return (
    <section className="w-full">
      <div className="w-full">
        <div className="bg-gradient-to-br from-background/90 via-background/90 to-background/50">
          <div className="flex items-center justify-center gap-3 max-w-6xl mx-auto py-6">
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
                    winnerSide={adminAWinsTotal > adminBWinsTotal ? "A" : adminBWinsTotal > adminAWinsTotal ? "B" : "none"}
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
                <div className="w-full max-w-6xl h-12 mx-auto border-x border-dashed border-foreground/20"></div>
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
              <div className="py-6 border-t border-dashed border-foreground/20">
                <div className="text-base uppercase tracking-wider font-bold text-muted-foreground mb-2">Overall Winner</div>
                <div className={`text-7xl font-extrabold uppercase ${partyText(overallWinnerParty)}`}>{overallWinnerName}</div>
                <div className="font-mono text-muted-foreground mt-2">Based on winning {Math.max(adminAWinsTotal, adminBWinsTotal)}/{cards.length} key metrics</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
