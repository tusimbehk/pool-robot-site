# 用户数据分析与运营系统设计文档

> **项目目标**: 建立自主可控的用户数据分析系统，实现从进站到售后全流程的用户行为追踪与分析，提升转化率和用户终身价值。

> **创建日期**: 2025-02-06

> **状态**: 设计阶段

---

## 一、核心目标

### 业务目标
1. **提升转化率** - 完整追踪从进站到下单的每个环节，识别流失点
2. **提升复购率** - 基于用户画像进行个性化推荐和精准营销
3. **数据自主可控** - 不依赖第三方平台，完全掌控用户数据
4. **数字化运营** - 售后服务全流程数字化，提升服务质量

### 技术原则
- **混合架构** - 快速启动（Segment）+ 数据自主（自建数据库）
- **身份为中心** - 匿名用户与登录用户数据无缝合并
- **隐私合规** - 内置 GDPR/CCPA 合规功能
- **支付分离** - 支付数据由 Shopify 处理，我们不接触敏感信息

---

## 二、整体架构

### 2.1 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户触点                                │
├─────────────────────────────────────────────────────────────────┤
│  网站 | 移动端 | 邮件 | SMS | 社交媒体 | 广告                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       前端追踪层                                │
├─────────────────────────────────────────────────────────────────┤
│  • 双写策略: Segment + 自建 API                                 │
│  • 身份管理: 匿名 ID ↔ 用户 ID                                  │
│  • 自动追踪: 页面浏览、滚动、点击等                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────┬────────────────────────────────────┐
│      Segment (CDP)        │       自建数据平台                  │
├──────────────────────────┼────────────────────────────────────┤
│ • 实时数据分发            │ • PostgreSQL (数据仓库)            │
│ • GA4, Meta, Ads         │ • 用户画像系统                      │
│ • 邮件/SMS 工具          │ • 分析仪表板                        │
│ • 合规工具 (GDPR)        │ • 售后服务系统                      │
└──────────────────────────┴────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       Shopify 集成                              │
├─────────────────────────────────────────────────────────────────┤
│  • Webhook 接收订单更新                                         │
│  • API 同步产品/客户信息                                         │
│  • 结账重定向                                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 数据流向

```
用户行为
   ↓
前端 SDK 捕获
   ↓
   ├─→ Segment → [多目的地]
   │                ├─→ Google Analytics
   │                ├─→ Meta Pixel
   │                ├─→ Google Ads
   │                └─→ Klaviyo (邮件)
   │
   └─→ 自建 API → PostgreSQL
                    ├─→ 原始事件表
                    ├─→ 用户画像表
                    └─→ 订单数据表
```

### 2.3 身份管理流程

```
首次访问
   ↓
生成 anonymous_id (存储在 localStorage)
   ↓
收集所有行为数据 (关联 anonymous_id)
   ↓
注册/登录
   ↓
生成 user_id
   ↓
合并历史数据 (anonymous_id → user_id)
   ↓
完整用户行为轨迹
```

---

## 三、数据库设计

### 3.1 核心数据表

#### users - 用户表
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  password_hash VARCHAR(255),
  shopify_customer_id VARCHAR(255),

  signup_source VARCHAR(50),
  referral_code VARCHAR(50),

  gdpr_consent BOOLEAN DEFAULT false,
  data_consent_given_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP
);
```

#### user_profiles - 用户画像表
```sql
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),

  -- 基础画像
  country_code VARCHAR(2),
  timezone VARCHAR(50),
  language VARCHAR(10),
  currency VARCHAR(3),

  -- 购买偏好
  preferred_price_range VARCHAR(20),
  product_category_preference TEXT[],

  -- 行为标签
  tags TEXT[],

  -- 统计指标
  total_orders INT DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  avg_order_value DECIMAL(10,2),
  last_purchase_at TIMESTAMP,

  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### user_events - 行为事件表
