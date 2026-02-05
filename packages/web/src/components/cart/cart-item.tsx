"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { useCartStore } from "@/store/cart-store";
import { useAnalytics } from "@/hooks/use-analytics";
import type { CartItem } from "@/store/cart-store";
import { formatCurrency } from "@/lib/utils";

interface CartItemProps {
  item: CartItem;
}

export function CartItemComponent({ item }: CartItemProps) {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const { trackRemoveFromCart } = useAnalytics();

  function handleRemove() {
    // Track remove from cart event
    if (item.price) {
      trackRemoveFromCart({
        id: item.merchandiseId,
        name: item.title || "Product",
        price: item.price,
        quantity: item.quantity,
        currency: "USD",
      });
    }

    removeItem(item.merchandiseId);
  }

  return (
    <div className="flex gap-4 py-4 border-b">
      {/* Image */}
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border bg-muted">
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-xs text-muted-foreground">No image</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between">
          <div>
            <h3 className="font-medium">{item.title}</h3>
            {item.handle && (
              <p className="text-sm text-muted-foreground">
                SKU: {item.merchandiseId.split("/").pop()}
              </p>
            )}
          </div>
          <button
            onClick={handleRemove}
            className="text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Remove item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-end justify-between">
          {/* Quantity */}
          <div className="flex items-center gap-2 rounded-md border">
            <button
              onClick={() => updateQuantity(item.merchandiseId, item.quantity - 1)}
              className="p-1 hover:bg-muted transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.merchandiseId, item.quantity + 1)}
              className="p-1 hover:bg-muted transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="font-medium">
              {item.price
                ? formatCurrency(item.price * item.quantity, "USD")
                : "Price not available"}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.price ? formatCurrency(item.price, "USD") : ""} each
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
