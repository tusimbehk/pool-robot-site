import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse our products",
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
