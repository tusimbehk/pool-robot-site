import { cookies } from 'next/headers';
import { RequestCookies } from 'next/dist/compiled/@edge-runtime/cookies';

export const ID_KEYS = {
  ANONYMOUS_ID: 'pool_anonymous_id',
  USER_ID: 'pool_user_id',
  SESSION_ID: 'pool_session_id',
} as const;

/**
 * Get anonymous ID from request headers (for API routes)
 */
export function getAnonymousIdFromRequest(request: Request): string {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = new RequestCookies(cookieHeader);
  const anonymousId = cookies.get(ID_KEYS.ANONYMOUS_ID)?.value;

  if (anonymousId) {
    return anonymousId;
  }

  // Generate new anonymous ID if not exists
  return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get user ID from request headers (for API routes)
 */
export function getUserIdFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = new RequestCookies(cookieHeader);
  return cookies.get(ID_KEYS.USER_ID)?.value || null;
}

/**
 * These functions use next/headers and only work in Server Components
 * NOT compatible with Node.js runtime API routes
 */

/**
 * Get anonymous ID (Server Components only)
 */
export function getAnonymousId(): string {
  const cookieStore = cookies();
  const anonymousId = cookieStore.get(ID_KEYS.ANONYMOUS_ID)?.value;

  if (anonymousId) {
    return anonymousId;
  }

  // 生成新的匿名 ID
  const newId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  cookieStore.set(ID_KEYS.ANONYMOUS_ID, newId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365 * 2, // 2 years
  });

  return newId;
}

/**
 * Get user ID (Server Components only)
 */
export function getUserId(): string | null {
  const cookieStore = cookies();
  return cookieStore.get(ID_KEYS.USER_ID)?.value || null;
}

/**
 * Set user ID (Server Components only)
 */
export function setUserId(userId: string): void {
  const cookieStore = cookies();
  cookieStore.set(ID_KEYS.USER_ID, userId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365 * 2, // 2 years
  });
}

/**
 * Clear user ID (Server Components only)
 */
export function clearUserId(): void {
  const cookieStore = cookies();
  cookieStore.delete(ID_KEYS.USER_ID);
}
