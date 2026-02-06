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
    const result = await db
      .select({
        product: sql<string>`product_title`.as('product_title'),
        quantity: sql<number>`SUM(quantity)`.as('quantity'),
        revenue: sql<string>`SUM(quantity * price)::text`.as('revenue'),
      })
      .from(orderItems)
      .groupBy(sql`product_title`)
      .orderBy(sql`SUM(quantity) DESC`)
      .limit(limit);

    const data: ProductSalesData[] = result.map(row => ({
      product: row.product as string,
      quantity: Number(row.quantity),
      revenue: row.revenue as string,
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
