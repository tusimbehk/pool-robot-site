import { cookies } from 'next/headers';

export const ID_KEYS = {
  ANONYMOUS_ID: 'pool_anonymous_id',
  USER_ID: 'pool_user_id',
  SESSION_ID: 'pool_session_id',
} as const;

/**
 * These functions use next/headers and only work in Server Components
 */

/**
 * Get anonymous ID (Server Components only)
 */
export async function getAnonymousId(): Promise<string> {
  const cookieStore = await cookies();
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
export async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ID_KEYS.USER_ID)?.value || null;
}

/**
 * Set user ID (Server Components only)
 */
export async function setUserId(userId: string): Promise<void> {
  const cookieStore = await cookies();
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
export async function clearUserId(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ID_KEYS.USER_ID);
}
