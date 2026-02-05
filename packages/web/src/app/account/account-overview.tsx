"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import {
  ShoppingBag,
  Package,
  Clock,
  Truck,
} from "lucide-react";
import Link from "next/link";

interface AccountOverviewProps {
  user: { id: string; email: string; name?: string } | null;
}

export function AccountOverview({ user }: AccountOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">
          Welcome, {user?.name || user?.email?.split("@")[0]}!
        </h2>
        <p className="text-muted-foreground">
          Here's what's happening with your account
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickStat
          title="Total Orders"
          value="3"
          icon={ShoppingBag}
          href="/account/orders"
        />
        <QuickStat
          title="Processing"
          value="1"
          icon={Clock}
          href="/account/orders?status=processing"
        />
        <QuickStat
          title="Shipped"
          value="2"
          icon={Truck}
          href="/account/orders?status=shipped"
        />
        <QuickStat
          title="Wishlist"
          value="5"
          icon={Package}
          href="/account/wishlist"
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentOrders />
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Button variant="outline" asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/account/orders">View All Orders</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/account/wishlist">View Wishlist</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/support">Get Support</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface QuickStatProps {
  title: string;
  value: string;
  icon: React.ElementType;
  href: string;
}

function QuickStat({ title, value, icon: Icon, href }: QuickStatProps) {
  return (
    <Link
      href={href}
      className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </Link>
  );
}

function RecentOrders() {
  // Mock data - in production, fetch from API
  const orders = [
    {
      id: "PC-12345678",
      date: "2024-01-15",
      status: "Shipped",
      total: "$1,299.00",
    },
    {
      id: "PC-87654321",
      date: "2024-01-10",
      status: "Delivered",
      total: "$449.00",
    },
  ];

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No orders yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div>
            <p className="font-medium">{order.id}</p>
            <p className="text-sm text-muted-foreground">{order.date}</p>
          </div>
          <div className="text-right">
            <p className="font-medium">{order.total}</p>
            <p
              className={`text-sm ${
                order.status === "Shipped"
                  ? "text-blue-600"
                  : "text-green-600"
              }`}
            >
              {order.status}
            </p>
          </div>
        </div>
      ))}
      <Button variant="link" asChild className="w-full">
        <Link href="/account/orders">View all orders →</Link>
      </Button>
    </div>
  );
}
