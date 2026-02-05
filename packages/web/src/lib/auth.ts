/**
 * Authentication Utilities
 *
 * Helper functions for authentication
 */

import { cookies } from "next/headers";

// Session cookie name
const SESSION_COOKIE = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

export interface Session {
  user: SessionUser;
  expiresAt: number;
}

/**
 * Hash a password (simple implementation - use bcrypt in production)
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hashedPassword;
}

/**
 * Generate a session token
 */
export function generateSessionToken(): string {
  return crypto.randomUUID();
}

/**
 * Create a session cookie
 */
export async function createSession(user: SessionUser): Promise<void> {
  const cookieStore = await cookies();

  const session: Session = {
    user,
    expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
  };

  cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

/**
 * Get the current session
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);

  if (!sessionCookie) {
    return null;
  }

  try {
    const session: Session = JSON.parse(sessionCookie.value);

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      await deleteSession();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Delete the current session
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Get the current user (convenience method)
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}
