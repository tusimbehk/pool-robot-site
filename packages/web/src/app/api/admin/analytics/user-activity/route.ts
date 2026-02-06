// packages/web/src/app/api/admin/analytics/user-activity/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userEvents } from '@/db/schema';
import { getAdminTokenFromHeaders, isValidAdminToken } from '@/lib/admin/auth';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';

interface ActivityDataPoint {
  date: string; // YYYY-MM-DD
  activeUsers: number;
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
    const { searchParams } = new URL(request.url);
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '30'), 1), 365);

    // Query user activity by date
    const result = await db
      .select({
        date: sql<string>`DATE(occurred_at)`.as('date'),
        activeUsers: sql<number>`COUNT(DISTINCT user_id)`.as('active_users'),
      })
      .from(userEvents)
      .where(sql`occurred_at >= NOW() - INTERVAL '1 day' * ${days}`)
      .groupBy(sql`DATE(occurred_at)`)
      .orderBy(sql`DATE(occurred_at)`);

    const data: ActivityDataPoint[] = result.map(row => ({
      date: row.date as string,
      activeUsers: Number(row.activeUsers),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[Analytics] User activity error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user activity' },
      { status: 500 }
    );
  }
}