```sql
CREATE TABLE user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id VARCHAR(255),
  user_id UUID REFERENCES users(id),

  event_name VARCHAR(100) NOT NULL,
  event_properties JSONB,

  -- 上下文信息
  page_url TEXT,
  page_title VARCHAR(500),
  referrer_url TEXT,
  utm_source VARCHAR(50),
  utm_medium VARCHAR(50),
  utm_campaign VARCHAR(50),

  -- 设备信息
  device_type VARCHAR(20),
  browser VARCHAR(50),
  os VARCHAR(50),
  screen_resolution VARCHAR(20),

  -- 地理信息
  country_code VARCHAR(2),
  city VARCHAR(100),

  occurred_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_user_id ON user_events(user_id);
CREATE INDEX idx_events_anonymous_id ON user_events(anonymous_id);
CREATE INDEX idx_events_name ON user_events(event_name);
CREATE INDEX idx_events_occurred_at ON user_events(occurred_at DESC);
```

#### user_sessions - 访问会话表
```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id VARCHAR(255),
  user_id UUID REFERENCES users(id),

  session_start TIMESTAMP DEFAULT NOW(),
  session_end TIMESTAMP,
  page_views INT DEFAULT 0,
  duration_seconds INT,

  entry_page TEXT,
  exit_page TEXT,
  traffic_source VARCHAR(50),

  added_to_cart BOOLEAN DEFAULT false,
  started_checkout BOOLEAN DEFAULT false,
  completed_purchase BOOLEAN DEFAULT false
);
```

#### orders - 订单表
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  shopify_order_id VARCHAR(255) UNIQUE,
  shopify_order_number VARCHAR(50),

  status VARCHAR(50),
  financial_status VARCHAR(50),
  fulfillment_status VARCHAR(50),

  subtotal_price DECIMAL(10,2),
  total_tax DECIMAL(10,2),
  total_shipping DECIMAL(10,2),
  total_price DECIMAL(10,2),
  currency VARCHAR(3),

  shipping_address JSONB,
  billing_address JSONB,

  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### order_items - 订单商品表
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  shopify_product_id VARCHAR(255),
  shopify_variant_id VARCHAR(255),

  product_title VARCHAR(255),
  variant_title VARCHAR(255),
  sku VARCHAR(100),
  quantity INT,
  price DECIMAL(10,2),
  total_discount DECIMAL(10,2)
);
```

#### support_tickets - 售后工单表
```sql
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  order_id UUID REFERENCES orders(id),

  ticket_number VARCHAR(50) UNIQUE,
  subject VARCHAR(500),
  category VARCHAR(50),
  status VARCHAR(50),
  priority VARCHAR(20),

  description TEXT,
  resolution TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  first_response_at TIMESTAMP,
  resolved_at TIMESTAMP,

  customer_rating INT,
  feedback TEXT
);
```

#### cart_abandonment - 购物车弃单表
```sql
CREATE TABLE cart_abandonment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  anonymous_id VARCHAR(255),

  cart_items JSONB,
  cart_total DECIMAL(10,2),
  item_count INT,

  recovery_status VARCHAR(50),
  recovery_email_sent_at TIMESTAMP,
  recovered_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.2 数据关系

```
users (1) ----< (1) user_profiles
  |
  | (1)
  |
  +----< (N) user_events
  |
  +----< (N) user_sessions
  |
  +----< (N) orders (1) ----< (N) order_items
  |
  +----< (N) support_tickets
  |
  +----< (N) cart_abandonment
```

---

## 四、前端追踪设计

### 4.1 双写策略

```typescript
// src/lib/analytics.ts

// 双写函数
export function trackEvent(eventName: string, properties: Record<string, unknown>) {
  // 1. 发送到 Segment
  analytics.track(eventName, properties);

  // 2. 同时发送到自己的 API
  trackToOwnAPI(eventName, properties);
}

async function trackToOwnAPI(eventName: string, properties: Record<string, unknown>) {
  const anonymousId = getAnonymousId();
  const userId = getUserId();

  await fetch('/api/events/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: eventName,
      properties,
      anonymousId,
      userId,
      context: {
        page: window.location.href,
        referrer: document.referrer,
        device: getDeviceInfo(),
      },
      timestamp: new Date().toISOString(),
    }),
  }).catch(err => {
    // 静默失败，不影响用户体验
    console.error('[Analytics] Failed to send event:', err);
  });
}
```

