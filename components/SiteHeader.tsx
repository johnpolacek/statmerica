"use client"

import ThemeToggle from "@/components/ThemeToggle"

type SiteHeaderProps = {}

export default function SiteHeader({}: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-dashed backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-4 h-16 flex items-center justify-start bg-gradient-to-tl from-foreground/5 dark:from-foreground/20 dark:via-foreground/5 to-background">
        <div className="w-full flex items-center gap-8 max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">
            <span className="text-primary">Stat</span>
            <span className="text-secondary">merica</span>
          </h1>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
              Home
            </a>
            <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
              About
            </a>
            <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
              Data Sources
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}


