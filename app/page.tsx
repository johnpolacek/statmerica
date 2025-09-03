"use client"

import { useState } from "react"
import SiteHeader from "@/components/SiteHeader"
import Hero from "@/components/Hero"
import MetricsDashboard from "@/components/MetricsDashboard"
import ComparisonSection from "@/components/ComparisonSection"
import SiteFooter from "@/components/SiteFooter"

export default function StatmericaHomepage() {
  const [adminA, setAdminA] = useState("trump-1")
  const [adminB, setAdminB] = useState("biden-1")

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Hero />
      <MetricsDashboard
        adminA={adminA}
        onAdminAChange={setAdminA}
        adminB={adminB}
        onAdminBChange={setAdminB}
      />
      <ComparisonSection />
      <SiteFooter />
    </div>
  )
}


