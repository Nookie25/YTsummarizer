import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// The app is a single-page tool (paste a URL, get a summary), so there's one
// canonical route to index. Add entries here if you introduce marketing or
// content pages later.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
