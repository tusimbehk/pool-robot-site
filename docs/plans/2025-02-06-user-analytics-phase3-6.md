# 用户数据分析系统 - 阶段 3-6 实施计划摘要

> 本文档包含阶段 3-6 的核心任务概览

---

## 阶段 3: 用户画像系统 (2周)

### 核心任务

**Task 3.1: 创建用户画像表**

```sql
-- 添加到 packages/web/src/db/schema.ts
export const userProfiles = pgTable('user_profiles', {
  userId: uuid('user_id').primaryKey().references(() => users.id),
  countryCode: varchar('country_code', { length: 2 }),
  timezone: varchar('timezone', { length: 50 }),
  language: varchar('language', { length: 10 }),
  currency: varchar('currency', { length: 3 }),
  preferredPriceRange: varchar('preferred_price_range', { length: 20 }),
  productCategoryPreference: jsonb('product_category_preference'), // string[]
  tags: jsonb('tags'), // string[]
  totalOrders: integer('total_orders').default(0),
  totalSpent: decimal('total_spent', { precision: 10, scale: 2 }).default('0'),
  avgOrderValue: decimal('avg_order_value', { precision: 10, scale: 2 }),
  lastPurchaseAt: timestamp('last_purchase_at'),
  rScore: integer('r_score'), // Recency score 1-5
  fScore: integer('f_score'), // Frequency score 1-5
  mScore: integer('m_score'), // Monetary score 1-5
  segment: varchar('segment', { length: 50 }),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

**Task 3.2: RFM 分数计算逻辑**

创建 `packages/web/src/lib/analytics/rfm.ts`:

```typescript
/**
 * 计算 RFM 分数并更新用户画像
 */
export async function recalculateRFMScore(userId: string) {
  // 获取最近90天的订单
  const orders = await getOrdersByUserId(userId, 90);

  // Recency: 距离上次购买的天数
  const lastOrder = orders[0];
  const daysSinceLastPurchase = lastOrder
    ? Math.floor((Date.now() - new Date(lastOrder.processedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  // Frequency: 90天内订单数
  const frequency = orders.length;

  // Monetary: 90天内总消费
  const monetary = orders.reduce((sum, o) => sum + parseFloat(o.totalPrice), 0);

  // 计算分数 (1-5分，5分最高)
  const rScore = calculateRecencyScore(daysSinceLastPurchase);
  const fScore = calculateFrequencyScore(frequency);
  const mScore = calculateMonetaryScore(monetary);

  // 确定用户分层
  const segment = getUserSegment(rScore, fScore, mScore);

  // 更新数据库
  await updateUserProfile(userId, {
    rScore,
    fScore,
    mScore,
    segment,
  });
}

function calculateRecencyScore(days: number): number {
  if (days <= 30) return 5;
  if (days <= 60) return 4;
  if (days <= 90) return 3;
  if (days <= 180) return 2;
  return 1;
}

function calculateFrequencyScore(count: number): number {
  if (count >= 5) return 5;
  if (count >= 3) return 4;
  if (count >= 2) return 3;
  if (count >= 1) return 2;
  return 1;
}

function calculateMonetaryScore(amount: number): number {
  if (amount >= 1000) return 5;
  if (amount >= 500) return 4;
  if (amount >= 250) return 3;
  if (amount >= 100) return 2;
  return 1;
}

function getUserSegment(r: number, f: number, m: number): string {
  if (r >= 4 && f >= 4 && m >= 4) return 'VIP';
  if (r >= 3 && f >= 3 && m >= 3) return 'Loyal';
  if (r >= 2 && f >= 2 && m >= 2) return 'Potential';
  if (r >= 3 && f <= 2 && m <= 2) return 'New';
  return 'At-Risk';
}
```

**Task 3.3: 行为标签系统**

创建 `packages/web/src/lib/analytics/tagging.ts`:

```typescript
/**
 * 为用户自动分配行为标签
 */
export async function assignBehaviorTags(userId: string) {
  const tags: string[] = [];
  const profile = await getUserProfile(userId);
  const events = await getUserEvents(userId, 30); // 最近30天

  // 高价值客户: 累计消费 > $1000
  if (profile.totalSpent > 1000) {
    tags.push('high-value');
  }

  // 频繁购买者: 30天内购买 > 2次
  if (profile.totalOrders > 2) {
    tags.push('frequent-buyer');
  }

  // 价格敏感: 经常浏览打折商品
  const saleProductViews = events.filter(e =>
    e.eventName === 'Product Viewed' &&
    (e.eventProperties as any).on_sale === true
  ).length;

  if (saleProductViews > 5) {
    tags.push('price-sensitive');
  }

  // 新尝鲜: 常浏览新品
  // ... 更多标签逻辑

  await updateUserProfile(userId, { tags });
}
```

**Task 3.4: 用户画像 API**

创建 `packages/web/src/app/api/users/[id]/profile/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, params.id),
  });

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json({ profile });
}
```

---

## 阶段 4: 分析仪表板 (2周)

### 核心任务

**Task 4.1: 核心指标 API**

创建 `packages/web/src/app/api/analytics/metrics/route.ts`:

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'today';

  const metrics = await calculateMetrics(period);

  return NextResponse.json({
    visitors: metrics.visitors,
    pageViews: metrics.pageViews,
    addToCart: metrics.addToCart,
    orders: metrics.orders,
    revenue: metrics.revenue,
    conversionRate: metrics.conversionRate,
  });
}
```

