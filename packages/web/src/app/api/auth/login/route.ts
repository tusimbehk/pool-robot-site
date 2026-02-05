/**
 * Login API Route
 *
 * POST /api/auth/login
 *
 * Request body:
 * {
 *   "email": string,
 *   "password": string
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "user": { id, email, name }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, createSession, deleteSession } from "@/lib/auth";

// Import users from register route (in production, use database)
let users: Map<string, {
  id: string;
  email: string;
  passwordHash: string;
  name?: string;
  createdAt: number;
}>;

// Dynamic import to avoid module issues
async function getUsers() {
  if (!users) {
    // In production, this would be a database query
    users = new Map();
  }
  return users;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user
    const allUsers = await getUsers();
    const user = Array.from(allUsers.values()).find(u => u.email === email);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Delete existing session (if any)
    await deleteSession();

    // Create new session
    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
