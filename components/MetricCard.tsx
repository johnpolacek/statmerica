import { ExternalLink, ChevronsDown, ChevronsUp } from "lucide-react"
import { ResponsiveContainer, LineChart, XAxis, YAxis, Legend, Line, Tooltip } from "recharts"
import Link from "next/link"
import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { formatChange, windowLabel, type Comparison, type SideResult } from "@/lib/compare"
import type { Party } from "@/lib/terms"

type MetricCardProps = {
  comparison: Comparison
  defaultCollapsed?: boolean
}

type ChartDatum = {
  label: string
  adminA: number | null
  adminB: number | null
  pointA: SideResult["points"][number]
  pointB: SideResult["points"][number]
}

const partyStroke = (p: Party) => (p === "R" ? "#dc2626" : "#2563eb")
const partyLightStroke = (p: Party) => (p === "R" ? "#fca5a5" : "#93c5fd")
const partyText = (p: Party) => (p === "R" ? "text-red-600" : "text-blue-600")
const partyBadge = (p: Party) => (p === "R" ? "bg-red-600/90 text-white/90" : "bg-blue-600/90 text-white/90")
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 })

export default function MetricCard({ comparison, defaultCollapsed = true }: MetricCardProps) {
  const { metric, a, b, window, winner } = comparison
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [showChange, setShowChange] = useState(true)

  // Party aggregates have no meaningful level, so only yearly change can be charted.
  const canShowLevel = !a.isParty && !b.isParty
  const chartChange = showChange || !canShowLevel
  const sameParty = a.party === b.party

  const chartData: ChartDatum[] = a.points.map((pa, i) => {
    const pb = b.points[i]
    return {
      label: pa.label,
      adminA: chartChange ? pa.change : pa.level,
      adminB: chartChange ? pb.change : pb.level,
      pointA: pa,
      pointB: pb,
    }
  })

  const winnerSide = winner === "A" ? a : winner === "B" ? b : null
  const badgeClass = sameParty || !winnerSide ? "bg-background/50 text-foreground/70 border border-foreground/10" : partyBadge(winnerSide.party)
  const badgeLabel =
    winner === "none" ? "No comparable data" : winner === "tie" ? "Tie" : `${winnerSide!.label} ${winnerSide!.isParty ? "Win" : "Wins"}`

  const levelRange = (side: SideResult) => {
    if (side.isParty) return side.memberCount ? `avg of ${side.memberCount} terms` : "–"
    if (side.baseline == null || side.windowEnd == null) return "–"
    return `${metric.formatLevel(side.baseline)} → ${metric.formatLevel(side.windowEnd)}`
  }

  const latestPoint = (side: SideResult) => side.points.find((p) => p.partial && p.level != null)

  const renderTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null
    return (
      <div className="rounded-md border border-foreground/10 bg-background/95 backdrop-blur p-2 shadow text-sm">
        <div className="font-mono text-[12px] text-muted-foreground mb-1">{label}</div>
        {payload.map((entry: any, idx: number) => {
          const point: SideResult["points"][number] = entry.dataKey === "adminA" ? entry.payload.pointA : entry.payload.pointB
          return (
            <div key={idx} className="mb-1 last:mb-0">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="font-semibold">{entry.name}</span>
                {point.year != null && <span className="text-muted-foreground font-mono text-xs">{point.partial ?? point.year}</span>}
              </div>
              <div className="pl-4 text-muted-foreground">Change: {formatChange(metric, point.change, 2)}{point.partial ? " (partial year)" : ""}</div>
              {point.level != null && <div className="pl-4 text-muted-foreground">Level: {metric.formatLevel(point.level)}</div>}
              {point.nominal != null && <div className="pl-4 text-muted-foreground">Nominal: {metric.formatLevel(point.nominal)}</div>}
            </div>
          )
        })}
      </div>
    )
  }

  const renderDot = (side: "A" | "B", color: string) => (props: any) => {
    const { cx, cy, payload, index } = props
    if (cx == null || cy == null || props.value == null) return <g key={`${side}-${index}`} />
    const point = side === "A" ? payload.pointA : payload.pointB
    return point.partial ? (
      <circle key={`${side}-${index}`} cx={cx} cy={cy} r={4} fill="var(--background)" stroke={color} strokeWidth={2} />
    ) : (
      <circle key={`${side}-${index}`} cx={cx} cy={cy} r={4} fill={color} />
    )
  }

  const sideSummary = (side: SideResult) => (
    <>
      <span className="mr-2 text-sm font-bold">{formatChange(metric, side.windowChange)}</span>
      <span>{side.isParty ? (side.memberCount ? `avg of ${side.memberCount} terms` : "") : side.windowEnd != null ? metric.formatLevel(side.windowEnd) : ""}</span>
    </>
  )

  if (isCollapsed) {
    return (
      <div className="pl-8 pr-4 py-4">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 min-w-0">
              <div className="text-xl sm:text-2xl font-bold truncate">{metric.title}</div>
              <span className={`px-2 py-0.5 inline-block font-mono rounded text-xs font-semibold shrink-0 ${badgeClass}`}>{badgeLabel}</span>
            </div>
            {window > 0 && window < 4 && <div className="text-xs text-muted-foreground font-mono text-center sm:text-left mt-1">{windowLabel(window)}</div>}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-6">
            {[a, b].map((side, i) => (
              <div key={i} className="sm:text-xs text-muted-foreground text-center sm:text-left w-[180px]">
                <div className="font-semibold">{side.label}</div>
                <div className={`font-mono text-xs ${partyText(side.party)} whitespace-nowrap`}>{sideSummary(side)}</div>
              </div>
            ))}
            <div className="py-2 sm:py-0">
              <Button variant="outline" size="sm" onClick={() => setIsCollapsed(false)} aria-label={`View data for ${metric.title}`}>
                <ChevronsDown />
                View Data
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const strokeA = partyStroke(a.party)
  const strokeB = sameParty ? partyLightStroke(b.party) : partyStroke(b.party)

  return (
    <div className="p-8 bg-gradient-to-tl from-transparent via-background/30 to-background/70 relative">
      <div className="pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-0">
          <div className="flex flex-col gap-2">
            <div className="text-2xl sm:text-3xl pl-0 sm:pl-8 font-bold flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span>{metric.title}</span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-foreground/60 font-mono">{windowLabel(window)}</span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-foreground/60 font-mono">{metric.levelLabel}</span>
            </div>
            <div className="pl-0 sm:pl-8 text-center sm:text-left">
              <div className={`px-3 py-1 inline-block font-mono rounded text-xs font-semibold ${badgeClass}`}>{badgeLabel}</div>
            </div>
          </div>
          <div className="flex items-center justify-center lg:justify-end gap-4 sm:gap-6 lg:gap-8 flex-wrap lg:pr-8">
            <Button className="absolute top-2 right-2 !px-2" size="sm" variant="outline" onClick={() => setIsCollapsed(true)} aria-label={`Close ${metric.title}`}>
              <ChevronsUp />
            </Button>
            {canShowLevel && (
              <div className="w-full lg:w-auto flex items-center justify-center gap-2 text-[11px] sm:text-xs text-muted-foreground">
                <span>Level</span>
                <Switch checked={showChange} onCheckedChange={setShowChange} aria-label="Toggle between level and yearly change" />
                <span>Yearly change</span>
              </div>
            )}
            {[a, b].map((side, i) => {
              const latest = latestPoint(side)
              return (
                <div key={i} className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">{side.label}</div>
                  <div className={`flex items-center justify-center gap-1 font-mono text-lg sm:text-xl font-extrabold ${partyText(side.party)} ${i === 1 && sameParty ? "opacity-80" : ""}`}>
                    {formatChange(metric, side.windowChange)}
                  </div>
                  <div className={`text-xs scale-x-90 tracking-tighter opacity-70 font-semibold font-mono ${partyText(side.party)}`}>{levelRange(side)}</div>
                  {latest && (
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      Latest {metric.formatLevel(latest.level!)} · {latest.partial}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 16, right: 30, left: 20, bottom: 28 }}>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                width={56}
                domain={["auto", "auto"]}
                tickFormatter={(v: number) => (!chartChange ? compact.format(v) : metric.changeKind === "pct" ? `${v.toFixed(1)}%` : v.toFixed(1))}
              />
              <Tooltip content={renderTooltip} wrapperStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ marginTop: 12 }} />
              <Line
                type="monotone"
                dataKey="adminA"
                stroke={strokeA}
                strokeWidth={3}
                dot={renderDot("A", strokeA)}
                activeDot={{ r: 5, fill: strokeA }}
                connectNulls={false}
                name={a.label}
              />
              <Line
                type="monotone"
                dataKey="adminB"
                stroke={strokeB}
                strokeOpacity={sameParty ? 0.85 : 1}
                strokeDasharray={sameParty ? "6 4" : undefined}
                strokeWidth={3}
                dot={renderDot("B", strokeB)}
                activeDot={{ r: 5, fill: strokeB }}
                connectNulls={false}
                name={b.label}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="py-2 px-8 text-sm space-y-1">
          <p>{metric.explanation}</p>
          {metric.caveat && <p className="text-muted-foreground">Note: {metric.caveat}</p>}
          {window > 0 && window < 4 && (
            <p className="text-muted-foreground">Both sides are scored over the same {window === 1 ? "first year" : `first ${window} years`}, the most either has complete data for.</p>
          )}
          {(a.points.some((p) => p.partial) || b.points.some((p) => p.partial)) && (
            <p className="text-muted-foreground">Hollow points are partial years. They are shown but not scored.</p>
          )}
        </div>
        <div className="pt-3 pb-2 px-8 border-t border-dashed border-foreground/20">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Data Source:</span>
              <span>{metric.source}</span>
            </div>
            <Link href={`/data-sources#${metric.sourceAnchor}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline transition-colors">
              View Details
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
