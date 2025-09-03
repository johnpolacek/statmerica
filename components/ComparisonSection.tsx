import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ComparisonSection() {
  return (
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
  )
}


