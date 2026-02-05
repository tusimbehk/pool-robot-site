/**
 * Register API Route
 *
 * POST /api/auth/register
 *
 * Request body:
 * {
 *   "email": string,
 *   "password": string,
 *   "name?: string
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "user": { id, email, name }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { hashPassword, createSession } from "@/lib/auth";
import { generateId } from "@/lib/utils";

// In-memory user storage (replace with database in production)
const users = new Map<string, {
  id: string;
  email: string;
  passwordHash: string;
  name?: string;
  createdAt: number;
}>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = Array.from(users.values()).find(u => u.email === email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User already exists" },
        { status: 409 }
      );
    }

    // Create new user
    const passwordHash = await hashPassword(password);
    const userId = generateId();

    users.set(userId, {
      id: userId,
      email,
      passwordHash,
      name,
      createdAt: Date.now(),
    });

    // Create session
    await createSession({
      id: userId,
      email,
      name,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        name,
      }
    });

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
