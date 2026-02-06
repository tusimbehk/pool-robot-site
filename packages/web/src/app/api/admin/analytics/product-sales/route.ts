// packages/web/src/app/api/admin/analytics/product-sales/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orderItems } from '@/db/schema';
import { getAdminTokenFromHeaders, isValidAdminToken } from '@/lib/admin/auth';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';

interface ProductSalesData {
  product: string;
  quantity: number;
  revenue: string;
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
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10'), 1), 100);

    // Query product sales aggregated by product title
    const result = await db.execute<{
      product_title: string;
      quantity: bigint;
      revenue: string;
    }>(sql`
      SELECT
        product_title,
        SUM(quantity) as quantity,
        SUM(quantity * price) as revenue
      FROM order_items
      GROUP BY product_title
      ORDER BY quantity DESC
      LIMIT ${limit}
    `);

    const data: ProductSalesData[] = result.rows.map(row => ({
      product: row.product_title,
      quantity: Number(row.quantity),
      revenue: row.revenue,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[Analytics] Product sales error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product sales' },
      { status: 500 }
    );
  }
}
