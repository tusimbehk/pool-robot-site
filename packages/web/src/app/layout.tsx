import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CartSheet } from "@/components/cart/cart-sheet";
import { CookieBanner } from "@/components/cookie-banner";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PoolClean Pro - Premium Pool Cleaning Robots",
  description: "Advanced pool cleaning robots for European and North American markets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen">
          {children}
        </div>
        <CartSheet />
        <CookieBanner />
      </body>
    </html>
  );
}
