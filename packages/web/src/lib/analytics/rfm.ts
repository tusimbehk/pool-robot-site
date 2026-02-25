// packages/web/src/lib/analytics/rfm.ts

import { db } from '@/db';
import { orders, userProfiles } from '@/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

export interface RFMScores {
  rScore: number;
  fScore: number;
  mScore: number;
  segment: string;
}

/**
 * Calculate Recency score (1-5, 5 is best)
 */
function calculateRecencyScore(daysSinceLastPurchase: number): number {
  if (daysSinceLastPurchase <= 30) return 5;
  if (daysSinceLastPurchase <= 60) return 4;
  if (daysSinceLastPurchase <= 90) return 3;
  if (daysSinceLastPurchase <= 180) return 2;
  return 1;
}

/**
 * Calculate Frequency score (1-5, 5 is best)
 */
function calculateFrequencyScore(orderCount: number): number {
  if (orderCount >= 5) return 5;
  if (orderCount >= 3) return 4;
  if (orderCount >= 2) return 3;
  if (orderCount >= 1) return 2;
  return 1;
}

/**
 * Calculate Monetary score (1-5, 5 is best)
 */
function calculateMonetaryScore(totalSpent: number): number {
  if (totalSpent >= 1000) return 5;
  if (totalSpent >= 500) return 4;
  if (totalSpent >= 250) return 3;
  if (totalSpent >= 100) return 2;
  return 1;
}

/**
 * Determine customer segment based on RFM scores
 */
function getUserSegment(r: number, f: number, m: number): string {
  if (r >= 4 && f >= 4 && m >= 4) return 'VIP';
  if (r >= 3 && f >= 3 && m >= 3) return 'Loyal';
  if (r >= 2 && f >= 2 && m >= 2) return 'Potential';
  if (r >= 3 && f <= 2) return 'New';
  return 'At-Risk';
}

/**
 * Calculate RFM scores for a single user
 */
export async function calculateUserRFM(userId: string): Promise<RFMScores> {
  // Get orders from last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const userOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.userId, userId),
        gte(orders.processedAt, ninetyDaysAgo)
      )
    );

  // Calculate Recency (days since last purchase)
  let daysSinceLastPurchase = 999;
  if (userOrders.length > 0) {
    const lastOrder = userOrders.reduce((latest, order) => {
      const latestDate = latest.processedAt ? new Date(latest.processedAt) : new Date(0);
      const orderDate = order.processedAt ? new Date(order.processedAt) : new Date(0);
      return orderDate > latestDate ? order : latest;
    });
    if (lastOrder.processedAt) {
      daysSinceLastPurchase = Math.floor(
        (Date.now() - new Date(lastOrder.processedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
    }
  }

  const rScore = calculateRecencyScore(daysSinceLastPurchase);

  // Calculate Frequency
  const fScore = calculateFrequencyScore(userOrders.length);

  // Calculate Monetary
  const totalSpent = userOrders.reduce((sum, order) =>
    sum + parseFloat(order.totalPrice || '0'), 0
  );
  const mScore = calculateMonetaryScore(totalSpent);

  // Determine segment
  const segment = getUserSegment(rScore, fScore, mScore);

  return { rScore, fScore, mScore, segment };
}

/**
 * Recalculate and update RFM scores for a user
 */
export async function recalculateUserRFM(userId: string) {
  const scores = await calculateUserRFM(userId);

  const totalOrders = scores.fScore >= 2 ? 1 : 0; // Approximate
  const totalSpent = scores.mScore * 100; // Approximate

  // Check if profile exists
  const existing = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing profile
    await db
      .update(userProfiles)
      .set({
        ...scores,
        totalOrders,
        totalSpent: totalSpent.toString(),
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId));
  } else {
    // Create new profile
    await db.insert(userProfiles).values({
      userId,
      ...scores,
      totalOrders,
      totalSpent: totalSpent.toString(),
    });
  }
}
