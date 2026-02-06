// packages/web/src/app/api/admin/analytics/order-funnel/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userSessions, orders } from '@/db/schema';
import { getAdminTokenFromHeaders, isValidAdminToken } from '@/lib/admin/auth';
import { sql, count } from 'drizzle-orm';

export const runtime = 'nodejs';

interface FunnelStage {
  stage: string;
  count: number;
}

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const token = getAdminTokenFromHeaders(request.headers);
  if (!token || !isValidAdminToken(token)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Get total sessions (visits)
    const [totalSessions] = await db
      .select({ count: count() })
      .from(userSessions);

    // Sessions with add to cart
    const [addToCart] = await db
      .select({ count: count() })
      .from(userSessions)
      .where(sql`added_to_cart = true`);

    // Sessions with checkout started
    const [checkoutStarted] = await db
      .select({ count: count() })
      .from(userSessions)
      .where(sql`started_checkout = true`);

    // Sessions with purchase completed
    const [purchaseCompleted] = await db
      .select({ count: count() })
      .from(userSessions)
      .where(sql`completed_purchase = true`);

    const data: FunnelStage[] = [
      { stage: '访问', count: totalSessions.count },
      { stage: '加入购物车', count: addToCart.count },
      { stage: '开始结账', count: checkoutStarted.count },
      { stage: '完成购买', count: purchaseCompleted.count },
    ];

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[Analytics] Order funnel error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order funnel' },
      { status: 500 }
    );
  }
}
