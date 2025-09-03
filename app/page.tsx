"use client"

import SiteHeader from "@/components/SiteHeader"
import Hero from "@/components/Hero"
import MetricsDashboard from "@/components/MetricsDashboard"
import SiteFooter from "@/components/SiteFooter"

export default function StatmericaHomepage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Hero />
      <MetricsDashboard />
      <SiteFooter />
    </div>
  )
}


