/**
 * Shopify Client Tests
 * Tests for both real and mock Shopify clients
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockShopifyClient } from "./client.mock";
import { getMockProductByHandle, mockProducts } from "./mocks";

describe("Mock Shopify Client", () => {
  describe("getProducts", () => {
    it("should return a list of products", async () => {
      const result = await mockShopifyClient.getProducts();

      expect(result.edges).toBeDefined();
      expect(result.edges.length).toBeGreaterThan(0);
      expect(result.pageInfo).toBeDefined();
    });

    it("should limit results with first parameter", async () => {
      const result = await mockShopifyClient.getProducts(2);

      expect(result.edges.length).toBeLessThanOrEqual(2);
    });

    it("should filter products by tag query", async () => {
      const result = await mockShopifyClient.getProducts(20, undefined, "tag:premium");

      expect(result.edges.length).toBeGreaterThan(0);
      result.edges.forEach((edge) => {
        expect(edge.node.tags).toContain("premium");
      });
    });

    it("should filter products by product type", async () => {
      const result = await mockShopifyClient.getProducts(
        20,
        undefined,
        "product_type:Accessories"
      );

      expect(result.edges.length).toBeGreaterThan(0);
      result.edges.forEach((edge) => {
        expect(edge.node.productType).toBe("Accessories");
      });
    });

    it("should search products by text", async () => {
      const result = await mockShopifyClient.getProducts(20, undefined, "Elite");

      expect(result.edges.length).toBeGreaterThan(0);
      result.edges.forEach((edge) => {
        expect(
          edge.node.title.toLowerCase().includes("elite") ||
            edge.node.description.toLowerCase().includes("elite")
        ).toBe(true);
      });
    });
  });

  describe("getProduct", () => {
    it("should return a product by handle", async () => {
      const result = await mockShopifyClient.getProduct("poolclean-elite");

      expect(result).toBeDefined();
      expect(result?.handle).toBe("poolclean-elite");
    });

    it("should return null for non-existent handle", async () => {
      const result = await mockShopifyClient.getProduct("non-existent");

      expect(result).toBeNull();
    });

    it("should return product with all required fields", async () => {
      const result = await mockShopifyClient.getProduct("poolclean-elite");

      expect(result?.id).toBeDefined();
      expect(result?.title).toBeDefined();
      expect(result?.description).toBeDefined();
      expect(result?.priceRange).toBeDefined();
      expect(result?.images).toBeDefined();
      expect(result?.variants).toBeDefined();
    });
  });

  describe("createCart", () => {
    it("should create a cart with items", async () => {
      const input = {
        lines: [
          { merchandiseId: "gid://shopify/ProductVariant/1", quantity: 1 },
          { merchandiseId: "gid://shopify/ProductVariant/2", quantity: 2 },
        ],
      };

      const result = await mockShopifyClient.createCart(input);

      expect(result).toBeDefined();
      expect(result?.id).toContain("mock-cart");
      expect(result?.lines.edges.length).toBe(2);
    });

    it("should create a cart with checkout URL", async () => {
      const input = {
        lines: [{ merchandiseId: "gid://shopify/ProductVariant/1", quantity: 1 }],
      };

      const result = await mockShopifyClient.createCart(input);

      expect(result?.checkoutUrl).toBeDefined();
      expect(result?.checkoutUrl).toContain("/checkout");
    });
  });

  describe("getShop", () => {
    it("should return shop information", async () => {
      const result = await mockShopifyClient.getShop();

      expect(result).toBeDefined();
      expect(result.name).toBe("PoolClean Pro");
      expect(result.description).toBeDefined();
    });
  });
});

describe("Mock Data Helpers", () => {
  describe("getMockProductByHandle", () => {
    it("should find product by handle", () => {
      const result = getMockProductByHandle("poolclean-elite");

      expect(result).toBeDefined();
      expect(result?.handle).toBe("poolclean-elite");
    });

    it("should return undefined for unknown handle", () => {
      const result = getMockProductByHandle("unknown");

      expect(result).toBeUndefined();
    });
  });

  describe("mockProducts", () => {
    it("should have at least 6 products", () => {
      expect(mockProducts.length).toBeGreaterThanOrEqual(6);
    });

    it("should have products with different price ranges", () => {
      const prices = mockProducts.map((p) =>
        parseFloat(p.priceRange.minVariantPrice.amount)
      );

      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      expect(minPrice).toBeLessThan(500);
      expect(maxPrice).toBeGreaterThan(1000);
    });

    it("should have products with proper structure", () => {
      mockProducts.forEach((product) => {
        expect(product.id).toBeDefined();
        expect(product.handle).toBeDefined();
        expect(product.title).toBeDefined();
        expect(product.description).toBeDefined();
        expect(product.priceRange).toBeDefined();
        expect(product.variants).toBeDefined();
        expect(product.variants.length).toBeGreaterThan(0);
      });
    });
  });
});
