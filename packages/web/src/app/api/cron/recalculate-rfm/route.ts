// packages/web/src/app/api/cron/recalculate-rfm/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { recalculateUserRFM } from '@/lib/analytics/rfm';
import { db } from '@/db';
import { users } from '@/db/schema';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Cron] Starting RFM recalculation...');

    // Get all users who have orders
    const allUsers = await db.select().from(users);

    let processed = 0;
    let errors = 0;

    for (const user of allUsers) {
      try {
        await recalculateUserRFM(user.id);
        processed++;
      } catch (error) {
        console.error(`[Cron] Failed to recalculate RFM for user ${user.id}:`, error);
        errors++;
      }
    }

    console.log(`[Cron] RFM recalculation complete: ${processed} processed, ${errors} errors`);

    return NextResponse.json({
      success: true,
      processed,
      errors,
      totalUsers: allUsers.length,
    });
  } catch (error) {
    console.error('[Cron] Error:', error);
    return NextResponse.json(
      { error: 'Failed to recalculate RFM' },
      { status: 500 }
    );
  }
}
