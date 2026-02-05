"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth";
import { AccountNav } from "../account-nav";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Card, CardContent } from "@/components/ui";

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: "processing" | "shipped" | "delivered" | "cancelled";
  total: string;
  itemCount: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    // Fetch orders - mock data for now
    async function fetchOrders() {
      setLoading(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock orders data
      const mockOrders: Order[] = [
        {
          id: "1",
          orderNumber: "PC-12345678",
          date: "2024-01-15",
          status: "shipped",
          total: "$1,299.00",
          itemCount: 1,
        },
        {
          id: "2",
          orderNumber: "PC-87654321",
          date: "2024-01-10",
          status: "delivered",
          total: "$449.00",
          itemCount: 2,
        },
        {
          id: "3",
          orderNumber: "PC-11223344",
          date: "2024-01-05",
          status: "delivered",
          total: "$899.00",
          itemCount: 1,
        },
      ];

      setOrders(mockOrders);
      setLoading(false);
    }

    fetchOrders();
  }, []);

  const filteredOrders = filter === "all"
    ? orders
    : orders.filter((order) => order.status === filter);

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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold">Order History</h1>
                <p className="text-muted-foreground">
                  View and track your orders
                </p>
              </div>

              {/* Filter */}
              <div className="flex gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={filter === "processing" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("processing")}
                >
                  Processing
                </Button>
                <Button
                  variant={filter === "shipped" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("shipped")}
                >
                  Shipped
                </Button>
                <Button
                  variant={filter === "delivered" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("delivered")}
                >
                  Delivered
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <LoadingIcon className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredOrders.length === 0 ? (
              /* Empty State */
              <Card>
                <CardContent className="flex min-h-[300px] flex-col items-center justify-center">
                  <p className="text-muted-foreground">
                    {filter === "all" ? "No orders yet" : `No ${filter} orders`}
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/products">Start Shopping</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              /* Orders List */
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

interface OrderCardProps {
  order: Order;
}

function OrderCard({ order }: OrderCardProps) {
  const statusColors: Record<Order["status"], string> = {
    processing: "bg-yellow-100 text-yellow-800",
    shipped: "bg-blue-100 text-blue-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">{order.orderNumber}</h3>
              <Badge className={statusColors[order.status]}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Placed on {new Date(order.date).toLocaleDateString()}
            </p>
            <p className="text-sm text-muted-foreground">
              {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
            </p>
          </div>

          <div className="flex items-center justify-between sm:flex-col sm:items-end sm:gap-2">
            <p className="text-lg font-bold">{order.total}</p>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/account/orders/${order.id}`}>View Details</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
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
