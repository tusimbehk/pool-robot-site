/**
 * Client-side Cookie utilities for analytics
 * Does NOT use next/headers - safe for use in any context
 */

export const ID_KEYS = {
  ANONYMOUS_ID: 'pool_anonymous_id',
  USER_ID: 'pool_user_id',
  SESSION_ID: 'pool_session_id',
} as const;

/**
 * Parse cookies from a Cookie header string
 */
export function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  return cookies;
}

/**
 * Get anonymous ID from cookie header string (for API routes)
 */
export function getAnonymousIdFromHeaders(cookieHeader: string): string {
  const cookies = parseCookies(cookieHeader || '');
  const anonymousId = cookies[ID_KEYS.ANONYMOUS_ID];

  if (anonymousId) {
    return anonymousId;
  }

  // Generate new anonymous ID if not exists
  return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get user ID from cookie header string (for API routes)
 */
export function getUserIdFromHeaders(cookieHeader: string): string | null {
  const cookies = parseCookies(cookieHeader || '');
  return cookies[ID_KEYS.USER_ID] || null;
}

/**
 * Get anonymous ID from document.cookie (client-side only)
 */
export function getAnonymousId(): string {
  if (typeof document === 'undefined') {
    return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  const cookies = parseCookies(document.cookie || '');
  const anonymousId = cookies[ID_KEYS.ANONYMOUS_ID];

  if (anonymousId) {
    return anonymousId;
  }

  // Generate and set new anonymous ID
  const newId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  document.cookie = `${ID_KEYS.ANONYMOUS_ID}=${newId}; path=/; max-age=${60 * 60 * 24 * 365 * 2}; SameSite=lax`;
  return newId;
}

/**
 * Get user ID from document.cookie (client-side only)
 */
export function getUserId(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = parseCookies(document.cookie || '');
  return cookies[ID_KEYS.USER_ID] || null;
}

/**
 * Set user ID in document.cookie (client-side only)
 */
export function setUserId(userId: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${ID_KEYS.USER_ID}=${userId}; path=/; max-age=${60 * 60 * 24 * 365 * 2}; SameSite=lax`;
}

/**
 * Clear user ID from document.cookie (client-side only)
 */
export function clearUserId(): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${ID_KEYS.USER_ID}=; path=/; max-age=0`;
}
