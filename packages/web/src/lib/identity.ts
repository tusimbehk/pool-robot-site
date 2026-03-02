import { getAnonymousId, getUserId, setUserId, clearUserId as clearUserIdCookie } from './cookies';

export interface UserTraits {
  email?: string;
  name?: string;
  phone?: string;
  gdprConsent?: boolean;
  signupSource?: string;
  [key: string]: unknown;
}

export interface IdentityMergeRequest {
  userId: string;
  anonymousId: string;
  traits: UserTraits;
}

export interface IdentityMergeResponse {
  success: boolean;
  mergedEventsCount: number;
  userProfile?: {
    userId: string;
    email: string;
    createdAt: string;
  };
}

/**
 * 用户注册/登录时调用，合并匿名身份与用户身份
 */
export async function identifyUser(userId: string, traits: UserTraits): Promise<void> {
  const anonymousId = await getAnonymousId();

  // 1. 更新 Cookie
  await setUserId(userId);

  // 2. 发送到 Segment
  if (typeof window !== 'undefined' && (window as any).analytics) {
    (window as any).analytics.identify(userId, traits);
  }

  // 3. 发送到自己的 API（合并历史数据）
  try {
    const response = await fetch('/api/users/identify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        anonymousId,
        traits,
      }),
    });

    if (!response.ok) {
      console.error('[Identity] Failed to merge user data');
    }
  } catch (error) {
    console.error('[Identity] Error merging user data:', error);
  }
}

/**
 * 用户退出时调用
 */
export async function logoutUser(): Promise<void> {
  // 1. 清除用户 ID Cookie
  await clearUserIdCookie();

  // 2. 重置 Segment
  if (typeof window !== 'undefined' && (window as any).analytics) {
    (window as any).analytics.reset();
  }

  // 3. 追踪退出事件
  // (将在 Task 5 中实现)
}

/**
 * 获取当前用户 ID（匿名或已登录）
 */
export async function getCurrentUserId(): Promise<{ userId: string | null; anonymousId: string }> {
  return {
    userId: await getUserId(),
    anonymousId: await getAnonymousId(),
  };
}
