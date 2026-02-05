/**
 * Shopify Client Helpers
 *
 * Utility functions that automatically switch between real and mock Shopify client
 * based on whether credentials are configured
 */

import { SHOPIFY_CONFIG } from "@/lib/constants";
import { shopifyClient } from "./client";
import { mockShopifyClient } from "./client.mock";

/**
 * Check if Shopify is properly configured
 */
export function isShopifyConfigured(): boolean {
  return !!(
    SHOPIFY_CONFIG.domain &&
    SHOPIFY_CONFIG.storefrontToken &&
    SHOPIFY_CONFIG.domain !== "your-store.myshopify.com"
  );
}

/**
 * Get the appropriate Shopify client (real or mock)
 *
 * Usage:
 * ```ts
 * import { getShopifyClient } from '@/lib/shopify/client-helpers';
 *
 * const client = getShopifyClient();
 * const products = await client.getProducts();
 * ```
 */
export function getShopifyClient() {
  if (isShopifyConfigured()) {
    return shopifyClient;
  }

  // Log warning in development
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "[Shopify] Using mock client. Configure NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN and NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN to use real API."
    );
  }

  return mockShopifyClient;
}

/**
 * Re-export client types
 */
export type { Product, ProductsConnection, Cart, CartCreateInput, Shop } from "./types";
