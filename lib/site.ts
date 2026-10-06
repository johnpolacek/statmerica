// Absolute base URL for metadata and social preview images.
// Set NEXT_PUBLIC_SITE_URL once the custom domain is live (e.g. https://statmerica.com).
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
