/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI
 */

"use client";

import React from "react";
import { Button } from "@/components/ui";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Default Error Fallback Component
 */
function DefaultErrorFallback({ error, retry }: { error: Error | null; retry: () => void }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Something went wrong</h1>
        <p className="mb-6 text-muted-foreground">
          {error?.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={retry} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button onClick={() => window.location.href = "/"} variant="outline">
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Error Boundary Class Component
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log to console
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Send to monitoring service (Sentry, etc.)
    if (typeof window !== "undefined") {
      // Dynamically import to avoid SSR issues
      import("@/lib/monitoring").then(({ captureException }) => {
        captureException(error, {
          tags: {
            component: "ErrorBoundary",
          },
          extra: {
            componentStack: errorInfo.componentStack,
          },
        });
      });
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultErrorFallback;
      return <Fallback error={this.state.error || new Error("Unknown error")} retry={this.handleReset} />;
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary alternative
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
): React.ComponentType<P> {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * useErrorHandler hook for catching errors in async functions
 */
export function useErrorHandler() {
  return React.useCallback((error: Error) => {
    throw error;
  }, []);
}
