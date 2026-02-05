/**
 * Shopify Storefront API Types
 * Based on Shopify Storefront API 2024-10
 */

export interface Money {
  amount: string;
  currencyCode: string;
}

export interface Image {
  url: string;
  altText?: string | null;
  width?: number;
  height?: number;
}

export interface ProductVariant {
  id: string;
  title: string;
  sku?: string;
  price: Money;
  compareAtPrice?: Money | null;
  availableForSale: boolean;
  currentlyNotInStock?: boolean;
  weight?: number;
  weightUnit?: string;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
}

export interface ProductOption {
  id: string;
  name: string;
  values: string[];
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  productType: string;
  vendor: string;
  tags: string[];
  priceRange: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  };
  compareAtPriceRange?: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  };
  images: Image[];
  variants: ProductVariant[];
  options: ProductOption[];
  createdAt: string;
  updatedAt: string;
  availableForSale: boolean;
}

export interface ProductsConnection {
  edges: Array<{
    node: Product;
  }>;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    endCursor?: string;
    startCursor?: string;
  };
}

export interface Checkout {
  id: string;
  webUrl: string;
  lineItems: Array<{
    id: string;
    title: string;
    quantity: number;
    variant: {
      id: string;
      price: Money;
      product: {
        title: string;
        handle: string;
      };
    };
  }>;
  subtotalPrice: Money;
  totalPrice: Money;
  taxIncluded: boolean;
}

export interface CartLineItem {
  merchandiseId: string;
  quantity: number;
}

export interface CartCreateInput {
  lines: CartLineItem[];
  buyerIdentity?: {
    email?: string;
  };
}

export interface Cart {
  id: string;
  checkoutUrl: string;
  lines: {
    edges: Array<{
      node: {
        id: string;
        quantity: number;
        merchandise: {
          id: string;
          title: string;
          product: {
            title: string;
            handle: string;
          };
          price: Money;
          image?: Image;
        };
      };
    }>;
  };
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
    taxAmount: Money;
  };
}

export interface Shop {
  name: string;
  description?: string;
  primaryDomain?: {
    url: string;
  };
}
