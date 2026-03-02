# Vercel 环境变量配置清单

## 快速配置表

在 Vercel 项目中添加以下 8 个环境变量：

| # | 变量名 | 值 | 获取位置 | 是否必填 |
|---|--------|-----|----------|----------|
| 1 | `DATABASE_URL` | `postgresql://...` | Supabase/Neon/Railway | ✅ 必填 |
| 2 | `SHOPIFY_SHOP_NAME` | `your-shop.myshopify.com` | Shopify Admin | ✅ 必填 |
| 3 | `SHOPIFY_ACCESS_TOKEN` | `shpat_xxxxxxxxxxxxx` | Shopify Admin → Develop apps | ✅ 必填 |
| 4 | `SHOPIFY_WEBHOOK_SECRET` | `随机字符串` | Shopify Webhooks 设置 | ✅ 必填 |
| 5 | `RESEND_API_KEY` | `re_xxxxxxxxxxxxx` | resend.com/api-keys | ✅ 必填 |
| 6 | `FROM_EMAIL` | `noreply@poolclean.com` | Resend 验证域名 | ✅ 必填 |
| 7 | `CRON_SECRET` | `已生成↓` | 无需获取 | ✅ 必填 |
| 8 | `ADMIN_PASSWORD` | `admin123` | 自定义密码 | ✅ 必填 |

---

## 已生成密钥

### CRON_SECRET (直接复制使用)

```
63f94f887501164895b9ba4dd26ac1191a6473fb2c35daa9f32ae0e07592ddc5
```

---

## 详细获取指南

### 1. DATABASE_URL

**Supabase (推荐)**
1. 访问 https://supabase.com
2. 创建新项目
3. Settings → Database → Connection String
4. 选择 "URI" 格式
5. 复制连接字符串

```
postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
```

**Neon (免费)**
1. 访问 https://neon.tech
2. 创建项目
3. Dashboard → Connection Details
4. 复制 Connection String

---

### 2. SHOPIFY_SHOP_NAME

1. 登录 Shopify Admin
2. 查看浏览器地址栏
3. 格式：`your-shop-name.myshopify.com`

---

### 3. SHOPIFY_ACCESS_TOKEN

1. Shopify Admin → **Settings**
2. **Apps and sales channels** → **Develop apps**
3. 点击 **"Create an app"**
4. 命名后，配置 **Admin API access**
5. 勾选权限：
   - `read_products`
   - `read_orders`
   - `write_orders`
   - `read_customers`
6. 点击 **"Install app"**
7. 复制 **Admin API access token**

---

### 4. SHOPIFY_WEBHOOK_SECRET

1. 创建 Webhook 时自动生成
2. 或使用任意随机字符串（至少 32 位）

**生成命令:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 5. RESEND_API_KEY

1. 访问 https://resend.com
2. 注册/登录
3. **API Keys** → **Create API Key**
4. 权限选择 **"Send"**
5. 复制生成的 Key

```
re_xxxxxxxxxxxxx
```

---

### 6. FROM_EMAIL

**选项 A: 使用 Resend 测试域名 (开发阶段)**
```
onboarding@resend.dev
```

**选项 B: 使用自己的域名 (生产环境)**
1. Resend → **Domains** → **Add Domain**
2. 添加你的域名 (如 `poolclean.com`)
3. 添加 DNS 记录到域名提供商
4. 等待验证通过
5. 使用任意该域名下的邮箱
```
noreply@poolclean.com
info@poolclean.com
support@poolclean.com
```

---

### 7. CRON_SECRET

已生成，直接复制：
```
63f94f887501164895b9ba4dd26ac1191a6473fb2c35daa9f32ae0e07592ddc5
```

---

### 8. ADMIN_PASSWORD

默认值：`admin123`

**生产环境建议修改为强密码**

---

## Vercel 配置步骤

### 添加环境变量

1. Vercel 项目 → **Settings** → **Environment Variables**
2. 点击 **"Add New"**
3. 输入 **Name** 和 **Value**
4. ⚠️ **重要**: 选择环境：
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. 点击 **Save**
6. 重复以上步骤添加所有 8 个变量

### 环境选择说明

| 环境 | 说明 |
|------|------|
| Production | 生产域名 (your-domain.com) |
| Preview | Pull Request 预览链接 |
| Development | 本地开发 |

---

## 配置完成后

1. 点击 **Deployments** 标签
2. 找到最新的部署
3. 点击 **...** → **Redeploy**
4. 等待重新部署完成

---

## 验证配置

部署完成后，运行：

```bash
# 测试 Cron 端点 (验证 CRON_SECRET)
curl https://your-app.vercel.app/api/cron/check-abandoned-carts \
  -H "Authorization: Bearer 63f94f887501164895b9ba4dd26ac1191a6473fb2c35daa9f32ae0e07592ddc5"
```

期望返回：
```json
{
  "success": true,
  "processed": 0,
  "results": []
}
```

---

## 文件位置

- 完整配置模板: `.env.production.example`
- 复制粘贴版本: `docs/vercel-env-copy-paste.txt`
- 本清单: `docs/deployment-checklist.md`
