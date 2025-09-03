export default function SiteFooter() {
  return (
    <footer className="border-t border-dashed py-12 px-4 bg-muted/30 mt-8">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Data Sources
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Data from BLS, FRED, Census, USDA, CDC, and more
          </p>
        </div>
      </div>
    </footer>
  )
}


