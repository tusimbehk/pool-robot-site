/**
 * Shopify Client Hook
 *
 * React hook for accessing the Shopify client
 */

import { useDebugValue } from "react";
import { getShopifyClient, isShopifyConfigured } from "@/lib/shopify";

/**
 * Hook to get the Shopify client
 */
export function useShopifyClient() {
  const client = getShopifyClient();
  const configured = isShopifyConfigured();

  useDebugValue(configured ? "Shopify configured" : "Using mock client");

  return client;
}

/**
 * Hook to check if Shopify is configured
 */
export function useIsShopifyConfigured() {
  const configured = isShopifyConfigured();
  useDebugValue(configured ? "Configured" : "Not configured");
  return configured;
}
