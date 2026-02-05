"use client";

import { useState, useEffect } from "react";
import { useShopifyClient } from "@/hooks/use-shopify";
import { useAnalytics } from "@/hooks/use-analytics";
import type { Product } from "@/lib/shopify";

interface ProductListProps {
  initialProducts?: Product[];
  tag?: string;
  productType?: string;
  search?: string;
}

export function ProductList({
  initialProducts,
  tag,
  productType,
  search,
}: ProductListProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [loading, setLoading] = useState(!initialProducts);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If initial products provided, use them
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
      setLoading(false);
      return;
    }

    // Otherwise fetch products
    async function fetchProducts() {
      setLoading(true);
      setError(null);

      try {
        const client = useShopifyClient();
        let query = "";

        if (tag) {
          query = `tag:${tag}`;
        } else if (productType) {
          query = `product_type:${productType}`;
        } else if (search) {
          query = search;
        }

        const result = await client.getProducts(20, undefined, query);
        const productList = result.edges.map((edge) => edge.node);

        setProducts(productList);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load products");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [tag, productType, search, initialProducts]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[4/3] animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} position={products.indexOf(product) + 1} />
      ))}
    </div>
  );
}

function ProductCard({ product, position }: { product: Product; position: number }) {
  const image = product.images[0];
  const price = product.priceRange.minVariantPrice;
  const compareAtPrice = product.compareAtPriceRange?.minVariantPrice;
  const { track } = useAnalytics();

  function handleProductClick() {
    // Track product click from list
    track("Product Clicked", {
      product_id: product.id,
      name: product.title,
      price: parseFloat(price.amount),
      currency: price.currencyCode,
      category: product.productType,
      position,
      list_id: "product_list",
    });
  }

  return (
    <a
      href={`/products/${product.handle}`}
      onClick={handleProductClick}
      className="group rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="aspect-square overflow-hidden rounded-t-lg bg-muted">
        {image ? (
          <img
            src={image.url}
            alt={image.altText || product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
          {product.title}
        </h3>

        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {product.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: price.currencyCode,
              }).format(parseFloat(price.amount))}
            </span>
            {compareAtPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: compareAtPrice.currencyCode,
                }).format(parseFloat(compareAtPrice.amount))}
              </span>
            )}
          </div>

          {!product.availableForSale && (
            <span className="text-sm text-muted-foreground">Out of stock</span>
          )}
        </div>
      </div>
    </a>
  );
}