### 4.2 身份管理

```typescript
// src/lib/identity.ts

const ID_KEYS = {
  ANONYMOUS_ID: 'pool_anonymous_id',
  USER_ID: 'pool_user_id',
};

// 获取或生成匿名 ID
export function getAnonymousId(): string {
  let id = localStorage.getItem(ID_KEYS.ANONYMOUS_ID);

  if (!id) {
    id = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(ID_KEYS.ANONYMOUS_ID, id);

    trackEvent('First Visit', {
      referrer: document.referrer,
      utm_source: getUTMParam('utm_source'),
      utm_medium: getUTMParam('utm_medium'),
      utm_campaign: getUTMParam('utm_campaign'),
    });
  }

  return id;
}

// 用户登录时调用 - 合并身份
export async function identifyUser(userId: string, traits: Record<string, unknown>) {
  localStorage.setItem(ID_KEYS.USER_ID, userId);

  const anonymousId = getAnonymousId();

  // 1. Segment identify
  analytics.identify(userId, traits);

  // 2. 自己的 API - 合并历史数据
  await fetch('/api/users/identify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, anonymousId, traits }),
  });
}
```

### 4.3 关键追踪事件

| 事件名称 | 触发时机 | 关键属性 |
|---------|---------|---------|
| First Visit | 首次访问网站 | referrer, utm_* |
| Page Viewed | 页面加载 | page, path |
| Products Searched | 用户搜索 | query, results_count |
| Product Viewed | 查看产品详情 | product_id, price, category |
| Product Added | 加入购物车 | product_id, quantity, cart_value |
| Product Removed | 移除购物车商品 | product_id, quantity |
| Cart Abandoned | 购物车30分钟无活动 | cart_id, cart_value |
| Checkout Started | 开始结账 | cart_id, revenue |
| Order Completed | 订单完成 | order_id, revenue |
| Product Shared | 分享产品 | product_id, platform |

---

## 五、后端 API 设计

### 5.1 事件追踪 API

#### POST /api/events/track
接收前端发送的行为事件

```typescript
// 请求体
{
  event: string,           // 事件名称
  properties: Record<string, unknown>,  // 事件属性
  anonymousId: string,     // 匿名 ID
  userId?: string,         // 用户 ID（可选）
  context: {
    page: string,
    referrer: string,
    device: DeviceInfo,
    location?: LocationInfo
  },
  timestamp: string
}

// 响应
{
  success: true,
  eventId: string
}
```

### 5.2 身份管理 API

#### POST /api/users/identify
用户注册/登录时合并身份

```typescript
// 请求体
{
  userId: string,          // 新用户 ID
  anonymousId: string,     // 之前的匿名 ID
  traits: {
    email: string,
    name?: string,
    phone?: string,
    // ... 其他用户属性
  }
}

// 响应
{
  success: true,
  mergedEventsCount: number,  // 合并的历史事件数
  userProfile: UserProfile
}
```

#### GET /api/users/:id/profile
获取用户画像

```typescript
// 响应
{
  userId: string,
  email: string,
  profile: {
    country: string,
    currency: string,
    tags: string[],
    totalOrders: number,
    totalSpent: number,
    avgOrderValue: number,
    lastPurchaseAt: string
  },
  recommendations: {
    products: Product[],
    content: string[]
  }
}
```

### 5.3 分析查询 API

#### POST /api/analytics/funnel
转化漏斗分析

