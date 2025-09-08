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
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <span className="text-3xl mr-1 scale-y-110">🇺🇸</span>
            <h1 className="text-2xl font-extrabold mr-6 uppercase">
              <span className="text-primary font-semibold">Stat</span>
              <span className="text-secondary">merica</span>
            </h1>
          </Link>
          <nav className="hidden md:flex items-center gap-6 border-l-2 border-dotted border-foreground/20 pl-6">
            <Link href="/about" className="text-sm font-mono text-primary/80 hover:text-primary transition-colors">
              About
            </Link>
            <Link href="/data-sources" className="text-sm font-mono text-primary/80 hover:text-primary transition-colors">
              Data Sources
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="https://github.com/johnpolacek/statmerica"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Statmerica on GitHub"
            className="text-foreground/70 hover:text-foreground transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.419 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.109-1.464-1.109-1.464-.907-.62.069-.608.069-.608 1.003.07 1.53 1.031 1.53 1.031.892 1.528 2.341 1.087 2.91.832.091-.647.35-1.087.636-1.337-2.221-.252-4.555-1.111-4.555-4.944 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.646 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844a9.54 9.54 0 0 1 2.504.337c1.909-1.294 2.748-1.025 2.748-1.025.546 1.376.202 2.393.1 2.646.64.699 1.028 1.592 1.028 2.683 0 3.842-2.337 4.688-4.566 4.936.359.309.679.919.679 1.852 0 1.336-.012 2.415-.012 2.742 0 .268.18.58.688.481A10.013 10.013 0 0 0 22 12c0-5.523-4.477-10-10-10Z"/>
            </svg>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}


