"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Check, Truck, Shield, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui";
import { useCartStore } from "@/store/cart-store-v2";
import { useToast } from "@/components/ui/use-toast";
import { useAnalytics } from "@/hooks/use-analytics";
import { formatPrice, calculateSavings } from "@/lib/currency";
import type { Product, ProductVariant } from "@/lib/shopify";
import { isShopifyConfigured } from "@/lib/shopify";

interface ProductInfoProps {
  product: Product;
}

const features = [
  { icon: Truck, title: "Free Shipping", description: "On orders over $100" },
  { icon: Shield, title: "2 Year Warranty", description: "Full coverage" },
  { icon: RotateCcw, title: "30-Day Returns", description: "Hassle-free returns" },
];

export function ProductInfo({ product }: ProductInfoProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product.variants[0]
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const addItemWithSync = useCartStore((state) => state.addItemWithSync);
  const { toast } = useToast();
  const { trackProduct, trackAddToCart, trackCheckout } = useAnalytics();

  // Track product view once when component mounts
  useEffect(() => {
    trackProduct({
      id: product.id,
      name: product.title,
      price: parseFloat(selectedVariant.price.amount),
      currency: selectedVariant.price.currencyCode,
      category: product.productType,
      variant: selectedVariant.title,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]); // Only track when product ID changes

  // Memoize price calculations
  const price = useMemo(() => selectedVariant.price, [selectedVariant.price]);
  const compareAtPrice = useMemo(
    () => selectedVariant.compareAtPrice,
    [selectedVariant.compareAtPrice]
  );
  const savings = useMemo(
    () =>
      compareAtPrice
        ? calculateSavings(parseFloat(compareAtPrice.amount), parseFloat(price.amount))
        : 0,
    [compareAtPrice, price.amount]
  );

  // Memoize formatted prices
  const formattedPrice = useMemo(
    () => formatPrice(parseFloat(price.amount), price.currencyCode as any),
    [price]
  );
  const formattedCompareAtPrice = useMemo(
    () =>
      compareAtPrice
        ? formatPrice(parseFloat(compareAtPrice.amount), compareAtPrice.currencyCode as any)
        : null,
    [compareAtPrice]
  );

  // Check if product is available
  const isAvailable = useMemo(
    () => product.availableForSale && selectedVariant.availableForSale,
    [product.availableForSale, selectedVariant.availableForSale]
  );

  // Stable add to cart handler
  const handleAddToCart = useCallback(async () => {
    if (!isAvailable) {
      toast({
        title: "Product unavailable",
        description: "This product is currently out of stock.",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);

    try {
      // Track add to cart event
      trackAddToCart({
        id: selectedVariant.id,
        name: product.title,
        price: parseFloat(price.amount),
        quantity,
        currency: price.currencyCode,
      });

      const item = {
        merchandiseId: selectedVariant.id,
        quantity,
        title: product.title,
        price: parseFloat(price.amount),
        image: product.images[0]?.url,
        handle: product.handle,
      };

      // Use addItemWithSync if Shopify is configured, otherwise use local addItem
      if (isShopifyConfigured()) {
        await addItemWithSync(item);
      } else {
        addItem(item);
      }

      toast({
        title: "Added to cart",
        description: `${quantity} × ${product.title} has been added to your cart.`,
      });
    } catch (error) {
      console.error("Failed to add to cart:", error);
      // Fallback to local cart if sync fails
      addItem({
        merchandiseId: selectedVariant.id,
        quantity,
        title: product.title,
        price: parseFloat(price.amount),
        image: product.images[0]?.url,
        handle: product.handle,
      });
      toast({
        title: "Added to cart",
        description: `${quantity} × ${product.title} has been added to your cart.`,
      });
    } finally {
      setIsAdding(false);
    }
  }, [
    isAvailable,
    toast,
    trackAddToCart,
    selectedVariant,
    product,
    quantity,
    price,
    addItem,
    addItemWithSync,
  ]);

  // Buy now handler - waits for cart sync before navigating
  const handleBuyNow = useCallback(async () => {
    await handleAddToCart();

    // Track checkout started
    trackCheckout({
      cartId: `cart-${Date.now()}`,
      total: parseFloat(price.amount) * quantity,
      currency: price.currencyCode,
      itemCount: quantity,
    });

    // Navigate to checkout (after sync completes)
    window.location.href = "/checkout";
  }, [handleAddToCart, trackCheckout, price.amount, price.currencyCode, quantity]);

  // Variant change handler
  const handleVariantChange = useCallback(
    (variant: ProductVariant) => {
      setSelectedVariant(variant);

      // Track variant change as another product view
      trackProduct({
        id: product.id,
        name: product.title,
        price: parseFloat(variant.price.amount),
        currency: variant.price.currencyCode,
        category: product.productType,
        variant: variant.title,
      });
    },
    [product.id, product.title, product.productType, trackProduct]
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{product.title}</h1>
        <p className="mt-2 text-muted-foreground">{product.vendor}</p>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold">{formattedPrice}</span>
        {formattedCompareAtPrice && (
          <>
            <span className="text-lg text-muted-foreground line-through">
              {formattedCompareAtPrice}
            </span>
            {savings > 0 && (
              <Badge variant="success">Save {savings.toFixed(2)}</Badge>
            )}
          </>
        )}
      </div>

      {/* Tags */}
      {product.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {product.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Variants */}
      {product.variants.length > 1 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Select option</label>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => handleVariantChange(variant)}
                disabled={!variant.availableForSale}
                className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                  selectedVariant.id === variant.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-muted"
                } ${!variant.availableForSale ? "cursor-not-allowed opacity-50" : ""}`}
              >
                {variant.title}
                {!variant.availableForSale && " - Out of stock"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Quantity</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-input hover:bg-accent"
          >
            -
          </button>
          <span className="w-12 text-center font-medium">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-input hover:bg-accent"
          >
            +
          </button>
        </div>
      </div>

      {/* Add to Cart */}
      <div className="flex gap-3">
        <Button
          size="lg"
          className="flex-1"
          disabled={!isAvailable || isAdding}
          onClick={handleAddToCart}
        >
          {isAdding ? "Adding..." : isAvailable ? "Add to cart" : "Out of stock"}
        </Button>
        <Button
          size="lg"
          variant="outline"
          disabled={!isAvailable || isAdding}
          onClick={handleBuyNow}
        >
          Buy now
        </Button>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 gap-4 border-t pt-6 sm:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.title} className="flex items-start gap-3">
              <Icon className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-medium">{feature.title}</p>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Description */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold">Description</h2>
        <div
          className="mt-3 text-muted-foreground prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
        />
      </div>
    </div>
  );
}
