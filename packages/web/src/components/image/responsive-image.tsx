import Image from "next/image";
import type { ImageProps } from "next/image";

interface ResponsiveImageProps extends Omit<ImageProps, "sizes"> {
  sizes?: "hero" | "card" | "thumbnail" | "banner";
}

const sizeMap: Record<string, string> = {
  hero: "(max-width: 768px) 100vw, 1200px",
  card: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  thumbnail: "100px",
  banner: "(max-width: 768px) 100vw, 1200px",
};

/**
 * Responsive image component with pre-defined sizes
 */
export function ResponsiveImage({
  sizes = "card",
  ...props
}: ResponsiveImageProps) {
  return <Image sizes={sizeMap[sizes]} {...props} />;
}
