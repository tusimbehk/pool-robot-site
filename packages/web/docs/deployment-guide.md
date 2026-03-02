# 部署配置指南

## Vercel Dashboard 部署

### 1. 导入项目

访问 [vercel.com/new](https://vercel.com/new) 并导入 GitHub 仓库：
```
tusimbehk/pool-robot-site
```

### 2. 配置构建设置

Vercel 会自动检测 Next.js，但请确认：

| 设置 | 值 |
|------|-----|
| Framework Preset | Next.js |
| Root Directory | `./` |
| Build Command | `cd packages/web && npm run build` |
| Install Command | `cd packages/web && npm install` |
| Output Directory | `packages/web/.next` |

### 3. 环境变量

在 Vercel 项目设置 > Environment Variables 中添加：

#### 数据库
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

#### Shopify
```
SHOPIFY_SHOP_NAME=your-shop.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxx
SHOPIFY_WEBHOOK_SECRET=your-webhook-secret
```

#### 营销自动化
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=noreply@poolclean.com
CRON_SECRET=63f94f887501164895b9ba4dd26ac1191a6473fb2c35daa9f32ae0e07592ddc5
```

#### 管理后台
```
ADMIN_PASSWORD=admin123
```

### 4. Cron Jobs 验证

部署后，确认 Cron Jobs 已启用：
- Vercel Dashboard > Settings > Cron Jobs
- 应该看到两个任务：
  - `/api/cron/check-abandoned-carts` (每 15 分钟)
  - `/api/cron/recalculate-rfm` (每天凌晨 2 点)

### 5. 部署后验证

#### 检查弃购检测
```bash
curl https://your-domain.vercel.app/api/cron/check-abandoned-carts \
  -H "Authorization: Bearer 63f94f887501164895b9ba4dd26ac1191a6473fb2c35daa9f32ae0e07592ddc5"
```

#### 检查 RFM 重算
```bash
curl https://your-domain.vercel.app/api/cron/recalculate-rfm \
  -H "Authorization: Bearer 63f94f887501164895b9ba4dd26ac1191a6473fb2c35daa9f32ae0e07592ddc5"
```

#### 检查管理后台
```
https://your-domain.vercel.app/admin
```

### 6. Resend 邮件配置

1. 访问 [resend.com](https://resend.com)
2. 创建 API Key
3. 验证发件域名（如 poolclean.com）
4. 复制 API Key 到环境变量

### 7. Shopify Webhook 配置

在 Shopify Admin 中创建 Webhooks：

**订单创建**
```
URL: https://your-domain.vercel.app/api/webhooks/shopify/order-created
Event: orders/create
Format: JSON
```

**订单更新**
```
URL: https://your-domain.vercel.app/api/webhooks/shopify/order-updated
Event: orders/updated
Format: JSON
```

---

## 快速复制粘贴

### 环境变量 (一次性复制)

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
SHOPIFY_SHOP_NAME=your-shop.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxx
SHOPIFY_WEBHOOK_SECRET=your-webhook-secret
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=noreply@poolclean.com
CRON_SECRET=63f94f887501164895b9ba4dd26ac1191a6473fb2c35daa9f32ae0e07592ddc5
ADMIN_PASSWORD=admin123
```

---

## 部署检查清单

- [ ] 导入 GitHub 仓库到 Vercel
- [ ] 配置构建设置
- [ ] 添加所有环境变量
- [ ] 验证 Cron Jobs 已启用
- [ ] 测试弃购检测端点
- [ ] 测试 RFM 重算端点
- [ ] 配置 Resend API
- [ ] 配置 Shopify Webhooks
- [ ] 测试管理后台登录
