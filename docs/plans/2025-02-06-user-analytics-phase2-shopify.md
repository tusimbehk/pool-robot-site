# 用户数据分析系统 - 阶段 2: Shopify 集成

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 同步 Shopify 订单和客户数据，建立电商数据基础

**Architecture:**
- Shopify Webhook 接收订单更新
- API 同步客户信息
- 订单数据与用户画像关联

**Tech Stack:** Next.js 15 API Routes, Shopify Admin API, Webhook cryptography

---

## Task 1: Webhook 签名验证

**Files:**
- Create: `packages/web/src/lib/shopify/webhook.ts`

**Step 1: 安装 Shopify API 依赖**

```bash
pnpm add @shopify/shopify-api
```

**Step 2: 创建 Webhook 验证工具**

创建 `packages/web/src/lib/shopify/webhook.ts`:

```typescript
import crypto from 'crypto';

/**
 * 验证 Shopify Webhook 请求的真实性
 */
export async function verifyShopifyWebhook(
  request: Request
): Promise<boolean> {
  const body = await request.text();
  const headers = request.headers;

  const shopifyHmac = headers.get('x-shopify-hmac-sha256');
  const topic = headers.get('x-shopify-topic');
  const shop = headers.get('x-shopify-shop-domain');

  if (!shopifyHmac || !topic || !shop) {
    return false;
  }

  // 从环境变量获取 Webhook 密钥
  const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Webhook] SHOPIFY_WEBHOOK_SECRET not configured');
    return false;
  }

  // 计算 HMAC
  const hmac = crypto
    .createHmac('sha256', webhookSecret)
    .update(body, 'utf8')
    .digest('base64');

  // 安全比较
  return crypto.timingSafeEqual(
    Buffer.from(shopifyHmac),
    Buffer.from(hmac)
  );
}

/**
 * 解析 Webhook 主题
 */
export function parseWebhookTopic(request: Request): string | null {
  return request.headers.get('x-shopify-topic');
}
```

**Step 3: 添加环境变量**

在 `.env.local` 中添加:

```env
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret_here
```

**Step 4: Commit**

```bash
git add packages/web/src/lib/shopify/webhook.ts
git commit -m "feat: add Shopify webhook verification utility"
```

---

## Task 2: 订单同步 Schema

**Files:**
- Modify: `packages/web/src/db/schema.ts`

**Step 1: 添加订单相关表**

在 `packages/web/src/db/schema.ts` 中添加:

```typescript
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  shopifyOrderId: varchar('shopify_order_id', { length: 255 }).unique(),
  shopifyOrderNumber: varchar('shopify_order_number', { length: 50 }),
  status: varchar('status', { length: 50 }),
  financialStatus: varchar('financial_status', { length: 50 }),
  fulfillmentStatus: varchar('fulfillment_status', { length: 50 }),
  subtotalPrice: decimal('subtotal_price', { precision: 10, scale: 2 }),
  totalTax: decimal('total_tax', { precision: 10, scale: 2 }),
  totalShipping: decimal('total_shipping', { precision: 10, scale: 2 }),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 3 }),
  shippingAddress: jsonb('shipping_address'),
  billingAddress: jsonb('billing_address'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id),
  shopifyProductId: varchar('shopify_product_id', { length: 255 }),
  shopifyVariantId: varchar('shopify_variant_id', { length: 255 }),
  productTitle: varchar('product_title', { length: 255 }),
  variantTitle: varchar('variant_title', { length: 255 }),
  sku: varchar('sku', { length: 100 }),
  quantity: integer('quantity'),
  price: decimal('price', { precision: 10, scale: 2 }),
  totalDiscount: decimal('total_discount', { precision: 10, scale: 2 }),
});
```

**Step 2: 推送 schema 到数据库**

```bash
pnpm db:push
```

**Step 3: Commit**

```bash
git add packages/web/src/db/schema.ts
git commit -m "feat: add orders and order_items tables"
```

---

## Task 3: 订单创建 Webhook

**Files:**
- Create: `packages/web/src/app/api/webhooks/shopify/order-created/route.ts`

**Step 1: 创建订单创建处理器**

