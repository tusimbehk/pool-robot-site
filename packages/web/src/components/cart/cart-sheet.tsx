"use client";

import { useMemo, useCallback } from "react";
import { useCartStore } from "@/store/cart-store-v2";
import { Button } from "@/components/ui";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui";
import { ShoppingCart, ShoppingBag, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/currency";
import type { CurrencyCode } from "@/lib/currency";
import { CartItemComponent } from "./cart-item";

const DEFAULT_CURRENCY: CurrencyCode = "USD";

export function CartSheet() {
  // Select store values with shallow comparison optimization
  const items = useCartStore((state) => state.items);
  const isOpen = useCartStore((state) => state.isOpen);
  const closeCart = useCartStore((state) => state.closeCart);
  const isSyncing = useCartStore((state) => state.isSyncing);
  const syncError = useCartStore((state) => state.syncError);

  // Memoize subtotal calculation
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + (item.price ? item.price * item.quantity : 0);
    }, 0);
  }, [items]);

  // Memoize total items count
  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  // Memoize formatted subtotal
  const formattedSubtotal = useMemo(
    () => formatPrice(subtotal, DEFAULT_CURRENCY),
    [subtotal]
  );

  // Stable close handler
  const handleClose = useCallback(() => {
    closeCart();
  }, [closeCart]);

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader className="px-1">
          <SheetTitle>Shopping Cart</SheetTitle>
        </SheetHeader>

        {/* Cart Items */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center space-y-4">
            <ShoppingBag className="h-16 w-16 text-muted-foreground" />
            <div className="text-center">
              <p className="text-lg font-medium">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">
                Add some products to get started
              </p>
            </div>
            <Button onClick={handleClose} asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-1">
              {items.map((item) => (
                <CartItemComponent key={item.merchandiseId} item={item} />
              ))}
            </div>

            {/* Footer */}
            <SheetFooter className="px-1 pb-0 pt-4">
              <div className="w-full space-y-4">
                {/* Sync status indicator */}
                {isSyncing && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Syncing with Shopify...</span>
                  </div>
                )}
                {syncError && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <span>⚠️ {syncError}</span>
                  </div>
                )}

                {/* Subtotal */}
                <div className="flex items-center justify-between text-base font-medium">
                  <span>Subtotal</span>
                  <span>{formattedSubtotal}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Shipping and taxes calculated at checkout
                </p>

                {/* Actions */}
                <div className="space-y-2">
                  <Button className="w-full" size="lg" asChild>
                    <Link href="/cart" onClick={handleClose}>
                      View Cart ({totalItems})
                    </Link>
                  </Button>
                  <Button
                    className="w-full"
                    size="lg"
                    variant="outline"
                    onClick={handleClose}
                    asChild
                  >
                    <Link href="/products">Continue Shopping</Link>
                  </Button>
                </div>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * Cart trigger button for header (optimized with memoization)
 */
export function CartTrigger() {
  const openCart = useCartStore((state) => state.openCart);
  const items = useCartStore((state) => state.items);

  // Memoize total items calculation
  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  // Memoize badge display
  const badgeDisplay = useMemo(() => {
    return totalItems > 99 ? "99+" : totalItems.toString();
  }, [totalItems]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={openCart}
    >
      <ShoppingCart className="h-5 w-5" />
      <span className="sr-only">Open cart</span>
      {totalItems > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {badgeDisplay}
        </span>
      )}
    </Button>
  );
}
