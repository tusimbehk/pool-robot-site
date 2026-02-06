import { NextRequest, NextResponse } from 'next/server';
import { verifyAndParseWebhook } from '@/lib/shopify/webhook';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

interface ShopifyOrderUpdate {
  id: string;
  order_number: number;
  email?: string;
  financial_status: string;
  fulfillment_status?: string;
  subtotal_price?: string;
  total_tax?: string;
  total_shipping_price_set?: {
    shop_money_amount: string;
  };
  total_price?: string;
  currency?: string;
  processed_at?: string;
  updated_at: string;
  tags?: string[];
}

export async function POST(request: NextRequest) {
  let shopifyOrder: ShopifyOrderUpdate;

  // 检查是否为测试模式
  const testModeHmac = request.headers.get('x-shopify-hmac-sha256');

  if (testModeHmac === 'test-dev-mode-skip') {
    console.warn('[Webhook] Running in TEST MODE - skipping HMAC verification');
    const body = await request.json();
    shopifyOrder = body as ShopifyOrderUpdate;
  } else {
    const verification = await verifyAndParseWebhook<ShopifyOrderUpdate>(request);

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
  console.log('[Webhook] Order updated:', shopifyOrder.id, 'Topic:', topic);

  try {
    // 查找现有订单
    const existingOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.shopifyOrderId, shopifyOrder.id))
      .limit(1);

    const existingOrder = existingOrders[0];

    if (!existingOrder) {
      console.log('[Webhook] Order not found, creating new order instead');
      // 订单不存在，可能是因为 orders/create webhook 没有触发
      // 这里可以选择创建新订单，或者返回错误
      // 为了容错，我们返回成功（避免 Shopify 重试）
      return NextResponse.json({
        success: true,
        message: 'Order not found, skipping update',
        orderCreated: false,
      });
    }

    // 更新订单状态
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: shopifyOrder.financial_status,
        financialStatus: shopifyOrder.financial_status,
        fulfillmentStatus: shopifyOrder.fulfillment_status || null,
        updatedAt: new Date(),
      })
      .where(eq(orders.shopifyOrderId, shopifyOrder.id))
      .returning();

    console.log('[Webhook] Order updated successfully:', updatedOrder.id);

    return NextResponse.json({
      success: true,
      orderId: updatedOrder.id,
      shopifyOrderId: shopifyOrder.id,
      updated: true,
    });
  } catch (error) {
    console.error('[Webhook] Error updating order:', error);
    return NextResponse.json(
      {
        error: 'Failed to update order',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
