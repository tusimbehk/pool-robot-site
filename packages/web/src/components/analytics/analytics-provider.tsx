"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { SEGMENT_CONFIG } from "@/lib/constants";

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

/**
 * Analytics Provider
 *
 * Handles automatic page tracking and initializes Segment
 */
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize Segment on mount
    if (typeof window !== "undefined") {
      const { initAnalytics } = require("@/lib/analytics");
      initAnalytics(SEGMENT_CONFIG.writeKey);
    }
  }, []);

  useEffect(() => {
    // Track page views on route change
    if (typeof window !== "undefined") {
      const { trackPage } = require("@/lib/analytics");

      // Build page properties
      const properties = {
        path: pathname,
        search: searchParams.toString(),
        url: window.location.href,
        referrer: document.referrer,
        title: document.title,
      };

      // Track page view
      trackPage({
        name: pathname,
        properties,
      });
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}
