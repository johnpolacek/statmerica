import SiteHeader from "@/components/SiteHeader"
import Hero from "@/components/Hero"
import HeroImage from "@/components/HeroImage"
import MetricsDashboard from "@/components/MetricsDashboard"
import SiteFooter from "@/components/SiteFooter"

export default function StatmericaHomepage() {
  return (
    <div className="min-h-screen relative bg-background">
      <div id="pattern" className="z-40 pointer-events-none opacity-[.1875] absolute inset-0 bg-[length:20%_20%] bg-[url('/dot-grid-l.png')] dark:bg-[url('/dot-grid-d.png')]"></div>
      <SiteHeader />
      <div className="w-full relative z-0 -mt-20">
        <HeroImage />
        <div className="w-full absolute top-0 left-0 h-full">
          <Hero />
          <div className="w-full h-16 bg-gradient-to-t from-background/50 to-transparent absolute bottom-0 left-0"></div>
        </div>
      </div>
      <div className="w-full relative z-50 -mt-[85px] border-t border-dashed">
        <div className="w-full relative z-20">
          <MetricsDashboard />
        </div>
        <div className="w-full h-[100vh] bg-gradient-to-b from-foreground/10 to-transparent absolute top-0 left-0"></div>
      </div>
      <SiteFooter />
    </div>
  )
}
