/**
 * Image utility functions
 */

/**
 * Generate a base64 blur placeholder
 */
export function generateBlurPlaceholder(
  width: number = 10,
  height: number = 10,
  color: string = "#e5e7eb"
): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}"/>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/**
 * Get optimized image URL from Shopify CDN
 * Shopify supports automatic image transformation via URL parameters
 */
export function getShopifyImageUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    crop?: "center" | "top" | "bottom" | "left" | "right";
    scale?: number;
  } = {}
): string {
  const { width, height, crop, scale } = options;

  if (!url.includes("cdn.shopify.com")) {
    return url;
  }

  const urlObj = new URL(url);
  const params = urlObj.searchParams;

  if (width) params.set("width", width.toString());
  if (height) params.set("height", height.toString());
  if (crop) params.set("crop", crop);
  if (scale) params.set("scale", scale.toString());

  urlObj.search = params.toString();
  return urlObj.toString();
}

/**
 * Calculate aspect ratio from dimensions
 */
export function calculateAspectRatio(width: number, height: number): number {
  return width / height;
}

/**
 * Get responsive srcset for different screen sizes
 */
export function generateSrcSet(
  baseUrl: string,
  sizes: number[]
): string {
  return sizes
    .map((size) => {
      const url = getShopifyImageUrl(baseUrl, { width: size });
      return `${url} ${size}w`;
    })
    .join(", ");
}

/**
 * Common image sizes for responsive images
 */
export const imageSizes = {
  thumbnail: 100,
  card: 400,
  featured: 800,
  hero: 1200,
  full: 1920,
} as const;

/**
 * Breakpoints for responsive images
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;
