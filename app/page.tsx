"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Moon, Sun, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { useTheme } from "next-themes"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts"

const presidents = [
  { value: "all", label: "All Administrations" },
  { value: "biden", label: "Biden (2021-Present)" },
  { value: "trump", label: "Trump (2017-2021)" },
  { value: "obama", label: "Obama (2009-2017)" },
  { value: "bush", label: "Bush (2001-2009)" },
  { value: "clinton", label: "Clinton (1993-2001)" },
  { value: "reagan", label: "Reagan (1981-1989)" },
]

const generateChartData = (title: string, trend: string) => {
  const data = []

  // Realistic data based on actual metric types
  const metricData: { [key: string]: number[] } = {
    "Inflation (CPI)": [1.2, 4.7, 8.0, 4.1, 3.2],
    "Average Wage": [26.8, 27.2, 27.8, 28.1, 28.5],
    "Gas Prices": [2.17, 3.01, 5.01, 3.52, 3.45],
    "Home Prices": [322, 350, 384, 402, 420],
    "S&P 500": [3756, 4766, 3840, 4080, 4567],
    "Population Growth": [0.7, 0.6, 0.4, 0.4, 0.4],
    "Marriage Rate": [7.1, 6.9, 6.5, 6.3, 6.1],
    "Life Expectancy": [78.8, 77.0, 76.1, 76.4, 76.4],
    "Healthcare Costs": [11172, 11948, 12414, 12764, 12914],
    "Obesity Rate": [34.2, 35.1, 35.7, 36.0, 36.2],
    "Air Quality (AQI)": [51, 49, 47, 48, 48],
    "Average Temperature": [53.2, 53.4, 53.6, 53.7, 53.8],
    "College Tuition": [32635, 34740, 36436, 37100, 37650],
    "Student Debt": [33560, 35200, 36510, 37000, 37338],
    "Violent Crime": [398, 387, 380, 370, 366],
    "Incarceration Rate": [531, 520, 515, 510, 505],
  }

  const values = metricData[title] || [50, 55, 60, 58, 62]

  for (let i = 0; i < 5; i++) {
    data.push({
      year: 2020 + i,
      value: values[i],
    })
  }

  return data
}

const generateComparisonData = (title: string) => {
  const data = []

  // Realistic data for Trump vs Biden comparison
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

  const termLabels = ["1st Year", "2nd Year", "3rd Year", "4th Year"]

  for (let i = 0; i < 4; i++) {
    data.push({
      year: termLabels[i],
      trump: trumpData[title][i],
      biden: bidenData[title][i],
    })
  }

  return data
}

const metrics = [
  { title: "Inflation (CPI)", value: "3.2%", trend: "up", change: "+0.4%" },
  { title: "Average Wage", value: "$28.50/hr", trend: "up", change: "+2.1%" },
  { title: "Gas Prices", value: "$3.45/gal", trend: "down", change: "-0.15%" },
  { title: "Home Prices", value: "$420K", trend: "up", change: "+5.2%" },
  { title: "S&P 500", value: "4,567", trend: "up", change: "+12.3%" },
  { title: "Population Growth", value: "0.4%", trend: "down", change: "-0.1%" },
  { title: "Marriage Rate", value: "6.1/1000", trend: "down", change: "-0.3%" },
  { title: "Life Expectancy", value: "76.4 years", trend: "down", change: "-0.2%" },
  { title: "Healthcare Costs", value: "$12,914", trend: "up", change: "+4.1%" },
  { title: "Obesity Rate", value: "36.2%", trend: "up", change: "+1.1%" },
  { title: "Air Quality (AQI)", value: "48", trend: "stable", change: "0%" },
  { title: "Average Temperature", value: "53.8°F", trend: "up", change: "+0.3°F" },
  { title: "College Tuition", value: "$37,650", trend: "up", change: "+3.2%" },
  { title: "Student Debt", value: "$37,338", trend: "up", change: "+2.8%" },
  { title: "Violent Crime", value: "366/100K", trend: "down", change: "-1.7%" },
  { title: "Incarceration Rate", value: "505/100K", trend: "down", change: "-2.1%" },
]

const determineWinner = (title: string) => {
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

  // Metrics where lower is better
  const lowerIsBetter = [
    "Inflation (CPI)",
    "Gas Prices",
    "Healthcare Costs",
    "Obesity Rate",
    "Average Temperature",
    "College Tuition",
    "Student Debt",
    "Violent Crime",
    "Incarceration Rate",
  ]

  const trumpValues = trumpData[title] || [50, 55, 60, 58]
  const bidenValues = bidenData[title] || [60, 65, 70, 68]

  const trumpAvg = trumpValues.reduce((a, b) => a + b, 0) / trumpValues.length
  const bidenAvg = bidenValues.reduce((a, b) => a + b, 0) / bidenValues.length

  if (lowerIsBetter.includes(title)) {
    return trumpAvg < bidenAvg ? "Trump" : "Biden"
  } else {
    return trumpAvg > bidenAvg ? "Trump" : "Biden"
  }
}

