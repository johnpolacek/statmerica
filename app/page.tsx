import type { Metadata } from "next"
import SiteHeader from "@/components/SiteHeader"
import Hero from "@/components/Hero"
import HeroImage from "@/components/HeroImage"
import MetricsDashboard from "@/components/MetricsDashboard"
import SiteFooter from "@/components/SiteFooter"
import { compareAll } from "@/lib/compare"
import { resolveMatchup } from "@/lib/terms"

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams
  const { a, b } = resolveMatchup(params.a, params.b)
  const result = compareAll(a, b)
  if (!result) return {}

  const { scorecard, comparisons } = result
  const title = `${result.a.label} vs ${result.b.label}`
  const description = `${result.a.label} leads on ${scorecard.a.wins.length} of ${comparisons.length} metrics, ${result.b.label} on ${scorecard.b.wins.length}. Compare GDP, jobs, inflation, wages and more.`
  const image = `/api/og?a=${a}&b=${b}`

  return {
    title: { absolute: `${title} | Statmerica` },
    description,
    alternates: { canonical: `/?a=${a}&b=${b}` },
    openGraph: { title, description, url: `/?a=${a}&b=${b}`, images: [{ url: image, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  }
}

export default async function StatmericaHomepage({ searchParams }: PageProps) {
  const params = await searchParams
  const { a, b } = resolveMatchup(params.a, params.b)

  return (
    <div className="min-h-screen relative bg-background">
      <div id="pattern" className="z-40 pointer-events-none opacity-30 absolute inset-0 bg-[length:10%_6%] bg-[url('/dot-grid-l.png')] dark:bg-[url('/dot-grid-d.png')]"></div>
      <SiteHeader />
      <div className="w-full relative z-0 -mt-20 max-h-[720px]">
        <HeroImage />
        <div className="w-full absolute top-0 left-0 h-full">
          <Hero />
          <div className="w-full h-16 bg-gradient-to-t from-background/50 to-transparent absolute bottom-0 left-0"></div>
        </div>
      </div>
      <div className="w-full relative z-50 -mt-[85px] border-t border-dashed">
        <div className="w-full relative z-20">
          <MetricsDashboard initialA={a} initialB={b} />
        </div>
        <div className="w-full h-[100vh] bg-gradient-to-b from-foreground/10 to-transparent absolute top-0 left-0"></div>
      </div>
      <SiteFooter />
    </div>
  )
}
