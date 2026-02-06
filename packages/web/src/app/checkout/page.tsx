"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart-store-v2";
import { Loader2 } from "lucide-react";

const CHECKOUT_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Checkout redirect page
 *
 * Redirects to Shopify checkout using real checkout URL
 */
export default function CheckoutClientPage() {
  const router = useRouter();
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const hasRedirected = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current) {
      return;
    }

    const redirectToCheckout = async () => {
      // If cart is empty, redirect to products
      const totalItems = getTotalItems();

      if (totalItems === 0) {
        router.push("/products");
        return;
      }

      try {
        const cartState = useCartStore.getState();

        // Check if cartId exists
        if (!cartState.cartId) {
          console.error("[Checkout] No cart ID found");
          router.push("/cart?error=no-cart-id");
          return;
        }

        // Set timeout for safety
        timeoutRef.current = setTimeout(() => {
          console.error("[Checkout] Checkout timeout");
          router.push("/cart?error=checkout-timeout");
        }, CHECKOUT_TIMEOUT_MS);

        // Get Shopify checkout URL
        const checkoutUrl = await cartState.getCheckoutUrl();

        // Clear timeout on success
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        if (checkoutUrl) {
          hasRedirected.current = true;
          // Redirect to Shopify checkout
          window.location.href = checkoutUrl;
        } else {
          console.error("[Checkout] No checkout URL available");
          router.push("/cart?error=checkout-failed");
        }
      } catch (err) {
        console.error("[Checkout] Redirect failed:", err);
        router.push("/cart?error=checkout-error");
      }
    };

    redirectToCheckout();

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [router, getTotalItems]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Redirecting to checkout...</p>
    </div>
  );
}
