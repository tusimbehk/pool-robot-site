/**
 * Shopify Storefront API Cart Operations
 *
 * Full Cart API implementation for Shopify Storefront API 2024-10
 * Includes: create, add, update, remove, and discount code operations
 */

import { SHOPIFY_CONFIG } from "@/lib/constants";
import type { Cart, CartCreateInput, CartLineItem } from "./types";

const SHOPIFY_GRAPHQL_URL = `https://${SHOPIFY_CONFIG.domain}/api/${SHOPIFY_CONFIG.apiVersion}/graphql.json`;

/**
 * Execute GraphQL query against Shopify Storefront API
 */
async function shopifyFetch<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  if (!SHOPIFY_CONFIG.domain || !SHOPIFY_CONFIG.storefrontToken) {
    throw new Error("Shopify credentials not configured");
  }

  const response = await fetch(SHOPIFY_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_CONFIG.storefrontToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.statusText}`);
  }

  const json = await response.json();

  if (json.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  return json.data as T;
}

// ==================== MUTATIONS ====================

const CART_CREATE_MUTATION = `
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  product {
                    title
                    handle
                  }
                  price {
                    amount
                    currencyCode
                  }
                  image {
                    url
                    altText
                    width
                    height
                  }
                }
              }
            }
          }
        }
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
          totalAmount {
            amount
            currencyCode
          }
          taxAmount {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
` as const;

const CART_LINES_ADD_MUTATION = `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  product {
                    title
                    handle
                  }
                  price {
                    amount
                    currencyCode
                  }
                  image {
                    url
                    altText
                  }
                }
              }
            }
          }
        }
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
          totalAmount {
            amount
            currencyCode
          }
          taxAmount {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
` as const;

const CART_LINES_UPDATE_MUTATION = `
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
          totalAmount {
            amount
            currencyCode
          }
          taxAmount {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
` as const;

const CART_LINES_REMOVE_MUTATION = `
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        id
        checkoutUrl
        lines(first: 50) {
          edges {
            node {
              id
              quantity
            }
          }
        }
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
          totalAmount {
            amount
            currencyCode
          }
          taxAmount {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
` as const;

const CART_DISCOUNT_CODES_UPDATE_MUTATION = `
  mutation CartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]!) {
    cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
      cart {
        id
        discountCodes {
          code
          applicable
        }
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
          totalAmount {
            amount
            currencyCode
          }
          totalDiscountAmount {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
` as const;

// ==================== QUERIES ====================

const GET_CART_QUERY = `
  query GetCart($cartId: ID!) {
    cart(id: $cartId) {
      id
      checkoutUrl
      lines(first: 50) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                product {
                  title
                  handle
                }
                price {
                  amount
                  currencyCode
                }
                image {
                  url
                  altText
                }
              }
            }
          }
        }
      }
      cost {
        subtotalAmount {
          amount
          currencyCode
        }
        totalAmount {
          amount
          currencyCode
        }
        taxAmount {
          amount
          currencyCode
        }
      }
    }
  }
