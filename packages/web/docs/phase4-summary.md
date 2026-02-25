# Phase 4: 营销自动化 - 完成总结

**日期**: 2026-02-07
**状态**: ✅ 已完成
**分支**: feature/marketing-automation

---

## 概述

Phase 4 实现了弃购挽回邮件系统和 RFM 客户分层系统，用于提高转化率和客户生命周期价值。

### 核心功能

1. **弃购检测与邮件恢复**
   - 每 15 分钟自动检测弃购会话
   - 发送个性化中文恢复邮件
   - 24 小时冷却期避免重复发送

2. **RFM 客户分层**
   - 每日凌晨 2 点自动重算
   - Recency (最近购买) - 1-5 分
   - Frequency (购买频率) - 1-5 分
   - Monetary (消费金额) - 1-5 分
   - 客户分层: VIP, Loyal, Potential, New, At-Risk

---

## 技术架构

### 技术栈

| 组件 | 技术选择 | 说明 |
|------|----------|------|
| 邮件服务 | Resend | 免费 3000 封/月 |
| 定时任务 | Vercel Cron | 与部署平台集成 |
| 数据库 | PostgreSQL + Drizzle ORM | 已有基础设施 |

### 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel Cron                          │
├─────────────────────────────────────────────────────────┤
│  每 15 分钟: 检测弃购会话 → 发送邮件                    │
│  每日凌晨: 重算 RFM 分数 → 更新客户分层                │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    PostgreSQL 数据库                    │
├─────────────────────────────────────────────────────────┤
│  user_profiles: RFM 分数、客户分层                      │
│  abandoned_cart_emails: 邮件发送记录                    │
│  user_sessions: 会话数据 (已有)                         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Resend Email API                     │
├─────────────────────────────────────────────────────────┤
│  主题: 🛒 您购物车中的商品在等您                        │
│  内容: 购物车商品、折扣码、恢复链接                     │
└─────────────────────────────────────────────────────────┘
```

---

## 数据库 Schema

### user_profiles 表

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE,
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
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### abandoned_cart_emails 表

```sql
CREATE TABLE abandoned_cart_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE,
  user_id UUID REFERENCES users(id),
  email VARCHAR(255),
  sent_at TIMESTAMP DEFAULT NOW(),
  clicked_at TIMESTAMP,
  recovered_at TIMESTAMP,
  discount_code VARCHAR(50),
  cart_items JSONB,  -- 购物车快照
  cart_total DECIMAL(10,2)
);
```

---

## RFM 分层算法

### 分数计算

**Recency (R) - 最近购买时间:**
```typescript
≤ 30 天  → 5 分
≤ 60 天  → 4 分
≤ 90 天  → 3 分
≤ 180 天 → 2 分
> 180 天 → 1 分
```

**Frequency (F) - 购买频率 (近90天):**
```typescript
≥ 5 单  → 5 分
≥ 3 单  → 4 分
≥ 2 单  → 3 分
≥ 1 单  → 2 分
0 单    → 1 分
```

**Monetary (M) - 消费金额 (近90天):**
```typescript
≥ $1000 → 5 分
≥ $500  → 4 分
≥ $250  → 3 分
≥ $100  → 2 分
< $100  → 1 分
```

### 客户分层规则

```typescript
R ≥ 4 && F ≥ 4 && M ≥ 4 → VIP         // 高价值客户
R ≥ 3 && F ≥ 3 && M ≥ 3 → Loyal       // 忠诚客户
R ≥ 2 && F ≥ 2 && M ≥ 2 → Potential   // 潜力客户
R ≥ 3 && F ≤ 2         → New         // 新客户
其他                   → At-Risk     // 流失风险
```

---

## 弃购检测逻辑

### 检测条件

1. 会话中有商品加入购物车 (`added_to_cart = true`)
2. 会话未完成购买 (`completed_purchase = false`)
3. 最后活跃时间 > 30 分钟前
4. 24 小时内未发送过邮件

### 邮件模板

**主题:** 🛒 您购物车中的商品在等您

**内容包含:**
- 购物车商品列表（名称、数量、价格）
- 购物车总额
- 限时折扣码 (10% OFF)
- 直接返回购物车的链接
- 退订选项

---

## API 端点

### 定时任务端点

```
GET /api/cron/check-abandoned-carts
├── 触发: Vercel Cron (每 15 分钟)
├── 鉴权: Bearer CRON_SECRET
└── 功能: 检测弃购并发送邮件

GET /api/cron/recalculate-rfm
├── 触发: Vercel Cron (每天凌晨 2 点)
├── 鉴权: Bearer CRON_SECRET
└── 功能: 重算所有用户的 RFM 分数
```

### 管理 API

```
POST /api/marketing/send-cart-recovery
├── 鉴权: Bearer Admin Token
├── 功能: 手动触发弃购邮件
└── 请求体:
    {
      "email": "customer@example.com",
      "cartItems": [...],
      "cartTotal": "299.00",
      "discountCode": "SAVE10"
    }