```typescript
// 请求体
{
  funnel: [
    { step: 'Page Viewed', filter: { page: '/products' } },
    { step: 'Product Viewed' },
    { step: 'Product Added' },
    { step: 'Checkout Started' },
    { step: 'Order Completed' }
  ],
  dateRange: {
    from: '2025-01-01',
    to: '2025-02-06'
  }
}

// 响应
{
  results: [
    { step: 'Page Viewed', count: 10000, conversionRate: 100 },
    { step: 'Product Viewed', count: 3000, conversionRate: 30 },
    { step: 'Product Added', count: 900, conversionRate: 9 },
    { step: 'Checkout Started', count: 450, conversionRate: 4.5 },
    { step: 'Order Completed', count: 270, conversionRate: 2.7 }
  ],
  dropoffs: [
    { from: 'Page Viewed', to: 'Product Viewed', dropRate: 70 },
    { from: 'Product Viewed', to: 'Product Added', dropRate: 70 },
    // ...
  ]
}
```

---

## 六、Webhook 集成

### 6.1 Shopify Webhook 配置

在 Shopify Admin 中配置以下 Webhooks：

| 事件主题 | 端点 | 用途 |
|---------|------|------|
| orders/create | /api/webhooks/shopify/order-created | 新订单通知 |
| orders/updated | /api/webhooks/shopify/order-updated | 订单状态更新 |
| customers/create | /api/webhooks/shopify/customer-created | 新客户注册 |
| customers/update | /api/webhooks/shopify/customer-updated | 客户信息更新 |
| app/uninstalled | /api/webhooks/shopify/app-uninstalled | 应用卸载通知 |

### 6.2 Webhook 处理逻辑

```typescript
// src/app/api/webhooks/shopify/order-created/route.ts

import { verifyShopifyWebhook } from '@/lib/shopify/webhook';
import { syncOrderToDatabase } from '@/lib/orders/sync';

export async function POST(request: Request) {
  // 1. 验证 Webhook 真实性
  const isValid = await verifyShopifyWebhook(request);
  if (!isValid) {
    return Response.json({ error: 'Invalid webhook' }, { status: 401 });
  }

  // 2. 解析订单数据
  const order = await request.json();

  // 3. 同步到数据库
  await syncOrderToDatabase(order);

  // 4. 触发后续流程
  await Promise.all([
    // 更新用户画像
    updateUserProfile(order.customer_id, order),
    // 发送订单确认邮件
    sendOrderConfirmationEmail(order),
    // 更新分析数据
    updateAnalyticsData(order),
  ]);

  return Response.json({ success: true });
}
```

### 6.3 订单同步流程

```
Shopify 订单创建
   ↓
Webhook 通知
   ↓
验证签名
   ↓
解析订单数据
   ↓
同步到 orders 表
   ↓
同步到 order_items 表
   ↓
更新 user_profiles:
   - total_orders += 1
   - total_spent += order_total
   - last_purchase_at = now
   - 重新计算 avg_order_value
   ↓
触发订单完成事件
   ↓
发送确认邮件/SMS
```

---

## 七、用户画像系统

### 7.1 画像维度

#### 基础属性
- 地理位置（国家、城市）
- 语言偏好
- 货币偏好
- 时区

#### 行为标签
- `high-value` - 高价值客户（累计消费 > $1000）
- `frequent-buyer` - 频繁购买者（30天内购买 > 2次）
- `price-sensitive` - 价格敏感（常购买打折商品）
- `early-adopter` - 新品尝鲜者
- `at-risk` - 流失风险（30天未访问）
- `churned` - 已流失（90天未访问）

#### RFM 分层
- **R (Recency)** - 最近一次购买时间
- **F (Frequency)** - 购买频率
- **M (Monetary)** - 消费金额

基于 RFM 值将用户分为：
- **VIP 客户** - 高R、高F、高M
- **忠诚客户** - 高R、中F、中M
- **潜力客户** - 中R、低F、中M
- **新客户** - 低R、低F、低M
- **流失客户** - 低R、低F、低M

### 7.2 实时更新机制