` as const;

// ==================== CART API ====================

export interface CartLineInput {
  merchandiseId: string;
  quantity: number;
}

export interface CartLineUpdateInput {
  id: string;
  quantity: number;
}

export interface UserError {
  field: string[];
  message: string;
}

export interface CartResult {
  cart: Cart | null;
  userErrors: UserError[];
}

/**
 * Retry configuration for API calls
 */
interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
}

const DEFAULT_RETRY: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
};

/**
 * Sleep utility for retry delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i <= config.maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < config.maxRetries) {
        await sleep(config.retryDelay * (i + 1)); // Exponential backoff
      }
    }
  }

  throw lastError;
}

/**
 * Shopify Cart API Client
 *
 * Provides methods for cart operations:
 * - create: Create a new cart
 * - addLines: Add items to cart
 * - updateLines: Update item quantities
 * - removeLines: Remove items from cart
 * - addDiscountCode: Add a discount code
 * - removeDiscountCode: Remove discount codes
 */
export const cartApi = {
  /**
   * Create a new cart
   *
   * @param input - Cart creation input
   * @returns Cart object or null if failed
   */
  async create(input: CartCreateInput): Promise<Cart | null> {
    return withRetry(async () => {
      const data = await shopifyFetch<{
        cartCreate: CartResult;
      }>(CART_CREATE_MUTATION, { input });

      if (data.cartCreate.userErrors.length > 0) {
        console.error("Cart create errors:", data.cartCreate.userErrors);
        throw new Error(data.cartCreate.userErrors[0].message);
      }

      return data.cartCreate.cart;
    });
  },

  /**
   * Add lines to existing cart
   *
   * @param cartId - The cart ID
   * @param lines - Array of cart line inputs
   * @returns Updated cart object or null if failed
   */
  async addLines(
    cartId: string,
    lines: CartLineInput[]
  ): Promise<Cart | null> {
    return withRetry(async () => {
      const data = await shopifyFetch<{
        cartLinesAdd: CartResult;
      }>(CART_LINES_ADD_MUTATION, { cartId, lines });

      if (data.cartLinesAdd.userErrors.length > 0) {
        console.error("Cart add lines errors:", data.cartLinesAdd.userErrors);
        throw new Error(data.cartLinesAdd.userErrors[0].message);
      }

      return data.cartLinesAdd.cart;
    });
  },

  /**
   * Update line quantities in cart
   *
   * @param cartId - The cart ID
   * @param lines - Array of cart line update inputs with id and quantity
   * @returns Updated cart object or null if failed
   */
  async updateLines(
    cartId: string,
    lines: CartLineUpdateInput[]
  ): Promise<Cart | null> {
    return withRetry(async () => {
      const data = await shopifyFetch<{
        cartLinesUpdate: CartResult;
      }>(CART_LINES_UPDATE_MUTATION, { cartId, lines });

      if (data.cartLinesUpdate.userErrors.length > 0) {
        console.error("Cart update lines errors:", data.cartLinesUpdate.userErrors);
        throw new Error(data.cartLinesUpdate.userErrors[0].message);
      }

      return data.cartLinesUpdate.cart;
    });
  },

  /**
   * Remove lines from cart
   *
   * @param cartId - The cart ID
   * @param lineIds - Array of line IDs to remove
   * @returns Updated cart object or null if failed
   */
  async removeLines(cartId: string, lineIds: string[]): Promise<Cart | null> {
    return withRetry(async () => {
      const data = await shopifyFetch<{
        cartLinesRemove: CartResult;
      }>(CART_LINES_REMOVE_MUTATION, { cartId, lineIds });

      if (data.cartLinesRemove.userErrors.length > 0) {
        console.error("Cart remove lines errors:", data.cartLinesRemove.userErrors);
        throw new Error(data.cartLinesRemove.userErrors[0].message);
      }

      return data.cartLinesRemove.cart;
    });
  },

  /**
   * Add discount code to cart
   *
   * @param cartId - The cart ID
   * @param discountCodes - Array of discount codes
   * @returns Updated cart object or null if failed
   */
  async addDiscountCode(
    cartId: string,
    discountCodes: string[]
  ): Promise<Cart | null> {
    return withRetry(async () => {
      const data = await shopifyFetch<{
        cartDiscountCodesUpdate: CartResult;
      }>(CART_DISCOUNT_CODES_UPDATE_MUTATION, { cartId, discountCodes });

      if (data.cartDiscountCodesUpdate.userErrors.length > 0) {
        console.error("Cart discount errors:", data.cartDiscountCodesUpdate.userErrors);
        throw new Error(data.cartDiscountCodesUpdate.userErrors[0].message);
      }

      return data.cartDiscountCodesUpdate.cart;
    });
  },

  /**
   * Remove discount codes from cart
   *
   * @param cartId - The cart ID
   * @returns Updated cart object or null if failed
   */
  async removeDiscountCode(cartId: string): Promise<Cart | null> {
    return this.addDiscountCode(cartId, []);
  },

  /**
   * Get cart by ID (with checkout URL)
   *
   * @param cartId - The cart ID
   * @returns Cart object or null if failed
   */
  async getCart(cartId: string): Promise<Cart | null> {
    return withRetry(async () => {
      const data = await shopifyFetch<{
        cart: Cart | null;
      }>(GET_CART_QUERY, { cartId });

      return data.cart;
    });
  },
};
