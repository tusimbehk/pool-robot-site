/**
 * Session API Route
 *
 * GET /api/auth/session
 *
 * Returns the current user session if authenticated
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: session.user,
      expiresAt: session.expiresAt,
    });

  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
