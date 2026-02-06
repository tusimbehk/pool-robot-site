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
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current) return;

    const redirectToCheckout = async () => {
      // If cart is empty, redirect to products
      if (getTotalItems() === 0) {
        router.push("/products");
        return;
      }

      try {
        // Set timeout for safety
        timeoutRef.current = setTimeout(() => {
          router.push("/cart?error=checkout-timeout");
        }, CHECKOUT_TIMEOUT_MS);

        // Get real Shopify checkout URL
        const checkoutUrl = await useCartStore.getState().getCheckoutUrl();

        // Clear timeout on success
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        if (checkoutUrl) {
          hasRedirected.current = true;
          // Redirect to Shopify checkout
          window.location.href = checkoutUrl;
        } else {
          // Fallback: redirect to cart with error
          router.push("/cart?error=checkout-failed");
        }
      } catch (error) {
        console.error("Checkout redirect failed:", error);
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
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Redirecting to checkout...</p>
    </div>
  );
}
