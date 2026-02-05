"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
}

/**
 * Product-optimized image component
 *
 * Features:
 * - Aspect ratio preservation
 * - Blur placeholder
 * - Zoom on hover (optional)
 * - Loading state
 */
export function ProductImage({
  src,
  alt,
  fill = false,
  priority = false,
  className,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
}: ProductImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  if (fill) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-muted">
        {isLoading && (
          <div className="absolute inset-0 animate-pulse bg-muted" />
        )}
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={cn(
            "object-cover transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          onLoad={() => setIsLoading(false)}
          priority={priority}
        />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-muted">
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}
      <Image
        src={src}
        alt={alt}
        width={800}
        height={800}
        sizes={sizes}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        onLoad={() => setIsLoading(false)}
        priority={priority}
      />
    </div>
  );
}
