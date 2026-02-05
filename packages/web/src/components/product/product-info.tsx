"use client";

import { useState, useEffect } from "react";
import { Check, Truck, Shield, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui";
import { useCartStore } from "@/store/cart-store";
import { useToast } from "@/components/ui/use-toast";
import { useAnalytics } from "@/hooks/use-analytics";
import type { Product, ProductVariant } from "@/lib/shopify";

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
  const addItem = useCartStore((state) => state.addItem);
  const { toast } = useToast();
  const { trackProduct, trackAddToCart, trackCheckout } = useAnalytics();
  const [viewTracked, setViewTracked] = useState(false);

  // Track product view when component mounts
  useEffect(() => {
    if (!viewTracked) {
      trackProduct({
        id: product.id,
        name: product.title,
        price: parseFloat(selectedVariant.price.amount),
        currency: selectedVariant.price.currencyCode,
        category: product.productType,
        variant: selectedVariant.title,
      });
      setViewTracked(true);
    }
  }, [product, selectedVariant, trackProduct, viewTracked]);

  const price = selectedVariant.price;
  const compareAtPrice = selectedVariant.compareAtPrice;
  const savings = compareAtPrice
    ? parseFloat(compareAtPrice.amount) - parseFloat(price.amount)
    : 0;

  function handleAddToCart() {
    if (!product.availableForSale || !selectedVariant.availableForSale) {
      toast({
        title: "Product unavailable",
        description: "This product is currently out of stock.",
        variant: "destructive",
      });
      return;
    }

    // Track add to cart event
    trackAddToCart({
      id: selectedVariant.id,
      name: product.title,
      price: parseFloat(price.amount),
      quantity,
      currency: price.currencyCode,
    });

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
  }

  function handleBuyNow() {
    // First add to cart
    handleAddToCart();

    // Then track checkout started
    const total = parseFloat(price.amount) * quantity;
    trackCheckout({
      cartId: `cart-${Date.now()}`,
      total,
      currency: price.currencyCode,
      itemCount: quantity,
    });

    // Navigate to checkout
    window.location.href = "/checkout";
  }

  function handleVariantChange(variant: ProductVariant) {
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
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{product.title}</h1>
        <p className="mt-2 text-muted-foreground">{product.vendor}</p>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: price.currencyCode,
          }).format(parseFloat(price.amount))}
        </span>
        {compareAtPrice && (
          <>
            <span className="text-lg text-muted-foreground line-through">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: compareAtPrice.currencyCode,
              }).format(parseFloat(compareAtPrice.amount))}
            </span>
            {savings > 0 && (
              <Badge variant="success">Save {price.currencyCode} {savings.toFixed(2)}</Badge>
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
          disabled={!product.availableForSale || !selectedVariant.availableForSale}
          onClick={handleAddToCart}
        >
          {product.availableForSale && selectedVariant.availableForSale
            ? "Add to cart"
            : "Out of stock"}
        </Button>
        <Button
          size="lg"
          variant="outline"
          disabled={!product.availableForSale || !selectedVariant.availableForSale}
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
