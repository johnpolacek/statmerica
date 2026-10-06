import SiteHeader from "@/components/SiteHeader"
import SiteFooter from "@/components/SiteFooter"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "../../components/ui/badge"
import { ExternalLink, Database, Code, TrendingUp, TrendingDown, GitBranch, Download } from "lucide-react"
import cpiData from "@/data/cpi.json"
import incomeGapData from "@/data/income_gap.json"
import gasData from "@/data/gas_prices.json"
import deficitData from "@/data/deficit.json"
import unemploymentData from "@/data/unemployment.json"
import sp500Data from "@/data/sp500.json"
import gdpData from "@/data/gdp.json"
import debtToGdpData from "@/data/debt_to_gdp.json"
import householdIncomeData from "@/data/household_income.json"
import wagesData from "@/data/wages.json"
import lifeExpectancyData from "@/data/life_expectancy.json"
import homeownershipData from "@/data/homeownership.json"
import jobsData from "@/data/jobs.json"
import groceriesData from "@/data/groceries.json"
import disposableIncomeData from "@/data/disposable_income.json"
import housingAffordabilityData from "@/data/housing_affordability.json"

// Transform JSON metadata into display format with a unified shape so TS is happy
type DataSourceMeta = {
  displayTitle: string
  displayDescription: string
  icon: any
  color: string
  anchor: string
  source: { name?: string; homepage?: string; api?: string; attribution?: string; credibility?: string }
  seriesId?: string
  coverage?: { start?: number | null; end?: number | null }
  frequency?: string
  processing?: {
    updateScript?: string
    dataFile?: string
    methodology?: string[]
    chartUsage?: string[]
  }
  notes?: string
}