```typescript
// src/lib/user-profile/updater.ts

export async function updateUserProfile(userId: string, event: Event) {
  switch (event.name) {
    case 'Order Completed':
      await updatePurchaseStats(userId, event.data);
      await recalculateRFMScore(userId);
      await assignBehaviorTags(userId);
      break;

    case 'Product Viewed':
      await updateProductPreferences(userId, event.data);
      break;

    case 'Page Viewed':
      await updateLastSeen(userId);
      await checkChurnRisk(userId);
      break;
  }
}

// RFM 分数计算
async function recalculateRFMScore(userId: string) {
  const orders = await getOrdersByUserId(userId, 90); // 最近90天

  const recency = daysSinceLastOrder(orders);
  const frequency = orders.length;
  const monetary = sumOrderTotal(orders);

  // 计算 RFM 分数（1-5分）
  const rScore = calculateRecencyScore(recency);
  const fScore = calculateFrequencyScore(frequency);
  const mScore = calculateMonetaryScore(monetary);

  // 存储到 user_profiles
  await saveRFMScore(userId, { r: rScore, f: fScore, m: mScore });

  // 更新用户分层
  const segment = getUserSegment(rScore, fScore, mScore);
  await updateUserSegment(userId, segment);
}

function getUserSegment(r: number, f: number, m: number): string {
  if (r >= 4 && f >= 4 && m >= 4) return 'VIP';
  if (r >= 3 && f >= 3 && m >= 3) return 'Loyal';
  if (r >= 2 && f >= 2 && m >= 2) return 'Potential';
  if (r >= 3 && f <= 2 && m <= 2) return 'New';
  return 'At-Risk';
}
```

---

## 八、数据分析仪表板

### 8.1 核心指标看板

#### 实时指标
```
┌─────────────────────────────────────────────────────┐
│ 今日概览 (2025-02-06)                               │
├─────────────────────────────────────────────────────┤
│ 访客数:     1,234  ↑ 12% vs 昨天                   │
│ 页面浏览:   5,678  ↑ 8% vs 昨天                    │
│ 加入购物车:   156  ↑ 15% vs 昨天                   │
│ 订单数:       12  ↓ 5% vs 昨天                    │
│ 收入:     $4,560  ↓ 3% vs 昨天                    │
└─────────────────────────────────────────────────────┘
```

#### 转化漏斗
```
访客 → 产品浏览 → 加购 → 结账 → 成交
100%    45%        12%    8%     2.7%

流失分析:
- 访客 → 产品浏览: 55% 流失
- 产品浏览 → 加购: 73% 流失 ← 优化重点
- 加购 → 结账: 33% 流失
- 结账 → 成交: 66% 流失
```

#### 用户分层
```
┌──────────┬───────┬─────────┬───────────┐
│ 分层     │ 用户数 │ 占比    │ 平均消费  │
├──────────┼───────┼─────────┼───────────┤
│ VIP      │ 45    │ 2.3%    │ $1,890    │
│ Loyal    │ 234   │ 12.1%   │ $680      │
│ Potential│ 567   │ 29.3%   │ $320      │
│ New      │ 891   │ 46.1%   │ $156      │
│ At-Risk  │ 193   │ 10.0%   │ $89       │
└──────────┴───────┴─────────┴───────────┘
```

### 8.2 用户详情页

```
用户: john@example.com
┌─────────────────────────────────────────────────────────────┐
│ 基础信息                                                   │
│ ├─ 注册时间: 2024-12-01                                    │
│ ├─ 最后访问: 2025-02-06 (2小时前)                          │
│ ├─ 位置: 美国, 加州                                        │
│ └─ 设备: iPhone 15, Safari                                 │
├─────────────────────────────────────────────────────────────┤
│ 购买统计                                                   │
│ ├─ 总订单: 3                                               │
│ ├─ 总消费: $1,340                                          │
│ ├─ 平均客单: $447                                          │
│ └─ 分层: Loyal Customer                                    │
├─────────────────────────────────────────────────────────────┤
│ 行为轨迹                                                   │
│ ├─ 浏览过 23 个产品                                        │
│ ├─ 加入购物车 8 次                                         │
│ ├─ 感兴趣: Robotic Pool Cleaners, 配件                     │
│ └─ 活跃时段: 上午 9-11 点                                  │
├─────────────────────────────────────────────────────────────┤
│ 最近订单                                                   │
│ ├─ #PC-12345678 | 2025-01-28 | $449 | 已发货             │
│ └─ #PC-87654321 | 2024-12-15 | $891 | 已签收             │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 仪表板技术栈

- **Metabase** - 开源 BI 工具，快速生成可视化
- **或 Streamlit** - Python 数据应用框架
- **或 Recharts** - React 组件，自建仪表板

---

## 九、隐私合规

### 9.1 GDPR 合规

#### 数据收集同意
```typescript
// 首次访问显示同意横幅
<ConsentBanner>
  我们使用 Cookie 来改善您的体验。
  <Button onClick={acceptAll}>接受所有</Button>
  <Button onClick={acceptEssential}>仅必要</Button>
  <Button onClick={managePreferences}>管理偏好</Button>
