import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, userEvents } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export const runtime = 'nodejs'; // Changed from 'edge' to 'nodejs' for better compatibility

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, anonymousId, traits } = body;

    if (!userId || !anonymousId || !traits) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. 检查用户是否已存在
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = existingUsers[0];

    // 2. 如果不存在，创建用户
    if (!user) {
      await db.insert(users).values({
        id: userId,
        email: traits.email as string,
        phone: traits.phone as string,
        gdprConsent: (traits.gdprConsent as boolean) || false,
        dataConsentGivenAt: traits.gdprConsent ? new Date() : null,
        signupSource: traits.signupSource as string,
      });
    }

    // 3. 将匿名事件关联到用户 ID
    const updatedEvents = await db
      .update(userEvents)
      .set({ userId: userId })
      .where(
        and(
          eq(userEvents.anonymousId, anonymousId),
          isNull(userEvents.userId)
        )
      )
      .returning();

    // 4. 更新用户最后活跃时间
    await db
      .update(users)
      .set({ lastSeenAt: new Date() })
      .where(eq(users.id, userId));

    // 5. 获取更新后的用户信息
    const updatedUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const updatedUser = updatedUsers[0];

    return NextResponse.json({
      success: true,
      mergedEventsCount: updatedEvents.length,
      userProfile: {
        userId: updatedUser.id,
        email: updatedUser.email,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    console.error('[Identify API] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
