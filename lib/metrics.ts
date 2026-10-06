import cpi from "@/data/cpi.json"
import debtToGdp from "@/data/debt_to_gdp.json"
import deficit from "@/data/deficit.json"
import disposableIncome from "@/data/disposable_income.json"
import gas from "@/data/gas_prices.json"
import gdp from "@/data/gdp.json"
import groceries from "@/data/groceries.json"
import homeownership from "@/data/homeownership.json"
import householdIncome from "@/data/household_income.json"
import housingAffordability from "@/data/housing_affordability.json"
import incomeGap from "@/data/income_gap.json"
import jobs from "@/data/jobs.json"
import lifeExpectancy from "@/data/life_expectancy.json"
import sp500 from "@/data/sp500.json"
import unemployment from "@/data/unemployment.json"
import wages from "@/data/wages.json"

// `nominal` is set on inflation-adjusted series and holds the original dollars.
export type DataRow = { year: number; value: number; nominal?: number; latest?: boolean; asOf?: string }

// How a metric's movement over a term is measured.
// - "pct": percent change of the level, for amounts like prices, income and GDP.
// - "diff": plain difference, for values that are already rates or ratios of GDP
//   (4.0% → 5.0% unemployment is "+1.0 pts", not "+25%").
export type ChangeKind = "pct" | "diff"

export type MetricDef = {
  id: string
  title: string
  better: "higher" | "lower"
  changeKind: ChangeKind
  diffUnit?: string
  levelLabel: string
  formatLevel: (v: number) => string
  explanation: string
  // Known distortions readers should weigh, shown under the explanation.
  caveat?: string
  source: string
  sourceAnchor: string
  // Granularity of the in-progress `latest` row, used to label it ("Aug 2026", "Q2 2026").
  latestPeriod?: "month" | "quarter" | "day" | "ytd-average"
  rows: DataRow[]
}

const rowsOf = (json: { data: DataRow[] }) => json.data

const fixed = (v: number, digits: number) =>
  v.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })

// "2026-08" -> "Aug 2026 dollars"
const realBaseLabel = (json: { meta: { realBase?: string } }) => {
  const base = json.meta.realBase
  if (!base) return "inflation-adjusted"
  const [y, m] = base.split("-").map(Number)
  return `${new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-US", { month: "short", timeZone: "UTC" })} ${y} dollars`
}

