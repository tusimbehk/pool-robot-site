# Shopify Real Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable real Shopify integration replacing mock data with live Storefront API calls for products, cart, and checkout.

**Architecture:**
- Use existing `shopifyClient` for product fetching with fallback to mock data
- Use existing `cart-store-v2.ts` with Shopify Cart API for cart sync
- Redirect to Shopify-hosted checkout using real checkout URL from cart

**Tech Stack:** Next.js 15, React 19, TypeScript, Shopify Storefront API 2024-10, Zustand

---

### Task 1: Add getCart() to Cart API

**Files:**
- Modify: `packages/web/src/lib/shopify/cart-api.ts`

**Step 1: Add GET_CART_QUERY constant**

Add after `CART_DISCOUNT_CODES_UPDATE_MUTATION` (around line 274):

```typescript
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
```

**Step 2: Add getCart method to cartApi**

Add inside `export const cartApi = { ... }` after `removeDiscountCode` method (around line 479):

```typescript
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
```

**Step 3: Commit**

```bash
git add packages/web/src/lib/shopify/cart-api.ts
git commit -m "feat: add getCart method to retrieve checkout URL"
```

---

### Task 2: Update Cart Store getCheckoutUrl()

**Files:**
- Modify: `packages/web/src/store/cart-store-v2.ts`

**Step 1: Modify ExtendedCartState interface**

Change `getCheckoutUrl` return type from `string | null` to `Promise<string | null>` (around line 52):

```typescript
  getCheckoutUrl: () => Promise<string | null>;
```

**Step 2: Update getCheckoutUrl implementation**

Replace the existing `getCheckoutUrl` method (around line 244-252):

```typescript
  getCheckoutUrl: async () => {
    const { cartId } = get();
    if (!cartId || !isShopifyConfigured()) {
      return null;
    }

    try {
      const cart = await cartApi.getCart(cartId);
      return cart?.checkoutUrl || null;
    } catch (error) {
      console.error("Failed to get checkout URL:", error);
      return null;
    }
  },
```

**Step 3: Commit**

```bash
git add packages/web/src/store/cart-store-v2.ts
git commit -m "fix: update getCheckoutUrl to fetch real Shopify checkout URL"
```

---

### Task 3: Update Checkout Page Redirect

**Files:**
- Modify: `packages/web/src/app/checkout/page.tsx`

**Step 1: Replace entire file content**

The file should redirect to real Shopify checkout instead of thank-you page:

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart-store-v2";
import { Loader2 } from "lucide-react";

/**
 * Checkout redirect page
 *
 * Redirects to Shopify checkout using real checkout URL
 */
