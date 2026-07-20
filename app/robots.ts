import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Allow crawling of the app, but keep API routes and Sentry's tunnel out of
// the index — they aren't pages and shouldn't show up in search results.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/monitoring"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
