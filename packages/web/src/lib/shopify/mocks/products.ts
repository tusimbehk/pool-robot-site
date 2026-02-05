/**
 * Mock Product Data for Development
 *
 * Use this data when Shopify API is not configured or for testing
 */

import type { Product, ProductsConnection } from "../types";

/**
 * Mock product images
 */
const mockImages = [
  {
    url: "https://images.unsplash.com/photo-1567548411268-8a6273e61b68?w=800&h=800&fit=crop",
    altText: "Pool cleaning robot in action",
    width: 800,
    height: 800,
  },
  {
    url: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800&h=800&fit=crop",
    altText: "Pool cleaner side view",
    width: 800,
    height: 800,
  },
];

/**
 * Mock products
 */
export const mockProducts: Product[] = [
  {
    id: "gid://shopify/Product/1",
    handle: "poolclean-elite",
    title: "PoolClean Elite X1",
    description:
      "The most advanced pool cleaning robot with AI-powered navigation and smart home integration. Perfect for pools up to 50m².",
    descriptionHtml:
      '<p>The most advanced pool cleaning robot with AI-powered navigation and smart home integration.</p>',
    productType: "Robotic Pool Cleaner",
    vendor: "PoolClean Pro",
    tags: ["robotic", "premium", "smart-home", "ai"],
    priceRange: {
      minVariantPrice: { amount: "1299.00", currencyCode: "USD" },
      maxVariantPrice: { amount: "1299.00", currencyCode: "USD" },
    },
    compareAtPriceRange: {
      minVariantPrice: { amount: "1499.00", currencyCode: "USD" },
      maxVariantPrice: { amount: "1499.00", currencyCode: "USD" },
    },
    images: mockImages,
    variants: [
      {
        id: "gid://shopify/ProductVariant/1",
        title: "Default",
        sku: "PC-ELITE-X1",
        price: { amount: "1299.00", currencyCode: "USD" },
        compareAtPrice: { amount: "1499.00", currencyCode: "USD" },
        availableForSale: true,
        selectedOptions: [{ name: "Title", value: "Default" }],
      },
    ],
    options: [{ id: "1", name: "Title", values: ["Default"] }],
    availableForSale: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "gid://shopify/Product/2",
    handle: "poolclean-pro",
    title: "PoolClean Pro M2",
    description:
      "Professional grade pool cleaner with powerful suction and long battery life. Ideal for larger pools up to 80m².",
    descriptionHtml:
      '<p>Professional grade pool cleaner with powerful suction and long battery life.</p>',
    productType: "Robotic Pool Cleaner",
    vendor: "PoolClean Pro",
    tags: ["robotic", "professional", "large-pool"],
    priceRange: {
      minVariantPrice: { amount: "899.00", currencyCode: "USD" },
      maxVariantPrice: { amount: "899.00", currencyCode: "USD" },
    },
    images: mockImages,
    variants: [
      {
        id: "gid://shopify/ProductVariant/2",
        title: "Default",
        sku: "PC-PRO-M2",
        price: { amount: "899.00", currencyCode: "USD" },
        availableForSale: true,
        selectedOptions: [{ name: "Title", value: "Default" }],
      },
    ],
    options: [{ id: "2", name: "Title", values: ["Default"] }],
    availableForSale: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "gid://shopify/Product/3",
    handle: "poolclean-essential",
    title: "PoolClean Essential E1",
    description:
      "Affordable and reliable pool cleaning for small to medium pools up to 40m². Easy to use and maintain.",
    descriptionHtml: '<p>Affordable and reliable pool cleaning for small to medium pools.</p>',
    productType: "Robotic Pool Cleaner",
    vendor: "PoolClean Pro",
    tags: ["robotic", "budget", "small-pool"],
    priceRange: {
      minVariantPrice: { amount: "449.00", currencyCode: "USD" },
      maxVariantPrice: { amount: "449.00", currencyCode: "USD" },
    },
    images: mockImages,
    variants: [
      {
        id: "gid://shopify/ProductVariant/3",
        title: "Default",
        sku: "PC-ESS-E1",
        price: { amount: "449.00", currencyCode: "USD" },
        availableForSale: true,
        selectedOptions: [{ name: "Title", value: "Default" }],
      },
    ],
    options: [{ id: "3", name: "Title", values: ["Default"] }],
    availableForSale: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "gid://shopify/Product/4",
    handle: "poolclean-commercial",
    title: "PoolClean Commercial C1",
    description:
      "Heavy-duty pool cleaning robot designed for commercial pools and large residential pools up to 150m².",
    descriptionHtml: '<p>Heavy-duty pool cleaning robot for commercial applications.</p>',
    productType: "Robotic Pool Cleaner",
    vendor: "PoolClean Pro",
    tags: ["robotic", "commercial", "heavy-duty"],
    priceRange: {
      minVariantPrice: { amount: "2499.00", currencyCode: "USD" },
      maxVariantPrice: { amount: "2499.00", currencyCode: "USD" },
    },
    images: mockImages,
    variants: [
      {
        id: "gid://shopify/ProductVariant/4",
        title: "Default",
        sku: "PC-COM-C1",
        price: { amount: "2499.00", currencyCode: "USD" },
        availableForSale: true,
        selectedOptions: [{ name: "Title", value: "Default" }],
      },
    ],
    options: [{ id: "4", name: "Title", values: ["Default"] }],
    availableForSale: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "gid://shopify/Product/5",
    handle: "filter-cartridge-set",
    title: "Filter Cartridge Set (3-Pack)",
    description:
      "Replacement filter cartridges for PoolClean robots. Pack of 3 for extended cleaning sessions.",
    descriptionHtml: '<p>Replacement filter cartridges for PoolClean robots.</p>',
    productType: "Accessories",
    vendor: "PoolClean Pro",
    tags: ["accessory", "filter", "replacement"],
    priceRange: {
      minVariantPrice: { amount: "79.00", currencyCode: "USD" },
      maxVariantPrice: { amount: "79.00", currencyCode: "USD" },
    },
    images: mockImages.slice(0, 1),
    variants: [
      {
        id: "gid://shopify/ProductVariant/5",
        title: "3-Pack",
        sku: "PC-FILTER-3PK",
        price: { amount: "79.00", currencyCode: "USD" },
        availableForSale: true,
        selectedOptions: [{ name: "Size", value: "3-Pack" }],
      },
    ],
    options: [{ id: "5", name: "Size", values: ["3-Pack"] }],
    availableForSale: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "gid://shopify/Product/6",
    handle: "power-cable-15m",
    title: "Extension Power Cable - 15m",
    description:
      "15-meter extension cable for larger pools. High-quality, tangle-free design.",
    descriptionHtml: '<p>15-meter extension cable for larger pools.</p>',
    productType: "Accessories",
    vendor: "PoolClean Pro",
    tags: ["accessory", "cable", "extension"],
    priceRange: {
      minVariantPrice: { amount: "49.00", currencyCode: "USD" },
      maxVariantPrice: { amount: "49.00", currencyCode: "USD" },
    },
    images: mockImages.slice(0, 1),
    variants: [
      {
        id: "gid://shopify/ProductVariant/6",
        title: "15m",
        sku: "PC-CABLE-15M",
        price: { amount: "49.00", currencyCode: "USD" },
        availableForSale: true,
        selectedOptions: [{ name: "Length", value: "15m" }],
      },
    ],
    options: [{ id: "6", name: "Length", values: ["15m"] }],
    availableForSale: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

/**
 * Mock products connection (for pagination)
 */
export const mockProductsConnection: ProductsConnection = {
  edges: mockProducts.map((product) => ({ node: product })),
  pageInfo: {
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

/**
 * Get mock product by handle
 */
export function getMockProductByHandle(handle: string): Product | undefined {
  return mockProducts.find((p) => p.handle === handle);
}

/**
 * Get mock product by ID
 */
export function getMockProductById(id: string): Product | undefined {
  return mockProducts.find((p) => p.id === id);
}

/**
 * Search mock products
 */
export function searchMockProducts(query: string): Product[] {
  const lowerQuery = query.toLowerCase();
  return mockProducts.filter(
    (p) =>
      p.title.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Filter mock products by tag
 */
export function filterMockProductsByTag(tag: string): Product[] {
  return mockProducts.filter((p) =>
    p.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
}

/**
 * Filter mock products by product type
 */
export function filterMockProductsByType(productType: string): Product[] {
  return mockProducts.filter(
    (p) => p.productType.toLowerCase() === productType.toLowerCase()
  );
}
