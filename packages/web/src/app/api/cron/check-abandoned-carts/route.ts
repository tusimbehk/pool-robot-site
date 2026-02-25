// packages/web/src/app/api/cron/check-abandoned-carts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { findAbandonedCarts, processAbandonedCart } from '@/lib/marketing/abandoned-carts';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Cron] Checking for abandoned carts...');

    const abandonedCarts = await findAbandonedCarts();

    console.log(`[Cron] Found ${abandonedCarts.length} abandoned carts`);

    const results = [];

    for (const cart of abandonedCarts) {
      const result = await processAbandonedCart(cart);
      results.push({
        sessionId: cart.sessionId,
        email: cart.email,
        result: result.success ? 'sent' : ('reason' in result ? result.reason : 'failed'),
      });
    }

    return NextResponse.json({
      success: true,
      processed: abandonedCarts.length,
      results,
    });
  } catch (error) {
    console.error('[Cron] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check abandoned carts' },
      { status: 500 }
    );
  }
}
