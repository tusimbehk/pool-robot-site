import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, userEvents, userSessions, orders, orderItems, userProfiles, abandonedCartEmails } from '@/db/schema';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const tables = [
      { name: 'users', schema: users },
      { name: 'user_events', schema: userEvents },
      { name: 'user_sessions', schema: userSessions },
      { name: 'orders', schema: orders },
      { name: 'order_items', schema: orderItems },
      { name: 'user_profiles', schema: userProfiles },
      { name: 'abandoned_cart_emails', schema: abandonedCartEmails },
    ];

    const results: Record<string, { exists: boolean; count?: number; error?: string }> = {};

    for (const table of tables) {
      try {
        const result = await db.select().from(table.schema).limit(1);
        results[table.name] = { exists: true, count: result.length };
      } catch (error) {
        results[table.name] = {
          exists: false,
          error: (error as Error).message.includes('does not exist') ? 'Table does not exist' : (error as Error).message
        };
      }
    }

    return NextResponse.json({
      success: true,
      database: 'connected',
      tables: results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Database connection failed',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
