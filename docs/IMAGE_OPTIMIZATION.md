# Image Optimization Guide

## Configuration

Next.js Image optimization is configured in `next.config.ts`:

- **Supported formats**: AVIF, WebP (with fallback)
- **Device sizes**: 640, 750, 828, 1080, 1200, 1920, 2048, 3840
- **Image sizes**: 16, 32, 48, 64, 96, 128, 256, 384
- **Remote sources**:
  - Shopify CDN (cdn.shopify.com)
  - Unsplash (images.unsplash.com)
  - Cloudinary
  - AWS S3

## Components

### ImageWithFallback
```tsx
<ImageWithFallback
  src="https://example.com/image.jpg"
  alt="Product"
  fallback="/images/placeholder.png"
  width={800}
  height={600}
/>
```

### ProductImage
```tsx
<ProductImage
  src={product.images[0].url}
  alt={product.title}
  fill
  priority
/>
```

### BlurImage
```tsx
<BlurImage
  src="https://example.com/image.jpg"
  alt="Product"
  blurDataURL="data:image/svg+xml,..."
  width={800}
  height={600}
/>
```

### ResponsiveImage
```tsx
<ResponsiveImage
  src="https://example.com/image.jpg"
  alt="Product"
  sizes="card"
  width={800}
  height={600}
/>
```

## Utility Functions

```ts
import {
  generateBlurPlaceholder,
  getShopifyImageUrl,
  calculateAspectRatio,
  generateSrcSet,
  imageSizes,
  breakpoints
} from "@/lib/image";

// Generate blur placeholder
const blurData = generateBlurPlaceholder(10, 10, "#e5e7eb");

// Get optimized Shopify URL
const optimizedUrl = getShopifyImageUrl(shopifyUrl, { width: 800, crop: "center" });

// Calculate aspect ratio
const ratio = calculateAspectRatio(1920, 1080); // 16:9

// Generate srcset
const srcset = generateSrcSet(baseUrl, [400, 800, 1200]);
```

## Best Practices

1. **Use Next.js Image component** - Always prefer it over regular img tags
2. **Set proper dimensions** - Helps prevent layout shift
3. **Use priority for above-fold images** - Improves LCP
4. **Use fill for unknown dimensions** - With proper parent sizing
5. **Add blur placeholders** - Improves perceived performance
6. **Use WebP/AVIF** - Modern formats with better compression

## Adding New Image Sources

Edit `next.config.ts`:

```ts
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "your-cdn.com",
    },
  ],
}
```
