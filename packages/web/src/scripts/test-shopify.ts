/**
 * Shopify API Connection Test Script
 *
 * Run this script to test your Shopify API connection:
 * npx tsx src/scripts/test-shopify.ts
 */

import { shopifyClient } from "../lib/shopify/client";
import { SHOPIFY_CONFIG } from "../lib/constants";

async function testShopifyConnection() {
  console.log("🔍 Testing Shopify API Connection...\n");

  // Check configuration
  console.log("📋 Configuration:");
  console.log("  Domain:", SHOPIFY_CONFIG.domain);
  console.log("  API Version:", SHOPIFY_CONFIG.apiVersion);
  console.log("  Token:", SHOPIFY_CONFIG.storefrontToken ? "***configured***" : "NOT SET");

  if (!SHOPIFY_CONFIG.domain || !SHOPIFY_CONFIG.storefrontToken) {
    console.log("\n❌ Shopify credentials not configured!");
    console.log("Please set these environment variables in .env.local:");
    console.log("  - NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN");
    console.log("  - NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN");
    return false;
  }

  try {
    // Test shop info
    console.log("\n🏪 Testing shop info...");
    const shop = await shopifyClient.getShop();
    console.log("  ✅ Shop:", shop.name);
    console.log("  Description:", shop.description);

    // Test products query
    console.log("\n📦 Testing products query...");
    const products = await shopifyClient.getProducts(5);
    console.log(`  ✅ Found ${products.edges.length} products`);

    if (products.edges.length > 0) {
      const product = products.edges[0].node;
      console.log("\n📦 Sample product:");
      console.log("  Title:", product.title);
      console.log("  Handle:", product.handle);
      console.log("  Price:", product.priceRange.minVariantPrice.amount);
      console.log("  Available:", product.availableForSale);
    }

    // Test product by handle
    console.log("\n📦 Testing product query by handle...");
    const testProduct = await shopifyClient.getProduct("poolclean-elite");
    if (testProduct) {
      console.log("  ✅ Product found:", testProduct.title);
    } else {
      console.log("  ℹ️  Product not found (this is OK if you haven't created it yet)");
    }

    console.log("\n✅ Shopify API connection successful!");
    return true;
  } catch (error) {
    console.error("\n❌ Shopify API connection failed:");
    if (error instanceof Error) {
      console.error("  Error:", error.message);
    }
    console.error("\nTroubleshooting:");
    console.error("  1. Verify your store domain is correct");
    console.error("  2. Verify your Storefront API access token is valid");
    console.error("  3. Check that Storefront API is enabled in Shopify admin");
    console.error("     (Settings > Apps and sales channels > Develop apps)");
    return false;
  }
}

// Run the test
testShopifyConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });
