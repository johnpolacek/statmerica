"use client"

import { useMemo, useState } from "react"
import MetricCard from "@/components/MetricCard"
import AdministrationSelect from "@/components/AdministrationSelect"
import { administrations, type MetricSummary } from "@/lib/metrics"
import cpi from "@/data/cpi.json"
import incomeGap from "@/data/income_gap.json"
import { CircleCheckBig } from "lucide-react"

type CpiDataPoint = { year: number; value: number }
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
  const igJson = incomeGap as unknown as { data: { year: number; value: number }[]; meta: { title?: string; units?: string } }
  const byYear = useMemo(() => new Map<number, number>(cpiJson.data.map(d => [d.year, d.value])), [cpiJson.data])
  const igByYear = useMemo(() => new Map<number, number>(igJson.data.map(d => [d.year, d.value])), [igJson.data])

  const getAdminLabel = (value: string) => {
    if (value === "party-D") return "Democrats"
    if (value === "party-R") return "Republicans"
    return administrations.find(a => a.value === value)?.label ?? value
  }

  const buildSeriesForAdmin = (value: string): AdminSeries => {
    if (value === "party-D" || value === "party-R") {
      const targetParty = value === "party-D" ? "D" : "R"
      const terms = administrations.filter(a => (a as any).party === targetParty).map(a => a.value)
      const yearOfTermValues: number[][] = [[], [], [], []]
      for (const term of terms) {
        const years = getTermYears(term)
        years.forEach((y, idx) => {
          const v = byYear.get(y)
          if (typeof v === "number") yearOfTermValues[idx].push(v)
        })
      }
      const averaged: AdminSeries = yearOfTermValues.map(arr => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null))
      return averaged
    }
    const years = getTermYears(value)
    return years.map(y => byYear.get(y) ?? null)
  }


  const buildSeriesForAdminIG = (value: string): AdminSeries => {
    if (value === "party-D" || value === "party-R") {
      const targetParty = value === "party-D" ? "D" : "R"
      const terms = administrations.filter(a => (a as any).party === targetParty).map(a => a.value)
      const yearOfTermValues: number[][] = [[], [], [], []]
      for (const term of terms) {
        const years = getTermYears(term)
        years.forEach((y, idx) => {
          const v = igByYear.get(y)
          if (typeof v === "number") yearOfTermValues[idx].push(v)
        })
      }
      const averaged: AdminSeries = yearOfTermValues.map(arr => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null))
      return averaged
    }
    const years = getTermYears(value)
    return years.map(y => igByYear.get(y) ?? null)
  }

  const seriesA = buildSeriesForAdmin(adminA)
  const seriesB = buildSeriesForAdmin(adminB)

  const avg = (series: AdminSeries) => {
    const values = series.filter((v): v is number => v != null)
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
  }

  const adminAComputed: AdminComputed = {
    label: getAdminLabel(adminA),
    series: seriesA,
    average: avg(seriesA),
    party: getParty(adminA),
  }

  const adminBComputed: AdminComputed = {
    label: getAdminLabel(adminB),
    series: seriesB,
    average: avg(seriesB),
    party: getParty(adminB),
  }

  const stripYears = (label: string) => label.replace(/\s*\([^)]*\)\s*$/, "")
  const adminAName = stripYears(adminAComputed.label)
  const adminBName = stripYears(adminBComputed.label)

  const termLabelsCpi = ["1st Year", "2nd Year", "3rd Year", "4th Year"]
  const chartData = termLabelsCpi.map((label, i) => ({
    year: label,
    adminA: adminAComputed.series[i] ?? null,
    adminB: adminBComputed.series[i] ?? null,
  }))

  // For CPI YoY, lower average is better
  const aAvg = adminAComputed.average
  const bAvg = adminBComputed.average
  const adminAWinsCpi = aAvg != null && bAvg != null && aAvg < bAvg ? 1 : 0
  const adminBWinsCpi = aAvg != null && bAvg != null && bAvg < aAvg ? 1 : 0

  const latestYear = Math.max(...cpiJson.data.map(d => d.year))
  const latestVal = cpiJson.data.find(d => d.year === latestYear)?.value ?? 0
  const yoyLabel = `${latestVal >= 0 ? "+" : ""}${latestVal.toFixed(2)}%`
  const trend: MetricSummary["trend"] = Math.abs(latestVal) < 1 ? "stable" : latestVal > 0 ? "up" : "down"

  // Income Gap YoY current value and trend
  const latestIgYear = Math.max(...igJson.data.map(d => d.year))
  const latestIg = igJson.data.find(d => d.year === latestIgYear)?.value ?? 0
  const igTrend: MetricSummary["trend"] = Math.abs(latestIg) < 1 ? "stable" : latestIg > 0 ? "up" : "down"

  // Series per admin for Income Gap YoY
  const igSeriesA = buildSeriesForAdminIG(adminA)
  const igSeriesB = buildSeriesForAdminIG(adminB)
  const avgIG = (series: AdminSeries) => {
    const values = series.filter((v): v is number => v != null)
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
  }
  const igAAvg = avgIG(igSeriesA)
  const igBAvg = avgIG(igSeriesB)

  // Determine wins for CPI and Income Gap (lower is better for both YoY series)
  const adminAWinsIg = igAAvg != null && igBAvg != null && igAAvg < igBAvg ? 1 : 0
  const adminBWinsIg = igAAvg != null && igBAvg != null && igBAvg < igAAvg ? 1 : 0

  const adminAWinsTotal = adminAWinsCpi + adminAWinsIg
  const adminBWinsTotal = adminBWinsCpi + adminBWinsIg

  const adminAMetricsList: string[] = []
  const adminBMetricsList: string[] = []
  if (adminAWinsCpi) adminAMetricsList.push("Inflation (CPI YoY)")
  if (adminBWinsCpi) adminBMetricsList.push("Inflation (CPI YoY)")
  if (adminAWinsIg) adminAMetricsList.push("Income Gap YoY")
  if (adminBWinsIg) adminBMetricsList.push("Income Gap YoY")

  // Build card configs to render within metrics.map
  const termLabels = ["1st Year", "2nd Year", "3rd Year", "4th Year"]
  const cpiChartData = termLabels.map((label, i) => ({ year: label, adminA: adminAComputed.series[i] ?? null, adminB: adminBComputed.series[i] ?? null }))
  const igChartData = termLabels.map((label, i) => ({ year: label, adminA: igSeriesA[i] ?? null, adminB: igSeriesB[i] ?? null }))

  const cards = [
    {
      title: "Inflation Rate",
      value: yoyLabel,
      trend,
      change: `avg ${aAvg?.toFixed(2) ?? "–"}% vs ${bAvg?.toFixed(2) ?? "–"}%`,
      chartData: cpiChartData,
      adminAStart: adminAComputed.series.find(v => v != null) ?? null,
      adminAEnd: [...adminAComputed.series].reverse().find(v => v != null) ?? null,
      adminBStart: adminBComputed.series.find(v => v != null) ?? null,
      adminBEnd: [...adminBComputed.series].reverse().find(v => v != null) ?? null,
      adminAValueLabel: aAvg != null ? `${aAvg.toFixed(2)}%` : "–",
      adminBValueLabel: bAvg != null ? `${bAvg.toFixed(2)}%` : "–",
      methodBadge: "CPI YoY",
      explanation:
        "The Consumer Price Index (CPI) tracks price changes in a typical basket of goods and services change over time. High CPI growth means prices are rising faster, eroding wages and savings. Lower CPI growth is better and indicates easing inflation and improved affordability.",
    },
    {
      title: "Income Gap YoY",
      value: `${latestIg >= 0 ? "+" : ""}${latestIg.toFixed(2)}%`,
      trend: igTrend,
      change: `avg ${igAAvg?.toFixed(2) ?? "–"}% vs ${igBAvg?.toFixed(2) ?? "–"}%`,
      chartData: igChartData,
      adminAStart: igSeriesA.find(v => v != null) ?? null,
      adminAEnd: [...igSeriesA].reverse().find(v => v != null) ?? null,
      adminBStart: igSeriesB.find(v => v != null) ?? null,
      adminBEnd: [...igSeriesB].reverse().find(v => v != null) ?? null,
      adminAValueLabel: igAAvg != null ? `${igAAvg.toFixed(2)}%` : "–",
      adminBValueLabel: igBAvg != null ? `${igBAvg.toFixed(2)}%` : "–",
      methodBadge: "Income Gap YoY",
      explanation: "YoY percent change in income gap (P90/P50 ratio). Measures how fast the 90th percentile income grows relative to the median income. 2024-2025 extrapolated using last 3 years growth.",
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
