/**
 * Segment Analytics Configuration with Dual-Write Strategy
 *
 * Analytics utility using Segment + self-hosted API for event tracking
 * Implements dual-write: sends events to both Segment and own API
 * Falls back to console logging when neither is available
 */

import { getAnonymousId as getCookieAnonymousId, getUserId } from './client-cookies';

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
 * Get device information for context
 */
function getDeviceInfo() {
  if (typeof window === "undefined") {
    return { type: "unknown" };
  }

  const ua = navigator.userAgent;
  const type = /Mobile|Android|iPhone/i.test(ua) ? "mobile" :
               /Tablet|iPad/i.test(ua) ? "tablet" : "desktop";

  return {
    type,
    browser: detectBrowser(),
    os: detectOS(),
    screen: `${window.screen.width}x${window.screen.height}`,
  };
}

function detectBrowser(): string {
  if (typeof window === "undefined") return "unknown";

  const ua = navigator.userAgent;
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edge")) return "Edge";
  return "Unknown";
}

function detectOS(): string {
  if (typeof window === "undefined") return "unknown";

  const ua = navigator.userAgent;
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("iOS")) return "iOS";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("Linux")) return "Linux";
  return "Unknown";
}

/**
 * Check if analytics is allowed by cookie consent
 */
function isAnalyticsAllowed(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) return false;
    const parsed = JSON.parse(consent) as { necessary: boolean; analytics: boolean; marketing: boolean };
    return parsed.analytics === true;
  } catch {
    return false;
  }
}

/**
 * Send event to self-hosted API (Dual-Write)
 */
async function sendToSelfHostedAPI(
  eventName: string,
  properties: Record<string, unknown>,
  anonymousId: string,
  userId?: string
): Promise<void> {
  // Check cookie consent before sending
  if (!isAnalyticsAllowed()) {
    return;
  }

  const payload = {
    event: eventName,
    properties,
    anonymousId,
    userId: userId || undefined,
    context: {
      page: typeof window !== "undefined" ? window.location.href : "",
      pageTitle: typeof window !== "undefined" ? document.title : "",
      referrer: typeof window !== "undefined" ? document.referrer : "",
      device: getDeviceInfo(),
    },
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch('/api/events/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // 静默失败，不影响用户体验
    console.error('[Analytics] Failed to send event to self-hosted API:', err);
  }
}

/**
 * Track a page view (Dual-Write)
 */
export function trackPage(page: SegmentPage): void {
  // 1. Send to Segment
  if (!isAnalyticsReady()) {
    console.log("[Segment] Page:", page);
  } else {
    const analytics = getAnalytics();
    if (analytics) {
      analytics.page(page.name || "", page.properties, {
        userId: page.userId,
        anonymousId: page.anonymousId,
      });
    }
  }

  // 2. Send to self-hosted API (Dual-Write)
  const anonymousId = getCookieAnonymousId();
  const userId = getUserId();
  sendToSelfHostedAPI(
    'Page Viewed',
    {
      page_name: page.name || '',
      ...page.properties,
    },
    anonymousId,
    userId || page.userId
  );
}

/**
 * Track an event (Dual-Write)
 */
export function trackEvent(event: SegmentEvent): void {
  // 1. Send to Segment
  if (!isAnalyticsReady()) {
    console.log("[Segment] Event:", event);
  } else {
    const analytics = getAnalytics();
    if (analytics) {
      analytics.track(event.event, event.properties, {
        userId: event.userId,
        anonymousId: event.anonymousId,
      });
    }
  }

  // 2. Send to self-hosted API (Dual-Write)
  const anonymousId = event.anonymousId || getCookieAnonymousId();
  const userId = event.userId || getUserId() || undefined;
  sendToSelfHostedAPI(
    event.event,
    event.properties || {},
    anonymousId,
    userId
  );
}

/**
 * Identify a user (Dual-Write)
 */
export function identifyUser(user: SegmentIdentify): void {
  // 1. Send to Segment
  if (!isAnalyticsReady()) {
    console.log("[Segment] Identify:", user);
  } else {
    const analytics = getAnalytics();
    if (analytics) {
      analytics.identify(user.userId, user.traits);
    }
  }

  // 2. Send to self-hosted API (Dual-Write)
  const anonymousId = getCookieAnonymousId();
  const traits = user.traits || {};

  // Non-blocking send
  fetch('/api/users/identify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.userId,
      anonymousId,
      traits,
    }),
  }).catch((err) => {
    console.error('[Analytics] Failed to identify user:', err);
  });
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
  // Use cookie-based anonymous ID for dual-write
  return getCookieAnonymousId();
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

  // Track logout event to self-hosted API
  const anonymousId = getCookieAnonymousId();
  sendToSelfHostedAPI('User Logged Out', {}, anonymousId);
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
