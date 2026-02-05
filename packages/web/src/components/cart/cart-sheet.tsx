"use client";

import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui";
import { ShoppingCart, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { CartItemComponent } from "./cart-item";

export function CartSheet() {
  const items = useCartStore((state) => state.items);
  const isOpen = useCartStore((state) => state.isOpen);
  const closeCart = useCartStore((state) => state.closeCart);
  const getTotalItems = useCartStore((state) => state.getTotalItems);

  const subtotal = items.reduce((sum, item) => {
    return sum + (item.price ? item.price * item.quantity : 0);
  }, 0);

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
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
            <Button onClick={closeCart} asChild>
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
                {/* Subtotal */}
                <div className="flex items-center justify-between text-base font-medium">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal, "USD")}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Shipping and taxes calculated at checkout
                </p>

                {/* Actions */}
                <div className="space-y-2">
                  <Button className="w-full" size="lg" asChild>
                    <Link href="/cart" onClick={closeCart}>
                      View Cart ({getTotalItems()})
                    </Link>
                  </Button>
                  <Button
                    className="w-full"
                    size="lg"
                    variant="outline"
                    onClick={closeCart}
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
 * Cart trigger button for header
 */
export function CartTrigger() {
  const openCart = useCartStore((state) => state.openCart);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const totalItems = getTotalItems();

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
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </Button>
  );
}
