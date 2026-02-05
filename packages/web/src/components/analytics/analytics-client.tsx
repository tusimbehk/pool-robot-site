"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Analytics component - client side only
 * Simplified to avoid SSR issues with useSearchParams
 */
export function Analytics() {
  const pathname = usePathname();
  const trackedPath = useRef<string>(pathname);

  useEffect(() => {
    // Initialize Segment on mount
    const { initAnalytics } = require("@/lib/analytics");
    const writeKey = "your-segment-write-key"; // Default value
    initAnalytics(writeKey);
  }, []);

  useEffect(() => {
    // Track page views on route change
    // Only track if path actually changed
    if (trackedPath.current !== pathname) {
      const { trackPage } = require("@/lib/analytics");

      const properties = {
        path: pathname,
        url: window.location.href,
        referrer: document.referrer,
        title: document.title,
      };

      trackPage({
        name: pathname,
        properties,
      });

      trackedPath.current = pathname;
    }
  }, [pathname]);

  return null;
}
