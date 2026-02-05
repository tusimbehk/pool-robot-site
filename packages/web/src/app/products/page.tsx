import { Metadata } from "next";
import { getShopifyClient, mockProductsConnection } from "@/lib/shopify";
import { ProductList, ProductFilters, ProductSort } from "@/components/product";
import { Suspense } from "react";

interface ProductsPageProps {
  searchParams: Promise<{
    type?: string;
    tag?: string;
    sort?: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Products - PoolClean Pro",
    description: "Browse our range of premium pool cleaning robots and accessories",
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { type, tag } = await searchParams;

  // Fetch initial products server-side
  let initialProducts = mockProductsConnection.edges.map((e) => e.node);

  try {
    const client = getShopifyClient();
    let query = "";

    if (tag) {
      query = `tag:${tag}`;
    } else if (type) {
      query = `product_type:${type === "robots" ? "Robotic Pool Cleaner" : "Accessories"}`;
    }

    const result = await client.getProducts(20, undefined, query);
    if (result.edges.length > 0) {
      initialProducts = result.edges.map((e) => e.node);
    }
  } catch {
    // Use mock data if fetch fails
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="mt-2 text-muted-foreground">
          Browse our range of premium pool cleaning robots and accessories
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Suspense fallback={<div>Loading filters...</div>}>
          <ProductFilters
            selectedType={
              type === "robots"
                ? "Robotic Pool Cleaner"
                : type === "accessories"
                ? "Accessories"
                : undefined
            }
          />
        </Suspense>

        <ProductSort value="featured" onChange={() => {}} />
      </div>

      {/* Products */}
      <ProductList
        initialProducts={initialProducts}
        productType={
          type === "robots"
            ? "Robotic Pool Cleaner"
            : type === "accessories"
            ? "Accessories"
            : undefined
        }
        tag={tag}
      />
    </div>
  );
}
