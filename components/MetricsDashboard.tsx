import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import MetricCard from "@/components/MetricCard"
import AdministrationSelect from "@/components/AdministrationSelect"
import { calculateOverallWinner, metrics } from "@/lib/metrics"

type MetricsDashboardProps = {
  adminA: string
  onAdminAChange: (value: string) => void
  adminB: string
  onAdminBChange: (value: string) => void
}

export default function MetricsDashboard({ adminA, onAdminAChange, adminB, onAdminBChange }: MetricsDashboardProps) {
  const { trumpWins, bidenWins, trumpMetrics, bidenMetrics, overallWinner } = calculateOverallWinner()

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-3xl font-bold">Key Metrics</h3>
          <div className="flex items-center gap-3">
            <AdministrationSelect value={adminA} onChange={onAdminAChange} />
            <span className="text-sm text-muted-foreground">vs</span>
            <AdministrationSelect value={adminB} onChange={onAdminBChange} />
          </div>
        </div>
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
  )
}