</ConsentBanner>

// 同意状态存储
localStorage.setItem('consent', JSON.stringify({
  necessary: true,
  analytics: true,     // 用户同意
  marketing: false,    // 用户拒绝
  timestamp: '2025-02-06T10:00:00Z'
}));
```

#### 数据访问请求 (GDPR Article 15)
```typescript
// GET /api/users/data-access

export async function getUserDataExport(userId: string) {
  const data = {
    profile: await getUserProfile(userId),
    events: await getUserEvents(userId),
    orders: await getUserOrders(userId),
    consent: await getUserConsent(userId),
  };

  // 生成 JSON 文件
  return generateJSONFile(data);
}
```

#### 数据删除请求 (GDPR Article 17)
```typescript
// DELETE /api/users/:id

export async function deleteUserAccount(userId: string) {
  // 1. 匿名化所有事件数据
  await anonymizeUserEvents(userId);

  // 2. 删除用户个人信息
  await db.users.delete({ where: { id: userId } });

  // 3. 从 Shopify 删除（如果需要）
  await shopifyClient.customer.delete(userId);

  // 4. 记录删除操作
  await logDataDeletion(userId);
}
```

### 9.2 Cookie 管理

```typescript
// src/components/cookie-banner.tsx

export function CookieBanner() {
  const [consent, setConsent] = useState<Consent>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  const handleAccept = (type: 'all' | 'essential') => {
    const newConsent = type === 'all'
      ? { necessary: true, analytics: true, marketing: true }
      : { necessary: true, analytics: false, marketing: false };

    setConsent(newConsent);
    localStorage.setItem('cookie-consent', JSON.stringify(newConsent));

    // 根据 consent 启用/禁用追踪
    if (newConsent.analytics) {
      enableAnalytics();
    }
  };

  return (
    <Banner>
      <p>我们使用 Cookie 来提供和改善服务。</p>
      <Buttons>
        <Button onClick={() => handleAccept('all')}>接受所有</Button>
        <Button onClick={() => handleAccept('essential')}>仅必要</Button>
        <Link href="/privacy">隐私政策</Link>
      </Buttons>
    </Banner>
  );
}
```

---

## 十、自动化营销触发器

### 10.1 购物车弃单恢复

```typescript
// src/lib/automation/cart-recovery.ts

// 每5分钟检查一次弃单
export async function checkAbandonedCarts() {
  const abandonedCarts = await getAbandonedCarts({
    abandonedFor: '30 minutes',
    notRecovered: true,
    emailSent: false,
  });

  for (const cart of abandonedCarts) {
    // 发送恢复邮件
    await sendCartRecoveryEmail(cart);

    // 记录发送状态
    await markEmailSent(cart.id);
  }
}