创建 `packages/web/src/app/api/webhooks/shopify/order-created/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyShopifyWebhook } from '@/lib/shopify/webhook';
import { db } from '@/db';
import { orders, orderItems, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  // 1. 验证 Webhook
  const isValid = await verifyShopifyWebhook(request);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid webhook' }, { status: 401 });
  }

  // 2. 重新读取 body（因为 verifyShopifyWebhook 已经消耗了）
  const body = await request.json();
  const shopifyOrder = body;

  console.log('[Webhook] Order created:', shopifyOrder.id);

  try {
    // 3. 查找或创建用户
    let user = await db.query.users.findFirst({
      where: eq(users.email, shopifyOrder.email),
    });

    if (!user) {
      const [newUser] = await db.insert(users).values({
        email: shopifyOrder.email,
        phone: shopifyOrder.phone,
        shopifyCustomerId: shopifyOrder.customer.id,
        gdprConsent: true, // 下单视为同意
      }).returning();

      user = newUser;
    }

    // 4. 创建订单
    const [newOrder] = await db.insert(orders).values({
      userId: user.id,
      shopifyOrderId: shopifyOrder.id,
      shopifyOrderNumber: shopifyOrder.order_number.toString(),
      status: shopifyOrder.financial_status,
      financialStatus: shopifyOrder.financial_status,
      fulfillmentStatus: shopifyOrder.fulfillment_status,
      subtotalPrice: shopifyOrder.subtotal_price,
      totalTax: shopifyOrder.total_tax,
      totalShipping: shopifyOrder.total_shipping_price_set?.shop_money_amount || 0,
      totalPrice: shopifyOrder.total_price,
      currency: shopifyOrder.currency,
      shippingAddress: shopifyOrder.shipping_address,
      billingAddress: shopifyOrder.billing_address,
      processedAt: shopifyOrder.processed_at,
    }).returning();

    // 5. 创建订单商品
    for (const item of shopifyOrder.line_items) {
      await db.insert(orderItems).values({
        orderId: newOrder.id,
        shopifyProductId: item.product_id,
        shopifyVariantId: item.variant_id,
        productTitle: item.name,
        variantTitle: item.variant_title,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        totalDiscount: item.total_discount,
      });
    }

    // 6. 触发订单完成事件
    // （这个将在阶段 3 实现）

    return NextResponse.json({ success: true, orderId: newOrder.id });
  } catch (error) {
    console.error('[Webhook] Error processing order:', error);
    return NextResponse.json(
      { error: 'Failed to process order' },
      { status: 500 }
    );
  }
}
```

**Step 2: 创建本地测试脚本**

创建 `packages/web/src/scripts/test-webhook.ts`:

```typescript
async function testOrderCreatedWebhook() {
  const mockOrder = {
    id: '123456789',
    order_number: 1001,
    email: 'test@example.com',
    phone: '+1234567890',
    customer: { id: 'cust_123' },
    financial_status: 'paid',
    fulfillment_status: 'fulfilled',
    subtotal_price: '100.00',
    total_tax: '8.00',
    total_shipping_price_set: { shop_money_amount: '10.00' },
    total_price: '118.00',
    currency: 'USD',
    processed_at: new Date().toISOString(),
    line_items: [
      {
        product_id: 'prod_123',
        variant_id: 'var_123',
        name: 'PoolClean Pro',
        variant_title: 'Default',
        sku: 'PC-001',
        quantity: 1,
        price: '100.00',
        total_discount: '0.00',
      },
    ],
    shipping_address: {
      first_name: 'John',
      last_name: 'Doe',
      address1: '123 Main St',
      city: 'San Francisco',
      province: 'CA',
      country: 'US',
      zip: '94102',
    },
    billing_address: {
      first_name: 'John',
      last_name: 'Doe',
      address1: '123 Main St',
      city: 'San Francisco',
      province: 'CA',
      country: 'US',
      zip: '94102',
    },
  };

  const response = await fetch('http://localhost:3000/api/webhooks/shopify/order-created', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-shopify-shop-domain': 'test.myshopify.com',
      'x-shopify-topic': 'orders/create',
      // 注意：测试时跳过 HMAC 验证或计算正确的 HMAC
    },
    body: JSON.stringify(mockOrder),
  });

  console.log('Response:', await response.json());
}

testOrderCreatedWebhook();
```