GET /api/users/[id]/profile
├── 鉴权: 无 (公开)
└── 功能: 获取用户 RFM 分数和分层信息
```

---

## Vercel Cron 配置

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

---

## 环境变量

```bash
# Resend Email API
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=noreply@poolclean.com

# Cron Job Security
CRON_SECRET=your-random-secret-key-here
```

---

## 新增文件清单

### 核心代码

| 文件 | 说明 |
|------|------|
| `src/lib/analytics/rfm.ts` | RFM 计算库 |
| `src/lib/email/resend.ts` | Resend 邮件客户端 |
| `src/lib/marketing/abandoned-carts.ts` | 弃购检测逻辑 |

### API 端点

| 文件 | 说明 |
|------|------|
| `src/app/api/cron/check-abandoned-carts/route.ts` | 弃购检测 Cron |
| `src/app/api/cron/recalculate-rfm/route.ts` | RFM 重算 Cron |
| `src/app/api/marketing/send-cart-recovery/route.ts` | 手动弃购邮件 API |
| `src/app/api/users/[id]/profile/route.ts` | 用户资料 API |

### 配置和文档

| 文件 | 说明 |
|------|------|
| `packages/web/.env.marketing.example` | 环境变量模板 |
| `src/scripts/verify-phase4.ts` | 验证测试脚本 |
| `vercel.json` | 更新了 Cron 配置 |

---

## Git 提交记录

```
8bfcf32 fix: update verification script to use correct port
9d0e16f fix: handle missing Resend API key gracefully
ca6988b test: add Phase 4 verification script
344a0a7 docs: add marketing automation environment variables
4ce093e feat: add Vercel Cron configuration for marketing automation
589f9b6 feat: add user profile API for RFM data
40e491e feat: add manual cart recovery email API
1b97148 feat: add RFM recalculation cron endpoint
ae9efac feat: add abandoned cart check cron endpoint
7ce206d feat: add abandoned cart detection logic
3b9d2b7 feat: add Resend email client with cart recovery template
90983ee feat: add RFM calculation library
bf3aae7 deps: add resend for email automation
5f238c4 docs: add Phase 4 marketing automation design document
```

---

## 测试结果

### 验证测试

```
🧪 Phase 4 验证测试

Testing RFM calculation...
  ✓ RFM calculation logic exists
Testing abandoned cart detection...
  ✓ Abandoned cart detection logic exists
Testing cron endpoints...
  ✓ Cron endpoints properly protected

✅ 所有测试通过！
```

### 功能测试

| 测试项 | 结果 |
|--------|------|
| Cron 端点认证 | ✅ |
| Admin Token 生成 | ✅ |
| 手动弃购邮件 API | ✅ |
| RFM 重算端点 | ✅ |
| 错误处理 (无 API key) | ✅ |

---

## 部署检查清单

### 环境变量配置

- [ ] `RESEND_API_KEY` - Resend API 密钥
- [ ] `FROM_EMAIL` - 发件邮箱地址
- [ ] `CRON_SECRET` - Cron 任务密钥

### Vercel 部署

- [ ] 推送代码到 GitHub
- [ ] 在 Vercel 中配置环境变量
- [ ] 验证 Cron Jobs 已启用
- [ ] 测试邮件发送功能

### 验证步骤

1. **测试弃购检测**
   ```bash
   curl https://your-domain.com/api/cron/check-abandoned-carts \
     -H "Authorization: Bearer $CRON_SECRET"
   ```

2. **测试 RFM 重算**
   ```bash
   curl https://your-domain.com/api/cron/recalculate-rfm \
     -H "Authorization: Bearer $CRON_SECRET"
   ```

3. **测试手动邮件发送**
   ```bash
   curl -X POST https://your-domain.com/api/marketing/send-cart-recovery \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -d '{"email":"test@example.com",...}'
   ```

---

## 监控指标

建议监控以下指标以评估营销自动化效果：

- 弃购邮件发送数量
- 邮件打开率
- 邮件点击率
- 挽回转化率
- RFM 分层分布

---

## 后续优化建议

1. **邮件模板优化**
   - A/B 测试不同的邮件主题
   - 个性化商品推荐
   - 动态折扣策略

2. **RFM 算法优化**
   - 根据业务数据调整阈值
   - 添加更多分层维度
   - 季节性因素考虑

3. **自动化流程扩展**
   - 欢迎邮件序列
   - 客户生命周期邮件
   - 再营销自动化

---

**文档版本**: 1.0
**最后更新**: 2026-02-07
