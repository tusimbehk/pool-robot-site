/**
 * Health Check Utilities
 *
 * Functions for checking service health and dependencies
 */

export interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  checks: Record<string, HealthCheck>;
  timestamp: string;
}

export interface HealthCheck {
  status: "pass" | "fail" | "warn";
  message?: string;
  responseTime?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Perform a health check on an external service
 */
export async function checkServiceHealth(
  name: string,
  url: string,
  timeout = 5000
): Promise<HealthCheck> {
  const startTime = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = performance.now() - startTime;

    if (response.ok) {
      return {
        status: "pass",
        message: "Service is reachable",
        responseTime,
      };
    }

    return {
      status: "fail",
      message: `Service returned status ${response.status}`,
      responseTime,
    };
  } catch (error) {
    const responseTime = performance.now() - startTime;
    return {
      status: "fail",
      message: error instanceof Error ? error.message : "Unknown error",
      responseTime,
    };
  }
}

/**
 * Check Shopify API health
 */
export async function checkShopifyHealth(): Promise<HealthCheck> {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;

  if (!domain) {
    return {
      status: "warn",
      message: "Shopify not configured",
    };
  }

  return checkServiceHealth(
    "shopify",
    `https://${domain}`,
    5000
  );
}

/**
 * Check analytics service health
 */
export function checkAnalyticsHealth(): HealthCheck {
  const segmentKey = process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY;

  if (!segmentKey) {
    return {
      status: "warn",
      message: "Segment not configured",
    };
  }

  return {
    status: "pass",
    message: "Analytics configured",
  };
}

/**
 * Check memory usage
 */
export function checkMemoryHealth(): HealthCheck {
  if (typeof window !== "undefined") {
    // Browser memory API if available
    const memory = (performance as any).memory;
    if (memory) {
      const usedMB = memory.usedJSHeapSize / (1024 * 1024);
      const totalMB = memory.jsHeapSizeLimit / (1024 * 1024);
      const usagePercent = (usedMB / totalMB) * 100;

      return {
        status: usagePercent > 90 ? "fail" : usagePercent > 75 ? "warn" : "pass",
        message: `Memory usage: ${usedMB.toFixed(2)}MB / ${totalMB.toFixed(2)}MB`,
        metadata: {
          usedMB,
          totalMB,
          usagePercent,
        },
      };
    }
  }

  return {
    status: "pass",
    message: "Memory check not available",
  };
}

/**
 * Check network connectivity
 */
export function checkNetworkHealth(): HealthCheck {
  if (typeof navigator !== "undefined") {
    const connection = (navigator as any).connection;

    if (connection) {
      const effectiveType = connection.effectiveType;
      const downlink = connection.downlink;

      return {
        status: effectiveType === "slow-2g" || effectiveType === "2g" ? "warn" : "pass",
        message: `Network: ${effectiveType} (~${downlink}Mbps)`,
        metadata: {
          effectiveType,
          downlink,
          rtt: connection.rtt,
        },
      };
    }
  }

  return {
    status: "pass",
    message: "Network info not available",
  };
}

/**
 * Run all health checks
 */
export async function runHealthChecks(): Promise<HealthCheckResult> {
  const checks: Record<string, HealthCheck> = {
    memory: checkMemoryHealth(),
    network: checkNetworkHealth(),
    analytics: checkAnalyticsHealth(),
  };

  // Run async checks
  checks.shopify = await checkShopifyHealth();

  // Calculate overall status
  const failedChecks = Object.values(checks).filter((c) => c.status === "fail");
  const warnChecks = Object.values(checks).filter((c) => c.status === "warn");

  let status: "healthy" | "degraded" | "unhealthy";
  if (failedChecks.length > 0) {
    status = "unhealthy";
  } else if (warnChecks.length > 0) {
    status = "degraded";
  } else {
    status = "healthy";
  }

  return {
    status,
    checks,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Health check API route handler
 */
export async function GET() {
  const result = await runHealthChecks();

  return Response.json(result, {
    status: result.status === "unhealthy" ? 503 : 200,
  });
}
