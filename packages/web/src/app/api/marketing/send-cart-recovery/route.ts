// packages/web/src/app/api/marketing/send-cart-recovery/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAdminTokenFromHeaders, isValidAdminToken } from '@/lib/admin/auth';
import { sendCartRecoveryEmail } from '@/lib/email/resend';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // Verify admin authentication
  const token = getAdminTokenFromHeaders(request.headers);
  if (!token || !isValidAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email, cartItems, cartTotal, discountCode } = await request.json();

    if (!email || !cartItems || !cartTotal) {
      return NextResponse.json(
        { error: 'Missing required fields: email, cartItems, cartTotal' },
        { status: 400 }
      );
    }

    const result = await sendCartRecoveryEmail({
      to: email,
      cartItems,
      cartTotal,
      discountCode,
      recoveryUrl: `https://poolclean.com/cart`,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cart recovery email sent',
    });
  } catch (error) {
    console.error('[Marketing] Error sending cart recovery:', error);
    return NextResponse.json(
      { error: 'Failed to send cart recovery email' },
      { status: 500 }
    );
  }
}
