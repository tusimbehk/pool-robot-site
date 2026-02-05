/**
 * Performance Optimization Utilities
 *
 * Collection of utilities for optimizing web performance
 */

/**
 * Image size breakpoints for responsive images
 */
export const imageBreakpoints = {
  xs: 640,   // small mobile
  sm: 768,   // mobile
  md: 1024,  // tablet
  lg: 1280,  // desktop
  xl: 1536,  // large desktop
  "2xl": 1920, // extra large
} as const;

/**
 * Generate responsive image srcset
 */
export function generateSrcSet(
  baseUrl: string,
  widths: number[]
): string {
  return widths
    .map((width) => {
      const url = addQueryParam(baseUrl, "width", width.toString());
      return `${url} ${width}w`;
    })
    .join(", ");
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizes(): string {
  return "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";
}

/**
 * Add query parameter to URL
 */
function addQueryParam(url: string, key: string, value: string): string {
  const urlObj = new URL(url, url.startsWith("http") ? undefined : window.location.origin);
  urlObj.searchParams.set(key, value);
  return urlObj.toString();
}

/**
 * Lazy load intersection observer options
 */
export const lazyLoadOptions = {
  root: null,
  rootMargin: "200px",
  threshold: 0.01,
};

/**
 * Preload critical resources
 */
export function preloadResource(href: string, as: "script" | "style" | "font" | "image"): void {
  if (typeof document === "undefined") return;

  const link = document.createElement("link");
  link.rel = "preload";
  link.href = href;
  link.as = as;

  if (as === "font") {
    link.crossOrigin = "anonymous";
  }

  document.head.appendChild(link);
}

/**
 * Prefetch resource for next navigation
 */
export function prefetchResource(href: string): void {
  if (typeof document === "undefined") return;

  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = href;

  document.head.appendChild(link);
}

/**
 * DNS prefetch for external domains
 */
export function dnsPrefetch(domain: string): void {
  if (typeof document === "undefined") return;

  const link = document.createElement("link");
  link.rel = "dns-prefetch";
  link.href = domain;

  document.head.appendChild(link);
}

/**
 * Preconnect to external domains
 */
export function preconnect(domain: string): void {
  if (typeof document === "undefined") return;

  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = domain;
  link.crossOrigin = "anonymous";

  document.head.appendChild(link);
}

/**
 * Preconnect to critical external domains
 * Call this in your app layout
 */
export function setupCriticalPreconnects(): void {
  // Shopify CDN
  preconnect("https://cdn.shopify.com");

  // Segment
  preconnect("https://cdn.segment.com");

  // Google Analytics
  preconnect("https://www.google-analytics.com");

  // Fonts
  preconnect("https://fonts.googleapis.com");
  preconnect("https://fonts.gstatic.com");
}

/**
 * Get priority hint for fetch
 */
export type FetchPriority = "auto" | "high" | "low";

/**
 * Load script with priority
 */
export function loadScript(
  src: string,
  priority: FetchPriority = "auto",
  async: boolean = false
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("document is not defined"));
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = async;
    script.fetchPriority = priority;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

    document.head.appendChild(script);
  });
}

/**
 * Defer non-critical CSS
 */
export function deferStyle(href: string): void {
  if (typeof document === "undefined") return;

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "style";
  link.href = href;
  link.onload = () => {
    link.setAttribute("rel", "stylesheet");
  };

  document.head.appendChild(link);
}

/**
 * Debounce function for resize/scroll events
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | undefined;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for scroll events
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Request animation frame throttle
 * Better for scroll/resize handlers
 */
export function rafThrottle<T extends (...args: unknown[]) => unknown>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | undefined;

  return (...args: Parameters<T>) => {
    if (rafId !== undefined) {
      cancelAnimationFrame(rafId);
    }

    rafId = requestAnimationFrame(() => {
      func(...args);
      rafId = undefined;
    });
  };
}

/**
 * Check if Intersection Observer is supported
 */
export function hasIntersectionObserver(): boolean {
  return (
    typeof window !== "undefined" &&
    "IntersectionObserver" in window &&
    "IntersectionObserverEntry" in window &&
    "intersectionRatio" in window.IntersectionObserverEntry.prototype
  );
}

/**
 * Create an intersection observer for lazy loading
 */
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options = lazyLoadOptions
): IntersectionObserver | null {
  if (!hasIntersectionObserver()) {
    return null;
  }

  return new IntersectionObserver(callback, options);
}

/**
 * Format bytes to human readable size
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Estimate connection type from navigator.connection
 */
export function getConnectionType(): string {
  if (typeof navigator === "undefined" || !("connection" in navigator)) {
    return "unknown";
  }

  const conn = (navigator as any).connection;

  if (!conn) return "unknown";

  if (conn.effectiveType) {
    return conn.effectiveType; // 'slow-2g', '2g', '3g', or '4g'
  }

  return "unknown";
}

/**
 * Check if user is on slow connection
 */
export function isSlowConnection(): boolean {
  const connection = getConnectionType();
  return connection === "slow-2g" || connection === "2g";
}

/**
 * Get device pixel ratio
 */
export function getPixelRatio(): number {
  if (typeof window === "undefined") return 1;
  return window.devicePixelRatio || 1;
}

/**
 * Should serve high-resolution images
 */
export function shouldServeHighResImages(): boolean {
  return getPixelRatio() > 1 && !isSlowConnection();
}
