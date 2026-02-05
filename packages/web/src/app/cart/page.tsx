"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { useCartStore } from "@/store/cart-store";
import { Card, CardContent } from "@/components/ui";
import type { CartItem } from "@/store/cart-store";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default function CartPageClientPage() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  const subtotal = items.reduce((sum, item) => {
    return sum + (item.price ? item.price * item.quantity : 0);
  }, 0);

  const shippingCost = subtotal > 100 ? 0 : 9.99;
  const total = subtotal + shippingCost;

  if (items.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Your cart is empty</h1>
          <p className="mt-4 text-muted-foreground">
            Add some products to get started
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <Button asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Return Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Cart Items */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Shopping Cart ({items.length})</h1>
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-muted-foreground hover:text-destructive"
            >
              Clear cart
            </Button>
          )}
        </div>

        {items.map((item) => (
          <CartItemCard
            key={item.merchandiseId}
            item={item}
            onUpdateQuantity={(qty) => updateQuantity(item.merchandiseId, qty)}
            onRemove={() => removeItem(item.merchandiseId)}
          />
        ))}
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <Card className="sticky top-24">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Order Summary</h2>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal, "USD")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                {shippingCost === 0 ? (
                  <span className="text-green-600">Free</span>
                ) : (
                  <span>{formatCurrency(shippingCost, "USD")}</span>
                )}
              </div>
              {subtotal < 100 && (
                <p className="text-xs text-muted-foreground">
                  Add {formatCurrency(100 - subtotal, "USD")} more for free shipping
                </p>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(total, "USD")}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Taxes calculated at checkout
              </p>
            </div>

            <div className="space-y-2 pt-4">
              <Button className="w-full" size="lg" asChild>
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-center gap-4 text-muted-foreground text-xs">
                <div className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>30-day returns</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Image */}
          <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-md border bg-muted">
            {item.image ? (
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-sm text-muted-foreground">No image</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-1 flex-col">
            <div className="flex justify-between">
              <div>
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  SKU: {item.merchandiseId.split("/").pop()}
                </p>
              </div>
              <button
                onClick={onRemove}
                className="text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-auto flex items-center justify-between">
              {/* Quantity */}
              <div className="flex items-center gap-3 rounded-md border p-1">
                <button
                  onClick={() => onUpdateQuantity(item.quantity - 1)}
                  className="p-1 hover:bg-muted transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.quantity + 1)}
                  className="p-1 hover:bg-muted transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Price */}
              <div className="text-right">
                <p className="text-lg font-bold">
                  {item.price
                    ? formatCurrency(item.price * item.quantity, "USD")
                    : "N/A"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.price ? formatCurrency(item.price, "USD") : ""} each
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
