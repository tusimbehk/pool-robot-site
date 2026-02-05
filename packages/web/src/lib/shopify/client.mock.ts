/**
 * Shopify Client Mock (for development)
 *
 * This file provides mock Shopify API responses when the real API is not configured.
 * It mirrors the real client interface for seamless switching.
 */

import type {
  Product,
  ProductsConnection,
  Cart,
  CartCreateInput,
  Shop,
} from "./types";
import {
  mockProducts,
  mockProductsConnection,
  getMockProductByHandle,
} from "./mocks";

/**
 * Mock Shopify client that returns mock data
 *
 * Usage: Replace real client with this when developing without Shopify credentials
 */
export const mockShopifyClient = {
  /**
   * Fetch mock products
   */
  async getProducts(
    first = 20,
    after?: string,
    query?: string
  ): Promise<ProductsConnection> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    let products = [...mockProducts];

    // Apply tag filter if query contains tag:
    if (query?.includes("tag:")) {
      const tag = query.replace("tag:", "").trim();
      products = products.filter((p) =>
        p.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
      );
    }

    // Apply product type filter if query contains product_type:
    if (query?.includes("product_type:")) {
      const type = query.replace("product_type:", "").trim();
      products = products.filter(
        (p) => p.productType.toLowerCase() === type.toLowerCase()
      );
    }

    // Apply search filter for other queries
    if (query && !query.includes("tag:") && !query.includes("product_type:")) {
      const lowerQuery = query.toLowerCase();
      products = products.filter(
        (p) =>
          p.title.toLowerCase().includes(lowerQuery) ||
          p.description.toLowerCase().includes(lowerQuery)
      );
    }

    return {
      edges: products.slice(0, first).map((product) => ({ node: product })),
      pageInfo: {
        hasNextPage: products.length > first,
        hasPreviousPage: !!after,
        endCursor: products.length > first ? "cursor" : undefined,
        startCursor: "cursor",
      },
    };
  },

  /**
   * Fetch mock product by handle
   */
  async getProduct(handle: string): Promise<Product | null> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return getMockProductByHandle(handle) || null;
  },

  /**
   * Create mock cart
   */
  async createCart(input: CartCreateInput): Promise<Cart | null> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const cartId = `mock-cart-${Date.now()}`;

    return {
      id: cartId,
      checkoutUrl: `/checkout?cart=${cartId}`,
      lines: {
        edges: input.lines.map((line, index) => {
          const product = mockProducts[index] || mockProducts[0];
          return {
            node: {
              id: `line-${index}`,
              quantity: line.quantity,
              merchandise: {
                id: line.merchandiseId,
                title: product.title,
                product: {
                  title: product.title,
                  handle: product.handle,
                },
                price: product.variants[0].price,
                image: product.images[0],
              },
            },
          };
        }),
      },
      cost: {
        subtotalAmount: { amount: "0.00", currencyCode: "USD" },
        totalAmount: { amount: "0.00", currencyCode: "USD" },
        taxAmount: { amount: "0.00", currencyCode: "USD" },
      },
    };
  },

  /**
   * Fetch mock shop info
   */
  async getShop(): Promise<Shop> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      name: "PoolClean Pro",
      description: "Premium pool cleaning robots for European and North American markets",
      primaryDomain: {
        url: "https://poolcleanpro.com",
      },
    };
  },
};