// 3小时未恢复，发送第二次邮件
export async function sendSecondReminder() {
  const carts = await getAbandonedCarts({
    abandonedFor: '3 hours',
    notRecovered: true,
    emailsSent: 1,
  });

  for (const cart of carts) {
    await sendCartRecoveryEmail(cart, {
      template: 'second_reminder',
      discount: '5% OFF',  // 添加优惠激励
    });
  }
}
```

### 10.2 流失用户召回

```typescript
// 30天未访问，发送召回邮件
export async function reengageInactiveUsers() {
  const inactiveUsers = await getUsers({
    lastSeenBefore: '30 days ago',
    hasPurchased: true,  // 曾经购买过的用户
  });

  for (const user of inactiveUsers) {
    await sendReactivationEmail(user, {
      subject: 'We miss you! Here\'s 10% off',
      discount: 'WELCOMEBACK10',
    });
  }
}
```

### 10.3 个性化推荐

```typescript
// 基于用户画像推荐产品
export async function getPersonalizedRecommendations(userId: string) {
  const profile = await getUserProfile(userId);

  // 获取用户兴趣标签
  const interests = profile.product_category_preference;

  // 获取相似用户购买的商品
  const similarUsers = await findSimilarUsers(userId);
  const popularItems = await getPopularProductsAmongUsers(similarUsers);

  // 排除已购买的商品
  const purchasedIds = await getPurchasedProductIds(userId);
  const recommendations = popularItems.filter(
    item => !purchasedIds.includes(item.id)
  );

  return recommendations.slice(0, 6); // 返回前6个推荐
}
```

---

## 十一、售后服务系统

### 11.1 工单管理

#### 工单创建
```typescript
// POST /api/support/tickets

{
  userId: string,
  orderId?: string,
  category: 'shipping' | 'product' | 'return' | 'refund' | 'other',
  subject: string,
  description: string,
  priority: 'low' | 'normal' | 'high' | 'urgent'
}
```

#### 工单状态流转
```
创建 → 待处理 → 处理中 → 已解决 → 已关闭
            ↓
         已关闭 (无响应3天)
```

### 11.2 订单追踪

```typescript
// 从 Shopify 同步物流信息
export async function syncOrderTracking(orderId: string) {
  const shopifyOrder = await shopifyClient.order.get(orderId);
  const fulfillment = shopifyOrder.fulfillments[0];

  await db.orders.update(orderId, {
    fulfillmentStatus: fulfillment.status,
    trackingNumbers: fulfillment.tracking_numbers,
    trackingUrls: fulfillment.tracking_urls,
    estimatedDelivery: fulfillment.estimated_delivery_at,
  });

  // 通知用户
  if (fulfillment.status === 'in_transit') {
    await sendShippingNotification(shopifyOrder.email, {
      trackingNumber: fulfillment.tracking_numbers[0],
      estimatedDelivery: fulfillment.estimated_delivery_at,
    });
  }
}
```

### 11.3 退换货处理

```typescript
// POST /api/returns/create

{
  orderId: string,
  items: Array<{
    orderItemId: string,
    reason: string,
    action: 'refund' | 'exchange',
  }>,
  refundMethod: 'original' | 'store_credit',
}

