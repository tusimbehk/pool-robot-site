/**
 * Monitoring & Error Tracking Module
 *
 * Central exports for all monitoring and error tracking utilities
 */

// Sentry integration
export {
  initSentry,
  captureException,
  captureMessage,
  setSentryUser,
  clearSentryUser,
  addBreadcrumb,
  startTransaction,
  isSentryConfigured,
} from "./sentry";

// Logger
export {
  logger,
  createPerformanceLogger,
  PerformanceLogger,
  LogLevel,
  type LogContext,
  type LogEntry,
} from "./logger";

// Health checks
export {
  runHealthChecks,
  checkServiceHealth,
  checkShopifyHealth,
  checkAnalyticsHealth,
  checkMemoryHealth,
  checkNetworkHealth,
  type HealthCheckResult,
  type HealthCheck,
} from "./health";
