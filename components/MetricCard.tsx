import { Minus, TrendingDown, TrendingUp } from "lucide-react"
import { ResponsiveContainer, LineChart, XAxis, YAxis, Legend, Line } from "recharts"
import { calculateTrend, generateComparisonData } from "@/lib/metrics"

type Party = "D" | "R" | "U"

type ChartDatum = { year: string; adminA: number | null; adminB: number | null }

type MetricCardProps = {
  title: string
  value: string
  trend: string
  change: string
  adminALabel?: string
  adminBLabel?: string
  chartDataOverride?: ChartDatum[]
  adminTrendsOverride?: { adminA: { trend: string; change: string }; adminB: { trend: string; change: string } }
  adminRangesOverride?: { adminAStart: number | null; adminAEnd: number | null; adminBStart: number | null; adminBEnd: number | null }
  winnerSide?: "A" | "B" | "none"
  isPercent?: boolean
  adminAValueLabel?: string
  adminBValueLabel?: string
  partyA?: Party
  partyB?: Party
}

export default function MetricCard({
  title,
  value,
  trend,
  change,
  adminALabel,
  adminBLabel,
  chartDataOverride,
  adminTrendsOverride,
  adminRangesOverride,
  winnerSide = "none",
  isPercent,
  adminAValueLabel,
  adminBValueLabel,
  partyA = "U",
  partyB = "U",
}: MetricCardProps) {
  const chartData: ChartDatum[] =
    chartDataOverride ??
    generateComparisonData(title).map((d) => ({ year: d.year as unknown as string, adminA: (d as any).trump ?? null, adminB: (d as any).biden ?? null }))

  const adminATrend = adminTrendsOverride?.adminA ?? { trend, change }
  const adminBTrend = adminTrendsOverride?.adminB ?? { trend, change }

  const partyStroke = (p: Party) => (p === "R" ? "#dc2626" : p === "D" ? "#2563eb" : "#6b7280")
  const partyLightStroke = (p: Party) => (p === "R" ? "#fca5a5" : p === "D" ? "#93c5fd" : "#9ca3af")
  const partyText = (p: Party) => (p === "R" ? "text-red-600" : p === "D" ? "text-blue-600" : "text-muted-foreground")
  const partyBadge = (p: Party) => (p === "R" ? "bg-red-100 text-red-800/70 dark:bg-red-900 dark:text-red-200" : p === "D" ? "bg-blue-100 text-blue-800/70 dark:bg-blue-900 dark:text-blue-200" : "bg-muted text-foreground/70")

  const sameParty = partyA === partyB && partyA !== "U"

  const getDefaultRanges = (title: string) => {
    const aData: { [key: string]: number[] } = {
      "Inflation (CPI)": [2.3, 1.8, 1.2, 0.1],
    }

    const bData: { [key: string]: number[] } = {
      "Inflation (CPI)": [1.2, 4.7, 8.0, 4.1],
    }

    const aVals = aData[title] || [50, 55, 60, 58]
    const bVals = bData[title] || [60, 65, 70, 68]

    return {
      adminAStart: aVals[0],
      adminAEnd: aVals[aVals.length - 1],
      adminBStart: bVals[0],
      adminBEnd: bVals[bVals.length - 1],
    }
  }

  const adminRanges = adminRangesOverride ?? getDefaultRanges(title)

  const formatRange = (v: number | null | undefined) => {
    if (v == null) return "–"
    return isPercent ? `${v.toFixed(2)}%` : v.toFixed(2)
  }

  const winningParty: Party = winnerSide === "A" ? partyA : winnerSide === "B" ? partyB : "U"
  const badgeClass = sameParty || winnerSide === "none" ? "bg-muted text-foreground/70" : partyBadge(winningParty)
  const badgeLabel = sameParty || winnerSide === "none" ? "Comparison" : `${winnerSide === "A" ? (adminALabel ?? "Admin A") : (adminBLabel ?? "Admin B")} Wins`

  return (
    <div className="p-8">
      <div className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl pl-8 font-bold">{title}</div>
            <div className={`px-2 py-1 font-mono rounded-full text-xs font-semibold ${badgeClass}`}>
              {badgeLabel}
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">{adminALabel ?? "Admin A"}</div>
              <div className={`flex items-center justify-center gap-1 font-mono text-xl font-bold ${partyText(partyA)}`}>
                {adminAValueLabel ?? adminATrend.change}
              </div>
              <div className={`text-xs scale-x-90 tracking-tighter opacity-70 font-semibold font-mono ${partyText(partyA)}`}>
                {formatRange(adminRanges.adminAStart)} → {formatRange(adminRanges.adminAEnd)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">{adminBLabel ?? "Admin B"}</div>
              <div className={`flex items-center justify-center gap-1 font-mono text-xl font-bold ${partyText(partyB)} ${sameParty ? "opacity-80" : ""}`}>
                {adminBValueLabel ?? adminBTrend.change}
              </div>
              <div className={`text-xs scale-x-90 tracking-tighter opacity-70 font-semibold font-mono ${partyText(partyB)} ${sameParty ? "opacity-80" : ""}`}>
                {formatRange(adminRanges.adminBStart)} → {formatRange(adminRanges.adminBEnd)}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis
                dataKey="year"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                width={50}
                domain={["dataMin - 5", "dataMax + 5"]}
                tickFormatter={isPercent ? (v: number) => `${v.toFixed(2)}%` : undefined}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="adminA"
                stroke={partyStroke(partyA)}
                strokeWidth={3}
                dot={{ r: 4, fill: partyStroke(partyA), strokeWidth: 0 }}
                activeDot={{ r: 5, fill: partyStroke(partyA) }}
                connectNulls={false}
                name={adminALabel ?? "Admin A"}
              />
              <Line
                type="monotone"
                dataKey="adminB"
                stroke={sameParty ? partyLightStroke(partyB) : partyStroke(partyB)}
                strokeOpacity={sameParty ? 0.85 : 1}
                strokeDasharray={sameParty ? "6 4" : undefined}
                strokeWidth={3}
                dot={{ r: 4, fill: sameParty ? partyLightStroke(partyB) : partyStroke(partyB), strokeWidth: 0 }}
                activeDot={{ r: 5, fill: sameParty ? partyLightStroke(partyB) : partyStroke(partyB) }}
                connectNulls={false}
                name={adminBLabel ?? "Admin B"}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}


