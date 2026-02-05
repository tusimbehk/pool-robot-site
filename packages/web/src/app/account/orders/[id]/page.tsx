"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth";
import { AccountNav } from "../../account-nav";
import { Loader2, Package, Truck, Check, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Separator } from "@/components/ui";

interface OrderItem {
  id: string;
  name: string;
  sku: string;
  price: string;
  quantity: number;
  image?: string;
}

interface OrderDetails {
  id: string;
  orderNumber: string;
  date: string;
  status: "processing" | "shipped" | "delivered" | "cancelled";
  subtotal: string;
  shipping: string;
  tax: string;
  total: string;
  shippingAddress: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  items: OrderItem[];
  tracking?: string;
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      setLoading(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock order data
      const mockOrder: OrderDetails = {
        id: params.id as string,
        orderNumber: "PC-12345678",
        date: "2024-01-15",
        status: "shipped",
        subtotal: "$1,299.00",
        shipping: "$0.00",
        tax: "$103.92",
        total: "$1,402.92",
        tracking: "1Z999AA10123456784",
        shippingAddress: {
          name: "John Doe",
          address1: "123 Main St",
          address2: "Apt 4B",
          city: "Los Angeles",
          state: "CA",
          zip: "90001",
          country: "United States",
        },
        items: [
          {
            id: "1",
            name: "PoolClean Elite X1",
            sku: "PCE-X1-BLK",
            price: "$1,299.00",
            quantity: 1,
            image: "/images/placeholder-product.jpg",
          },
        ],
      };

      setOrder(mockOrder);
      setLoading(false);
    }

    fetchOrder();
  }, [params.id]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container py-12">
          <div className="flex min-h-[400px] items-center justify-center">
            <LoadingIcon className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!order) {
    return (
      <ProtectedRoute>
        <div className="container py-12">
          <Card>
            <CardContent className="flex min-h-[300px] flex-col items-center justify-center">
              <p className="text-muted-foreground">Order not found</p>
              <Button asChild className="mt-4" onClick={() => router.back()}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  const steps = [
    { key: "placed", label: "Order Placed", icon: Package, completed: true },
    {
      key: "processing",
      label: "Processing",
      icon: Package,
      completed: order.status !== "cancelled",
    },
    {
      key: "shipped",
      label: "Shipped",
      icon: Truck,
      completed: order.status === "shipped" || order.status === "delivered",
    },
    {
      key: "delivered",
      label: "Delivered",
      icon: Check,
      completed: order.status === "delivered",
    },
  ];

  return (
    <ProtectedRoute>
      <div className="container py-12">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <AccountNav />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/account/orders">← Back to Orders</Link>
                </Button>
                <h1 className="mt-2 text-2xl font-bold">Order {order.orderNumber}</h1>
                <p className="text-muted-foreground">
                  Placed on {new Date(order.date).toLocaleDateString()}
                </p>
              </div>
              <Badge
                variant={
                  order.status === "cancelled"
                    ? "destructive"
                    : order.status === "delivered"
                    ? "default"
                    : "secondary"
                }
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </div>

            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderTrackingSteps
                  steps={steps}
                  currentStatus={order.status}
                  tracking={order.tracking}
                />
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Items ({order.items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="text-xs text-muted-foreground">No image</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{item.price}</p>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address & Order Summary */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{order.shippingAddress.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.shippingAddress.address1}
                    {order.shippingAddress.address2 && (
                      <>, {order.shippingAddress.address2}</>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                    {order.shippingAddress.zip}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.shippingAddress.country}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{order.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{order.shipping}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{order.tax}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{order.total}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/support">Contact Support</Link>
              </Button>
              {order.status === "delivered" && (
                <Button variant="outline" asChild>
                  <Link href="/products">Reorder</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

interface OrderTrackingStepsProps {
  steps: Array<{
    key: string;
    label: string;
    icon: React.ElementType;
    completed: boolean;
  }>;
  currentStatus: string;
  tracking?: string;
}

function OrderTrackingSteps({ steps, tracking }: OrderTrackingStepsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    step.completed
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.completed ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <p className="mt-2 text-xs text-center">{step.label}</p>
              </div>
              {!isLast && (
                <div className="h-0.5 flex-1 bg-muted">
                  <div
                    className={`h-full ${
                      index < steps.length - 1 && steps[index + 1].completed
                        ? "bg-primary"
                        : ""
                    }`}
                    style={{ width: step.completed ? "100%" : "0%" }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {tracking && (
        <div className="rounded-md bg-muted p-3">
          <p className="text-sm font-medium">Tracking Number</p>
          <p className="text-sm text-muted-foreground">{tracking}</p>
        </div>
      )}
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
