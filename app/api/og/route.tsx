import { ImageResponse } from "next/og"
import { compareAll, formatChange } from "@/lib/compare"
import { resolveMatchup, type Party } from "@/lib/terms"

// Social preview image for a matchup: /api/og?a=trump-1&b=biden-1
const color = (p: Party) => (p === "R" ? "#dc2626" : "#2563eb")

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const { a, b } = resolveMatchup(searchParams.get("a"), searchParams.get("b"))
  const result = compareAll(a, b)
  if (!result) return new Response("Not found", { status: 404 })

  const { scorecard, comparisons } = result
  const scored = comparisons.filter((c) => c.winner !== "none")
  const rows = scored.slice(0, 6)
  const maxWindow = Math.max(0, ...scored.map((c) => c.window))
  const windowNote =
    maxWindow === 4 ? `${comparisons.length} U.S. metrics, same years in office` : maxWindow === 1 ? "First year in office compared" : `First ${maxWindow} years in office compared`
  const years = (label: string, name: string) => label.replace(name, "").replace(/[()]/g, "").trim()

  const side = (label: string, name: string, party: Party, wins: number, align: "flex-start" | "flex-end") => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align, width: 420 }}>
      <div style={{ fontSize: 60, fontWeight: 800, color: color(party), lineHeight: 1 }}>{name}</div>
      <div style={{ fontSize: 24, color: "#57534e", marginTop: 8 }}>{years(label, name)}</div>
      <div style={{ fontSize: 96, fontWeight: 800, color: color(party), marginTop: 12, lineHeight: 1 }}>{String(wins)}</div>
      <div style={{ fontSize: 22, color: "#78716c" }}>{wins === 1 ? "metric won" : "metrics won"}</div>
    </div>
  )

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#fafaf9", padding: "48px 64px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 800, letterSpacing: 2 }}>
            <span style={{ color: "#1c1917" }}>STAT</span>
            <span style={{ color: "#dc2626" }}>MERICA</span>
          </div>
          <div style={{ fontSize: 22, color: "#78716c" }}>{windowNote}</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40 }}>
          {side(result.a.label, scorecard.a.name, scorecard.a.party, scorecard.a.wins.length, "flex-start")}
          <div style={{ fontSize: 40, color: "#a8a29e", fontWeight: 700 }}>vs</div>
          {side(result.b.label, scorecard.b.name, scorecard.b.party, scorecard.b.wins.length, "flex-end")}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", marginTop: "auto", borderTop: "2px dashed #d6d3d1", paddingTop: 20 }}>
          {rows.map((c) => (
            <div key={c.metric.id} style={{ display: "flex", width: "33.3%", fontSize: 22, color: "#44403c", marginBottom: 8 }}>
              <span style={{ fontWeight: 700, marginRight: 8 }}>{c.metric.title}</span>
              <span style={{ color: color(c.a.party), marginRight: 6 }}>{formatChange(c.metric, c.a.windowChange)}</span>
              <span style={{ color: "#a8a29e", marginRight: 6 }}>/</span>
              <span style={{ color: color(c.b.party) }}>{formatChange(c.metric, c.b.windowChange)}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      // Scores change when data is refreshed, so don't let caches hold images forever.
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400" },
    },
  )
}