export default function CheckoutClientPage() {
  const router = useRouter();
  const { items, getTotalItems } = useCartStore();

  useEffect(() => {
    const redirectToCheckout = async () => {
      // If cart is empty, redirect to products
      if (getTotalItems() === 0) {
        router.push("/products");
        return;
      }

      // Get real Shopify checkout URL
      const checkoutUrl = await useCartStore.getState().getCheckoutUrl();

      if (checkoutUrl) {
        // Redirect to Shopify checkout
        window.location.href = checkoutUrl;
      } else {
        // Fallback: redirect to cart with error
        router.push("/cart?error=checkout-failed");
      }
    };

    redirectToCheckout();
  }, [items, router, getTotalItems]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Redirecting to checkout...</p>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add packages/web/src/app/checkout/page.tsx
git commit -m "feat: redirect to real Shopify checkout URL"
```

---

### Task 4: Enable Real Shopify Fetch in Product Page

**Files:**
- Modify: `packages/web/src/app/products/[slug]/page.tsx`

**Step 1: Update getProduct function**

Replace the existing `getProduct` function (around line 33-50):

```typescript
async function getProduct(slug: string) {
  const { isShopifyConfigured } = await import("@/lib/shopify");

  // Fallback to mock data if Shopify not configured
  if (!isShopifyConfigured()) {
    return mockProducts.find((p) => p.handle === slug) || null;
  }

  // Try real Shopify fetch
  try {
    const { shopifyClient } = await import("@/lib/shopify/client");
    return await shopifyClient.getProduct(slug);
  } catch (error) {
    console.error("Shopify fetch error:", error);
    // Fallback to mock data on error
    return mockProducts.find((p) => p.handle === slug) || null;
  }
}
```

**Step 2: Update related products to handle null product**

The related products section should handle the case where Shopify is used.
After line 66, update the related products logic:

```typescript
  // Get related products (same type, excluding current)
  let relatedProducts: typeof mockProducts = [];

  if (isShopifyConfigured()) {
    // For Shopify, we'd need to fetch related products
    // For now, just show nothing or could fetch by type
    relatedProducts = [];
  } else {
    relatedProducts = mockProducts
      .filter(
        (p) =>
          p.productType === product.productType &&
          p.id !== product.id &&
          p.availableForSale
      )
      .slice(0, 4);
  }
```

**Step 3: Commit**

```bash
git add packages/web/src/app/products/[slug]/page.tsx
git commit -m "feat: enable real Shopify fetch for product pages"
```

---

### Task 5: Update Product List Page

**Files:**
- Modify: `packages/web/src/app/products/page.tsx`

**Step 1: Update import and add isShopifyConfigured**

Update imports (around line 1-3):

```typescript
import { Metadata } from "next";
import { getShopifyClient, isShopifyConfigured, mockProductsConnection } from "@/lib/shopify";
import { ProductList, ProductFilters, ProductSort } from "@/components/product";
import { Suspense } from "react";
```

**Step 2: Update product fetching logic**

Replace the fetch logic (around line 24-43):

```typescript
  // Fetch initial products server-side
  let initialProducts = mockProductsConnection.edges.map((e) => e.node);

  if (isShopifyConfigured()) {
    try {
      const client = getShopifyClient();
      let query = "";

      if (tag) {
        query = `tag:${tag}`;
      } else if (type) {
        query = `product_type:${type === "robots" ? "Robotic Pool Cleaner" : "Accessories"}`;
      }

      const result = await client.getProducts(20, undefined, query);
      if (result.edges.length > 0) {
        initialProducts = result.edges.map((e) => e.node);
      }
    } catch (error) {
      console.error("Shopify fetch error:", error);
      // Use mock data as fallback
    }
  }
```

**Step 3: Add generateStaticParams that respects Shopify config**

Add this function after `generateMetadata` (around line 19):

```typescript
export async function generateStaticParams() {
  // For static generation, use mock data
  // In production with Shopify, use ISR or revalidate
  return mockProductsConnection.edges.map((edge) => ({
    slug: edge.node.handle,
  }));
}
```

**Step 4: Commit**

```bash
git add packages/web/src/app/products/page.tsx
git commit -m "feat: enable real Shopify fetch for product list page"
```

---

### Task 6: Create Error Handler Utility

**Files:**
- Create: `packages/web/src/lib/shopify/error-handler.ts`

**Step 1: Create error handler file**

```typescript
/**
 * Shopify Error Handler
 *
 * Unified error handling for Shopify API calls
 */

export class ShopifyError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = "ShopifyError";
  }
}

export type ShopifyErrorCode =
  | "CONFIGURATION_ERROR"
  | "NETWORK_ERROR"
  | "GRAPHQL_ERROR"
  | "PRODUCT_NOT_FOUND"
  | "CART_ERROR"
  | "CHECKOUT_ERROR"
  | "UNKNOWN";

/**
 * Parse error from Shopify API response
 */
export function parseShopifyError(error: unknown): ShopifyError {
  if (error instanceof ShopifyError) {
    return error;
  }

  // GraphQL errors
  if (error && typeof error === "object" && "errors" in error) {
    const errors = (error as { errors: Array<{ message: string }> }).errors;
    return new ShopifyError(
      errors[0]?.message || "GraphQL error",
      "GRAPHQL_ERROR",
      true
    );
  }

  // Network/Response errors
  if (error instanceof Error) {
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return new ShopifyError(error.message, "NETWORK_ERROR", true);
    }
    if (error.message.includes("credentials")) {
      return new ShopifyError(error.message, "CONFIGURATION_ERROR", false);
    }
    return new ShopifyError(error.message, "UNKNOWN", true);
  }

  return new ShopifyError("Unknown error occurred", "UNKNOWN", true);
}

/**
 * Handle Shopify error with logging and fallback
 */
export function handleShopifyError(
  error: unknown,
  context: string
): ShopifyError {
  const parsedError = parseShopifyError(error);

  // Log error (in production, this goes to Sentry)
  console.error(`[Shopify ${context}]:`, {
    code: parsedError.code,
    message: parsedError.message,
    recoverable: parsedError.recoverable,
  });

  return parsedError;
}
```

**Step 2: Export from Shopify module**

Update `packages/web/src/lib/shopify/index.ts`, add to exports:

```typescript
// Export error handling
export {
  ShopifyError,
  parseShopifyError,
  handleShopifyError,
} from "./error-handler";
export type { ShopifyErrorCode } from "./error-handler";
```

**Step 3: Commit**

```bash
git add packages/web/src/lib/shopify/error-handler.ts packages/web/src/lib/shopify/index.ts
git commit -m "feat: add unified Shopify error handling"
```

---

### Task 7: Create Shopify Setup Documentation

**Files:**
- Create: `docs/SHOPIFY_SETUP_GUIDE.md`

**Step 1: Create setup guide**

```markdown
# Shopify Setup Guide

