# 用户数据分析系统 - 阶段 1: 基础追踪

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 建立数据收集基础，实现双写策略（Segment + 自建 API），完整追踪用户行为

**Architecture:**
- 前端双写：同时发送事件到 Segment 和自建 API
- PostgreSQL 存储原始事件和用户数据
- 匿名用户与登录用户通过 ID 关联

**Tech Stack:** Next.js 15 API Routes, PostgreSQL (Neon), Segment Analytics.js, TypeScript

---

## Task 1: 数据库 Schema 创建

**Files:**
- Create: `packages/web/src/db/schema.ts`

**Step 1: 安装依赖**

```bash
cd packages/web
pnpm add drizzle-orm
pnpm add -D @types/pg postgres
```

**Step 2: 创建数据库连接配置**

创建 `packages/web/src/db/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const db = drizzle(postgres(connectionString));
```

**Step 3: 创建基础表结构**

创建 `packages/web/src/db/schema.ts`:

```typescript
import { pgTable, uuid, varchar, timestamp, text, jsonb, integer, boolean, decimal } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique(),
  phone: varchar('phone', { length: 50 }),
  shopifyCustomerId: varchar('shopify_customer_id', { length: 255 }),
  signupSource: varchar('signup_source', { length: 50 }),
  gdprConsent: boolean('gdpr_consent').default(false),
  dataConsentGivenAt: timestamp('data_consent_given_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastSeenAt: timestamp('last_seen_at'),
});

export const userEvents = pgTable('user_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  anonymousId: varchar('anonymous_id', { length: 255 }),
  userId: uuid('user_id').references(() => users.id),
  eventName: varchar('event_name', { length: 100 }).notNull(),
  eventProperties: jsonb('event_properties'),
  pageUrl: text('page_url'),
  pageTitle: varchar('page_title', { length: 500 }),
  referrerUrl: text('referrer_url'),
  utmSource: varchar('utm_source', { length: 50 }),
  utmMedium: varchar('utm_medium', { length: 50 }),
  utmCampaign: varchar('utm_campaign', { length: 50 }),
  deviceType: varchar('device_type', { length: 20 }),
  browser: varchar('browser', { length: 50 }),
  os: varchar('os', { length: 50 }),
  countryCode: varchar('country_code', { length: 2 }),
  city: varchar('city', { length: 100 }),
  occurredAt: timestamp('occurred_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  anonymousId: varchar('anonymous_id', { length: 255 }),
  userId: uuid('user_id').references(() => users.id),
  sessionStart: timestamp('session_start').defaultNow(),
  sessionEnd: timestamp('session_end'),
  pageViews: integer('page_views').default(0),
  durationSeconds: integer('duration_seconds'),
  entryPage: text('entry_page'),
  exitPage: text('exit_page'),
  trafficSource: varchar('traffic_source', { length: 50 }),
  addedToCart: boolean('added_to_cart').default(false),
  startedCheckout: boolean('started_checkout').default(false),
  completedPurchase: boolean('completed_purchase').default(false),
});
```

**Step 4: 配置 Drizzle Kit**

创建 `packages/web/drizzle.config.ts`:

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

**Step 5: 添加数据库命令到 package.json**

在 `packages/web/package.json` 的 scripts 中添加:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

**Step 6: 推送 schema 到数据库**

```bash
pnpm db:push
```

**Step 7: 验证表创建成功**

连接到数据库并验证:

```bash
psql $DATABASE_URL -c "\dt"
```

Expected output: Should see `users`, `user_events`, `user_sessions` tables.

**Step 8: Commit**

```bash
git add packages/web/src/db packages/web/drizzle.config.ts packages/web/package.json
git commit -m "feat: create database schema for user analytics"
```

---

## Task 2: 身份管理系统

**Files:**
- Create: `packages/web/src/lib/identity.ts`
- Create: `packages/web/src/lib/cookies.ts`

**Step 1: 创建 Cookie 工具函数**

创建 `packages/web/src/lib/cookies.ts`:

```typescript
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
```

**Step 2: 创建身份管理核心函数**

创建 `packages/web/src/lib/identity.ts`:

