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
