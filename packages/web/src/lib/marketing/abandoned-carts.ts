// packages/web/src/lib/marketing/abandoned-carts.ts

import { db } from '@/db';
import { userSessions, abandonedCartEmails, users } from '@/db/schema';
import { eq, and, lte, sql, gt } from 'drizzle-orm';
import { sendCartRecoveryEmail } from '@/lib/email/resend';

const ABANDONED_THRESHOLD_MINUTES = 30;
const EMAIL_COOLDOWN_HOURS = 24;

export interface AbandonedCart {
  sessionId: string;
  userId?: string;
  email?: string;
  cartItems: any[];
  lastSeenAt: Date;
}

/**
 * Find abandoned carts that need email recovery
 */
export async function findAbandonedCarts(): Promise<AbandonedCart[]> {
  const threshold = new Date();
  threshold.setMinutes(threshold.getMinutes() - ABANDONED_THRESHOLD_MINUTES);

  const cooldownThreshold = new Date();
  cooldownThreshold.setHours(cooldownThreshold.getHours() - EMAIL_COOLDOWN_HOURS);

  // Find sessions with added_to_cart but no completed_purchase
  const sessions = await db
    .select({
      sessionId: userSessions.id,
      userId: userSessions.userId,
      lastSeenAt: userSessions.sessionEnd,
    })
    .from(userSessions)
    .where(
      and(
        sql`${userSessions.addedToCart} = true`,
        sql`${userSessions.completedPurchase} = false`,
        lte(userSessions.sessionEnd, threshold)
      )
    );

  // Filter out sessions that already received an email recently
  const recentEmails = await db
    .select({ sessionId: abandonedCartEmails.sessionId })
    .from(abandonedCartEmails)
    .where(gt(abandonedCartEmails.sentAt, cooldownThreshold));

  const recentEmailSessionIds = new Set(recentEmails.map((e) => e.sessionId));

  const abandonedCarts: AbandonedCart[] = [];

  for (const session of sessions) {
    if (recentEmailSessionIds.has(session.sessionId)) {
      continue;
    }

    // Try to get user email
    let email: string | undefined;
    if (session.userId) {
      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1);

      email = user?.email;
    }

    abandonedCarts.push({
      sessionId: session.sessionId,
      userId: session.userId,
      email,
      cartItems: [], // Would need to fetch from session data
      lastSeenAt: session.lastSeenAt || new Date(),
    });
  }

  return abandonedCarts;
}

/**
 * Process abandoned cart and send recovery email
 */
export async function processAbandonedCart(cart: AbandonedCart) {
  if (!cart.email) {
    console.log('[Abandoned Cart] No email for session:', cart.sessionId);
    return { success: false, reason: 'no_email' };
  }

  // TODO: Fetch actual cart items from session storage
  const cartItems = [
    { name: 'PoolClean Pro X1', quantity: 1, price: '299.00' },
  ];

  const cartTotal = cartItems.reduce((sum, item) =>
    sum + parseFloat(item.price) * item.quantity, 0
  ).toFixed(2);

  // Send email
  const result = await sendCartRecoveryEmail({
    to: cart.email,
    cartItems,
    cartTotal,
    discountCode: 'CART10',
    recoveryUrl: `https://poolclean.com/cart?session=${cart.sessionId}`,
  });

  if (result.success) {
    // Track email sent
    await db.insert(abandonedCartEmails).values({
      sessionId: cart.sessionId,
      userId: cart.userId,
      email: cart.email,
      cartItems,
      cartTotal,
      discountCode: 'CART10',
    });
  }

  return result;
}
