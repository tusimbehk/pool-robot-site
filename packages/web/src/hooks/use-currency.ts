/**
 * Currency Hooks
 *
 * Custom hooks for currency formatting and conversion
 */

import { useMemo } from "react";
import {
  CurrencyCode,
  formatPrice as formatPriceUtil,
  convertPrice,
  getCurrencyConfig,
  getCurrencySymbol,
  calculateTax,
  calculateTotalWithTax,
  formatDiscount,
} from "@/lib/currency";

/**
 * Hook for formatting prices
 */
export function useFormatPrice(currency?: CurrencyCode) {
  return useMemo(
    () => (price: number, overrideCurrency?: CurrencyCode) => {
      return formatPriceUtil(price, overrideCurrency || currency || "USD");
    },
    [currency]
  );
}

/**
 * Hook for currency conversion
 */
export function useCurrencyConversion(baseCurrency: CurrencyCode = "USD") {
  const convert = useMemo(
    () => (price: number, toCurrency: CurrencyCode) => {
      return convertPrice(price, baseCurrency, toCurrency);
    },
    [baseCurrency]
  );

  const convertToAll = useMemo(
    () => (price: number, currencies: CurrencyCode[]) => {
      return currencies.map((currency) => ({
        currency,
        amount: convertPrice(price, baseCurrency, currency),
        formatted: formatPriceUtil(convertPrice(price, baseCurrency, currency), currency),
      }));
    },
    [baseCurrency]
  );

  return { convert, convertToAll };
}

/**
 * Hook for price calculations
 */
export function usePriceCalculations(currency: CurrencyCode = "USD") {
  const formatPrice = useFormatPrice(currency);

  return useMemo(
    () => ({
      formatPrice,
      calculateTax: (price: number, taxRate: number) => {
        const taxAmount = price * (taxRate / 100);
        return {
          amount: taxAmount,
          formatted: formatPriceUtil(taxAmount, currency),
        };
      },
      calculateTotal: (price: number, taxRate: number) => {
        const total = price * (1 + taxRate / 100);
        return {
          amount: total,
          formatted: formatPriceUtil(total, currency),
        };
      },
      calculateDiscount: (originalPrice: number, discountedPrice: number) => {
        const discount = originalPrice - discountedPrice;
        const percentage = (discount / originalPrice) * 100;
        return {
          amount: discount,
          percentage: Math.round(percentage),
          formatted: formatPriceUtil(discount, currency),
          formattedPercentage: `${Math.round(percentage)}%`,
        };
      },
      calculateSubtotal: (items: Array<{ price: number; quantity: number }>) => {
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        return {
          amount: subtotal,
          formatted: formatPriceUtil(subtotal, currency),
        };
      },
    }),
    [currency, formatPrice]
  );
}

/**
 * Hook for currency info
 */
export function useCurrencyInfo(currency: CurrencyCode) {
  return useMemo(() => {
    const config = getCurrencyConfig(currency);
    return {
      code: config.code,
      symbol: config.symbol,
      name: config.name,
      decimals: config.decimals,
      locale: config.locale,
    };
  }, [currency]);
}

/**
 * Hook for price comparison across currencies
 */
export function usePriceComparison(price: number, baseCurrency: CurrencyCode = "USD") {
  return useMemo(() => {
    const currencies: CurrencyCode[] = ["USD", "EUR", "GBP", "CAD"];
    return currencies.map((currency) => ({
      currency,
      amount: convertPrice(price, baseCurrency, currency),
      formatted: formatPriceUtil(convertPrice(price, baseCurrency, currency), currency),
      symbol: getCurrencySymbol(currency),
    }));
  }, [price, baseCurrency]);
}

/**
 * Hook for formatting price range
 */
export function usePriceRange(currency: CurrencyCode = "USD") {
  return useMemo(
    () => (minPrice: number, maxPrice: number) => {
      const min = formatPriceUtil(minPrice, currency);
      const max = formatPriceUtil(maxPrice, currency);
      return `${min} - ${max}`;
    },
    [currency]
  );
}