// 退换货状态
const RETURN_STATUSES = [
  'requested',      // 用户申请
  'approved',       // 已批准
  'return_shipped', // 用户已寄回
  'received',       // 仓库已收到
  'inspected',      // 已检查
  'refunded',       // 已退款
  'exchanged',      // 已换货
  'rejected',       // 已拒绝
];
```

---

## 十二、实施计划

### 阶段 1: 基础追踪 (2周)

**目标**: 建立数据收集基础

- [x] 数据库表结构设计和创建
- [ ] 前端 SDK 开发（双写策略）
- [ ] 身份管理系统
- [ ] 事件追踪 API
- [ ] Segment 集成（已有）
- [ ] Cookie 同意横幅

**交付物**:
- 可用的数据库 schema
- 前端追踪 SDK
- 基础事件数据开始收集

### 阶段 2: Shopify 集成 (1周)

**目标**: 同步订单和客户数据

- [ ] Shopify Webhook 配置
- [ ] 订单同步逻辑
- [ ] 客户信息同步
- [ ] 退换货状态同步

**交付物**:
- 订单数据自动同步到数据库
- 用户基础画像开始构建

### 阶段 3: 用户画像系统 (2周)

**目标**: 构建用户画像和分层

- [ ] RFM 分数计算
- [ ] 行为标签系统
- [ ] 用户分层逻辑
- [ ] 画像实时更新机制

**交付物**:
- 完整的用户画像数据
- 用户分层功能
- 画像查询 API

### 阶段 4: 分析仪表板 (2周)

**目标**: 可视化数据分析

- [ ] 核心指标看板
- [ ] 转化漏斗分析
- [ ] 用户详情页
- [ ] 自定义查询功能

**交付物**:
- 可用的数据分析仪表板
- 关键指标实时监控

### 阶段 5: 自动化营销 (2周)

**目标**: 基于数据的自动化运营

- [ ] 购物车弃单恢复
- [ ] 流失用户召回
- [ ] 个性化推荐系统
- [ ] 邮件/SMS 集成

**交付物**:
- 自动化营销流程上线
- 转化率提升

### 阶段 6: 售后服务 (2周)

**目标**: 数字化售后服务

- [ ] 工单管理系统
- [ ] 订单追踪功能
- [ ] 退换货流程
- [ ] 客服满意度追踪

**交付物**:
- 完整的售后服务系统
- 客服效率提升

### 总计: 11周

---

## 十三、技术栈总结

### 前端
- **框架**: Next.js 15 (React 19)
- **追踪**: Segment Analytics.js + 自建 API
- **状态管理**: Zustand
- **UI**: Radix UI + Tailwind CSS

### 后端
- **框架**: Next.js API Routes
- **数据库**: PostgreSQL (Neon 或 Supabase)
- **ORM**: Drizzle ORM 或 Prisma
- **缓存**: Redis (可选)

### 集成
- **电商**: Shopify Storefront API + Admin API
- **邮件**: Resend 或 SendGrid
- **SMS**: Twilio
- **分析**: Segment + 自建

### 基础设施
- **托管**: Vercel
- **监控**: Sentry
- **日志**: 自建或使用日志服务
- **数据库**: Neon/Supabase (托管 PostgreSQL)

---

## 十四、风险评估与缓解

### 风险 1: 数据量增长过快
**影响**: 数据库性能下降，成本增加
**缓解**:
- 设置数据保留策略（原始事件保留90天，聚合数据永久保留）
- 使用时序数据库存储事件数据
- 定期归档历史数据

### 风险 2: Segment 依赖
**影响**: 数据不自主，迁移困难
**缓解**:
- 采用双写策略，确保有完整备份
- 定期导出 Segment 数据进行校验
- 预留迁移接口，随时可切换

### 风险 3: 隐私合规
**影响**: 法律风险，罚款
**缓解**:
- 内置 GDPR/CCPA 合规功能
- 提供数据访问/删除接口
- 定期进行合规审计

### 风险 4: 开发周期长
**影响**: 错过市场机会
**缓解**:
- 分阶段交付，每2周有可用功能
- 使用现成工具（Segment）快速启动
- 优先开发核心功能

---

## 十五、成功指标

### 技术指标
- [ ] 数据收集覆盖率 > 95%
- [ ] API 响应时间 < 100ms (p95)
- [ ] 数据同步延迟 < 5分钟
- [ ] 系统可用性 > 99.5%

### 业务指标
- [ ] 整体转化率提升 20%
- [ ] 购物车弃单恢复率 > 15%
- [ ] 邮件打开率 > 25%
- [ ] 用户复购率提升 30%

### 运营指标
- [ ] 客服响应时间 < 2小时
- [ ] 工单解决率 > 90%
- [ ] 客户满意度 > 4.5/5

---

## 十六、下一步行动

1. **评审此设计文档** - 确认技术方案和业务目标
2. **创建实施工作分支** - 使用 git worktree
3. **开始阶段 1 开发** - 数据库和前端追踪 SDK
4. **每两周评审** - 确保进度符合预期

---

**文档版本**: v1.0
**最后更新**: 2025-02-06
**状态**: 待评审
