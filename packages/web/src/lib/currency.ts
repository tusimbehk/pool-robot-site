/**
 * Currency Utility Module
 *
 * Handles currency formatting, conversion, and display
 * Supports: USD, EUR, GBP, CAD, and more
 */

export type CurrencyCode = "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "CHF" | "NOK" | "SEK" | "DKK";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  decimals: number;
  rate: number; // Exchange rate relative to USD
  locale: string;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    decimals: 2,
    rate: 1,
    locale: "en-US",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    decimals: 2,
    rate: 0.92,
    locale: "de-DE",
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    decimals: 2,
    rate: 0.79,
    locale: "en-GB",
  },
  CAD: {
    code: "CAD",
    symbol: "C$",
    name: "Canadian Dollar",
    decimals: 2,
    rate: 1.36,
    locale: "en-CA",
  },
  AUD: {
    code: "AUD",
    symbol: "A$",
    name: "Australian Dollar",
    decimals: 2,
    rate: 1.53,
    locale: "en-AU",
  },
  CHF: {
    code: "CHF",
    symbol: "CHF",
    name: "Swiss Franc",
    decimals: 2,
    rate: 0.88,
    locale: "de-CH",
  },
  NOK: {
    code: "NOK",
    symbol: "kr",
    name: "Norwegian Krone",
    decimals: 2,
    rate: 10.65,
    locale: "nb-NO",
  },
  SEK: {
    code: "SEK",
    symbol: "kr",
    name: "Swedish Krona",
    decimals: 2,
    rate: 10.42,
    locale: "sv-SE",
  },
  DKK: {
    code: "DKK",
    symbol: "kr",
    name: "Danish Krone",
    decimals: 2,
    rate: 6.87,
    locale: "da-DK",
  },
};

/**
 * Get currency config by code
 */
export function getCurrencyConfig(code: CurrencyCode): CurrencyConfig {
  return SUPPORTED_CURRENCIES[code] || SUPPORTED_CURRENCIES.USD;
}

/**
 * Format price in a specific currency
 */
export function formatPrice(
  price: number,
  currencyCode: CurrencyCode = "USD",
  locale?: string
): string {
  const config = getCurrencyConfig(currencyCode);
  const formatLocale = locale || config.locale;

  return new Intl.NumberFormat(formatLocale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(price);
}

/**
 * Convert price from one currency to another
 */
export function convertPrice(
  price: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): number {
  const fromConfig = getCurrencyConfig(fromCurrency);
  const toConfig = getCurrencyConfig(toCurrency);

  // Convert to USD first, then to target currency
  const priceInUSD = price / fromConfig.rate;
  return priceInUSD * toConfig.rate;
}

/**
 * Format price with conversion
 */
export function formatConvertedPrice(
  price: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  locale?: string
): string {
  const convertedPrice = convertPrice(price, fromCurrency, toCurrency);
  return formatPrice(convertedPrice, toCurrency, locale);
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(code: CurrencyCode): string {
  return getCurrencyConfig(code).symbol;
}

/**
 * Get currency name
 */
export function getCurrencyName(code: CurrencyCode): string {
  return getCurrencyConfig(code).name;
}

/**
 * Format price range (e.g., "$100 - $500")
 */
export function formatPriceRange(
  minPrice: number,
  maxPrice: number,
  currencyCode: CurrencyCode = "USD",
  locale?: string
): string {
  const min = formatPrice(minPrice, currencyCode, locale);
  const max = formatPrice(maxPrice, currencyCode, locale);
  return `${min} - ${max}`;
}

/**
 * Parse price string to number
 */
export function parsePrice(priceString: string): number {
  // Remove currency symbols and spaces, then parse
  const cleaned = priceString.replace(/[^\d.,-]/g, "");
  const parsed = parseFloat(cleaned.replace(",", "."));
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calculate tax amount
 */
export function calculateTax(
  price: number,
  taxRate: number,
  currencyCode: CurrencyCode = "USD"
): string {
  const taxAmount = price * (taxRate / 100);
  return formatPrice(taxAmount, currencyCode);
}

/**
 * Calculate total with tax
 */
export function calculateTotalWithTax(
  price: number,
  taxRate: number,
  currencyCode: CurrencyCode = "USD"
): string {
  const total = price * (1 + taxRate / 100);
  return formatPrice(total, currencyCode);
}

/**
 * Format discount percentage
 */
export function formatDiscount(
  originalPrice: number,
  discountedPrice: number,
  currencyCode: CurrencyCode = "USD"
): string {
  const discount = originalPrice - discountedPrice;
  const percentage = (discount / originalPrice) * 100;
  const percentValue = Math.round(percentage);
  return `${percentValue}%`;
}

/**
 * Get currency list for selector
 */
export function getCurrencyList(): Array<{
  code: CurrencyCode;
  name: string;
  symbol: string;
}> {
  return Object.values(SUPPORTED_CURRENCIES).map((config) => ({
    code: config.code,
    name: config.name,
    symbol: config.symbol,
  }));
}

/**
 * Detect currency from locale
 */
export function detectCurrencyFromLocale(locale: string): CurrencyCode {
  const localeMap: Record<string, CurrencyCode> = {
    en: "USD",
    de: "EUR",
    fr: "EUR",
    es: "EUR",
    it: "EUR",
    "en-GB": "GBP",
    "en-CA": "CAD",
    "en-AU": "AUD",
    "de-CH": "CHF",
    nb: "NOK",
    sv: "SEK",
    da: "DKK",
  };

  return localeMap[locale] || localeMap[locale.split("-")[0]] || "USD";
}

/**
 * Validate currency code
 */
export function isValidCurrencyCode(code: string): code is CurrencyCode {
  return Object.keys(SUPPORTED_CURRENCIES).includes(code);
}
