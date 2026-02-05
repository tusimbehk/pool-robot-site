# Shopify API 配置指南

## 获取 Shopify Storefront API 凭证

### 1. 在 Shopify Admin 中创建应用

1. 登录 Shopify Admin
2. 进入 **Settings** > **Apps and sales channels**
3. 点击 **Develop apps**
4. 点击 **Create an app**
5. 输入应用名称（如 "PoolClean Pro Website"）
6. 选择应用开发者账号
7. 点击 **Create app**

### 2. 配置 Storefront API 权限

1. 在应用配置页面，找到 **Configure Storefront API access**
2. 点击 **Configure**
3. 选择以下权限：
   - `unauthenticated_read_product_listings` - 读取产品列表
   - `unauthenticated_read_product_inventory` - 读取库存（可选）
4. 点击 **Save**

### 3. 安装应用并获取访问令牌

1. 点击 **Install app**
2. 复制 **Storefront API access token**

### 4. 配置环境变量

在你的 `.env.local` 文件中添加：

```env
# Shopify Store Configuration
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_access_token_here
```

将 `your-store.myshopify.com` 替换为你的店铺域名
将 `your_storefront_access_token_here` 替换为刚才复制的访问令牌

### 5. 测试连接

运行测试脚本验证连接：

```bash
pnpm test:shopify
```

成功输出示例：

```
🔍 Testing Shopify API Connection...

📋 Configuration:
  Domain: your-store.myshopify.com
  API Version: 2024-10
  Token: ***configured***

🏪 Testing shop info...
  ✅ Shop: Your Store Name
  Description: Your store description

📦 Testing products query...
  ✅ Found X products

✅ Shopify API connection successful!
```

## 使用 Mock 数据（开发阶段）

如果还没有 Shopify 店铺，可以使用 Mock 数据进行开发：

```ts
import { getShopifyClient } from "@/lib/shopify";

// 自动使用 mock client（当 Shopify 未配置时）
const client = getShopifyClient();
const products = await client.getProducts();
```

Mock 数据包含：
- 6 个示例产品（4 个机器人 + 2 个配件）
- 不同价格区间（$449 - $2499）
- 完整的产品结构（图片、变体、标签等）

## 相关文件

| 文件 | 说明 |
|-----|------|
| `src/lib/shopify/client.ts` | 真实 Shopify API 客户端 |
| `src/lib/shopify/client.mock.ts` | Mock 数据客户端 |
| `src/lib/shopify/client-helpers.ts` | 自动切换助手 |
| `src/lib/shopify/mocks/products.ts` | Mock 产品数据 |
| `src/scripts/test-shopify.ts` | API 测试脚本 |

## 常见问题

### 401 Unauthorized

- 检查访问令牌是否正确
- 确认 Storefront API 权限已启用

### 404 Not Found

- 检查店铺域名是否正确
- 确认域名格式：`your-store.myshopify.com`

### 无产品返回

- 确认店铺中有发布的产品
- 检查产品是否在销售渠道中可见
