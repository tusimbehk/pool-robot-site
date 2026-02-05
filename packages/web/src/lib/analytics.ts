/**
 * Segment Analytics Configuration
 *
 * Analytics utility using Segment for event tracking
 * Falls back to console logging when Segment is not configured
 */

// Type declaration for Segment Analytics.js
declare global {
  interface Window {
    analytics?: {
      page: (name: string, properties?: Record<string, unknown>, options?: Record<string, unknown>) => void;
      track: (event: string, properties?: Record<string, unknown>, options?: Record<string, unknown>) => void;
      identify: (userId: string, traits?: Record<string, unknown>, options?: Record<string, unknown>) => void;
      alias: (userId: string, previousId?: string, options?: Record<string, unknown>) => void;
      user: () => { anonymousId: () => string };
      reset: () => void;
    };
  }
}

interface SegmentConfig {
  writeKey: string;
  isReady: boolean;
}

let segmentConfig: SegmentConfig = {
  writeKey: "",
  isReady: false,
};

// Type definitions for Segment
export interface SegmentEvent {
  event: string;
  properties?: Record<string, unknown>;
  userId?: string;
  anonymousId?: string;
}

export interface SegmentPage {
  name?: string;
  properties?: Record<string, unknown>;
  userId?: string;
  anonymousId?: string;
}

export interface SegmentIdentify {
  userId: string;
  traits?: Record<string, unknown>;
}

export interface SegmentUser {
  id?: string;
  email?: string;
  name?: string;
  // Add more user properties as needed
}

/**
 * Initialize Segment analytics
 */
export function initAnalytics(writeKey: string): void {
  if (!writeKey || writeKey === "your-segment-write-key") {
    if (process.env.NODE_ENV === "development") {
      console.log("[Segment] Mock mode - events will be logged to console");
    }
    segmentConfig = {
      writeKey: "",
      isReady: true,
    };
    return;
  }

  // Load Segment Analytics.js
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.async = true;
  script.src = `https://cdn.segment.com/analytics.js/v1/${writeKey}/analytics.min.js`;

  script.onload = () => {
    segmentConfig = {
      writeKey,
      isReady: true,
    };
  };

  document.head.appendChild(script);
}

/**
 * Get the analytics instance (returns window.analytics if loaded)
 */
function getAnalytics(): typeof window.analytics | undefined {
  return typeof window !== "undefined" ? window.analytics : undefined;
}

/**
 * Check if analytics is ready (Segment loaded or mock mode)
 */
export function isAnalyticsReady(): boolean {
  return segmentConfig.isReady || !!getAnalytics();
}

/**
 * Track a page view
 */
export function trackPage(page: SegmentPage): void {
  if (!isAnalyticsReady()) {
    console.log("[Segment] Page:", page);
    return;
  }

  const analytics = getAnalytics();
  if (analytics) {
    analytics.page(page.name || "", page.properties, {
      userId: page.userId,
      anonymousId: page.anonymousId,
    });
  }
}

/**
 * Track an event
 */
export function trackEvent(event: SegmentEvent): void {
  if (!isAnalyticsReady()) {
    console.log("[Segment] Event:", event);
    return;
  }

  const analytics = getAnalytics();
  if (analytics) {
    analytics.track(event.event, event.properties, {
      userId: event.userId,
      anonymousId: event.anonymousId,
    });
  }
}

/**
 * Identify a user
 */
export function identifyUser(user: SegmentIdentify): void {
  if (!isAnalyticsReady()) {
    console.log("[Segment] Identify:", user);
    return;
  }

  const analytics = getAnalytics();
  if (analytics) {
    analytics.identify(user.userId, user.traits);
  }
}

/**
 * Alias a user (merge anonymous ID with user ID)
 */
export function aliasUser(previousId: string, userId: string): void {
  if (!isAnalyticsReady()) {
    console.log("[Segment] Alias:", { previousId, userId });
    return;
  }

  const analytics = getAnalytics();
  if (analytics) {
    analytics.alias(userId, previousId);
  }
}

/**
 * Get anonymous ID for current session
 */
export function getAnonymousId(): string | undefined {
  const analytics = getAnalytics();
  // @ts-ignore - Segment types may not match exactly
  return analytics?.user?.()?.anonymousId?.();
}

/**
 * Reset the analytics (logout)
 */
export function resetAnalytics(): void {
  const analytics = getAnalytics();
  if (analytics) {
    analytics.reset();
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[Segment] Reset");
  }
}

/**
 * Helper: Track product viewed
 */
export function trackProductViewed(product: {
  id: string;
  name: string;
  price: number;
  currency: string;
  category?: string;
  variant?: string;
}): void {
  trackEvent({
    event: "Product Viewed",
    properties: {
      product_id: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency,
      category: product.category,
      variant: product.variant,
    },
  });
}

/**
 * Helper: Track product added to cart
 */
export function trackProductAdded(product: {
  id: string;
  name: string;
  price: number;
  quantity: number;
  currency: string;
}): void {
  trackEvent({
    event: "Product Added",
    properties: {
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      currency: product.currency,
      revenue: product.price * product.quantity,
    },
  });
}

/**
 * Helper: Track checkout started
 */
export function trackCheckoutStarted(cart: {
  cartId: string;
  total: number;
  currency: string;
  itemCount: number;
}): void {
  trackEvent({
    event: "Checkout Started",
    properties: {
      cart_id: cart.cartId,
      revenue: cart.total,
      currency: cart.currency,
      item_count: cart.itemCount,
    },
  });
}

/**
 * Helper: Track order completed
 */
export function trackOrderCompleted(order: {
  orderId: string;
  total: number;
  currency: string;
  itemCount: number;
  products: Array<{
    product_id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}): void {
  trackEvent({
    event: "Order Completed",
    properties: {
      order_id: order.orderId,
      revenue: order.total,
      currency: order.currency,
      products: order.products,
    },
  });
}
