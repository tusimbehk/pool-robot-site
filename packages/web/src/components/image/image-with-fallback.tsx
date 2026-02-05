"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";

interface ImageWithFallbackProps extends Omit<ImageProps, "src" | "onError"> {
  src: string;
  fallback?: string;
  containerClassName?: string;
}

/**
 * Optimized image component with fallback and blur-up support
 *
 * Features:
 * - Next.js Image optimization
 * - Fallback image on error
 * - Blur placeholder while loading
 * - Responsive sizing
 */
export function ImageWithFallback({
  src,
  alt,
  fallback = "/images/placeholder.png",
  containerClassName,
  className,
  priority = false,
  ...props
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}
      <Image
        src={imgSrc}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          if (imgSrc !== fallback) {
            setImgSrc(fallback);
            setIsLoading(false);
          }
        }}
        priority={priority}
        {...props}
      />
    </div>
  );
}
