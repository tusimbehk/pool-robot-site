/**
 * Sentry Server Configuration
 *
 * This file configures Sentry for server-side error tracking.
 * It's automatically loaded by Next.js when Sentry is configured.
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NODE_ENV || "development";

Sentry.init({
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,

  // Adjust this value in production
  tracesSampleRate: SENTRY_ENVIRONMENT === "production" ? 0.05 : 1.0,

  // Filter sensitive data
  beforeSend(event, hint) {
    // Remove sensitive headers and cookies
    if (event.request) {
      delete event.request.cookies;
      if (event.request.headers) {
        delete event.request.headers["cookie"];
        delete event.request.headers["authorization"];
        delete event.request.headers["x-api-key"];
      }
    }

    return event;
  },

  // Filter out sensitive query parameters
  beforeBreadcrumb(breadcrumb, hint) {
    if (breadcrumb.category === "http") {
      const url = breadcrumb.data?.url as string | undefined;
      if (url) {
        // Don't log auth URLs
        if (url.includes("/auth/") || url.includes("/login") || url.includes("/api/auth")) {
          return null;
        }
      }
    }
    return breadcrumb;
  },

  // Ignore specific errors
  ignoreErrors: [
    // Browser extensions
    /^Top level error$/,
    /^Non-Error promise rejection$/,
    // Network errors that are not actionable
    /^Network Error$/,
    /^Failed to fetch$/,
  ],

  integrations: [
    Sentry.httpIntegration({
      breadcrumbs: true,
    }),
  ],
});
