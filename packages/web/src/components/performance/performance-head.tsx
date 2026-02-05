"use client";

import { useEffect } from "react";
import { setupCriticalPreconnects, prefetchResource } from "@/lib/performance";

interface PerformanceHeadProps {
  children?: React.ReactNode;
}

/**
 * Performance optimization head component
 *
 * Adds preconnects and prefetches for critical external resources
 */
export function PerformanceHead({ children }: PerformanceHeadProps) {
  useEffect(() => {
    // Setup preconnects to external domains
    setupCriticalPreconnects();

    // Prefetch resources that might be needed soon
    // Prefetch account page for authenticated users
    if (document.cookie.includes("session")) {
      prefetchResource("/account");
    }

    // Prefetch product page on home
    if (window.location.pathname === "/") {
      prefetchResource("/products");
    }
  }, []);

  return <>{children}</>;
}

/**
 * Script loader for third-party scripts
 * Loads them only when needed (after page interaction)
 */
export function ThirdPartyScripts() {
  useEffect(() => {
    let hasInteracted = false;

    const interactionHandler = () => {
      if (!hasInteracted) {
        hasInteracted = true;

        // Load third-party scripts after user interaction
        // Examples: chat widgets, social widgets, etc.
        loadDelayedScripts();

        // Remove event listeners
        window.removeEventListener("scroll", interactionHandler);
        window.removeEventListener("click", interactionHandler);
        window.removeEventListener("keydown", interactionHandler);
      }
    };

    // Listen for user interaction
    window.addEventListener("scroll", interactionHandler, { passive: true });
    window.addEventListener("click", interactionHandler);
    window.addEventListener("keydown", interactionHandler);

    return () => {
      window.removeEventListener("scroll", interactionHandler);
      window.removeEventListener("click", interactionHandler);
      window.removeEventListener("keydown", interactionHandler);
    };
  }, []);

  return null;
}

/**
 * Load delayed third-party scripts
 */
function loadDelayedScripts() {
  // Add scripts that should load after user interaction
  // Examples:
  // - Social media widgets
  // - Non-critical analytics
  // - Embedded videos
}

/**
 * Dynamic import wrapper for code splitting
 */
export function dynamicImport<T>(
  importFunc: () => Promise<{ default: T }>,
  componentName = "Component"
): React.ComponentType<any> {
  // This is a wrapper around Next.js dynamic
  // Usage: const MyComponent = dynamicImport(() => import('./MyComponent'))
  return (() => null) as any;
}

import React from "react";
