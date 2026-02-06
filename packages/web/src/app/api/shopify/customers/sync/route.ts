import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // 注意：这里需要在 Shopify Admin API 配置后才能实际使用
    // 当前实现仅作为占位符，实际需要调用 Shopify Admin API
    // TODO: 实现 Shopify Admin API 调用

    // 查找现有用户
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUsers.length > 0) {
      return NextResponse.json({
        success: true,
        synced: false,
        message: 'User already exists',
        user: existingUsers[0],
      });
    }

    return NextResponse.json({
      success: true,
      synced: false,
      message: 'Customer sync requires Shopify Admin API configuration',
    });
  } catch (error) {
    console.error('[Customer Sync] Error:', error);
    return NextResponse.json(
      { error: 'Failed to sync customer', details: error instanceof Error ? error.message : String(error) },
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

  try {
    const customers = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const user = customers[0];

    if (!user) {
      return NextResponse.json({
        success: true,
        found: false,
        user: null,
      });
    }

    return NextResponse.json({
      success: true,
      found: true,
      user,
    });
  } catch (error) {
    console.error('[Customer Get] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get customer', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
