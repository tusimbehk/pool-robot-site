/**
 * Client-side Cookie utilities for analytics
 * Pure JavaScript implementation without Next.js dependencies
 */

export const ID_KEYS = {
  ANONYMOUS_ID: 'pool_anonymous_id',
  USER_ID: 'pool_user_id',
  SESSION_ID: 'pool_session_id',
} as const;

/**
 * Parse cookies from a cookie header string
 */
export function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.trim().split('=');
    if (parts.length >= 2) {
      const name = parts[0];
      const value = parts.slice(1).join('=');
      try {
        cookies[name] = decodeURIComponent(value);
      } catch {
        cookies[name] = value;
      }
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
  const maxAge = 60 * 60 * 24 * 365 * 2; // 2 years
  document.cookie = `${ID_KEYS.ANONYMOUS_ID}=${encodeURIComponent(newId)}; path=/; max-age=${maxAge}; SameSite=lax`;
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

  const maxAge = 60 * 60 * 24 * 365 * 2; // 2 years
  document.cookie = `${ID_KEYS.USER_ID}=${encodeURIComponent(userId)}; path=/; max-age=${maxAge}; SameSite=lax`;
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
