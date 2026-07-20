// Single source of truth for the site's public origin. Used by the sitemap,
// robots file, and OG metadataBase. Override per-environment with
// NEXT_PUBLIC_SITE_URL (e.g. a Vercel preview URL); defaults to production.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://memotube.com";
