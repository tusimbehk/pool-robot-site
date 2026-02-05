import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopping Cart - PoolClean Pro",
  description: "Review your shopping cart and proceed to checkout",
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
