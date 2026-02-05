"use client";

import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cart-store";

interface CartIconProps {
  className?: string;
}

/**
 * Floating cart icon with badge
 */
export function CartIcon({ className }: CartIconProps) {
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const totalItems = getTotalItems();

  return (
    <div className="relative">
      <ShoppingCart className={className} />
      {totalItems > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </div>
  );
}
