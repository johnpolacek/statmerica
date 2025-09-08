export default function SiteFooter() {
  return (
    <footer className="border-t border-dashed relative z-[60] py-12 px-4 bg-muted/30 mt-16 bg-gradient-to-tl from-foreground/10 dark:from-foreground/20 dark:via-foreground/5 to-background">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <a href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
            <a href="/data-sources" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Data Sources
            </a>
            <a href="https://github.com/johnpolacek/statmerica/discussions" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
          </div>
          <p className="text-sm text-muted-foreground text-center italic">
            Data from BLS, FRED, Census, USDA, CDC, and more
          </p>
        </div>
      </div>
    </footer>
  )
}


