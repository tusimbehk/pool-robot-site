"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";

interface BlurImageProps extends Omit<ImageProps, "blurDataURL"> {
  blurDataURL?: string;
  blurWidth?: number;
  blurHeight?: number;
}

/**
 * Image component with blur-up placeholder
 *
 * Uses a tiny base64 image as placeholder while loading
 */
export function BlurImage({
  src,
  alt,
  blurDataURL,
  blurWidth = 10,
  blurHeight = 10,
  ...props
}: BlurImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <Image
      src={src}
      alt={alt}
      placeholder="blur"
      blurDataURL={
        blurDataURL ||
        `data:image/svg+xml;base64,${Buffer.from(
          `<svg width="${blurWidth}" height="${blurHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#e5e7eb"/></svg>`
        ).toString("base64")}`
      }
      className={`transition-opacity duration-300 ${
        isLoading ? "opacity-0" : "opacity-100"
      }`}
      onLoad={() => setIsLoading(false)}
      {...props}
    />
  );
}
