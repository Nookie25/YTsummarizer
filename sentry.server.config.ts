// Sentry init for the Node.js server runtime. Loaded from instrumentation.ts.
// No DSN in the environment => Sentry stays disabled, so local dev and any
// deploy without the env var behave as if Sentry weren't installed.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  // Sample a fraction of requests for performance tracing. Dial up if you want
  // more traces; 0.1 keeps volume (and cost) low to start.
  tracesSampleRate: 0.1,
});
