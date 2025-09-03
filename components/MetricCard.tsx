import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Minus, TrendingDown, TrendingUp } from "lucide-react"
import { ResponsiveContainer, LineChart, XAxis, YAxis, Legend, Line } from "recharts"
import { calculateTrend, determineWinner, generateComparisonData } from "@/lib/metrics"

type MetricCardProps = {
  title: string
  value: string
  trend: string
  change: string
}

export default function MetricCard({ title, value, trend, change }: MetricCardProps) {
  const chartData = generateComparisonData(title)
  const winner = determineWinner(title)

  const trumpTrend = calculateTrend(title, "trump")
  const bidenTrend = calculateTrend(title, "biden")

  const getAdminValues = (title: string) => {
    const trumpData: { [key: string]: number[] } = {
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

    const bidenData: { [key: string]: number[] } = {
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

    const trumpValues = trumpData[title] || [50, 55, 60, 58]
    const bidenValues = bidenData[title] || [60, 65, 70, 68]

    return {
      trumpStart: trumpValues[0],
      trumpEnd: trumpValues[trumpValues.length - 1],
      bidenStart: bidenValues[0],
      bidenEnd: bidenValues[bidenValues.length - 1],
    }
  }

  const adminValues = getAdminValues(title)

  const getTrendIcon = (trendType: string) => {
    switch (trendType) {
      case "up":
        return <TrendingUp className="h-3 w-3 text-green-500" />
      case "down":
        return <TrendingDown className="h-3 w-3 text-gray-500" />
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />
    }
  }

  const getTrendColor = (trendType: string) => {
    switch (trendType) {
      case "up":
        return "text-green-500"
      case "down":
        return "text-gray-500"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <Card className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <div
              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                winner === "Trump"
                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              }`}
            >
              {winner} Wins
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Trump</div>
              <div className="text-sm font-semibold text-red-600">
                {adminValues.trumpStart} → {adminValues.trumpEnd}
              </div>
              <div className={`flex items-center justify-center gap-1 text-xs ${getTrendColor(trumpTrend.trend)}`}>
                {getTrendIcon(trumpTrend.trend)}
                {trumpTrend.change}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Biden</div>
              <div className="text-sm font-semibold text-blue-600">
                {adminValues.bidenStart} → {adminValues.bidenEnd}
              </div>
              <div className={`flex items-center justify-center gap-1 text-xs ${getTrendColor(bidenTrend.trend)}`}>
                {getTrendIcon(bidenTrend.trend)}
                {bidenTrend.change}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
                grid={{ stroke: "hsl(var(--border))", strokeDasharray: "3 3" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="trump"
                stroke="#dc2626"
                strokeWidth={3}
                dot={{ r: 4, fill: "#dc2626", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#dc2626" }}
                connectNulls={false}
                name="Trump (2017-2021)"
              />
              <Line
                type="monotone"
                dataKey="biden"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 4, fill: "#2563eb", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#2563eb" }}
                connectNulls={false}
                name="Biden (2021-2024)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}


