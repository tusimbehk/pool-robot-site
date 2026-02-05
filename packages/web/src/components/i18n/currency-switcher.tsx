/**
 * Currency Switcher Component
 *
 * Allows users to select their preferred currency
 */

"use client";

import { useState, useEffect, createContext, useContext } from "react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import { CurrencyCode, formatPrice, SUPPORTED_CURRENCIES, getCurrencyList } from "@/lib/currency";

const CURRENCY_STORAGE_KEY = "preferred_currency";
const DEFAULT_CURRENCY: CurrencyCode = "USD";

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  formatPrice: (price: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

/**
 * Get saved currency preference
 */
function getSavedCurrency(): CurrencyCode {
  if (typeof window === "undefined") return DEFAULT_CURRENCY;

  try {
    const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (saved && isValidCurrency(saved)) {
      return saved as CurrencyCode;
    }
  } catch {
    // Ignore storage errors
  }

  return DEFAULT_CURRENCY;
}

/**
 * Validate currency code
 */
function isValidCurrency(code: string): boolean {
  return Object.keys(SUPPORTED_CURRENCIES).includes(code);
}

/**
 * Save currency preference
 */
function saveCurrency(currency: CurrencyCode): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Currency Provider Props
 */
interface CurrencyProviderProps {
  children: React.ReactNode;
  defaultCurrency?: CurrencyCode;
}

/**
 * Currency Provider Component
 */
export function CurrencyProvider({ children, defaultCurrency = DEFAULT_CURRENCY }: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(defaultCurrency);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrencyState(getSavedCurrency());
  }, []);

  const setCurrency = (newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    saveCurrency(newCurrency);
  };

  const formatPriceWithCurrency = (price: number): string => {
    return formatPrice(price, currency);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, formatPrice: formatPriceWithCurrency }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

/**
 * Hook to use currency context
 */
export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}

/**
 * Currency Switcher Component
 */
export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();
  const currencies = getCurrencyList();

  const currentCurrency = SUPPORTED_CURRENCIES[currency];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 min-w-[100px] justify-start">
          <span className="font-medium">{currentCurrency.symbol}</span>
          <span className="hidden sm:inline">{currency}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {currencies.map((curr) => (
          <DropdownMenuItem
            key={curr.code}
            onClick={() => setCurrency(curr.code)}
            className="flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <span className="font-medium">{curr.symbol}</span>
              <span>{curr.code}</span>
            </span>
            {currency === curr.code && (
              <span className="text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Display price in current currency
 */
interface PriceDisplayProps {
  amount: number;
  originalCurrency?: CurrencyCode;
  className?: string;
}

export function PriceDisplay({ amount, originalCurrency, className }: PriceDisplayProps) {
  const { currency, formatPrice } = useCurrency();

  // Convert price if original currency is different
  let displayAmount = amount;
  if (originalCurrency && originalCurrency !== currency) {
    const { convertPrice } = require("@/lib/currency");
    displayAmount = convertPrice(amount, originalCurrency, currency);
  }

  return (
    <span className={className}>
      {formatPrice(displayAmount)}
    </span>
  );
}

/**
 * Currency badge showing price in multiple currencies
 */
interface CurrencyBadgeProps {
  amount: number;
  baseCurrency?: CurrencyCode;
}

export function CurrencyBadge({ amount, baseCurrency = "USD" }: CurrencyBadgeProps) {
  const { currency } = useCurrency();
  const currencies = getCurrencyList().slice(0, 3); // Show first 3 currencies

  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {currencies.map((curr) => (
        <span
          key={curr.code}
          className={`px-2 py-1 rounded ${
            curr.code === currency
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {formatPrice(
            curr.code === baseCurrency
              ? amount
              : convertPrice(amount, baseCurrency, curr.code),
            curr.code
          )}
        </span>
      ))}
    </div>
  );
}

// Import convertPrice function
function convertPrice(price: number, from: CurrencyCode, to: CurrencyCode): number {
  const { convertPrice: cp } = require("@/lib/currency");
  return cp(price, from, to);
}
