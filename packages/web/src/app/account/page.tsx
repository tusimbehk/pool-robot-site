"use client";

import { useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth";
import { AccountNav } from "./account-nav";
import { AccountOverview } from "./account-overview";
import { Loader2 } from "lucide-react";

export default function AccountClientPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <LoadingIcon className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container py-12">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <AccountNav />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <AccountOverview user={user} />
          </div>
        </div>
      </div>
    </ProtectedRoute>
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
