// Sentry init for the Edge runtime (middleware, edge routes). Loaded from
// instrumentation.ts. Disabled unless a DSN is present.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  tracesSampleRate: 0.1,
});
