/**
 * Sentry Error Tracking Configuration
 *
 * Integrates Sentry for error tracking and performance monitoring
 * https://docs.sentry.io/platforms/javascript/
 */

// @ts-ignore - Sentry types may not match exactly
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || "";
const SENTRY_ENVIRONMENT = process.env.NODE_ENV || "development";

/**
 * Initialize Sentry for error tracking
 */
export function initSentry(): void {
  if (!SENTRY_DSN) {
    console.warn("Sentry DSN not configured, error tracking disabled");
    return;
  }

  if (typeof window === "undefined") {
    // Server-side initialization
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: SENTRY_ENVIRONMENT,
      tracesSampleRate: SENTRY_ENVIRONMENT === "production" ? 0.1 : 1.0,
      // @ts-ignore
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers?.["authorization"];
        }
        return event;
      },
      // @ts-ignore
      beforeBreadcrumb(breadcrumb) {
        // Filter breadcrumbs to avoid leaking sensitive data
        if (breadcrumb.category === "xhr" || breadcrumb.category === "fetch") {
          const url = breadcrumb.data?.url as string | undefined;
          if (url?.includes("/api/auth")) {
            return null; // Don't track auth requests
          }
        }
        return breadcrumb;
      },
    });
  }
}

/**
 * Capture an exception and send to Sentry
 */
export function captureException(error: Error, context?: {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: { id?: string; email?: string };
}): void {
  if (!SENTRY_DSN) return;

  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    if (context?.user) {
      scope.setUser(context.user);
    }
    Sentry.captureException(error);
  });
}

/**
 * Capture a custom message
 */
export function captureMessage(message: string, level: "info" | "warning" | "error" = "info"): void {
  if (!SENTRY_DSN) return;

  Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(user: { id: string; email?: string; username?: string }): void {
  if (!SENTRY_DSN) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear user context
 */
export function clearSentryUser(): void {
  if (!SENTRY_DSN) return;
  Sentry.setUser(null);
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(crumb: {
  category: string;
  message: string;
  level?: "info" | "warning" | "error";
  data?: Record<string, unknown>;
}): void {
  if (!SENTRY_DSN) return;

  Sentry.addBreadcrumb({
    category: crumb.category,
    message: crumb.message,
    level: crumb.level || "info",
    data: crumb.data,
  });
}

/**
 * Performance monitoring - track a transaction
 * Note: In newer Sentry versions, transactions are auto-captured
 */
export function startTransaction(name: string, op: string) {
  if (!SENTRY_DSN) return null;

  // For Sentry v8+, use startSpan instead
  // @ts-ignore - startSpan may not be in types
  if (Sentry.startSpan) {
    // @ts-ignore
    return Sentry.startSpan({ name, op }, () => {});
  }

  // Fallback for older versions
  // @ts-ignore
  return Sentry.startTransaction ? Sentry.startTransaction({ name, op }) : null;
}

/**
 * Check if Sentry is configured
 */
export function isSentryConfigured(): boolean {
  return Boolean(SENTRY_DSN);
}
