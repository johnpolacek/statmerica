"use client"

import { useEffect, useMemo, useState } from "react"
import MetricCard from "@/components/MetricCard"
import AdministrationSelect from "@/components/AdministrationSelect"
import { administrations, type MetricSummary } from "@/lib/metrics"
import cpi from "@/data/cpi.json"
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

const getParty = (value: string): "D" | "R" | "U" => (administrations.find(a => a.value === value)?.party as any) ?? "U"
const partyText = (p: "D" | "R" | "U") => (p === "R" ? "text-red-600" : p === "D" ? "text-blue-600" : "text-muted-foreground")

export default function MetricsDashboard() {
  const [adminA, setAdminA] = useState("trump-1")
  const [adminB, setAdminB] = useState("biden-1")

  const cpiJson = cpi as unknown as CpiJson
  const byYear = useMemo(() => new Map<number, number>(cpiJson.data.map(d => [d.year, d.value])), [cpiJson.data])

  const getAdminLabel = (value: string) => administrations.find(a => a.value === value)?.label ?? value

  const getTermYears = (value: string): number[] => {
    const map: Record<string, [number, number]> = {
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
    const span = map[value]
    if (!span) return []
    const [start, end] = span
    return [start, start + 1, start + 2, start + 3].filter(y => y <= end)
  }

  const buildSeries = (years: number[]): AdminSeries => years.map(y => byYear.get(y) ?? null)

  const computeAverage = (series: AdminSeries) => {
    const values = series.filter((v): v is number => v != null)
    if (values.length === 0) return null
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  const partyA = getParty(adminA)
  const partyB = getParty(adminB)

  const yearsA = getTermYears(adminA)
  const yearsB = getTermYears(adminB)
  const seriesA = buildSeries(yearsA)
  const seriesB = buildSeries(yearsB)

  const adminAComputed: AdminComputed = {
    label: getAdminLabel(adminA),
    series: seriesA,
    average: computeAverage(seriesA),
    party: partyA,
  }

  const adminBComputed: AdminComputed = {
    label: getAdminLabel(adminB),
    series: seriesB,
    average: computeAverage(seriesB),
    party: partyB,
  }

  const stripYears = (label: string) => label.replace(/\s*\([^)]*\)\s*$/, "")
  const adminAName = stripYears(adminAComputed.label)
  const adminBName = stripYears(adminBComputed.label)

  const termLabels = ["1st Year", "2nd Year", "3rd Year", "4th Year"]
  const chartData = termLabels.map((label, i) => ({
    year: label,
    adminA: adminAComputed.series[i] ?? null,
    adminB: adminBComputed.series[i] ?? null,
  }))

  // For CPI YoY, lower average is better
  const aAvg = adminAComputed.average
  const bAvg = adminBComputed.average
  const adminAWins = aAvg != null && bAvg != null && aAvg < bAvg ? 1 : 0
  const adminBWins = aAvg != null && bAvg != null && bAvg < aAvg ? 1 : 0
  const adminAMetrics: string[] = adminAWins ? ["Inflation (CPI YoY)"] : []
  const adminBMetrics: string[] = adminBWins ? ["Inflation (CPI YoY)"] : []

  const latestYear = Math.max(...cpiJson.data.map(d => d.year))
  const latestVal = cpiJson.data.find(d => d.year === latestYear)?.value ?? 0
  const yoyLabel = `${latestVal >= 0 ? "+" : ""}${latestVal.toFixed(2)}%`
  const trend: MetricSummary["trend"] = Math.abs(latestVal) < 1 ? "stable" : latestVal > 0 ? "up" : "down"

  const metrics: MetricSummary[] = [
    {
      title: "Inflation (CPI YoY)",
      value: yoyLabel,
      trend,
      change: `avg ${aAvg?.toFixed(2) ?? "–"}% vs ${bAvg?.toFixed(2) ?? "–"}%`,
    },
  ]

  const adminAValueLabel = aAvg != null ? `${aAvg.toFixed(2)}%` : "–"
  const adminBValueLabel = bAvg != null ? `${bAvg.toFixed(2)}%` : "–"

  return (
    <section className="w-full">
      <div className="w-full">
        <div>
          <div className="flex items-center justify-center gap-3 max-w-6xl mx-auto mb-6">
            <AdministrationSelect value={adminA} onChange={setAdminA} />
            <span className="text-sm text-muted-foreground">vs</span>
            <AdministrationSelect value={adminB} onChange={setAdminB} />
          </div>
        </div>
        <div>
          {metrics.map((metric, index) => (
            <div key={index}>
              <div className="border-y border-dashed">
                <div className="max-w-6xl mx-auto border-x border-dashed">
                  <MetricCard
                    title={metric.title}
                    value={metric.value}
                    trend={metric.trend}
                    change={metric.change}
                    adminALabel={adminAComputed.label}
                    adminBLabel={adminBComputed.label}
                    chartDataOverride={chartData}
                    adminTrendsOverride={{ adminA: { trend, change: adminAValueLabel }, adminB: { trend, change: adminBValueLabel } }}
                    adminRangesOverride={{
                      adminAStart: adminAComputed.series.find(v => v != null) ?? null,
                      adminAEnd: [...adminAComputed.series].reverse().find(v => v != null) ?? null,
                      adminBStart: adminBComputed.series.find(v => v != null) ?? null,
                      adminBEnd: [...adminBComputed.series].reverse().find(v => v != null) ?? null,
                    }}
                    winnerOverride={adminAWins > adminBWins ? "Trump" : "Biden"}
                    isPercent
                    adminAValueLabel={adminAValueLabel}
                    adminBValueLabel={adminBValueLabel}
                    partyA={adminAComputed.party}
                    partyB={adminBComputed.party}
                  />
                </div>
              </div>
              {index !== metrics.length - 1 && (
                <div className="w-full max-w-6xl h-12 mx-auto border-x border-dashed"></div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12">
          <div className="max-w-4xl mx-auto border border-dashed rounded-lg py-4">
            <div className="text-center border-b border-dashed pb-4">
              <div className="text-2xl font-bold">Final Scorecard</div>
            </div>
            <div className="text-center">
              <div className="grid grid-cols-2">
                <div className="border-r border-dashed p-8">
                  <div className={`text-3xl font-bold ${partyText(adminAComputed.party)}`}>{adminAName}</div>
                  {yearsA.length > 0 && (
                    <div className="text-xs text-muted-foreground">{yearsA[0]}–{yearsA[yearsA.length - 1]}</div>
                  )}
                  <div className="text-center py-2 space-y-1">
                    {adminAMetrics.map((metric, index) => (
                      <div key={index} className="w-full flex items-center justify-center gap-2 font-bold"><CircleCheckBig className={partyText(adminAComputed.party)} /> {metric}</div>
                    ))}
                  </div>
                </div>
                <div className="p-8">
                  <div className={`text-3xl font-bold ${partyText(adminBComputed.party)}`}>{adminBName}</div>
                  {yearsB.length > 0 && (
                    <div className="text-xs text-muted-foreground">{yearsB[0]}–{yearsB[yearsB.length - 1]}</div>
                  )}
                  <div className="text-center space-y-1">
                    {adminBMetrics.map((metric, index) => (
                      <div key={index} className="font-bold"><CircleCheckBig className={partyText(adminBComputed.party)} /> {metric}</div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="py-6 border-t border-dashed">
                <div className="text-lg text-muted-foreground mb-2">Overall Winner</div>
                <div className={`text-8xl font-extrabold uppercase ${adminAWins > adminBWins ? partyText(adminAComputed.party) : partyText(adminBComputed.party)}`}>
                  {adminAWins > adminBWins ? adminAName : adminBName}
                </div>
                <div className="text-sm text-muted-foreground mt-2">Based on winning {adminAWins > adminBWins ? adminAWins : adminBWins} / {metrics.length} key metrics</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
