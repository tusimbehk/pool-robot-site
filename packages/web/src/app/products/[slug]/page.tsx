import { Metadata } from "next";
import { notFound } from "next/navigation";
import { mockProducts } from "@/lib/shopify";
import { ProductGallery, ProductInfo } from "@/components/product";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: `${product.title} - PoolClean Pro`,
    description: product.description,
    openGraph: {
      title: product.title,
      description: product.description,
      images: product.images.map((img) => img.url),
    },
  };
}

async function getProduct(slug: string) {
  const { isShopifyConfigured } = await import("@/lib/shopify");

  // Fallback to mock data if Shopify not configured
  if (!isShopifyConfigured()) {
    return mockProducts.find((p) => p.handle === slug) || null;
  }

  // Try real Shopify fetch
  try {
    const { shopifyClient } = await import("@/lib/shopify/client");
    return await shopifyClient.getProduct(slug);
  } catch (error) {
    console.error("Shopify fetch error:", error);
    // Fallback to mock data on error
    return mockProducts.find((p) => p.handle === slug) || null;
  }
}

export async function generateStaticParams() {
  return mockProducts.map((product) => ({
    slug: product.handle,
  }));
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  // Get related products (same type, excluding current)
  let relatedProducts: typeof mockProducts = [];

  const { isShopifyConfigured } = await import("@/lib/shopify");
  if (isShopifyConfigured()) {
    // For Shopify, we'd need to fetch related products
    // For now, just show nothing or could fetch by type
    relatedProducts = [];
  } else {
    relatedProducts = mockProducts
      .filter(
        (p) =>
          p.productType === product.productType &&
          p.id !== product.id &&
          p.availableForSale
      )
      .slice(0, 4);
  }

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <a href="/" className="hover:text-foreground">
          Home
        </a>
        <span>/</span>
        <a href="/products" className="hover:text-foreground">
          Products
        </a>
        <span>/</span>
        <span className="text-foreground">{product.title}</span>
      </nav>

      {/* Product */}
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Gallery */}
        <ProductGallery images={product.images} alt={product.title} />

        {/* Info */}
        <ProductInfo product={product} />
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight">Related Products</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((relatedProduct) => (
              <a
                key={relatedProduct.id}
                href={`/products/${relatedProduct.handle}`}
                className="group rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="aspect-square overflow-hidden rounded-t-lg bg-muted">
                  {relatedProduct.images[0] ? (
                    <img
                      src={relatedProduct.images[0].url}
                      alt={relatedProduct.images[0].altText || relatedProduct.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-muted-foreground">No image</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {relatedProduct.title}
                  </h3>
                  <p className="mt-2 text-sm font-bold">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: relatedProduct.priceRange.minVariantPrice.currencyCode,
                    }).format(
                      parseFloat(relatedProduct.priceRange.minVariantPrice.amount)
                    )}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