```typescript
import { getAnonymousId, getUserId, setUserId } from './cookies';
import { trackEvent } from './analytics';

export interface UserTraits {
  email?: string;
  name?: string;
  phone?: string;
  [key: string]: unknown;
}

/**
 * 用户注册/登录时调用，合并匿名身份与用户身份
 */
export async function identifyUser(userId: string, traits: UserTraits): Promise<void> {
  const anonymousId = getAnonymousId();

  // 1. 更新 Cookie
  setUserId(userId);

  // 2. 发送到 Segment
  if (typeof window !== 'undefined' && window.analytics) {
    window.analytics.identify(userId, traits);
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
export function logoutUser(): void {
  // 1. 清除用户 ID Cookie
  clearUserId();

  // 2. 重置 Segment
  if (typeof window !== 'undefined' && window.analytics) {
    window.analytics.reset();
  }

  // 3. 追踪退出事件
  trackEvent('User Logged Out', {});
}

/**
 * 获取当前用户 ID（匿名或已登录）
 */
export function getCurrentUserId(): { userId: string | null; anonymousId: string } {
  return {
    userId: getUserId(),
    anonymousId: getAnonymousId(),
  };
}
```

**Step 3: 添加类型定义**

在 `packages/web/src/lib/identity.ts` 中添加:

```typescript
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
```

**Step 4: 创建测试文件**

创建 `packages/web/src/lib/identity.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { identifyUser, getCurrentUserId } from './identity';

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn((name) => {
      if (name === 'pool_anonymous_id') return { value: 'test_anon_123' };
      return null;
    }),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, mergedEventsCount: 5 }),
  })
) as any;

describe('Identity Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get current user ID and anonymous ID', () => {
    const result = getCurrentUserId();
    expect(result.anonymousId).toBe('test_anon_123');
    expect(result.userId).toBeNull();
  });

  it('should identify user and merge data', async () => {
    await identifyUser('user_123', { email: 'test@example.com' });

    expect(global.fetch).toHaveBeenCalledWith('/api/users/identify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user_123',
        anonymousId: 'test_anon_123',
        traits: { email: 'test@example.com' },
      }),
    });
  });
});
```

**Step 5: 运行测试**

```bash
pnpm test src/lib/identity.test.ts
```

**Step 6: Commit**

```bash
git add packages/web/src/lib/identity.ts packages/web/src/lib/cookies.ts packages/web/src/lib/identity.test.ts
git commit -m "feat: add identity management system"
```

---

## Task 3: 事件追踪 API

**Files:**
- Create: `packages/web/src/app/api/events/track/route.ts`

**Step 1: 创建 API 路由处理器**

创建 `packages/web/src/app/api/events/track/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userEvents } from '@/db/schema';
import { validateEventPayload } from '@/lib/analytics/validation';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证请求体
    const validation = validateEventPayload(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: validation.errors },
        { status: 400 }
      );
    }

    const { event, properties, anonymousId, userId, context, timestamp } = validation.data;

    // 存储事件到数据库
    const [newEvent] = await db.insert(userEvents).values({
      anonymousId,
      userId: userId || null,
      eventName: event,
      eventProperties: properties,
      pageUrl: context?.page,
      pageTitle: context?.pageTitle,
      referrerUrl: context?.referrer,
      utmSource: context?.utmSource,
      utmMedium: context?.utmMedium,
      utmCampaign: context?.utmCampaign,
      deviceType: context?.device?.type,
      browser: context?.device?.browser,
      os: context?.device?.os,
      countryCode: context?.location?.countryCode,
      city: context?.location?.city,
      occurredAt: new Date(timestamp),
    }).returning();

    return NextResponse.json({
      success: true,
      eventId: newEvent.id,
    });
  } catch (error) {
    console.error('[Events API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Step 2: 创建验证函数**

创建 `packages/web/src/lib/analytics/validation.ts`:

```typescript
import { z } from 'zod';

export const EventPayloadSchema = z.object({
  event: z.string().min(1).max(100),
  properties: z.record(z.unknown()),
  anonymousId: z.string().min(1),
  userId: z.string().uuid().optional(),
  context: z.object({
    page: z.string().url().optional(),
    pageTitle: z.string().max(500).optional(),
    referrer: z.string().optional(),
    utmSource: z.string().max(50).optional(),
    utmMedium: z.string().max(50).optional(),
    utmCampaign: z.string().max(50).optional(),
    device: z.object({
      type: z.enum(['desktop', 'mobile', 'tablet']).optional(),
      browser: z.string().max(50).optional(),
      os: z.string().max(50).optional(),
    }).optional(),
    location: z.object({
      countryCode: z.string().length(2).optional(),
      city: z.string().max(100).optional(),
    }).optional(),
  }).optional(),
  timestamp: z.string().datetime().optional(),
});

export type EventPayload = z.infer<typeof EventPayloadSchema>;

