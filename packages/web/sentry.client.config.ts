/**
 * Sentry Client Configuration
 *
 * This file configures Sentry for browser-side error tracking.
 * It's automatically loaded by Next.js when Sentry is configured.
 *
 * To enable Sentry:
 * 1. Install: pnpm add @sentry/nextjs
 * 2. Run: npx @sentry/wizard@latest -i nextjs
 * 3. Set NEXT_PUBLIC_SENTRY_DSN in .env.local
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NODE_ENV || "development";

Sentry.init({
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,

  // Adjust this value in production (likely 0.05-0.1)
  tracesSampleRate: SENTRY_ENVIRONMENT === "production" ? 0.05 : 1.0,

  // Session replay
  replaysSessionSampleRate: SENTRY_ENVIRONMENT === "production" ? 0.05 : 1.0,
  replaysOnErrorSampleRate: 1.0,

  // Filter sensitive data
  beforeSend(event, hint) {
    // Remove any potentially sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.["cookie"];
      delete event.request.headers?.["authorization"];
      delete event.request.headers?.["x-auth-token"];
    }

    // Filter out specific errors
    if (event.exception) {
      const errorMessage = event.exception.values?.[0]?.value;
      // Ignore specific non-actionable errors
      if (errorMessage?.includes("Non-Error promise rejection")) {
        return null;
      }
    }

    return event;
  },

  // Filter breadcrumbs
  beforeBreadcrumb(breadcrumb, hint) {
    // Don't capture auth-related requests
    if (breadcrumb.category === "xhr" || breadcrumb.category === "fetch") {
      const url = breadcrumb.data?.url as string | undefined;
      if (url?.includes("/api/auth") || url?.includes("/api/login") || url?.includes("/api/register")) {
        return null;
      }
    }
    return breadcrumb;
  },

  // Integrations
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
