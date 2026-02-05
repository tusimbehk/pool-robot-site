import Link from "next/link";
import { Button } from "@/components/ui";

export default function ProductNotFound() {
  return (
    <div className="container flex min-h-[400px] flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Product Not Found</h1>
      <p className="mt-4 text-muted-foreground">
        The product you're looking for doesn't exist or has been removed.
      </p>
      <div className="mt-6 flex gap-4">
        <Button asChild>
          <Link href="/products">Browse Products</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}