const getDataSourcesMetadata = (): DataSourceMeta[] => {
  return [
    {
      displayTitle: "Consumer Price Index (CPI)",
      displayDescription: "Consumer price level (CPI-U) used to measure inflation over each term",
      icon: TrendingUp,
      color: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900/60",
      anchor: "cpi",
      source: {
        name: cpiData.meta.source?.name,
        homepage: cpiData.meta.source?.homepage,
        api: cpiData.meta.source?.api,
        attribution: cpiData.meta.source?.attribution,
      },
      seriesId: (cpiData.meta as any).series?.[0]?.id,
      coverage: cpiData.meta.coverage,
      frequency: cpiData.meta.frequency,
      processing: {
        updateScript: "pnpm run fetch:cpi",
        dataFile: "data/cpi.json",
        methodology: [
          "Fetch CPI-U, all items, NSA (CUUR0000SA0, published on FRED as CPIAUCNS)",
          "Use the December index as each year's value",
          "Keep the newest month of an unfinished year as a partial point, not scored",
        ],
        chartUsage: [
          "Inflation card: total price rise over the term, yearly inflation in chart",
        ],
      },
      notes: (cpiData.meta as any).notes,
    },
    {
      displayTitle: "Nonfarm Payroll Jobs",
      displayDescription: "Total jobs on U.S. nonfarm payrolls, December of each year",
      icon: TrendingUp,
      color: "bg-lime-50 border-lime-200 dark:bg-lime-950/30 dark:border-lime-900/60",
      anchor: "jobs",
      source: {
        name: jobsData.meta.source?.name,
        homepage: jobsData.meta.source?.homepage,
        api: jobsData.meta.source?.api,
        attribution: jobsData.meta.source?.attribution,
      },
      seriesId: (jobsData.meta as any).series?.map((s: any) => s.id).join(", "),
      coverage: jobsData.meta.coverage,
      frequency: jobsData.meta.frequency,
      processing: {
        updateScript: "pnpm run fetch:jobs",
        dataFile: "data/jobs.json",
        methodology: [
          "Fetch FRED PAYEMS (monthly, seasonally adjusted, thousands)",
          "Use the December value as each year's value",
          "Keep the newest month of an unfinished year as a partial point, not scored",
        ],
        chartUsage: [
          "Jobs card: percent growth over the term",
        ],
      },
      notes: (jobsData.meta as any).notes,
    },
    {
      displayTitle: "Grocery Prices (CPI Food at Home)",
      displayDescription: "Price index for food bought at grocery stores",
      icon: TrendingDown,
      color: "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900/60",
      anchor: "groceries",
      source: {
        name: groceriesData.meta.source?.name,
        homepage: groceriesData.meta.source?.homepage,
        api: groceriesData.meta.source?.api,
        attribution: groceriesData.meta.source?.attribution,
      },
      seriesId: (groceriesData.meta as any).series?.map((s: any) => s.id).join(", "),
      coverage: groceriesData.meta.coverage,
      frequency: groceriesData.meta.frequency,
      processing: {
        updateScript: "pnpm run fetch:groceries",
        dataFile: "data/groceries.json",
        methodology: [
          "Fetch FRED CUUR0000SAF11 (monthly, not seasonally adjusted)",
          "Use the December index as each year's value",
          "Keep the newest month of an unfinished year as a partial point, not scored",
        ],
        chartUsage: [
          "Grocery Prices card: total price rise over the term",
        ],
      },
      notes: (groceriesData.meta as any).notes,
    },
    {
      displayTitle: "Real Disposable Income per Person",
      displayDescription: "After-tax income per person, including government payments, adjusted for inflation",
      icon: TrendingUp,
      color: "bg-cyan-50 border-cyan-200 dark:bg-cyan-950/30 dark:border-cyan-900/60",
      anchor: "disposable-income",
      source: {
        name: disposableIncomeData.meta.source?.name,
        homepage: disposableIncomeData.meta.source?.homepage,
        api: disposableIncomeData.meta.source?.api,
        attribution: disposableIncomeData.meta.source?.attribution,
      },
      seriesId: (disposableIncomeData.meta as any).series?.map((s: any) => s.id).join(", "),
      coverage: disposableIncomeData.meta.coverage,
      frequency: disposableIncomeData.meta.frequency,
      processing: {
        updateScript: "pnpm run fetch:disposable-income",
        dataFile: "data/disposable_income.json",
        methodology: [
          "Fetch FRED A229RX0 (monthly, chained 2017 dollars, SAAR)",
          "Use the December value as each year's value",
          "Keep the newest month of an unfinished year as a partial point, not scored",
        ],
        chartUsage: [
          "Disposable Income card: percent growth over the term",
        ],
      },
      notes: (disposableIncomeData.meta as any).notes,
    },
    {
      displayTitle: "Housing Affordability",
      displayDescription: "Mortgage payment on a median-priced new home as a share of median household income",
      icon: TrendingDown,
      color: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-900/60",
      anchor: "housing-affordability",
      source: {
        name: housingAffordabilityData.meta.source?.name,
        homepage: housingAffordabilityData.meta.source?.homepage,
        api: housingAffordabilityData.meta.source?.api,
        attribution: housingAffordabilityData.meta.source?.attribution,
      },
      seriesId: (housingAffordabilityData.meta as any).series?.map((s: any) => s.id).join(", "),
      coverage: housingAffordabilityData.meta.coverage,
      frequency: housingAffordabilityData.meta.frequency,
      processing: {
        updateScript: "pnpm run fetch:housing-affordability",
        dataFile: "data/housing_affordability.json",
        methodology: [
          "Q4 median sales price of new houses sold (MSPUS)",
          "December average 30-year fixed mortgage rate (MORTGAGE30US)",
          "Payment: 80% loan, 30 years, principal and interest only",
          "Divide by monthly median household income (MEHOINUSA646N; Census Table H-5 before 1984)",
        ],
        chartUsage: [
          "Housing Affordability card: change in percentage points of income",
        ],
      },
      notes: (housingAffordabilityData.meta as any).notes,
    },
    {
      displayTitle: "Homeownership",
      displayDescription: "Quarterly Census homeownership rate; annualized with Q4 and latest quarter",
      icon: TrendingUp,
      color: "bg-stone-50 border-stone-200 dark:bg-stone-950/30 dark:border-stone-900/60",
      anchor: "homeownership",
      source: {
        name: homeownershipData.meta.source?.name,
        homepage: homeownershipData.meta.source?.homepage,
        api: homeownershipData.meta.source?.api,
        attribution: homeownershipData.meta.source?.attribution,
      },
      seriesId: (homeownershipData.meta as any).series?.[0]?.id,
      coverage: homeownershipData.meta.coverage,
      frequency: homeownershipData.meta.frequency,
      processing: {
        updateScript: "pnpm run fetch:homeownership",
        dataFile: "data/homeownership.json",
        methodology: [
          "Fetch FRED RHORUSQ156N (quarterly)",
          "Use the Q4 value as each year's value",
          "Keep the newest quarter of an unfinished year as a partial point, not scored",
        ],
        chartUsage: [
          "Homeownership card: change in percentage points",
        ],
      },
      notes: (homeownershipData.meta as any).notes,
    },
    {
      displayTitle: "Life Expectancy at Birth (US)",
      displayDescription: "Annual life expectancy at birth, in years",
      icon: TrendingUp,
      color: "bg-fuchsia-50 border-fuchsia-200 dark:bg-fuchsia-950/30 dark:border-fuchsia-900/60",
      anchor: "life-expectancy",
      source: {
        name: lifeExpectancyData.meta.source?.name,
        homepage: lifeExpectancyData.meta.source?.homepage,
        api: lifeExpectancyData.meta.source?.api,
        attribution: lifeExpectancyData.meta.source?.attribution,
      },
      coverage: lifeExpectancyData.meta.coverage,
      frequency: lifeExpectancyData.meta.frequency,
      processing: {
        updateScript: "pnpm run fetch:life-expectancy",
        dataFile: "data/life_expectancy.json",
        methodology: [
          "Fetch World Bank SP.DYN.LE00.IN (USA)",
          "Filter to 1979+",
        ],
        chartUsage: [
          "Life Expectancy card: change in years",
        ],
      },
      notes: (lifeExpectancyData.meta as any).notes,
    },
    {
      displayTitle: (gdpData.meta as any).title || "Real GDP",
      displayDescription: "Real GDP, Q4 levels in chained 2017 dollars",
      icon: TrendingUp,
      color: "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-900/60",
      anchor: "gdp",
      source: {
        name: gdpData.meta.source?.name,
        homepage: gdpData.meta.source?.homepage,
        api: gdpData.meta.source?.api,
        attribution: gdpData.meta.source?.attribution,
      },
      seriesId: (gdpData.meta as any).series?.[0]?.id,
      coverage: gdpData.meta.coverage,
      frequency: gdpData.meta.frequency,
      processing: {
        updateScript: "pnpm run fetch:gdp",
        dataFile: "data/gdp.json",
        methodology: [
          "Fetch FRED GDPC1 quarterly real GDP",
          "Use the Q4 value as each year's value",
          "Keep the newest quarter of an unfinished year as a partial point, not scored",
        ],
        chartUsage: [
          "GDP Growth card: percent growth over the term",
        ],
      },
      notes: (gdpData.meta as any).notes,
    },
    {
      displayTitle: (debtToGdpData.meta as any).title || "Debt / GDP Ratio",
      displayDescription: "Federal debt held by the public as a percent of GDP, Q4 values",
      icon: TrendingDown,
      color: "bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/60",
      anchor: "debt-to-gdp",
      source: {
        name: debtToGdpData.meta.source?.name,
        homepage: debtToGdpData.meta.source?.homepage,
        api: debtToGdpData.meta.source?.api,
        attribution: debtToGdpData.meta.source?.attribution,
      },
      seriesId: (debtToGdpData.meta as any).series?.[0]?.id,
      coverage: debtToGdpData.meta.coverage,
      frequency: debtToGdpData.meta.frequency,
      processing: {
        updateScript: "pnpm run fetch:debt-to-gdp",
        dataFile: "data/debt_to_gdp.json",
        methodology: [
          "Fetch FRED FYGFGDQ188S, debt held by the public as % of GDP (quarterly)",
          "Excludes debt the government owes itself, such as trust fund holdings",
          "Use the Q4 value as each year's value",
          "Keep the newest quarter of an unfinished year as a partial point, not scored",
        ],
        chartUsage: [
          "Debt / GDP card: change in percentage points",
        ],
      },
      notes: (debtToGdpData.meta as any).notes,
    },
    {
      displayTitle: (householdIncomeData.meta as any).title || "Household Income",
      displayDescription: "Real median household income in constant dollars",
      icon: TrendingUp,
      color: "bg-teal-50 border-teal-200 dark:bg-teal-950/30 dark:border-teal-900/60",
      anchor: "household-income",
      source: {
        name: householdIncomeData.meta.source?.name,
        homepage: householdIncomeData.meta.source?.homepage,
        api: householdIncomeData.meta.source?.api,
        attribution: householdIncomeData.meta.source?.attribution,
      },
      coverage: householdIncomeData.meta.coverage,
      frequency: householdIncomeData.meta.frequency,
      processing: {
        updateScript: "pnpm run fetch:household-income",
        dataFile: "data/household_income.json",
        methodology: [
          "Fetch FRED MEHOINUSA672N real median household income (1984+)",
          "Fill 1979–1983 from Census Historical Income Table H-5, scaled to match FRED in 1984",
        ],
        chartUsage: [
          "Household Income card: percent growth over the term",
        ],
      },
      notes: (householdIncomeData.meta as any).notes,
    },
    {
      displayTitle: (wagesData.meta as any).title || "Wages",
      displayDescription: "Real average hourly earnings (production & nonsupervisory), CPI-adjusted",
      icon: TrendingUp,
      color: "bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-900/60",
      anchor: "wages",
      source: {
        name: wagesData.meta.source?.name,
        homepage: wagesData.meta.source?.homepage,
        api: wagesData.meta.source?.api,
        attribution: wagesData.meta.source?.attribution,
      },
      coverage: wagesData.meta.coverage,
      frequency: wagesData.meta.frequency,
      processing: {
        updateScript: "pnpm run fetch:wages",
        dataFile: "data/wages.json",
        methodology: [
          "Fetch FRED AHETPI and CPIAUCSL (monthly)",
          "Deflate AHE by CPI to get real hourly earnings",
          "Use the December value as each year's value",
          "Keep the newest month of an unfinished year as a partial point, not scored",
        ],
        chartUsage: [
          "Wages card: percent growth over the term",
        ],
      },
      notes: (wagesData.meta as any).notes,
    },
    {
      displayTitle: "Gas Prices (Regular, Retail)",
      displayDescription: "Average retail gasoline price; annual averages with latest observation",
      icon: Database,
      color: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/60",
      anchor: "gas",
      source: {
        name: gasData.meta.source?.name,
        homepage: gasData.meta.source?.homepage,
        api: gasData.meta.source?.api,
        attribution: gasData.meta.source?.attribution,
      },
      seriesId: (gasData.meta as any).series?.[0]?.id,
      coverage: gasData.meta.coverage,
      frequency: gasData.meta.frequency,
      processing: {
        updateScript: "pnpm run fetch:gas",
        dataFile: "data/gas_prices.json",
        methodology: [
          "Fetch BLS average price of regular unleaded gasoline (APU000074714) via FRED",
          "Adjust each month for inflation with CPI-U to dollars of the latest CPI month",
          "Average the 12 monthly prices for each year; pump prices kept as nominal",
          "Show the year-to-date average of an unfinished year as a partial point, not scored",
        ],
        chartUsage: [
          "Gas Prices card: inflation-adjusted percent change over the term",
        ],
      },
      notes: (gasData.meta as any).notes,
    },
    {
      displayTitle: "Income Gap (Top 10% / Bottom 50%)",
      displayDescription: "Average pre-tax income of the top 10% divided by that of the bottom 50%",
      icon: Database,
      color: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900/60",
      anchor: "income-gap",
      source: {
        name: "World Inequality Database (derived)",
        homepage: "https://wid.world/",
        attribution: "Derived from WID sptincj992 (adults, equal split), groups p90p100 and p0p50",
      },
      coverage: (incomeGapData.meta as any).coverage,
      frequency: (incomeGapData.meta as any).frequency,
      processing: {
        updateScript: "pnpm run fetch:income-gap",
        dataFile: "data/income_gap.json",
        methodology: [
          "Read top 10% and bottom 50% pre-tax income shares (sptincj992) from the WID export",
          "Ratio = (top 10% share / 0.10) / (bottom 50% share / 0.50)",
          "No extrapolation: years WID has not published are left empty",
        ],
        chartUsage: [
          "Income Gap card: percent change in the ratio",
        ],
      },
      notes: (incomeGapData.meta as any).notes,
    },
    {
      displayTitle: "S&P 500 Index",
      displayDescription: "Year-end closing level of the S&P 500 price index",
      icon: TrendingUp,
      color: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/60",
      anchor: "sp500",
      source: {
        name: sp500Data.meta.source?.name,
        homepage: sp500Data.meta.source?.homepage,
        api: sp500Data.meta.source?.api,
        attribution: sp500Data.meta.source?.attribution,
      },
      seriesId: (sp500Data.meta as any).series?.[0]?.id,
      coverage: sp500Data.meta.coverage,
      frequency: sp500Data.meta.frequency,
      processing: {
        updateScript: "pnpm run fetch:sp500",
        dataFile: "data/sp500.json",
        methodology: [
          "Fetch FRED SP500 (daily, last ten years)",
          "Keep earlier year-end closes from the stored file (originally Stooq ^spx)",
          "Use the last December close as each year's value; newest close is a partial point",
          "Adjust for inflation with CPI-U to dollars of the latest CPI month; quoted levels kept as nominal",
        ],
        chartUsage: [
          "S&P 500 card: inflation-adjusted percent growth over the term",
        ],
      },
      notes: (sp500Data.meta as any).notes,
    },
    {
      displayTitle: "Federal Deficit (% of GDP, FY)",
      displayDescription: "Federal deficit as a share of GDP by fiscal year. Surpluses are negative.",
      icon: TrendingDown,
      color: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/60",
      anchor: "deficit",
      source: {
        name: deficitData.meta.source?.name,
        homepage: deficitData.meta.source?.homepage,
        api: deficitData.meta.source?.api,
        attribution: deficitData.meta.source?.attribution,
      },
      coverage: deficitData.meta.coverage,
      frequency: deficitData.meta.frequency,
      processing: {
        updateScript: "pnpm run fetch:deficit",
        dataFile: "data/deficit.json",
        methodology: [
          "Fetch FRED FYFSGDA188S, surplus or deficit as a percent of GDP",
          "Flip the sign so deficits are positive and surpluses negative",
          "Also store the dollar amount from FYFSD, converted from millions to billions",
        ],
        chartUsage: [
          "Federal Deficit card: change in percentage points of GDP",
        ],
      },
      notes: deficitData.meta.notes,
    },
    {
      displayTitle: "Unemployment Rate (U-3, SA)",
      displayDescription: "Monthly unemployment rate, December value for each year",
      icon: TrendingDown,
      color: "bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-900/60",
      anchor: "unemployment",
      source: {
        name: unemploymentData.meta.source?.name,
        homepage: unemploymentData.meta.source?.homepage,
        api: unemploymentData.meta.source?.api,
        attribution: unemploymentData.meta.source?.attribution,
      },
      seriesId: (unemploymentData.meta as any).series?.[0]?.id,
      coverage: unemploymentData.meta.coverage,
      frequency: unemploymentData.meta.frequency,
      processing: {
        updateScript: "pnpm run fetch:unemployment",
        dataFile: "data/unemployment.json",
        methodology: [
          "Fetch the CPS unemployment rate (LNS14000000, SA, published on FRED as UNRATE)",
          "Use the December value as each year's value",
          "Keep the newest month of an unfinished year as a partial point, not scored",
        ],
        chartUsage: [
          "Unemployment card: change in percentage points",
        ],
      },
      notes: (unemploymentData.meta as any).notes,
    },
  ]
}

