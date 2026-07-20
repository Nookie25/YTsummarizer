// Sentry init for the browser. Uses the public DSN so it can ship in client
// code. Disabled unless NEXT_PUBLIC_SENTRY_DSN is set.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: 0.1,
});

// Required for Sentry to instrument client-side navigations in the App Router.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
