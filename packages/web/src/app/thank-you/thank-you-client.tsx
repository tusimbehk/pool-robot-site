"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui";
import { Check, Package, Truck, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/cart-store";

interface OrderDetails {
  orderNumber: string;
  orderDate: string;
  customerEmail: string;
  total: string;
  items: number;
}

/**
 * Order confirmation page
 *
 * Displays after successful checkout
 */
export function ThankYouClientPage() {
  const searchParams = useSearchParams();
  const cartId = searchParams.get("cart");
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    // Clear the cart after successful order
    clearCart();

    // Mock order details - in production, this would come from Shopify
    setOrderDetails({
      orderNumber: `PC-${Date.now().toString().slice(-8)}`,
      orderDate: new Date().toISOString(),
      customerEmail: "customer@example.com",
      total: "$1,299.00",
      items: 1,
    });
  }, [clearCart]);

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

  if (!orderDetails) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <LoadingIcon className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your order details...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-16">
      {/* Success Message */}
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Thank you for your order!
        </h1>
        <p className="mt-2 text-muted-foreground">
          We've received your order and are processing it.
        </p>
      </div>

      {/* Order Details */}
      <div className="mt-8 rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">Order Details</h2>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order Number:</span>
            <span className="font-medium">{orderDetails.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order Date:</span>
            <span className="font-medium">
              {new Date(orderDetails.orderDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium">{orderDetails.customerEmail}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-bold text-lg">{orderDetails.total}</span>
          </div>
        </div>
      </div>

      {/* What's Next */}
      <div className="mt-8 rounded-lg border bg-muted/40 p-6">
        <h2 className="text-lg font-semibold">What's Next?</h2>

        <div className="mt-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">Order Confirmation</p>
              <p className="text-sm text-muted-foreground">
                We've sent a confirmation email to {orderDetails.customerEmail}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Truck className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">Shipping</p>
              <p className="text-sm text-muted-foreground">
                Estimated delivery by {estimatedDelivery.toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <RefreshCw className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">Track Your Order</p>
              <p className="text-sm text-muted-foreground">
                You'll receive tracking information once your order ships
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button className="flex-1" asChild>
          <Link href="/products">Continue Shopping</Link>
        </Button>
        <Button variant="outline" className="flex-1" asChild>
          <Link href="/account/orders">View Order Details</Link>
        </Button>
      </div>
    </div>
  );
}

function LoadingIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
