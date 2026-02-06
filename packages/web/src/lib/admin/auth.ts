// packages/web/src/lib/admin/auth.ts

const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Default for development

/**
 * Generate a simple admin token (in production, use JWT)
 */
export function generateAdminToken(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return Buffer.from(`${timestamp}:${random}`).toString('base64');
}

/**
 * Verify admin password and return token
 */
export function verifyAdminPassword(password: string): { success: boolean; token?: string } {
  if (password === ADMIN_PASSWORD) {
    return { success: true, token: generateAdminToken() };
  }
  return { success: false };
}

/**
 * Validate admin token format (basic validation)
 */
export function isValidAdminToken(token: string): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [timestamp] = decoded.split(':');
    const tokenTime = parseInt(timestamp, 10);

    // Check if token is not too old (24 hours)
    const oneDay = 24 * 60 * 60 * 1000;
    return Date.now() - tokenTime < oneDay;
  } catch {
    return false;
  }
}

/**
 * Get stored admin token from request headers
 */
export function getAdminTokenFromHeaders(headers: Headers): string | null {
  const authHeader = headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Set admin token in localStorage (client-side)
 */
export function setAdminToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  }
}

/**
 * Get admin token from localStorage (client-side)
 */
export function getAdminToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  }
  return null;
}

/**
 * Clear admin token from localStorage (client-side)
 */
export function clearAdminToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
}