**Step 3: 测试 Webhook**

```bash
npx tsx src/scripts/test-webhook.ts
```

**Step 4: 验证数据库**

```bash
psql $DATABASE_URL -c "SELECT id, email, shopify_customer_id FROM users WHERE email = 'test@example.com';"
psql $DATABASE_URL -c "SELECT shopify_order_id, total_price FROM orders LIMIT 1;"
```

**Step 5: Commit**

```bash
git add packages/web/src/app/api/webhooks packages/web/src/scripts/test-webhook.ts
git commit -m "feat: add order created webhook handler"
```

---

## Task 4: 订单更新 Webhook

**Files:**
- Create: `packages/web/src/app/api/webhooks/shopify/order-updated/route.ts`

**Step 1: 创建订单更新处理器**

创建 `packages/web/src/app/api/webhooks/shopify/order-updated/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyShopifyWebhook } from '@/lib/shopify/webhook';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const isValid = await verifyShopifyWebhook(request);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid webhook' }, { status: 401 });
  }

  const body = await request.json();
  const shopifyOrder = body;

  try {
    // 查找现有订单
    const existingOrder = await db.query.orders.findFirst({
      where: eq(orders.shopifyOrderId, shopifyOrder.id),
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // 更新订单状态
    await db
      .update(orders)
      .set({
        status: shopifyOrder.financial_status,
        financialStatus: shopifyOrder.financial_status,
        fulfillmentStatus: shopifyOrder.fulfillment_status,
        updatedAt: new Date(),
      })
      .where(eq(orders.shopifyOrderId, shopifyOrder.id));

    console.log('[Webhook] Order updated:', shopifyOrder.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Webhook] Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add packages/web/src/app/api/webhooks/shopify/order-updated
git commit -m "feat: add order updated webhook handler"
```

---

## Task 5: 客户同步 API

**Files:**
- Create: `packages/web/src/app/api/shopify/customers/sync/route.ts`

**Step 1: 创建客户同步功能**

创建 `packages/web/src/app/api/shopify/customers/sync/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getShopifyClient } from '@/lib/shopify';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // 从 Shopify 获取客户信息
    const client = getShopifyClient();
    const shopifyCustomers = await client.getCustomersByEmail(email);

    if (shopifyCustomers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No customer found in Shopify',
        synced: false,
      });
    }

    const shopifyCustomer = shopifyCustomers[0];

    // 同步到数据库
    const [user] = await db.insert(users).values({
      email: shopifyCustomer.email,
      phone: shopifyCustomer.phone,
      shopifyCustomerId: shopifyCustomer.id,
      firstName: shopifyCustomer.firstName,
      lastName: shopifyCustomer.lastName,
    }).onConflictDoUpdate({
      target: users.email,
      set: {
        phone: shopifyCustomer.phone,
        shopifyCustomerId: shopifyCustomer.id,
        updatedAt: new Date(),
      },
    }).returning();

    return NextResponse.json({
      success: true,
      synced: true,
      user,
    });
  } catch (error) {
    console.error('[Customer Sync] Error:', error);
    return NextResponse.json(
      { error: 'Failed to sync customer' },
      { status: 500 }
    );
  }
}

// GET 方法：按邮箱获取客户
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    );
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  return NextResponse.json({ user });
}
```

**Step 2: Commit**

```bash
git add packages/web/src/app/api/shopify/customers/sync
git commit -m "feat: add Shopify customer sync API"
```

---

## 完成标准

阶段 2 完成后，你应该能够：

1. ✅ Shopify 订单自动同步到数据库
2. ✅ 订单状态更新实时反映
3. ✅ 客户信息可以双向同步
4. ✅ Webhook 验证正常工作
5. ✅ 可以查询订单和客户数据

---

## Shopify Webhook 配置清单

在 Shopify Admin 中配置以下 Webhooks：

1. 进入 Settings → Notifications → Webhooks
2. 点击 "Create webhook"
3. 输入端点 URL: `https://yourdomain.com/api/webhooks/shopify/order-created`
4. 选择事件: "Order creation"
5. 复制 Webhook 密钥到环境变量
6. 重复以上步骤，创建:
   - `order-updated` 端点，事件: "Order updates"
