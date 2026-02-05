import { Suspense } from "react";
import { ThankYouClientPage } from "./thank-you-client";

export const metadata = {
  title: "Thank You - PoolClean Pro",
  description: "Thank you for your order",
};

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ThankYouClientPage />
    </Suspense>
  );
}
