export const administrations = [
  { value: "trump-2", label: "Trump (2025-present)", party: "R" },
  
  // Biden
  { value: "biden-1", label: "Biden (2021–2025)", party: "D" },

  // Trump
  { value: "trump-1", label: "Trump (2017–2021)", party: "R" },

  // Obama
  { value: "obama-1", label: "Obama (2009–2013)", party: "D" },
  { value: "obama-2", label: "Obama (2013–2017)", party: "D" },

  // George W. Bush
  { value: "gwbush-1", label: "George W. Bush (2001–2005)", party: "R" },
  { value: "gwbush-2", label: "George W. Bush (2005–2009)", party: "R" },

  // Clinton
  { value: "clinton-1", label: "Clinton (1993–1997)", party: "D" },
  { value: "clinton-2", label: "Clinton (1997–2001)", party: "D" },

  // George H. W. Bush
  { value: "ghwbush-1", label: "George H. W. Bush (1989–1993)", party: "R" },

  // Reagan
  { value: "reagan-1", label: "Reagan (1981–1985)", party: "R" },
  { value: "reagan-2", label: "Reagan (1985–1989)", party: "R" },
];

export type MetricSummary = {
  title: string
  value: string
  trend: string
  change: string
  explanation?: string
}

export const metrics: MetricSummary[] = [
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

export const generateChartData = (title: string, trend: string) => {
  const data: { year: number; value: number }[] = []

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

export const generateComparisonData = (title: string) => {
  const data: { year: string; trump: number; biden: number }[] = []

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

export const determineWinner = (title: string) => {
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

export const calculateOverallWinner = () => {
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

  return {
    trumpWins,
    bidenWins,
    trumpMetrics,
    bidenMetrics,
    overallWinner: trumpWins > bidenWins ? "Trump" : "Biden",
  }
}

export const calculateTrend = (title: string, administration: "trump" | "biden") => {
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

  const data = administration === "trump" ? trumpData[title] : bidenData[title]
  if (!data || data.length < 2) return { trend: "stable", change: "0%" }

  const firstValue = data[0]
  const lastValue = data[data.length - 1]
  const percentChange = ((lastValue - firstValue) / firstValue) * 100

  const trend = Math.abs(percentChange) < 1 ? "stable" : percentChange > 0 ? "up" : "down"
  const change = `${percentChange > 0 ? "+" : ""}${percentChange.toFixed(1)}%`

  return { trend, change }
}


