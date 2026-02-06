import { cookies } from 'next/headers';

export const ID_KEYS = {
  ANONYMOUS_ID: 'pool_anonymous_id',
  USER_ID: 'pool_user_id',
  SESSION_ID: 'pool_session_id',
} as const;

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

export function getUserId(): string | null {
  const cookieStore = cookies();
  return cookieStore.get(ID_KEYS.USER_ID)?.value || null;
}

export function setUserId(userId: string): void {
  const cookieStore = cookies();
  cookieStore.set(ID_KEYS.USER_ID, userId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365 * 2, // 2 years
  });
}

export function clearUserId(): void {
  const cookieStore = cookies();
  cookieStore.delete(ID_KEYS.USER_ID);
}
