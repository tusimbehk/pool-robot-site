/**
 * Health Check API Route
 *
 * Returns the health status of the application and its dependencies
 * Can be used by load balancers, monitoring services, etc.
 */

import { NextResponse } from "next/server";
import { runHealthChecks } from "@/lib/monitoring";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await runHealthChecks();

    return NextResponse.json(result, {
      status: result.status === "unhealthy" ? 503 : 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
