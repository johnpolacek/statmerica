import { Minus, TrendingDown, TrendingUp } from "lucide-react"
import { ResponsiveContainer, LineChart, XAxis, YAxis, Legend, Line } from "recharts"
import { calculateTrend, determineWinner, generateComparisonData } from "@/lib/metrics"

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
  winnerOverride?: string
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
  winnerOverride,
  isPercent,
  adminAValueLabel,
  adminBValueLabel,
  partyA = "U",
  partyB = "U",
}: MetricCardProps) {
  const chartData: ChartDatum[] =
    chartDataOverride ??
    generateComparisonData(title).map((d) => ({ year: d.year as unknown as string, adminA: (d as any).trump ?? null, adminB: (d as any).biden ?? null }))

  const computedWinner = winnerOverride ?? determineWinner(title)

  const adminATrend = adminTrendsOverride?.adminA ?? calculateTrend(title, "trump")
  const adminBTrend = adminTrendsOverride?.adminB ?? calculateTrend(title, "biden")

  const partyStroke = (p: Party) => (p === "R" ? "#dc2626" : p === "D" ? "#2563eb" : "#6b7280")
  const partyLightStroke = (p: Party) => (p === "R" ? "#fca5a5" : p === "D" ? "#93c5fd" : "#9ca3af")
  const partyText = (p: Party) => (p === "R" ? "text-red-600" : p === "D" ? "text-blue-600" : "text-muted-foreground")

  const sameParty = partyA === partyB && partyA !== "U"

  const getDefaultRanges = (title: string) => {
    const aData: { [key: string]: number[] } = {
      "Inflation (CPI)": [2.3, 1.8, 1.2, 0.1],
      "Average Wage": [25.2, 25.8, 26.1, 26.8],
      "Gas Prices": [2.74, 2.6, 2.17, 2.25],
      "Home Prices": [245, 265, 295, 322],
      "S&P 500": [2239, 2674, 3231, 3756],
      "Population Growth": [0.7, 0.6, 0.5, 0.4],
      "Marriage Rate": [7.8, 7.5, 7.3, 7.1],
      "Life Expectancy": [78.6, 78.7, 78.8, 78.8],
      "Healthcare Costs": [9596, 10348, 10966, 11172],
      "Obesity Rate": [31.9, 32.5, 33.7, 34.2],
      "Air Quality (AQI)": [55, 53, 52, 51],
      "Average Temperature": [52.7, 52.9, 53.0, 53.2],
      "College Tuition": [28775, 30094, 31394, 32635],
      "Student Debt": [28950, 30100, 31750, 33560],
      "Violent Crime": [386, 383, 379, 398],
      "Incarceration Rate": [655, 581, 541, 531],
    }

    const bData: { [key: string]: number[] } = {
      "Inflation (CPI)": [1.2, 4.7, 8.0, 4.1],
      "Average Wage": [26.8, 27.2, 27.8, 28.1],
      "Gas Prices": [2.17, 3.01, 5.01, 3.52],
      "Home Prices": [322, 350, 384, 402],
      "S&P 500": [3756, 4766, 3840, 4080],
      "Population Growth": [0.7, 0.6, 0.4, 0.4],
      "Marriage Rate": [7.1, 6.9, 6.5, 6.3],
      "Life Expectancy": [78.8, 77.0, 76.1, 76.4],
      "Healthcare Costs": [11172, 11948, 12414, 12764],
      "Obesity Rate": [34.2, 35.1, 35.7, 36.0],
      "Air Quality (AQI)": [51, 49, 47, 48],
      "Average Temperature": [53.2, 53.4, 53.6, 53.7],
      "College Tuition": [32635, 34740, 36436, 37100],
      "Student Debt": [33560, 35200, 36510, 37000],
      "Violent Crime": [398, 387, 380, 370],
      "Incarceration Rate": [531, 520, 515, 510],
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

  return (
    <div className="p-8">
      <div className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl pl-8 font-bold">{title}</div>
            <div
              className={`px-2 py-1 font-mono rounded-full text-xs font-semibold ${
                sameParty
                  ? "bg-muted text-foreground/70"
                  : computedWinner === "Trump"
                  ? "bg-red-100 text-red-800/70 dark:bg-red-900 dark:text-red-200"
                  : "bg-blue-100 text-blue-800/70 dark:bg-blue-900 dark:text-blue-200"
              }`}
            >
              {sameParty ? "Comparison" : `${computedWinner} Wins`}
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">{adminALabel ?? "Admin A"}</div>
              <div className={`flex items-center justify-center gap-1 font-mono text-xl font-bold ${partyText(partyA)}`}>
                {adminAValueLabel ?? adminATrend.change}
              </div>
              <div className={`text-xs scale-x-90 tracking-tighter opacity-70 font-semibold font-mono ${partyText(partyA)}`}>
                {adminRanges.adminAStart} → {adminRanges.adminAEnd}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">{adminBLabel ?? "Admin B"}</div>
              <div className={`flex items-center justify-center gap-1 font-mono text-xl font-bold ${partyText(partyB)} ${sameParty ? "opacity-80" : ""}`}>
                {adminBValueLabel ?? adminBTrend.change}
              </div>
              <div className={`text-xs scale-x-90 tracking-tighter opacity-70 font-semibold font-mono ${partyText(partyB)} ${sameParty ? "opacity-80" : ""}`}>
                {adminRanges.adminBStart} → {adminRanges.adminBEnd}
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