const scriptDocumentation = [
  {
    name: "fetch:all",
    command: "pnpm run fetch:all",
    file: "scripts/fetch-all.mjs",
    description: "Runs every fetch script below, then validates the results",
    parameters: [],
    envVars: [] as string[],
    output: "data/*.json",
    icon: Download,
  },
  {
    name: "validate:data",
    command: "pnpm run validate:data",
    file: "scripts/validate-data.mjs",
    description: "Checks ranges, signs, gaps, duplicate years and staleness for every dataset",
    parameters: [],
    envVars: [] as string[],
    output: "Pass or fail report",
    icon: Code,
  },
  {
    name: "fetch:cpi",
    command: "pnpm run fetch:cpi",
    file: "scripts/fetch-cpi.mjs",
    description: "CPI-U, all items, NSA from FRED (CPIAUCNS)",
    parameters: [],
    envVars: [] as string[],
    output: "data/cpi.json",
    icon: Download,
  },
  {
    name: "fetch:unemployment",
    command: "pnpm run fetch:unemployment",
    file: "scripts/fetch-unemployment.mjs",
    description: "Unemployment rate from FRED (UNRATE)",
    parameters: [],
    envVars: [] as string[],
    output: "data/unemployment.json",
    icon: Download,
  },
  {
    name: "fetch:wages",
    command: "pnpm run fetch:wages",
    file: "scripts/fetch-wages.mjs",
    description: "Real hourly earnings: AHETPI deflated by CPIAUCSL",
    parameters: [],
    envVars: [] as string[],
    output: "data/wages.json",
    icon: Download,
  },
  {
    name: "fetch:gdp",
    command: "pnpm run fetch:gdp",
    file: "scripts/fetch-gdp.mjs",
    description: "Real GDP (GDPC1), Q4 values",
    parameters: [],
    envVars: [] as string[],
    output: "data/gdp.json",
    icon: Download,
  },
  {
    name: "fetch:debt-to-gdp",
    command: "pnpm run fetch:debt-to-gdp",
    file: "scripts/fetch-debt-to-gdp.mjs",
    description: "Federal debt to GDP (GFDEGDQ188S), Q4 values",
    parameters: [],
    envVars: [] as string[],
    output: "data/debt_to_gdp.json",
    icon: Download,
  },
  {
    name: "fetch:deficit",
    command: "pnpm run fetch:deficit",
    file: "scripts/fetch-deficit-fred.mjs",
    description: "Federal deficit as % of GDP (FYFSGDA188S) plus dollar amount (FYFSD)",
    parameters: [],
    envVars: [] as string[],
    output: "data/deficit.json",
    icon: Download,
  },
  {
    name: "fetch:homeownership",
    command: "pnpm run fetch:homeownership",
    file: "scripts/fetch-homeownership.mjs",
    description: "Homeownership rate (RHORUSQ156N), Q4 values",
    parameters: [],
    envVars: [] as string[],
    output: "data/homeownership.json",
    icon: Download,
  },
  {
    name: "fetch:household-income",
    command: "pnpm run fetch:household-income",
    file: "scripts/fetch-household-income.mjs",
    description: "Real median household income with 1979–83 backfill",
    parameters: [],
    envVars: [] as string[],
    output: "data/household_income.json",
    icon: Download,
  },
  {
    name: "fetch:gas",
    command: "pnpm run fetch:gas",
    file: "scripts/fetch-gas-prices.mjs",
    description: "Regular gas price (APU000074714), yearly averages",
    parameters: [],
    envVars: [] as string[],
    output: "data/gas_prices.json",
    icon: Download,
  },
  {
    name: "fetch:sp500",
    command: "pnpm run fetch:sp500",
    file: "scripts/fetch-sp500.mjs",
    description: "S&P 500 year-end closes (FRED SP500 plus stored history)",
    parameters: [],
    envVars: [] as string[],
    output: "data/sp500.json",
    icon: Download,
  },
  {
    name: "fetch:life-expectancy",
    command: "pnpm run fetch:life-expectancy",
    file: "scripts/fetch-life-expectancy.mjs",
    description: "Life expectancy at birth from the World Bank",
    parameters: [],
    envVars: [] as string[],
    output: "data/life_expectancy.json",
    icon: Download,
  },
  {
    name: "fetch:jobs",
    command: "pnpm run fetch:jobs",
    file: "scripts/fetch-jobs.mjs",
    description: "Nonfarm payroll jobs (PAYEMS), December values",
    parameters: [],
    envVars: [] as string[],
    output: "data/jobs.json",
    icon: Download,
  },
  {
    name: "fetch:groceries",
    command: "pnpm run fetch:groceries",
    file: "scripts/fetch-groceries.mjs",
    description: "CPI food at home (CUUR0000SAF11), December values",
    parameters: [],
    envVars: [] as string[],
    output: "data/groceries.json",
    icon: Download,
  },
  {
    name: "fetch:disposable-income",
    command: "pnpm run fetch:disposable-income",
    file: "scripts/fetch-disposable-income.mjs",
    description: "Real disposable income per person (A229RX0), December values",
    parameters: [],
    envVars: [] as string[],
    output: "data/disposable_income.json",
    icon: Download,
  },
  {
    name: "fetch:housing-affordability",
    command: "pnpm run fetch:housing-affordability",
    file: "scripts/fetch-housing-affordability.mjs",
    description: "Mortgage payment share of income from MSPUS, MORTGAGE30US and MEHOINUSA646N",
    parameters: [],
    envVars: [] as string[],
    output: "data/housing_affordability.json",
    icon: Download,
  },
  {
    name: "fetch:income-gap",
    command: "pnpm run fetch:income-gap",
    file: "scripts/fetch-income-gap.mjs",
    description: "Builds the top 10% / bottom 50% income ratio from WID income shares",
    parameters: [],
    envVars: [] as string[],
    output: "data/income_gap.json",
    icon: GitBranch,
  },
]