**Task 4.2: 转化漏斗 API**

创建 `packages/web/src/app/api/analytics/funnel/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { funnel, dateRange } = body;

  const results = [];
  for (const step of funnel) {
    const count = await countEventsByName(step.step, dateRange);
    results.push({ step: step.step, count });
  }

  // 计算转化率
  const withRates = results.map((result, index) => ({
    ...result,
    conversionRate: index === 0 ? 100 : (result.count / results[0].count) * 100,
  }));

  return NextResponse.json({ results: withRates });
}
```

**Task 4.3: 仪表板 UI**

创建 `packages/web/src/app/analytics/page.tsx`:

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';

export default function AnalyticsDashboard() {
  const { data: metrics } = useQuery({
    queryKey: ['analytics-metrics'],
    queryFn: () => fetch('/api/analytics/metrics').then(r => r.json()),
  });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <MetricCard title="访客数" value={metrics?.visitors} />
        <MetricCard title="页面浏览" value={metrics?.pageViews} />
        <MetricCard title="加购" value={metrics?.addToCart} />
        <MetricCard title="订单" value={metrics?.orders} />
        <MetricCard title="收入" value={metrics?.revenue} format="currency" />
      </div>

      {/* 转化漏斗 */}
      <FunnelChart />
    </div>
  );
}
```

---

## 阶段 5: 自动化营销 (2周)

### 核心任务

**Task 5.1: 购物车弃单检测**

创建 `packages/web/src/lib/automation/cart-recovery.ts`:

```typescript
/**
 * 每5分钟检查一次弃单
 */
export async function checkAbandonedCarts() {
  const abandonedCarts = await db.query.userSessions.findMany({
    where: and(
      eq(userSessions.addedToCart, true),
      eq(userSessions.completedPurchase, false),
      // 查找30分钟前更新的会话
    ),
  });

  for (const session of abandonedCarts) {
    const lastUpdate = await getLastEventTime(session.id);
    const timeSinceUpdate = Date.now() - lastUpdate.getTime();

    if (timeSinceUpdate > 30 * 60 * 1000) { // 30分钟
      await sendCartRecoveryEmail(session);
    }
  }
}

/**
 * Vercel Cron Jobs 配置
 */
// 在 vercel.json 中添加:
// {
//   "crons": [{
//     "path": "/api/cron/check-abandoned-carts",
//     "schedule": "*/5 * * * *"
//   }]
// }
```

**Task 5.2: 个性化推荐**

创建 `packages/web/src/lib/analytics/recommendations.ts`:

```typescript
/**
 * 基于用户画像推荐产品
 */