const calculateOverallWinner = () => {
  let trumpWins = 0
  let bidenWins = 0
  const trumpMetrics: string[] = []
  const bidenMetrics: string[] = []

  metrics.forEach((metric) => {
    const winner = determineWinner(metric.title)
    if (winner === "Trump") {
      trumpWins++
      trumpMetrics.push(metric.title)
    } else {
      bidenWins++
      bidenMetrics.push(metric.title)
    }
  })

  return { trumpWins, bidenWins, trumpMetrics, bidenMetrics, overallWinner: trumpWins > bidenWins ? "Trump" : "Biden" }
}

const calculateTrend = (title: string, administration: "trump" | "biden") => {
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
    "Average Temperature": [52.7, 52.9, 53.0, 53.2],
    "College Tuition": [28775, 30094, 31394, 32635],
    "Student Debt": [28950, 30100, 31750, 33560],
    "Violent Crime": [398, 387, 380, 370],
    "Incarceration Rate": [531, 520, 515, 510],
  }

  const data = administration === "trump" ? trumpData[title] : bidenData[title]
  if (!data || data.length < 2) return { trend: "stable", change: "0%" }

  const firstValue = data[0]
  const lastValue = data[data.length - 1]
  const percentChange = ((lastValue - firstValue) / firstValue) * 100

  const trend = Math.abs(percentChange) < 1 ? "stable" : percentChange > 0 ? "up" : "down"
  const change = `${percentChange > 0 ? "+" : ""}${percentChange.toFixed(1)}%`

  return { trend, change }
}

function MetricCard({ title, value, trend, change }: { title: string; value: string; trend: string; change: string }) {
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

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="h-9 w-9"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export default function StatmericaHomepage() {
  const [selectedPresident, setSelectedPresident] = useState("all")
  const { trumpWins, bidenWins, trumpMetrics, bidenMetrics, overallWinner } = calculateOverallWinner()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold">
              <span className="text-primary">Stat</span>
              <span className="text-secondary">merica</span>
            </h1>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                Home
              </a>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                About
              </a>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                Data Sources
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedPresident} onValueChange={setSelectedPresident}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Administration" />
              </SelectTrigger>
              <SelectContent>
                {presidents.map((president) => (
                  <SelectItem key={president.value} value={president.value}>
                    {president.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl md:text-6xl font-bold text-balance mb-6">
            How has America changed across administrations?
          </h2>
          <p className="text-xl text-muted-foreground text-balance mb-8 max-w-2xl mx-auto">
            Explore key statistics on the economy, society, health, and environment over time.
          </p>
          <Button size="lg" className="text-lg px-8 py-6">
            Start Exploring
          </Button>
        </div>
      </section>

      {/* Key Metrics Dashboard */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h3 className="text-3xl font-bold text-center mb-12">Key Metrics Comparison: Trump vs Biden</h3>
          <div className="space-y-6">
            {metrics.map((metric, index) => (
              <MetricCard
                key={index}
                title={metric.title}
                value={metric.value}
                trend={metric.trend}
                change={metric.change}
              />
            ))}
          </div>

          <div className="mt-16 pt-12 border-t">
            <Card className="max-w-2xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Final Scorecard</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="text-3xl font-bold text-red-600">Trump</div>
                    <div className="text-2xl font-semibold">{trumpWins} wins</div>
                    <div className="text-left space-y-1">
                      {trumpMetrics.map((metric, index) => (
                        <div key={index} className="text-sm text-muted-foreground">
                          • {metric}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="text-3xl font-bold text-blue-600">Biden</div>
                    <div className="text-2xl font-semibold">{bidenWins} wins</div>
                    <div className="text-left space-y-1">
                      {bidenMetrics.map((metric, index) => (
                        <div key={index} className="text-sm text-muted-foreground">
                          • {metric}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t">
                  <div className="text-lg text-muted-foreground mb-2">Overall Winner</div>
                  <div className={`text-4xl font-bold ${overallWinner === "Trump" ? "text-red-600" : "text-blue-600"}`}>
                    {overallWinner}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">Based on {metrics.length} key metrics</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Compare Across Administrations</h3>
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Inflation Rate Comparison</span>
                  <Select defaultValue="inflation">
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inflation">Inflation Rate</SelectItem>
                      <SelectItem value="unemployment">Unemployment</SelectItem>
                      <SelectItem value="gdp">GDP Growth</SelectItem>
                      <SelectItem value="wages">Average Wages</SelectItem>
                    </SelectContent>
                  </Select>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted/50 rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Interactive chart would be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                About
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Data Sources
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Data from BLS, FRED, Census, USDA, CDC, and more
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