export const METRICS: MetricDef[] = [
  {
    id: "gdp",
    title: "GDP Growth",
    better: "higher",
    changeKind: "pct",
    levelLabel: "Real GDP, chained 2017 dollars",
    formatLevel: (v) => `$${fixed(v / 1000, 1)}T`,
    explanation: "Growth in real GDP, measured fourth quarter to fourth quarter and adjusted for inflation. Higher is better.",
    source: "U.S. Bureau of Economic Analysis via FRED",
    sourceAnchor: "gdp",
    latestPeriod: "quarter",
    rows: rowsOf(gdp),
  },
  {
    id: "jobs",
    title: "Jobs",
    better: "higher",
    changeKind: "pct",
    levelLabel: "Nonfarm payroll jobs, December",
    formatLevel: (v) => `${fixed(v / 1000, 1)}M jobs`,
    explanation: "Growth in total nonfarm payroll jobs, December to December. Measured as a percent so terms decades apart compare fairly. Higher is better.",
    source: "U.S. Bureau of Labor Statistics via FRED",
    sourceAnchor: "jobs",
    latestPeriod: "month",
    rows: rowsOf(jobs),
  },
  {
    id: "unemployment",
    title: "Unemployment",
    better: "lower",
    changeKind: "diff",
    diffUnit: "pts",
    levelLabel: "Unemployment rate, December",
    formatLevel: (v) => `${fixed(v, 1)}%`,
    explanation: "Change in the unemployment rate (U-3, seasonally adjusted), in percentage points, December to December. Lower is better.",
    caveat: "Terms that start in a recession, like 2009 or 2021, get credit for the recovery.",
    source: "U.S. Bureau of Labor Statistics via FRED",
    sourceAnchor: "unemployment",
    latestPeriod: "month",
    rows: rowsOf(unemployment),
  },
  {
    id: "wages",
    title: "Wages",
    better: "higher",
    changeKind: "pct",
    levelLabel: "Real hourly earnings, 1982–84 dollars",
    formatLevel: (v) => `$${fixed(v, 2)}/hr`,
    explanation: "Growth in average hourly earnings for production and nonsupervisory workers, adjusted for inflation. Higher is better.",
    caveat: "In 2020, low-wage workers lost jobs first, which pushed the average up without anyone getting a raise.",
    source: "U.S. Bureau of Labor Statistics via FRED",
    sourceAnchor: "wages",
    latestPeriod: "month",
    rows: rowsOf(wages),
  },
  {
    id: "household-income",
    title: "Household Income",
    better: "higher",
    changeKind: "pct",
    levelLabel: "Real median household income",
    formatLevel: (v) => `$${fixed(v, 0)}`,
    explanation: "Growth in real median household income, in constant dollars. Higher is better.",
    caveat: "Census publishes each year's figure the following September.",
    source: "U.S. Census Bureau via FRED",
    sourceAnchor: "household-income",
    rows: rowsOf(householdIncome),
  },
  {
    id: "disposable-income",
    title: "Disposable Income",
    better: "higher",
    changeKind: "pct",
    levelLabel: "Real after-tax income per person, 2017 dollars",
    formatLevel: (v) => `$${fixed(v, 0)}`,
    explanation: "Growth in income per person after taxes, including Social Security and other government payments, adjusted for inflation. December to December. Higher is better.",
    caveat: "Pandemic relief payments in 2020 and 2021 caused large temporary swings.",
    source: "U.S. Bureau of Economic Analysis via FRED",
    sourceAnchor: "disposable-income",
    latestPeriod: "month",
    rows: rowsOf(disposableIncome),
  },
  {
    id: "inflation",
    title: "Inflation",
    better: "lower",
    changeKind: "pct",
    levelLabel: "CPI-U index, December",
    formatLevel: (v) => fixed(v, 1),
    explanation: "Total rise in consumer prices (CPI-U), December to December. Yearly points are the annual inflation rate. Lower is better.",
    source: "U.S. Bureau of Labor Statistics via FRED",
    sourceAnchor: "cpi",
    latestPeriod: "month",
    rows: rowsOf(cpi),
  },
  {
    id: "groceries",
    title: "Grocery Prices",
    better: "lower",
    changeKind: "pct",
    levelLabel: "CPI food at home, December",
    formatLevel: (v) => fixed(v, 1),
    explanation: "Total rise in prices for food bought at grocery stores, December to December. Lower is better.",
    source: "U.S. Bureau of Labor Statistics via FRED",
    sourceAnchor: "groceries",
    latestPeriod: "month",
    rows: rowsOf(groceries),
  },
  {
    id: "gas",
    title: "Gas Prices",
    better: "lower",
    changeKind: "pct",
    levelLabel: `Regular gas, yearly average, ${realBaseLabel(gas)}`,
    formatLevel: (v) => `$${fixed(v, 2)}`,
    explanation: "Change in the average price of regular gasoline, adjusted for inflation, using yearly averages. Pump prices at the time appear as nominal in the chart tooltip. Lower is better.",
    source: "U.S. Bureau of Labor Statistics via FRED",
    sourceAnchor: "gas",
    latestPeriod: "ytd-average",
    rows: rowsOf(gas),
  },
  {
    id: "housing-affordability",
    title: "Housing Affordability",
    better: "lower",
    changeKind: "diff",
    diffUnit: "pts",
    levelLabel: "Mortgage payment as % of median income",
    formatLevel: (v) => `${fixed(v, 1)}% of income`,
    explanation:
      "Change in the monthly mortgage payment on a median-priced new home, with 20% down on a 30-year fixed loan, as a share of median household income. Includes price, interest rate and income. Lower is better.",
    caveat: "Uses new-home prices, the longest free national series. Existing homes usually sell for less. Mortgage rates are set by markets and the Fed, not the president.",
    source: "Census, HUD and Freddie Mac via FRED",
    sourceAnchor: "housing-affordability",
    rows: rowsOf(housingAffordability),
  },
  {
    id: "homeownership",
    title: "Homeownership",
    better: "higher",
    changeKind: "diff",
    diffUnit: "pts",
    levelLabel: "Homeownership rate, Q4",
    formatLevel: (v) => `${fixed(v, 1)}%`,
    explanation: "Change in the share of homes that are owner-occupied, in percentage points, Q4 to Q4. Higher is better.",
    caveat: "Census changed how it collected this survey during 2020, which inflated readings that year.",
    source: "U.S. Census Bureau via FRED",
    sourceAnchor: "homeownership",
    latestPeriod: "quarter",
    rows: rowsOf(homeownership),
  },
  {
    id: "sp500",
    title: "S&P 500",
    better: "higher",
    changeKind: "pct",
    levelLabel: `S&P 500 year-end close, ${realBaseLabel(sp500)}`,
    formatLevel: (v) => fixed(v, 0),
    explanation: "Growth in the S&P 500 price index, year-end close to year-end close, adjusted for inflation. Quoted index levels appear as nominal in the chart tooltip. Dividends are not included. Higher is better.",
    source: "S&P Dow Jones Indices via FRED",
    sourceAnchor: "sp500",
    latestPeriod: "day",
    rows: rowsOf(sp500),
  },
  {
    id: "debt-to-gdp",
    title: "Debt / GDP",
    better: "lower",
    changeKind: "diff",
    diffUnit: "pts",
    levelLabel: "Debt held by the public as % of GDP, Q4",
    formatLevel: (v) => `${fixed(v, 1)}%`,
    explanation: "Change in federal debt held by the public as a share of GDP, in percentage points, Q4 to Q4. Leaves out debt the government owes itself, such as Social Security trust fund bonds. Lower is better.",
    source: "U.S. Treasury via FRED",
    sourceAnchor: "debt-to-gdp",
    latestPeriod: "quarter",
    rows: rowsOf(debtToGdp),
  },
  {
    id: "deficit",
    title: "Federal Deficit",
    better: "lower",
    changeKind: "diff",
    diffUnit: "pts",
    levelLabel: "Deficit as % of GDP, fiscal year",
    formatLevel: (v) => (v < 0 ? `${fixed(-v, 1)}% surplus` : `${fixed(v, 1)}% of GDP`),
    explanation: "Change in the federal deficit as a share of GDP, in percentage points, by fiscal year. Surpluses count as negative deficits. Lower is better.",
    caveat: "Fiscal years start in October, so a term's first fiscal year began under the previous president and budget.",
    source: "FRED / OMB",
    sourceAnchor: "deficit",
    rows: rowsOf(deficit),
  },
  {
    id: "income-gap",
    title: "Income Gap",
    better: "lower",
    changeKind: "pct",
    levelLabel: "Top 10% avg income ÷ bottom 50% avg",
    formatLevel: (v) => `${fixed(v, 1)}×`,
    explanation: "Change in how many times more the average top-10% adult earns than the average bottom-50% adult, before taxes. Lower is better.",
    caveat: "The World Inequality Database publishes with a lag of two or more years.",
    source: "World Inequality Database",
    sourceAnchor: "income-gap",
    rows: rowsOf(incomeGap),
  },
  {
    id: "life-expectancy",
    title: "Life Expectancy",
    better: "higher",
    changeKind: "diff",
    diffUnit: "yrs",
    levelLabel: "Life expectancy at birth",
    formatLevel: (v) => `${fixed(v, 1)} yrs`,
    explanation: "Change in U.S. life expectancy at birth, in years. Higher is better.",
    caveat: "COVID-19 dominates 2020 to 2022. The World Bank publishes with a lag of a year or more.",
    source: "World Bank",
    sourceAnchor: "life-expectancy",
    rows: rowsOf(lifeExpectancy),
  },
]
