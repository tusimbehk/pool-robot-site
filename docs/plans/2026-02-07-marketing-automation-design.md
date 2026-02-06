# Phase 4: 营销自动化 - 设计文档

**日期**: 2026-02-07
**状态**: 设计完成

## 目标

构建弃购挽回邮件系统和 RFM 客户分层系统，提高转化率和客户生命周期价值。

## 技术选型

| 组件 | 技术选择 | 理由 |
|------|----------|------|
| 邮件服务 | Resend | 现代 API，免费层 3000 封/月 |
| 定时任务 | Vercel Cron | 与部署平台集成 |
| 数据库 | PostgreSQL + Drizzle ORM | 已有基础设施 |

## 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    定时任务触发                          │
├─────────────────────────────────────────────────────────┤
│  1. 弃购检测 (每 15 分钟)                               │
│     ├─ 查询 30 分钟前未完成的会话                         │
│     ├─ 检查 24 小时内是否已发送邮件                      │
│     └─ 触发 Resend 邮件 API                             │
│                                                          │
│  2. RFM 重算 (每天凌晨)                                   │
│     ├─ 遍历所有有订单的用户                              │
│     ├─ 计算 R/F/M 分数                                   │
│     └─ 更新 user_profiles 表                            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    数据库层                              │
├─────────────────────────────────────────────────────────┤
│  user_profiles 表:                                       │
│  - userId, rScore, fScore, mScore, segment              │
│  - tags, totalOrders, totalSpent, lastPurchaseAt        │
│                                                          │
│  user_sessions 表 (已有):                                │
│  - addedToCart, completedPurchase                        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Resend API                            │
├─────────────────────────────────────────────────────────┤
│  POST /emails                                            │
│  - from: noreply@poolclean.com                          │
│  - to: customer email                                    │
│  - template: cart-abandonment                           │
│  - variables: cartItems, discount, etc.                 │
└─────────────────────────────────────────────────────────┘
```

## 数据库 Schema

### user_profiles 表

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  country_code VARCHAR(2),
  timezone VARCHAR(50),
  language VARCHAR(10) DEFAULT 'zh-CN',
  currency VARCHAR(3) DEFAULT 'USD',
  preferred_price_range VARCHAR(20),
  product_category_preference JSONB,  -- string[]
  tags JSONB,                        -- string[]
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  avg_order_value DECIMAL(10,2),
  last_purchase_at TIMESTAMP,
  r_score INTEGER,  -- Recency 1-5
  f_score INTEGER,  -- Frequency 1-5
  m_score INTEGER,  -- Monetary 1-5
  segment VARCHAR(50),  -- VIP, Loyal, Potential, New, At-Risk
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### abandoned_cart_emails 表

```sql
CREATE TABLE abandoned_cart_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255),
  user_id UUID REFERENCES users(id),
  email VARCHAR(255),
  sent_at TIMESTAMP DEFAULT NOW(),
  clicked_at TIMESTAMP,
  recovered_at TIMESTAMP,
  discount_code VARCHAR(50),
  UNIQUE(session_id)
);
```

## RFM 分层算法

### 分数计算

**Recency (R) - 最近购买时间:**
```typescript
function calculateRecencyScore(daysSinceLastPurchase: number): number {
  if (daysSinceLastPurchase <= 30) return 5;
  if (daysSinceLastPurchase <= 60) return 4;
  if (daysSinceLastPurchase <= 90) return 3;
  if (daysSinceLastPurchase <= 180) return 2;
  return 1;
}
```

**Frequency (F) - 购买频率 (近90天):**
```typescript
function calculateFrequencyScore(orderCount: number): number {
  if (orderCount >= 5) return 5;
  if (orderCount >= 3) return 4;
  if (orderCount >= 2) return 3;
  if (orderCount >= 1) return 2;
  return 1;
}
```

**Monetary (M) - 消费金额 (近90天):**
```typescript
function calculateMonetaryScore(totalSpent: number): number {
  if (totalSpent >= 1000) return 5;
  if (totalSpent >= 500) return 4;
  if (totalSpent >= 250) return 3;
  if (totalSpent >= 100) return 2;
  return 1;
}
```

### 客户分层

```typescript
function getUserSegment(r: number, f: number, m: number): string {
  if (r >= 4 && f >= 4 && m >= 4) return 'VIP';
  if (r >= 3 && f >= 3 && m >= 3) return 'Loyal';
  if (r >= 2 && f >= 2 && m >= 2) return 'Potential';
  if (r >= 3 && f <= 2) return 'New';
  return 'At-Risk';
}
```

## 弃购检测逻辑

### 检测条件

1. 会话中有商品加入购物车 (`added_to_cart = true`)
2. 会话未完成购买 (`completed_purchase = false`)
3. 最后活跃时间 > 30 分钟前
4. 24 小时内未发送过邮件

### 邮件内容

**主题:** 🛒 您购物车中的商品在等您

**内容:**
- 购物车商品列表（商品名称、数量、价格）
- 购物车总额
- 限时折扣码（可选，10% OFF）
- 直接返回购物车的链接

## API 端点

### 定时任务端点

```
GET /api/cron/check-abandoned-carts
- 触发: Vercel Cron (每 15 分钟)
- 鉴权: Bearer token (CRON_SECRET)
- 功能: 检测弃购并发送邮件

GET /api/cron/recalculate-rfm
- 触发: Vercel Cron (每天凌晨)
- 鉴权: Bearer token (CRON_SECRET)
- 功能: 重算所有用户的 RFM 分数
```

### 管理 API

```
POST /api/marketing/send-cart-recovery
- 手动触发给特定用户发送弃购邮件

GET /api/users/[id]/profile
- 获取用户的 RFM 分数和分层信息
```

## Resend 集成

### 配置

```bash
# .env.local
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=noreply@poolclean.com
```

### 邮件模板

```typescript
await resend.emails.send({
  from: FROM_EMAIL,
  to: customerEmail,
  subject: '🛒 您购物车中的商品在等您',
  html: cartAbandonmentTemplate(cartItems, discountCode),
});
```

## 部署配置

### vercel.json

```json
{
  "crons": [
    {
      "path": "/api/cron/check-abandoned-carts",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/recalculate-rfm",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## 安全考虑

1. **Cron 端点保护:** 使用 `CRON_SECRET` 环境变量验证
2. **邮件频率限制:** 24 小时内不重复发送
3. **退订链接:** 所有邮件包含退订选项
4. **GDPR 合规:** 尊重用户隐私设置

## 监控指标

- 弃购邮件发送数量
- 邮件打开率
- 邮件点击率
- 挽回转化率
- RFM 分层分布

## 实施任务清单

1. 创建 user_profiles 和 abandoned_cart_emails 表
2. 实现 RFM 计算逻辑
3. 实现弃购检测逻辑
4. 集成 Resend API
5. 创建邮件模板
6. 实现定时任务端点
7. 配置 Vercel Cron
8. 测试邮件发送
9. 验证 RFM 分层准确性