export default function DataSourcesPage() {
  const dataSourcesMetadata = getDataSourcesMetadata()
  
  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <SiteHeader />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Data Sources & Methodology</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transparent documentation of all data sources, processing scripts, and methodologies 
            used to create the charts and comparisons in Statmerica.
          </p>
        </div>

        {/* Data Sources Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold mb-8 flex items-center gap-3">
            <Database className="h-8 w-8" />
            Data Sources
          </h2>
          
          <div className="space-y-8">
            {dataSourcesMetadata.map((source, index) => {
              const IconComponent = source.icon
              return (
                <Card key={index} id={source.anchor} className={`${source.color} transition-all hover:shadow-lg scroll-mt-24`}>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <IconComponent className="h-6 w-6" />
                      <CardTitle className="text-xl">{source.displayTitle}</CardTitle>
                    </div>
                    <CardDescription className="text-base">
                      {source.displayDescription}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid gap-6 lg:grid-cols-2">
                      {/* Left Column */}
                      <div className="space-y-6">
                        {/* Source Information */}
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide">Source</h4>
                          <div className="space-y-1 text-sm">
                            <div><strong>Organization:</strong> {source.source?.name}</div>
                            <div className="flex items-center gap-2">
                              <strong>Homepage:</strong> 
                              <a 
                                href={source.source?.homepage} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                              >
                                {source.source?.homepage?.replace('https://', '')}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                            <div><strong>Series:</strong> {source.seriesId}</div>
                            <div><strong>Coverage:</strong> {source.coverage?.start}–{source.coverage?.end}</div>
                            <div><strong>Frequency:</strong> {source.frequency}</div>
                          </div>
                        </div>

                        {/* Credibility & Impartiality */}
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide">Credibility & Impartiality</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {source.source?.credibility}
                          </p>
                        </div>

                        {/* Technical Details */}
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide">Processing</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs">
                                {source.processing?.updateScript}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {source.processing?.dataFile}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Attribution */}
                        <div className="pt-2 border-t border-border/50">
                          <div className="text-xs text-muted-foreground">
                            <strong>Attribution:</strong> {source.source?.attribution}
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-6">
                        {/* Methodology */}
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide">Methodology</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            {source.processing?.methodology?.map((step, stepIndex) => (
                              <li key={stepIndex}>{step}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Chart Usage */}
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide">Chart Usage</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            {source.processing?.chartUsage?.map((usage, usageIndex) => (
                              <li key={usageIndex}>{usage}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Scripts Section */}
        <section>
          <h2 className="text-3xl font-semibold mb-8 flex items-center gap-3">
            <Code className="h-8 w-8" />
            Data Processing Scripts
          </h2>
          
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
            {scriptDocumentation.map((script, index) => {
              const IconComponent = script.icon
              return (
                <Card key={index} className="hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <IconComponent className="h-5 w-5" />
                      <CardTitle className="text-lg">{script.name}</CardTitle>
                    </div>
                    <CardDescription>{script.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2 text-sm">Command</h4>
                      <code className="text-xs bg-muted p-2 rounded block font-mono">
                        {script.command}
                      </code>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2 text-sm">File</h4>
                      <Badge variant="outline" className="text-xs font-mono">
                        {script.file}
                      </Badge>
                    </div>

                    {script.parameters.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 text-sm">Parameters</h4>
                        <ul className="space-y-1">
                          {script.parameters.map((param, paramIndex) => (
                            <li key={paramIndex} className="text-xs text-muted-foreground font-mono">
                              {param}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {script.envVars.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 text-sm">Environment Variables</h4>
                        <ul className="space-y-1">
                          {script.envVars.map((envVar, envIndex) => (
                            <li key={envIndex} className="text-xs text-muted-foreground font-mono">
                              {envVar}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold mb-2 text-sm">Output</h4>
                      <Badge variant="secondary" className="text-xs font-mono">
                        {script.output}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Additional Information */}
        <section className="mt-16">
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-xl">Data Update Process</CardTitle>
              <CardDescription>
                How to refresh data sources and maintain data quality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Update Workflow</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Run <code className="bg-background px-1 rounded">pnpm run fetch:all</code> to refresh every dataset. No API keys are needed.</li>
                  <li>For the income gap, replace <code className="bg-background px-1 rounded">data/wid/WID_data_US.csv</code> with a newer WID export when one is published</li>
                  <li>Review the <code className="bg-background px-1 rounded">validate:data</code> report, then rebuild the application</li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Data Quality</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>All raw data sources are preserved in their original format</li>
                  <li>Processing scripts are deterministic and repeatable</li>
                  <li>Data transformations are documented and version controlled</li>
                  <li>No values are extrapolated. Partial years are shown but never scored.</li>
                  <li>Both sides of a comparison are measured over the same number of complete years</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