export function validateEventPayload(data: unknown) {
  return EventPayloadSchema.safeParse(data);
}
```

**Step 3: 添加类型导出**

更新 `packages/web/src/lib/analytics/index.ts`:

```typescript
export * from './validation';
export * from './events';
export * from './client';
```

**Step 4: 测试 API**

```bash
# 启动开发服务器
pnpm dev

# 在另一个终端测试 API
curl -X POST http://localhost:3000/api/events/track \
  -H "Content-Type: application/json" \
  -d '{
    "event": "Test Event",
    "properties": { "test": true },
    "anonymousId": "test_anon_123",
    "context": {
      "page": "http://localhost:3000"
    }
  }'
```

**Step 5: Commit**

```bash
git add packages/web/src/app/api/events packages/web/src/lib/analytics
git commit -m "feat: add event tracking API endpoint"
```

---

## Task 4: 用户身份合并 API

**Files:**
- Create: `packages/web/src/app/api/users/identify/route.ts`

**Step 1: 创建身份合并处理器**

创建 `packages/web/src/app/api/users/identify/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, userEvents } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, anonymousId, traits } = body;

    if (!userId || !anonymousId || !traits) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. 检查用户是否已存在
    let user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    // 2. 如果不存在，创建用户
    if (!user) {
      const [newUser] = await db.insert(users).values({
        id: userId,
        email: traits.email as string,
        phone: traits.phone as string,
        gdprConsent: traits.gdprConsent as boolean || false,
        dataConsentGivenAt: traits.gdprConsent ? new Date() : null,
        signupSource: traits.signupSource as string,
      }).returning();

      user = newUser;
    }

    // 3. 将匿名事件关联到用户 ID
    const updatedEvents = await db
      .update(userEvents)
      .set({ userId: userId })
      .where(and(
        eq(userEvents.anonymousId, anonymousId),
        eq(userEvents.userId, null)
      ))
      .returning();

    // 4. 更新用户最后活跃时间
    await db
      .update(users)
      .set({ lastSeenAt: new Date() })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      mergedEventsCount: updatedEvents.length,
      userProfile: {
        userId: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Identify API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Step 2: 测试身份合并**

```bash
curl -X POST http://localhost:3000/api/users/identify \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "anonymousId": "test_anon_123",
    "traits": {
      "email": "test@example.com",
      "name": "Test User"
    }
  }'
```

**Step 3: 验证数据库中的合并**

```bash
psql $DATABASE_URL -c "SELECT id, user_id, event_name FROM user_events WHERE anonymous_id = 'test_anon_123' LIMIT 5;"
```

Expected: Events should now have `userId` set instead of `null`.

**Step 4: Commit**

```bash
git add packages/web/src/app/api/users/identify
git commit -m "feat: add user identity merge API"
```

---

## Task 5: 前端追踪 SDK（双写策略）

**Files:**
- Modify: `packages/web/src/lib/analytics.ts`

**Step 1: 修改现有分析库**

更新 `packages/web/src/lib/analytics.ts`:

```typescript
import { AnalyticsBrowser } from '@segment/analytics-next';
import { getAnonymousId, getUserId } from './cookies';

// Segment 初始化
export const analytics = AnalyticsBrowser.load({
  writeKey: process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY || '',
});

/**
 * 双写策略：同时发送到 Segment 和自建 API
 */
export async function trackEvent(
  eventName: string,
  properties: Record<string, unknown>
): Promise<void> {
  const anonymousId = getAnonymousId();
  const userId = getUserId();

  // 1. 发送到 Segment（现有逻辑）
  analytics.track(eventName, properties);

  // 2. 同时发送到自己的 API
  const payload = {
    event: eventName,
    properties,
    anonymousId,
    userId: userId || undefined,
    context: {
      page: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof window !== 'undefined' ? document.referrer : '',
      device: getDeviceInfo(),
    },
    timestamp: new Date().toISOString(),
  };

  // 非阻塞发送
  fetch('/api/events/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch((err) => {
    // 静默失败，不影响用户体验
    console.error('[Analytics] Failed to send event:', err);
  });
}

/**
 * 获取设备信息
 */
function getDeviceInfo() {
  if (typeof window === 'undefined') {
    return { type: 'unknown' };
  }

  const ua = navigator.userAgent;
  const type = /Mobile|Android|iPhone/i.test(ua) ? 'mobile' :
               /Tablet|iPad/i.test(ua) ? 'tablet' : 'desktop';

  return {
    type,
    browser: detectBrowser(),
    os: detectOS(),
    screen: `${window.screen.width}x${window.screen.height}`,
  };
}

function detectBrowser(): string {
  if (typeof window === 'undefined') return 'unknown';

  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown';
}

function detectOS(): string {
  if (typeof window === 'undefined') return 'unknown';

  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('iOS')) return 'iOS';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('Linux')) return 'Linux';
  return 'Unknown';
}
```

**Step 2: 更新 useAnalytics hook**

修改 `packages/web/src/hooks/use-analytics.ts`，使用新的 `trackEvent`:

```typescript
import { useCallback } from 'react';
import { trackEvent } from '@/lib/analytics';

export function useAnalytics() {
  const track = useCallback((event: string, properties?: Record<string, unknown>) => {
    trackEvent(event, properties);
  }, []);

  const trackProduct = useCallback((product: {
    id: string;
    name: string;
    price: number;
    currency: string;
    category?: string;
    variant?: string;
  }) => {
    trackEvent('Product Viewed', {
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      currency: product.currency,
      category: product.category,
      variant: product.variant,
    });
  }, [track]);

  const trackAddToCart = useCallback((product: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    currency: string;
  }) => {
    trackEvent('Product Added', {
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      quantity: product.quantity,
      currency: product.currency,
    });
  }, [track]);

  // ... 其他追踪方法类似更新

  return {
    track,
    trackProduct,
    trackAddToCart,
    // ...
  };
}
```

**Step 3: 在浏览器中验证双写**

1. 打开浏览器 DevTools
2. 进入 Network 标签
3. 触发一个事件（如浏览产品）
4. 验证有两个请求：
   - 一个到 `cdn.segment.com`
   - 一个到 `/api/events/track`

**Step 4: Commit**

```bash
git add packages/web/src/lib/analytics.ts packages/web/src/hooks/use-analytics.ts
git commit -m "feat: implement dual-write strategy for event tracking"
```

---

## Task 6: Cookie 同意横幅

**Files:**
- Create: `packages/web/src/components/cookie-banner.tsx`

**Step 1: 创建 Cookie 同意组件**

创建 `packages/web/src/components/cookie-banner.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';

export interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const DEFAULT_CONSENT: ConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [consent, setConsent] = useState<ConsentPreferences>(DEFAULT_CONSENT);

  useEffect(() => {
    // 检查是否已存储同意
    const stored = localStorage.getItem('cookie-consent');
    if (!stored) {
      setShowBanner(true);
    } else {
      setConsent(JSON.parse(stored));
    }
  }, []);

  const handleAccept = (type: 'all' | 'essential') => {
    const newConsent: ConsentPreferences = type === 'all'
      ? { necessary: true, analytics: true, marketing: true }
      : { necessary: true, analytics: false, marketing: false };

    setConsent(newConsent);
    localStorage.setItem('cookie-consent', JSON.stringify(newConsent));
    setShowBanner(false);

    // 根据同意启用/禁用追踪
    if (newConsent.analytics) {
      enableAnalytics();
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4 shadow-lg">
      <div className="container mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <p className="text-sm">
            我们使用 Cookie 来改善您的体验并分析网站使用情况。
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleAccept('essential')}>
            仅必要
          </Button>
          <Button size="sm" onClick={() => handleAccept('all')}>
            接受所有
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href="/privacy">隐私政策</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

function enableAnalytics() {
  // 初始化 Segment Analytics
  if (typeof window !== 'undefined' && window.analytics) {
    window.analytics.load(process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY || '');
  }
}
```

**Step 2: 在根布局中添加横幅**

修改 `packages/web/src/app/layout.tsx`:

```typescript
import { CookieBanner } from '@/components/cookie-banner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
```

**Step 3: 测试 Cookie 横幅**

1. 清除 localStorage: `localStorage.clear()`
2. 刷新页面
3. 应该看到 Cookie 横幅出现在底部
4. 点击"接受所有"，横幅应该消失
5. 刷新页面，横幅不应该再出现

**Step 4: Commit**

```bash
git add packages/web/src/components/cookie-banner.tsx packages/web/src/app/layout.tsx
git commit -m "feat: add GDPR compliant cookie consent banner"
```

---

## 完成标准

阶段 1 完成后，你应该能够：

1. ✅ 数据库表创建成功，可以查询
2. ✅ 前端追踪事件同时发送到 Segment 和自建 API
3. ✅ 用户注册/登录时，匿名历史数据正确关联到用户 ID
4. ✅ Cookie 同意横幅正常工作
5. ✅ 可以在数据库中查询到用户行为事件

---

## 测试命令

```bash
# 运行所有测试
pnpm test

# 检查数据库连接
pnpm db:studio

# 查看事件数据
psql $DATABASE_URL -c "SELECT * FROM user_events ORDER BY occurred_at DESC LIMIT 10;"
```
