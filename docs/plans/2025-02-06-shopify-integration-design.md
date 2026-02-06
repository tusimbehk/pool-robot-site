# Shopify Real Integration Design

**Date:** 2025-02-06
**Author:** Claude + User collaboration
**Status:** Approved

## Overview

Enable real Shopify integration for the pool-robot-site e-commerce application, replacing mock data with live Shopify Storefront API calls for products, cart, and checkout.

## Requirements

- User has existing Shopify store with Storefront Access Token configured
- Need to create products in Shopify
- Use Shopify-hosted checkout (redirect flow)

## Architecture

### Data Flow Strategy

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User Browser  │────▶│  Next.js App    │────▶│  Shopify API    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────┐         ┌─────────────┐
                       │ Mock Fallback│         │ Cart API    │
                       └─────────────┘         └─────────────┘
```

1. **Product Data** - Fetch from Shopify Storefront API via `shopifyClient`
2. **Cart Sync** - Use existing `cart-store-v2.ts` with Shopify Cart API
3. **Checkout** - Redirect to Shopify-hosted checkout URL

### Environment Detection

- `isShopifyConfigured()` checks for valid credentials
- Real API calls when configured, mock fallback when not
- Ensures dev environments can continue using mock data

## Implementation Details

### 1. Product Data Integration

**File:** `packages/web/src/app/products/[slug]/page.tsx`

Enable real Shopify fetch in `getProduct()`:

```typescript
async function getProduct(slug: string) {
  const { isShopifyConfigured } = await import("@/lib/shopify");
  if (!isShopifyConfigured()) {
    return mockProducts.find((p) => p.handle === slug) || null;
  }

  try {
    const { shopifyClient } = await import("@/lib/shopify/client");
    return await shopifyClient.getProduct(slug);
  } catch (error) {
    console.error("Shopify fetch error:", error);
    return mockProducts.find((p) => p.handle === slug) || null;
  }
}
```

**File:** `packages/web/src/app/products/page.tsx`

- Enable real Shopify fetch for product list
- Use `shopifyClient.getProducts()` instead of mock data
- Update `generateStaticParams()` to fetch handles from Shopify

### 2. Cart & Checkout Integration

**File:** `packages/web/src/lib/shopify/cart-api.ts`

Add `getCart()` method to retrieve cart with checkout URL:

```typescript
export async function getCart(cartId: string): Promise<Cart | null> {
  const GET_CART_QUERY = `query GetCart($cartId: ID!) {
    cart(id: $cartId) {
      id
      checkoutUrl
      lines(first: 50) { ... }
      cost { ... }
    }
  }`;
  // ...
}
```

**File:** `packages/web/src/store/cart-store-v2.ts`

Fix `getCheckoutUrl()` to return real Shopify URL:

```typescript
getCheckoutUrl: async () => {
  const { cartId } = get();
  if (!cartId || !isShopifyConfigured()) {
    return "/checkout"; // fallback
  }

  const cart = await cartApi.getCart(cartId);
  return cart?.checkoutUrl || "/checkout";
}
```

**File:** `packages/web/src/app/checkout/page.tsx`

Redirect to real Shopify checkout:

```typescript
"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart-store-v2";

export default function CheckoutPage() {
  useEffect(() => {
    useCartStore.getState().getCheckoutUrl()?.then(url => {
      if (url) window.location.href = url;
    });
  }, []);

  return <div>Redirecting to checkout...</div>;
}
```

### 3. Error Handling

**File:** `packages/web/src/lib/shopify/error-handler.ts`

Unified error handling:

```typescript
export class ShopifyError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
  }
}
```

**User Experience:**
- Loading states with skeleton screens
- Sync status indicator in cart
- Toast notifications for sync failures
- Silent failures with Sentry logging in production

### 4. Shopify Product Structure

Products to create in Shopify Admin:

| Field | Value |
|-------|-------|
| Title | "PoolClean Pro X1", "PoolClean Pro X2", etc. |
| Description | Product descriptions |
| Product Type | "Pool Cleaner" (used for related products) |
| Images | At least 1 product image |
| Variants | Price, inventory status |
| Tags | Optional categories |

## Testing Checklist

| Test | Method |
|------|--------|
| Shopify credentials configured | Check `.env.local` |
| Product fetch works | Visit `/products/[slug]` |
| Cart sync works | Add item, check `cartId` |
| Checkout URL | Click checkout, verify redirect |
| Fallback works | Clear credentials, verify mock data |

## Files to Modify

1. `packages/web/src/app/products/[slug]/page.tsx`
2. `packages/web/src/app/products/page.tsx`
3. `packages/web/src/lib/shopify/cart-api.ts`
4. `packages/web/src/store/cart-store-v2.ts`
5. `packages/web/src/app/checkout/page.tsx`
6. `packages/web/src/lib/shopify/error-handler.ts` (new)

## Success Criteria

- [ ] Products load from Shopify
- [ ] Cart syncs with Shopify
- [ ] Checkout redirects to Shopify
- [ ] Fallback to mock data works
- [ ] Error handling in place

## Implementation Status

- [x] Design approved
- [x] Implementation plan created
- [x] getCart() method added (Task 1)
- [x] Cart store getCheckoutUrl() updated (Task 2)
- [x] Checkout page redirect updated (Task 3)
- [x] Product page real fetch enabled (Task 4)
- [x] Product list page real fetch enabled (Task 5)
- [x] Error handler created (Task 6)
- [x] Setup guide created (Task 7)
- [x] Design doc status tracking added (Task 8)
- [ ] Testing completed
- [ ] Deployed to production