This guide explains how to configure Shopify integration for the pool-robot-site.

## Prerequisites

- A Shopify store with products
- Admin access to Shopify

## Step 1: Create Storefront API Access Token

1. Go to Shopify Admin > Settings > Apps and sales channels > Develop apps
2. Click "Create an app" > Name it "PoolClean Pro" > Create app
3. Configure Admin API access scopes (if needed)
4. Configure Storefront API access:
   - Enable "Storefront API integration"
   - Select these scopes:
     - `unauthenticated_read_product_listings`
     - `unauthenticated_read_product_inventory`
     - `unauthenticated_read_checkouts`
5. Click "Install app" > "Reveal token once" > Copy the Storefront access token

## Step 2: Configure Environment Variables

Add to `.env.local`:

\`\`\`bash
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_token_here
\`\`\`

Note: Use store domain format like `poolclean-pro.myshopify.com`

## Step 3: Create Products in Shopify

### Required Product Fields

| Field | Description | Example |
|-------|-------------|---------|
| Title | Product name | PoolClean Pro X1 |
| Description | Product details | Advanced robotic pool cleaner... |
| Product Type | For categorization | Robotic Pool Cleaner |
| Images | At least 1 image | Upload product photos |
| Variants | Price and inventory | $299.00, In stock |
| Handle | URL slug (auto-generated) | poolclean-pro-x1 |

### Creating Products

1. Go to Products > Add product
2. Fill in required fields
3. Set Product Type to "Robotic Pool Cleaner" or "Accessories"
4. Add pricing and inventory
5. Upload images
6. Save

## Step 4: Verify Integration

1. Start dev server: \`npm run dev\`
2. Visit \`/products\` - should show Shopify products
3. Visit \`/products/[handle]\` - should show product details
4. Add to cart - should sync with Shopify
5. Click checkout - should redirect to Shopify checkout

## Troubleshooting

### Products not showing
- Check \`.env.local\` values are correct
- Verify Storefront access token has correct scopes
- Check browser console for GraphQL errors

### Checkout not redirecting
- Check cart has \`cartId\` in localStorage
- Verify Shopify credentials are configured
- Check network tab for API errors

### Fallback to mock data
The site automatically falls back to mock data if:
- Shopify credentials are missing
- API calls fail
- Products are not found

This ensures the site works during development.
\`\`\`

**Step 2: Commit**

```bash
git add docs/SHOPIFY_SETUP_GUIDE.md
git commit -m "docs: add Shopify setup guide"
```

---

### Task 8: Update Design Doc with Implementation Notes

**Files:**
- Modify: `docs/plans/2025-02-06-shopify-integration-design.md`

**Step 1: Add implementation status section**

Add at the end of the file:

```markdown
## Implementation Status

- [x] Design approved
- [x] Implementation plan created
- [ ] getCart() method added
- [ ] Cart store getCheckoutUrl() updated
- [ ] Checkout page redirect updated
- [ ] Product page real fetch enabled
- [ ] Product list page real fetch enabled
- [ ] Error handler created
- [ ] Setup guide created
- [ ] Testing completed
- [ ] Deployed to production
```

**Step 2: Commit**

```bash
git add docs/plans/2025-02-06-shopify-integration-design.md
git commit -m "docs: add implementation status tracking"
```

---

## Testing Checklist

After implementation, verify:

| Test | Command/Action | Expected Result |
|------|----------------|-----------------|
| Build successful | `npm run build` | No errors |
| Dev server starts | `npm run dev` | Server running |
| Product list loads | Visit `/products` | Shows products |
| Product page loads | Visit `/products/[handle]` | Shows product |
| Add to cart works | Click add to cart | Cart updates |
| Checkout redirect | Click checkout | Goes to Shopify |
| Fallback works | Clear credentials | Shows mock data |

---

## Success Criteria

- [ ] Products load from Shopify when configured
- [ ] Cart syncs with Shopify
- [ ] Checkout redirects to real Shopify checkout
- [ ] Fallback to mock data works when credentials missing
- [ ] Error handling in place with user-friendly messages
- [ ] Setup guide documented
