/**
 * React Hook for Analytics
 *
 * Provides a simple interface for tracking events in React components
 */

import { useCallback } from "react";
import {
  trackProductViewed,
  trackProductAdded,
  trackCheckoutStarted,
  trackOrderCompleted,
  trackEvent,
  type SegmentEvent,
} from "@/lib/analytics";

export function useAnalytics() {
  /**
   * Track any custom event
   */
  const track = useCallback((event: string, properties?: Record<string, unknown>) => {
    trackEvent({
      event,
      properties,
    });
  }, []);

  /**
   * Track product view
   */
  const trackProduct = useCallback((product: {
    id: string;
    name: string;
    price: number;
    currency: string;
    category?: string;
    variant?: string;
  }) => {
    trackProductViewed(product);
  }, []);

  /**
   * Track add to cart
   */
  const trackAddToCart = useCallback((product: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    currency: string;
  }) => {
    trackProductAdded(product);
  }, []);

  /**
   * Track remove from cart
   */
  const trackRemoveFromCart = useCallback((product: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    currency: string;
  }) => {
    trackEvent({
      event: "Product Removed",
      properties: {
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: product.quantity,
        currency: product.currency,
      },
    });
  }, []);

  /**
   * Track checkout started
   */
  const trackCheckout = useCallback((cart: {
    cartId: string;
    total: number;
    currency: string;
    itemCount: number;
  }) => {
    trackCheckoutStarted(cart);
  }, []);

  /**
   * Track order completed
   */
  const trackOrder = useCallback((order: {
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
  }) => {
    trackOrderCompleted(order);
  }, []);

  /**
   * Track search
   */
  const trackSearch = useCallback((query: string, resultsCount: number) => {
    trackEvent({
      event: "Products Searched",
      properties: {
        query,
        results_count: resultsCount,
      },
    });
  }, []);

  /**
   * Track share
   */
  const trackShare = useCallback((props: {
    product: string;
    platform: string;
  }) => {
    trackEvent({
      event: "Product Shared",
      properties: {
        product_id: props.product,
        share_platform: props.platform,
      },
    });
  }, []);

  return {
    track,
    trackProduct,
    trackAddToCart,
    trackRemoveFromCart,
    trackCheckout,
    trackOrder,
    trackSearch,
    trackShare,
  };
}
