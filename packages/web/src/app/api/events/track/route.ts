import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userEvents } from '@/db/schema';
import { validateEventPayload } from '@/lib/analytics/validation';

export const runtime = 'nodejs'; // Changed from 'edge' to 'nodejs' for better compatibility

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证请求体
    const validation = validateEventPayload(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { event, properties, anonymousId, userId, context, timestamp } = validation.data;

    // 存储事件到数据库
    const [newEvent] = await db.insert(userEvents).values({
      anonymousId,
      userId: userId || null,
      eventName: event,
      eventProperties: properties,
      pageUrl: context?.page,
      pageTitle: context?.pageTitle,
      referrerUrl: context?.referrer,
      utmSource: context?.utmSource,
      utmMedium: context?.utmMedium,
      utmCampaign: context?.utmCampaign,
      deviceType: context?.device?.type,
      browser: context?.device?.browser,
      os: context?.device?.os,
      countryCode: context?.location?.countryCode,
      city: context?.location?.city,
      occurredAt: timestamp ? new Date(timestamp) : new Date(),
    }).returning();

    return NextResponse.json({
      success: true,
      eventId: newEvent.id,
    });
  } catch (error) {
    console.error('[Events API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
