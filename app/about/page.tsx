import SiteHeader from "@/components/SiteHeader"
import SiteFooter from "@/components/SiteFooter"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="container mx-auto px-4 py-12 max-w-3xl grow">
        <h1 className="text-4xl font-bold mb-4 text-primary">About Statmerica</h1>
        <p className="text-lg mb-8">
          I built Statmerica as a small project to experiment with coding alongside different LLMs.
          The goal is simple: make it easy to compare important U.S. statistics across presidential
          administrations without spin.
        </p>

        <div className="prose dark:prose-invert max-w-none">
          <p>
            The site focuses on a few headline metrics and shows how they moved over a four‑year term.
            There’s no political angle here—just raw data and straightforward calculations. I try to avoid
            complex adjustments that can hide assumptions. Where simple extrapolations are used (for example,
            to fill 2024–2025 where needed), they’re clearly noted in the data descriptions.
          </p>

          <p>
            The charts and comparison logic are transparent by design. Data sources and processing commands
            are documented, and you can see exactly where the numbers come from. If you’re curious about the
            details, check out the <a href="/data-sources">Data Sources & Methodology</a> page.
          </p>

          <p>
            If you spot an error or have a suggestion for a new metric that meets the same bar—widely used,
            clearly defined, and reliably sourced—feel free to open an issue or reach out.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}


