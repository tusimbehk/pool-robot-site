"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart-store";
import { Loader2 } from "lucide-react";

/**
 * Checkout redirect page
 *
 * Redirects to Shopify checkout or shows error if cart is empty
 */
export default function CheckoutClientPage() {
  const router = useRouter();
  const { items, cartId, isSyncing } = useCartStore();

  useEffect(() => {
    // If cart is empty, redirect to products
    if (items.length === 0 && !isSyncing) {
      router.push("/products");
      return;
    }

    // If we have a Shopify cart ID, redirect to checkout
    if (cartId) {
      // In production, this would be the Shopify checkout URL
      // For now, we'll use a mock checkout flow
      router.push(`/thank-you?cart=${cartId}`);
    } else {
      // Redirect to cart page with error
      router.push("/cart?error=checkout");
    }
  }, [items, cartId, isSyncing, router]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Redirecting to checkout...</p>
    </div>
  );
}
