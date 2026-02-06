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

```bash
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_token_here
```

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

1. Start dev server: `npm run dev`
2. Visit `/products` - should show Shopify products
3. Visit `/products/[handle]` - should show product details
4. Add to cart - should sync with Shopify
5. Click checkout - should redirect to Shopify checkout

## Troubleshooting

### Products not showing
- Check `.env.local` values are correct
- Verify Storefront access token has correct scopes
- Check browser console for GraphQL errors

### Checkout not redirecting
- Check cart has `cartId` in localStorage
- Verify Shopify credentials are configured
- Check network tab for API errors

### Fallback to mock data
The site automatically falls back to mock data if:
- Shopify credentials are missing
- API calls fail
- Products are not found

This ensures the site works during development.
