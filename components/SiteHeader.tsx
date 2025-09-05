"use client"

import ThemeToggle from "@/components/ThemeToggle"
import Image from "next/image"
import Link from "next/link"

type SiteHeaderProps = {}

export default function SiteHeader({}: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-[60] w-full border-b border-dashed backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="px-4 h-16 flex items-center justify-start bg-gradient-to-tl from-foreground/5 dark:from-foreground/20 dark:via-foreground/5 to-background">
        <div className="w-full flex items-center max-w-6xl mx-auto">
          <Image src="flag.svg" alt="" width={36} height={36} className="scale-x-75" />
          <h1 className="text-2xl font-extrabold mr-6 uppercase">
            <span className="text-primary font-semibold">Stat</span>
            <span className="text-secondary">merica</span>
          </h1>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/data-sources" className="text-sm font-medium hover:text-primary transition-colors">
              Data Sources
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}


