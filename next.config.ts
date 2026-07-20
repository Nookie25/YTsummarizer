import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com" }],
  },
};

// withSentryConfig handles source-map upload at build time (so stack traces are
// readable) and wires up the tunnel route. The org/project/token come from env
// on Vercel; without them the build still succeeds and just skips map upload.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  // Route Sentry's own requests through your domain to dodge ad blockers.
  tunnelRoute: "/monitoring",
});
