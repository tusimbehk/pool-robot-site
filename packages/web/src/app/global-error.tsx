"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center">
          <h1 className="text-4xl font-bold">A critical error occurred</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            We apologize for the inconvenience. Please refresh the page.
          </p>
          <button
            onClick={reset}
            className="mt-6 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Reload page
          </button>
        </div>
      </body>
    </html>
  );
}