export async function getPersonalizedRecommendations(userId: string) {
  const profile = await getUserProfile(userId);

  // 1. 获取用户偏好的产品类别
  const preferredCategories = profile.productCategoryPreference || [];

  // 2. 查找该类别下的热门产品
  const popularProducts = await getPopularProducts({
    categories: preferredCategories,
    limit: 6,
  });

  // 3. 排除已购买的产品
  const purchasedIds = await getPurchasedProductIds(userId);
  const recommendations = popularProducts.filter(
    p => !purchasedIds.includes(p.id)
  );

  return recommendations.slice(0, 6);
}
```

**Task 5.3: 邮件集成**

创建 `packages/web/src/lib/email/resend.ts`:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendCartRecoveryEmail(
  session: UserSession,
  discount?: string
) {
  await resend.emails.send({
    from: 'noreply@poolclean.com',
    to: session.userEmail,
    subject: 'You left something behind!',
    template: 'cart-abandonment',
    variables: {
      cartItems: session.cartItems,
      cartTotal: session.cartTotal,
      discount: discount || null,
    },
  });
}
```

---

## 阶段 6: 售后服务 (2周)

### 核心任务

**Task 6.1: 工单管理系统 Schema**

```sql
export const supportTickets = pgTable('support_tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  orderId: uuid('order_id').references(() => orders.id),
  ticketNumber: varchar('ticket_number', { length: 50 }).unique(),
  subject: varchar('subject', { length: 500 }),
  category: varchar('category', { length: 50 }),
  status: varchar('status', { length: 50 }),
  priority: varchar('priority', { length: 20 }),
  description: text('description'),
  resolution: text('resolution'),
  createdAt: timestamp('created_at').defaultNow(),
  firstResponseAt: timestamp('first_response_at'),
  resolvedAt: timestamp('resolved_at'),
  customerRating: integer('customer_rating'),
  feedback: text('feedback'),
});
```

**Task 6.2: 工单创建 API**

创建 `packages/web/src/app/api/support/tickets/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, orderId, subject, category, description, priority } = body;

  // 生成工单编号
  const ticketNumber = `TKT-${Date.now()}`;

  const [ticket] = await db.insert(supportTickets).values({
    userId,
    orderId,
    ticketNumber,
    subject,
    category,
    status: 'open',
    priority: priority || 'normal',
    description,
  }).returning();

  return NextResponse.json({ ticket });
}
```

**Task 6.3: 订单追踪**

创建 `packages/web/src/app/api/orders/[id]/tracking/route.ts`:

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, params.id),
  });

  if (!order || !order.shopifyOrderId) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // 从 Shopify 获取最新物流信息
  const shopifyOrder = await shopifyClient.order.get(order.shopifyOrderId);

  const tracking = shopifyOrder.fulfillments.map(f => ({
    trackingCompany: f.tracking_company,
    trackingNumber: f.tracking_numbers[0],
    trackingUrl: f.tracking_urls[0],
    status: f.tracking_status,
    estimatedDelivery: f.estimated_delivery_at,
  }));

  return NextResponse.json({ tracking });
}
```

---

## 实施优先级建议

### 第一批（核心功能）- 4周

1. ✅ 阶段 1: 基础追踪 (2周)
2. ✅ 阶段 2: Shopify 集成 (1周)
3. ⏭️ 阶段 3: 用户画像 - 仅 RFM 分层 (1周)

**目标**: 数据开始收集，可以查看基础指标

### 第二批（分析能力）- 2周

4. ⏭️ 阶段 4: 分析仪表板 - 核心指标和漏斗 (2周)

**目标**: 可以分析转化率，识别问题

### 第三批（自动化运营）- 2周

5. ⏭️ 阶段 5: 自动化营销 - 仅弃单恢复 (2周)

**目标**: 提升转化率，自动挽回流失用户

### 第四批（完善服务）- 2周

6. ⏭️ 阶段 6: 售后服务 - 工单系统 (2周)

**目标**: 提升服务质量

---

## 总时间线

| 批次 | 阶段 | 时间 | 累计时间 |
|------|------|------|----------|
| 1 | 阶段 1-3 | 4周 | 4周 |
| 2 | 阶段 4 | 2周 | 6周 |
| 3 | 阶段 5 | 2周 | 8周 |
| 4 | 阶段 6 | 2周 | 10周 |

---

**每个阶段完成后，建议进行一次代码审查和性能测试。**
