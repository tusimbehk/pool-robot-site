/**
 * Shopify Error Handler
 *
 * Unified error handling for Shopify API calls
 */

export class ShopifyError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = "ShopifyError";
  }
}

export type ShopifyErrorCode =
  | "CONFIGURATION_ERROR"
  | "NETWORK_ERROR"
  | "GRAPHQL_ERROR"
  | "PRODUCT_NOT_FOUND"
  | "CART_ERROR"
  | "CHECKOUT_ERROR"
  | "UNKNOWN";

/**
 * Parse error from Shopify API response
 */
export function parseShopifyError(error: unknown): ShopifyError {
  if (error instanceof ShopifyError) {
    return error;
  }

  // GraphQL errors
  if (error && typeof error === "object" && "errors" in error) {
    const errors = (error as { errors: Array<{ message: string }> }).errors;
    return new ShopifyError(
      errors[0]?.message || "GraphQL error",
      "GRAPHQL_ERROR",
      true
    );
  }

  // Network/Response errors
  if (error instanceof Error) {
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return new ShopifyError(error.message, "NETWORK_ERROR", true);
    }
    if (error.message.includes("credentials")) {
      return new ShopifyError(error.message, "CONFIGURATION_ERROR", false);
    }
    return new ShopifyError(error.message, "UNKNOWN", true);
  }

  return new ShopifyError("Unknown error occurred", "UNKNOWN", true);
}

/**
 * Handle Shopify error with logging and fallback
 */
export function handleShopifyError(
  error: unknown,
  context: string
): ShopifyError {
  const parsedError = parseShopifyError(error);

  // Log error (in production, this goes to Sentry)
  console.error(`[Shopify ${context}]:`, {
    code: parsedError.code,
    message: parsedError.message,
    recoverable: parsedError.recoverable,
  });

  return parsedError;
}
