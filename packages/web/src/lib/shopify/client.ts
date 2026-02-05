/**
 * Shopify Storefront API Client
 * For fetching products, managing cart, and checkout
 * Supports multi-currency pricing
 */

import { SHOPIFY_CONFIG } from "@/lib/constants";
import type {
  Product,
  ProductsConnection,
  Cart,
  CartCreateInput,
  Shop,
} from "./types";
import type { CurrencyCode } from "@/lib/currency";

const SHOPIFY_GRAPHQL_URL = `https://${SHOPIFY_CONFIG.domain}/api/${SHOPIFY_CONFIG.apiVersion}/graphql.json`;

/**
 * Current currency context for Shopify requests
 */
let currentCurrency: CurrencyCode = "USD";

/**
 * Set the currency context for Shopify requests
 */
export function setShopifyCurrency(currency: CurrencyCode): void {
  currentCurrency = currency;
}

/**
 * Get the current currency context
 */
export function getShopifyCurrency(): CurrencyCode {
  return currentCurrency;
}

/**
 * Build the @inContext directive for currency
 */
function buildContextDirective(): string {
  return `@inContext(country: ${getCountryCodeForCurrency(currentCurrency)})`;
}

/**
 * Get country code for currency (simplified mapping)
 */
function getCountryCodeForCurrency(currency: CurrencyCode): string {
  const countryMap: Record<CurrencyCode, string> = {
    USD: "US",
    EUR: "DE",
    GBP: "GB",
    CAD: "CA",
    AUD: "AU",
    CHF: "CH",
    NOK: "NO",
    SEK: "SE",
    DKK: "DK",
  };
  return countryMap[currency] || "US";
}

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

// ==================== QUERIES ====================

const GET_PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $after: String, $query: String) {
    products(first: $first, after: $after, query: $query) {
      edges {
        node {
          id
          handle
          title
          description
          productType
          vendor
          tags
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 1) {
            edges {
              node {
                url
                altText
                width
                height
              }
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                sku
                price {
                  amount
                  currencyCode
                }
                availableForSale
              }
            }
          }
          options {
            id
            name
            values
          }
          availableForSale
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        endCursor
        startCursor
      }
    }
  }
` as const;

const GET_PRODUCT_QUERY = `
  query GetProduct($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      description
      descriptionHtml
      productType
      vendor
      tags
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
      images(first: 10) {
        edges {
          node {
            url
            altText
            width
            height
          }
        }
      }
      variants(first: 50) {
        edges {
          node {
            id
            title
            sku
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            availableForSale
            selectedOptions {
              name
              value
            }
          }
        }
      }
      options {
        id
        name
        values
      }
      availableForSale
      createdAt
      updatedAt
    }
  }
` as const;

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

const SHOP_QUERY = `
  query GetShop {
    shop {
      name
      description
      primaryDomain {
        url
      }
    }
  }
` as const;

// ==================== CLIENT FUNCTIONS ====================

export const shopifyClient = {
  /**
   * Fetch multiple products
   */
  async getProducts(
    first = 20,
    after?: string,
    query?: string
  ): Promise<ProductsConnection> {
    const data = await shopifyFetch<{
      products: ProductsConnection;
    }>(GET_PRODUCTS_QUERY, { first, after, query });
    return data.products;
  },

  /**
   * Fetch a single product by handle
   */
  async getProduct(handle: string): Promise<Product | null> {
    const data = await shopifyFetch<{
      product: Product | null;
    }>(GET_PRODUCT_QUERY, { handle });
    return data.product;
  },

  /**
   * Create a new cart
   */
  async createCart(input: CartCreateInput): Promise<Cart | null> {
    const data = await shopifyFetch<{
      cartCreate: {
        cart: Cart | null;
        userErrors: Array<{ field: string[]; message: string }>;
      };
    }>(CART_CREATE_MUTATION, { input });

    if (data.cartCreate.userErrors.length > 0) {
      console.error("Cart creation errors:", data.cartCreate.userErrors);
      return null;
    }

    return data.cartCreate.cart;
  },

  /**
   * Fetch shop info
   */
  async getShop(): Promise<Shop> {
    const data = await shopifyFetch<{ shop: Shop }>(SHOP_QUERY);
    return data.shop;
  },
};

// ==================== CURRENCY HELPERS ====================

/**
 * Currency helper for Shopify integration
 *
 * Note: For true multi-currency support with Shopify, enable Shopify Markets:
 * 1. Go to Shopify Admin > Settings > Markets
 * 2. Add markets for each target country/region
 * 3. Configure pricing and currency for each market
 * 4. Use the @inContext directive in GraphQL queries
 *
 * Example query with @inContext:
 * query GetProducts($country: CountryCode!) @inContext(country: $country) {
 *   products(first: 10) {
 *     priceRange { ... }
 *   }
 * }
 */

import { convertPrice } from "@/lib/currency";

/**
 * Convert Shopify price to target currency
 * Note: This is a client-side conversion. For production,
 * enable Shopify Markets for accurate multi-currency pricing.
 */
export function convertShopifyPrice(
  amount: string,
  fromCurrency: string,
  toCurrency: CurrencyCode
): { amount: string; currencyCode: CurrencyCode } {
  const numericAmount = parseFloat(amount);
  const converted = convertPrice(numericAmount, fromCurrency as CurrencyCode, toCurrency);

  return {
    amount: converted.toFixed(2),
    currencyCode: toCurrency,
  };
}

/**
 * Format Shopify money object
 */
export function formatShopifyMoney(money: { amount: string; currencyCode: string }): string {
  const { formatPrice } = require("@/lib/currency");
  return formatPrice(parseFloat(money.amount), money.currencyCode as CurrencyCode);
}

/**
 * Get localized price for display
 */
export function getLocalizedPrice(
  money: { amount: string; currencyCode: string },
  targetCurrency: CurrencyCode
): string {
  const { formatPrice, convertPrice } = require("@/lib/currency");

  if (money.currencyCode === targetCurrency) {
    return formatPrice(parseFloat(money.amount), targetCurrency);
  }

  const converted = convertPrice(
    parseFloat(money.amount),
    money.currencyCode as CurrencyCode,
    targetCurrency
  );
  return formatPrice(converted, targetCurrency);
}
