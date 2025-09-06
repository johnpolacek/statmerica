import SiteHeader from "@/components/SiteHeader"
import SiteFooter from "@/components/SiteFooter"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "../../components/ui/badge"
import { ExternalLink, Database, Code, TrendingUp, TrendingDown, GitBranch, Download } from "lucide-react"
import cpiData from "@/data/cpi.json"
import incomeGapData from "@/data/income_gap.json"
import gasData from "@/data/gas_prices.json"
import deficitData from "@/data/deficit.json"

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
      displayDescription: "Year-over-year inflation rates tracking price changes in goods and services",
      icon: TrendingUp,
      color: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900/60",
      anchor: "cpi",
      source: {
        name: cpiData.meta.source?.name,
        homepage: cpiData.meta.source?.homepage,
        api: cpiData.meta.source?.api,
        attribution: cpiData.meta.source?.attribution,
      },
      seriesId: (cpiData.meta as any).seriesId,
      coverage: cpiData.meta.coverage,
      frequency: cpiData.meta.frequency,
      processing: {
        updateScript: "pnpm run fetch:cpi",
        dataFile: "data/cpi.json",
        methodology: [
          "Fetch CPI-U series from BLS",
          "Compute December YoY for 1980–2024",
          "Append current-year latest month YoY",
        ],
        chartUsage: [
          "Inflation Rate card (YoY)",
        ],
      },
      notes: cpiData.meta.notes,
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
      seriesId: (gasData.meta as any).seriesId,
      coverage: gasData.meta.coverage,
      frequency: gasData.meta.frequency,
      processing: {
        updateScript: "pnpm run fetch:gas",
        dataFile: "data/gas_prices.json",
        methodology: [
          "Fetch EIA gas price series (monthly/weekly)",
          "Compute annual averages and YoY",
          "Backfill early years from BLS if needed",
        ],
        chartUsage: [
          "Gas Prices card (YoY, USD/gal)",
        ],
      },
      notes: gasData.meta.notes,
    },
    {
      displayTitle: "Income Gap (P90/P50 Ratio)",
      displayDescription: "Income inequality measured as ratio of 90th percentile to median income",
      icon: Database,
      color: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900/60",
      anchor: "income-gap",
      source: {
        name: "World Inequality Database (derived)",
        homepage: "https://wid.world/",
        attribution: "Derived from WID P50/P90 income series",
      },
      coverage: (incomeGapData.meta as any).coverage,
      frequency: (incomeGapData.meta as any).frequency,
      processing: {
        updateScript: "pnpm run fetch:income-gap",
        dataFile: "data/income_gap.json",
        methodology: [
          "Read P50/P90 USD levels",
          "Extrapolate 2024–2025 using last 3-year growth",
          "Compute ratio (P90/P50) and YoY",
        ],
        chartUsage: [
          "Wealth/Income Gap card (YoY, Ratio)",
        ],
      },
      notes: (incomeGapData.meta as any).notes,
    },
    {
      displayTitle: "Federal Budget Deficit (FY)",
      displayDescription: "Annual deficit = outlays minus receipts; plus current FY-to-date",
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
          "Fetch Treasury MTS Table 1 monthly receipts/outlays",
          "Aggregate by fiscal year (Oct–Sep)",
          "Compute deficit (outlays - receipts), convert to USD billions",
          "Compute YoY and append latest FYTD row",
        ],
        chartUsage: [
          "Federal Deficit card (YoY, USD billions)",
        ],
      },
      notes: deficitData.meta.notes,
    },
  ]
}

const scriptDocumentation = [
  {
    name: "fetch:cpi",
    command: "pnpm run fetch:cpi",
    file: "scripts/fetch-cpi.mjs",
    description: "Fetches Consumer Price Index data from BLS Public API",
    parameters: ["--series cuur|cusr (default: cuur)"],
    envVars: ["BLS_API_KEY (optional, increases rate limits)"],
    output: "data/cpi.json",
    icon: Download
  },
  {
    name: "fetch:gas",
    command: "pnpm run fetch:gas",
    file: "scripts/fetch-gas-prices.mjs",
    description: "Fetches U.S. regular gasoline prices from EIA (with BLS backfill)",
    parameters: [],
    envVars: ["EIA_API_KEY (required)", "BLS_API_KEY (optional for backfill)"],
    output: "data/gas_prices.json",
    icon: Download
  },
  {
    name: "wid:extract:income", 
    command: "pnpm run wid:extract:income",
    file: "scripts/wid-extract-income-us.mjs", 
    description: "Extracts US income data (P50, P90) from WID CSV files",
    parameters: ["--dir PATH (default: data/wid)", "--debug"],
    envVars: [],
    output: "data/us_income_p50.csv, data/us_income_p90.csv",
    icon: Code
  },
  {
    name: "fetch:income-gap",
    command: "pnpm run fetch:income-gap", 
    file: "scripts/fetch-income-gap.mjs",
    description: "Builds income gap ratios and YoY changes from P50/P90 CSVs",
    parameters: [],
    envVars: [],
    output: "data/income_gap.json", 
    icon: GitBranch
  }
  ,
  {
    name: "fetch:deficit",
    command: "pnpm run fetch:deficit",
    file: "scripts/fetch-deficit.mjs",
    description: "Aggregates Treasury MTS receipts/outlays into annual federal deficit",
    parameters: [],
    envVars: [],
    output: "data/deficit.json",
    icon: Download
  }
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
                  <li>Run <code className="bg-background px-1 rounded">pnpm run fetch:cpi</code> to update inflation data from BLS</li>
                  <li>Update WID CSV files in <code className="bg-background px-1 rounded">data/wid/</code> from latest WID exports</li>
                  <li>Run <code className="bg-background px-1 rounded">pnpm run wid:extract:income</code> to extract P50/P90 data</li>
                  <li>Run <code className="bg-background px-1 rounded">pnpm run fetch:income-gap</code> to compute income gap metrics</li>
                  <li>Verify data integrity and rebuild application</li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Data Quality</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>All raw data sources are preserved in their original format</li>
                  <li>Processing scripts are deterministic and repeatable</li>
                  <li>Data transformations are documented and version controlled</li>
                  <li>Extrapolations for future years are clearly marked and explained</li>
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
