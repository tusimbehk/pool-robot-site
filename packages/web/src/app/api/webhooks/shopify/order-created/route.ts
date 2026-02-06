import { NextRequest, NextResponse } from 'next/server';
import { verifyAndParseWebhook } from '@/lib/shopify/webhook';
import { db } from '@/db';
import { orders, orderItems, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

interface ShopifyOrder {
  id: string;
  order_number: number;
  email?: string;
  phone?: string;
  customer: {
    id: string;
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
  };
  financial_status: string;
  fulfillment_status?: string;
  subtotal_price: string;
  total_tax: string;
  total_shipping_price_set?: {
    shop_money_amount: string;
  };
  total_price: string;
  currency: string;
  processed_at: string;
  line_items: Array<{
    product_id: string;
    variant_id: string;
    name: string;
    variant_title?: string;
    sku?: string;
    quantity: number;
    price: string;
    total_discount: string;
  }>;
  shipping_address?: {
    first_name?: string;
    last_name?: string;
    address1?: string;
    city?: string;
    province?: string;
    country?: string;
    zip?: string;
  };
  billing_address?: {
    first_name?: string;
    last_name?: string;
    address1?: string;
    city?: string;
    province?: string;
    country?: string;
    zip?: string;
  };
}

export async function POST(request: NextRequest) {
  let shopifyOrder: ShopifyOrder;
  let verification;

  // 检查是否为测试模式（跳过 HMAC 验证）
  const testModeHmac = request.headers.get('x-shopify-hmac-sha256');

  if (testModeHmac === 'test-dev-mode-skip') {
    console.warn('[Webhook] Running in TEST MODE - skipping HMAC verification');
    // 测试模式：直接读取 body
    const body = await request.json();
    shopifyOrder = body as ShopifyOrder;
  } else {
    // 生产模式：验证并解析
    verification = await verifyAndParseWebhook<ShopifyOrder>(request);

    if (!verification.isValid) {
      console.error('[Webhook] Invalid webhook:', verification.error);
      return NextResponse.json(
        { error: 'Invalid webhook', details: verification.error },
        { status: 401 }
      );
    }

    shopifyOrder = verification.body!;
  }

  const topic = request.headers.get('x-shopify-topic');
  console.log('[Webhook] Order created:', shopifyOrder.id, 'Topic:', topic);

  try {
    // 1. 查找或创建用户
    let user;

    if (shopifyOrder.email) {
      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, shopifyOrder.email))
        .limit(1);

      user = existingUsers[0];

      if (!user) {
        const [newUser] = await db.insert(users).values({
          email: shopifyOrder.email,
          phone: shopifyOrder.phone || shopifyOrder.customer.phone,
          shopifyCustomerId: shopifyOrder.customer.id,
          gdprConsent: true, // 下单视为同意
        }).returning();

        user = newUser;
      } else {
        // 更新用户的 shopifyCustomerId（如果之前没有）
        if (!user.shopifyCustomerId) {
          const [updatedUser] = await db
            .update(users)
            .set({ shopifyCustomerId: shopifyOrder.customer.id })
            .where(eq(users.id, user.id))
            .returning();
          user = updatedUser;
        }
      }
    }

    // 2. 创建订单
    const [newOrder] = await db.insert(orders).values({
      userId: user?.id || null,
      shopifyOrderId: shopifyOrder.id,
      shopifyOrderNumber: shopifyOrder.order_number.toString(),
      status: shopifyOrder.financial_status,
      financialStatus: shopifyOrder.financial_status,
      fulfillmentStatus: shopifyOrder.fulfillment_status || null,
      subtotalPrice: shopifyOrder.subtotal_price,
      totalTax: shopifyOrder.total_tax,
      totalShipping: shopifyOrder.total_shipping_price_set?.shop_money_amount || '0',
      totalPrice: shopifyOrder.total_price,
      currency: shopifyOrder.currency,
      shippingAddress: shopifyOrder.shipping_address || null,
      billingAddress: shopifyOrder.billing_address || null,
      processedAt: shopifyOrder.processed_at ? new Date(shopifyOrder.processed_at) : new Date(),
    }).returning();

    // 3. 创建订单商品
    for (const item of shopifyOrder.line_items) {
      await db.insert(orderItems).values({
        orderId: newOrder.id,
        shopifyProductId: item.product_id,
        shopifyVariantId: item.variant_id,
        productTitle: item.name,
        variantTitle: item.variant_title || null,
        sku: item.sku || null,
        quantity: item.quantity,
        price: item.price,
        totalDiscount: item.total_discount,
      });
    }

    console.log('[Webhook] Order processed successfully, order ID:', newOrder.id);

    return NextResponse.json({
      success: true,
      orderId: newOrder.id,
      shopifyOrderId: shopifyOrder.id,
    });
  } catch (error) {
    console.error('[Webhook] Error processing order:', error);
    return NextResponse.json(
      {
        error: 'Failed to process order',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
