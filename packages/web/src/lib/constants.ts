/**
 * Application-wide constants
 */

export const SITE_NAME = "PoolClean Pro";
export const SITE_DESCRIPTION = "Premium pool cleaning robots for European and North American markets";

export const SUPPORTED_LOCALES = ["en", "de", "fr", "es", "it"] as const;
export const DEFAULT_LOCALE = "en" as const;

export const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "CAD"] as const;
export const DEFAULT_CURRENCY = "USD" as const;

export const ROUTES = {
  HOME: "/",
  PRODUCTS: "/products",
  PRODUCT: (slug: string) => `/products/${slug}`,
  CART: "/cart",
  CHECKOUT: "/checkout",
  ACCOUNT: "/account",
  ORDERS: "/account/orders",
  ORDER: (id: string) => `/account/orders/${id}`,
  SUPPORT: "/support",
  ABOUT: "/about",
  CONTACT: "/contact",
} as const;

export const API_ROUTES = {
  PRODUCTS: "/api/products",
  CART: "/api/cart",
  CHECKOUT: "/api/checkout",
  WEBHOOK: "/api/webhook",
} as const;

/**
 * Shopify configuration (to be filled from environment)
 */
export const SHOPIFY_CONFIG = {
  domain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || "",
  storefrontToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || "",
  apiVersion: "2024-10",
} as const;

/**
 * Segment configuration
 */
export const SEGMENT_CONFIG = {
  writeKey: process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY || "",
} as const;
