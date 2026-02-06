/**
 * Shopify Module
 *
 * Main entry point for Shopify-related functionality
 */

// Export types
export type {
  Product,
  ProductsConnection,
  Cart,
  CartCreateInput,
  CartLineItem,
  Shop,
  Money,
  Image,
  ProductVariant,
  ProductOption,
  Checkout,
} from "./types";

// Export real client
export { shopifyClient } from "./client";

// Export mock client
export { mockShopifyClient } from "./client.mock";

// Export helpers (recommended for most use cases)
export { getShopifyClient, isShopifyConfigured } from "./client-helpers";

// Export Cart API
export { cartApi } from "./cart-api";
export type { CartLineInput, CartLineUpdateInput, UserError } from "./cart-api";

// Export error handling
export {
  ShopifyError,
  parseShopifyError,
  handleShopifyError,
} from "./error-handler";
export type { ShopifyErrorCode } from "./error-handler";

// Export currency helpers
export {
  convertShopifyPrice,
  formatShopifyMoney,
  getLocalizedPrice,
} from "./client";

// Export mock data (for testing)
export {
  mockProducts,
  mockProductsConnection,
  getMockProductByHandle,
  getMockProductById,
  searchMockProducts,
  filterMockProductsByTag,
  filterMockProductsByType,
} from "./mocks";
