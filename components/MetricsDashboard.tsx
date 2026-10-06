"use client"

import { useMemo, useState } from "react"
import { CircleCheckBig, Link2, Check } from "lucide-react"
import MetricCard from "@/components/MetricCard"
import AdministrationSelect from "@/components/AdministrationSelect"
import { Button } from "@/components/ui/button"
import { compareAll } from "@/lib/compare"
import { getSelection, type Party } from "@/lib/terms"

const partyText = (p: Party) => (p === "R" ? "text-red-600" : "text-blue-600")

type MetricsDashboardProps = {
  initialA: string
  initialB: string
}

export default function MetricsDashboard({ initialA, initialB }: MetricsDashboardProps) {
  const [adminA, setAdminA] = useState(initialA)
  const [adminB, setAdminB] = useState(initialB)
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => compareAll(adminA, adminB), [adminA, adminB])

  // Keep the matchup in the URL so it can be shared and reloaded.
  const updateMatchup = (a: string, b: string) => {
    setAdminA(a)
    setAdminB(b)
    setCopied(false)
    const url = new URL(window.location.href)
    url.searchParams.set("a", a)
    url.searchParams.set("b", b)
    window.history.replaceState(null, "", url)
    const selA = getSelection(a)
    const selB = getSelection(b)
    if (selA && selB) document.title = `${selA.label} vs ${selB.label} | Statmerica`
  }

  const copyLink = async () => {
    const url = new URL(window.location.href)
    url.searchParams.set("a", adminA)
    url.searchParams.set("b", adminB)
    try {
      await navigator.clipboard.writeText(url.toString())
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  if (!result) return null
  const { a, b, comparisons, scorecard } = result
  const sortByLength = (list: string[]) => [...list].sort((x, y) => y.length - x.length)

  return (
    <section className="w-full pt-90 sm:pt-72 lg:pt-0">
      <div className="w-full">
        <div className="bg-gradient-to-br from-background/90 via-background/90 to-background/50">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 max-w-6xl mx-auto py-6">
            <AdministrationSelect value={adminA} onChange={(v) => updateMatchup(v, adminB)} />
            <span className="text-sm text-muted-foreground">vs</span>
            <AdministrationSelect value={adminB} onChange={(v) => updateMatchup(adminA, v)} />
            <Button variant="outline" size="sm" onClick={copyLink} aria-label="Copy link to this comparison" className="mt-2 sm:mt-0">
              {copied ? <Check /> : <Link2 />}
              {copied ? "Copied" : "Share"}
            </Button>
          </div>
        </div>
        <div>
          {comparisons.map((comparison, index) => (
            <div key={comparison.metric.id}>
              <div className="border-y border-dashed border-foreground/20 bg-gradient-to-t from-background/30 to-transparent">
                <div className="max-w-6xl mx-auto border-x border-dashed border-foreground/20 relative z-50">
                  <MetricCard comparison={comparison} />
                </div>
              </div>
              {index !== comparisons.length - 1 && (
                <div className="w-full max-w-6xl h-6 mx-auto border-x border-dashed border-foreground/20 bg-gradient-to-tl from-background/50 via-transparent to-background/50"></div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 border-y border-dashed border-foreground/20">
          <div className="max-w-4xl mx-auto border-x border-dashed border-foreground/20 pt-4 bg-background">
            <div className="text-center border-b border-dashed border-foreground/20 pb-4">
              <div className="text-4xl text-foreground/70 font-extrabold">Final Scorecard</div>
            </div>
            <div className="text-center">
              <div className="grid sm:grid-cols-2">
                {[
                  { side: scorecard.a, label: a.label, border: "border-b sm:border-b-0 sm:border-r border-dashed border-foreground/20" },
                  { side: scorecard.b, label: b.label, border: "" },
                ].map(({ side, label, border }, i) => (
                  <div key={i} className={`${border} p-4 sm:p-8`}>
                    <div className={`text-2xl sm:text-3xl font-bold ${partyText(side.party)}`}>{side.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{label}</div>
                    <div className="text-sm sm:text-base text-center py-2 space-y-1">
                      {sortByLength(side.wins).map((metric) => (
                        <div key={metric} className="w-full flex items-center justify-center gap-1 sm:gap-2 font-bold">
                          <CircleCheckBig className={partyText(side.party)} /> {metric}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-foreground/20 px-4 py-3 text-xs text-muted-foreground space-y-1">
                <p>Each metric compares both sides over the same number of complete years in office. Partial years are not scored.</p>
                {scorecard.ties.length > 0 && <p>Tied: {scorecard.ties.join(", ")}.</p>}
                {scorecard.skipped.length > 0 && <p>Not scored, no comparable data yet: {scorecard.skipped.join(", ")}.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
