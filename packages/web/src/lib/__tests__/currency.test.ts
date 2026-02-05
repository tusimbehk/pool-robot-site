/**
 * Currency Utility Tests
 */

import {
  formatPrice,
  convertPrice,
  formatConvertedPrice,
  getCurrencyConfig,
  getCurrencySymbol,
  getCurrencyName,
  formatPriceRange,
  calculateTax,
  calculateTotalWithTax,
  formatDiscount,
  getCurrencyList,
  detectCurrencyFromLocale,
  isValidCurrencyCode,
  SUPPORTED_CURRENCIES,
  type CurrencyCode,
} from "../currency";

describe("Currency Utilities", () => {
  describe("getCurrencyConfig", () => {
    it("should return USD config by default", () => {
      const config = getCurrencyConfig("USD");
      expect(config.code).toBe("USD");
      expect(config.symbol).toBe("$");
      expect(config.name).toBe("US Dollar");
    });

    it("should return EUR config", () => {
      const config = getCurrencyConfig("EUR");
      expect(config.code).toBe("EUR");
      expect(config.symbol).toBe("€");
    });

    it("should return default config for invalid code", () => {
      const config = getCurrencyConfig("INVALID" as CurrencyCode);
      expect(config.code).toBe("USD");
    });
  });

  describe("formatPrice", () => {
    it("should format USD price", () => {
      expect(formatPrice(100, "USD")).toBe("$100.00");
      expect(formatPrice(99.99, "USD")).toBe("$99.99");
    });

    it("should format EUR price", () => {
      expect(formatPrice(100, "EUR")).toMatch(/100/);
      expect(formatPrice(99.99, "EUR")).toMatch(/99/);
    });

    it("should format GBP price", () => {
      expect(formatPrice(50, "GBP")).toMatch(/50/);
    });

    it("should format with locale", () => {
      const formatted = formatPrice(1000, "USD", "de-DE");
      expect(formatted).toBeDefined();
    });
  });

  describe("convertPrice", () => {
    it("should convert USD to EUR", () => {
      const converted = convertPrice(100, "USD", "EUR");
      expect(converted).toBeGreaterThan(90);
      expect(converted).toBeLessThan(95);
    });

    it("should convert USD to GBP", () => {
      const converted = convertPrice(100, "USD", "GBP");
      expect(converted).toBeGreaterThan(75);
      expect(converted).toBeLessThan(85);
    });

    it("should handle same currency", () => {
      expect(convertPrice(100, "USD", "USD")).toBe(100);
    });
  });

  describe("formatConvertedPrice", () => {
    it("should format converted price", () => {
      const formatted = formatConvertedPrice(100, "USD", "EUR");
      expect(formatted).toBeDefined();
      expect(formatted).toMatch(/[€€]/);
    });
  });

  describe("getCurrencySymbol", () => {
    it("should return correct symbols", () => {
      expect(getCurrencySymbol("USD")).toBe("$");
      expect(getCurrencySymbol("EUR")).toBe("€");
      expect(getCurrencySymbol("GBP")).toBe("£");
      expect(getCurrencySymbol("CAD")).toBe("C$");
    });
  });

  describe("getCurrencyName", () => {
    it("should return correct names", () => {
      expect(getCurrencyName("USD")).toBe("US Dollar");
      expect(getCurrencyName("EUR")).toBe("Euro");
      expect(getCurrencyName("GBP")).toBe("British Pound");
    });
  });

  describe("formatPriceRange", () => {
    it("should format price range", () => {
      const range = formatPriceRange(100, 500, "USD");
      expect(range).toContain("$100");
      expect(range).toContain("$500");
      expect(range).toContain("-");
    });
  });

  describe("calculateTax", () => {
    it("should calculate tax amount", () => {
      const tax = calculateTax(100, 20, "USD");
      expect(tax).toContain("20");
    });

    it("should calculate 10% tax", () => {
      const tax = calculateTax(50, 10, "USD");
      expect(tax).toContain("5");
    });
  });

  describe("calculateTotalWithTax", () => {
    it("should calculate total with tax", () => {
      const total = calculateTotalWithTax(100, 20, "USD");
      expect(total).toContain("120");
    });

    it("should handle 0% tax", () => {
      const total = calculateTotalWithTax(100, 0, "USD");
      expect(total).toContain("100");
    });
  });

  describe("formatDiscount", () => {
    it("should calculate discount percentage", () => {
      const discount = formatDiscount(100, 80, "USD");
      expect(discount).toBe("20%");
    });

    it("should calculate 50% discount", () => {
      const discount = formatDiscount(100, 50, "USD");
      expect(discount).toBe("50%");
    });
  });

  describe("getCurrencyList", () => {
    it("should return all currencies", () => {
      const list = getCurrencyList();
      expect(list.length).toBe(Object.keys(SUPPORTED_CURRENCIES).length);
      expect(list[0]).toHaveProperty("code");
      expect(list[0]).toHaveProperty("name");
      expect(list[0]).toHaveProperty("symbol");
    });
  });

  describe("detectCurrencyFromLocale", () => {
    it("should detect USD from English locale", () => {
      expect(detectCurrencyFromLocale("en")).toBe("USD");
      expect(detectCurrencyFromLocale("en-US")).toBe("USD");
    });

    it("should detect EUR from European locales", () => {
      expect(detectCurrencyFromLocale("de")).toBe("EUR");
      expect(detectCurrencyFromLocale("fr")).toBe("EUR");
      expect(detectCurrencyFromLocale("es")).toBe("EUR");
    });

    it("should detect GBP from UK locale", () => {
      expect(detectCurrencyFromLocale("en-GB")).toBe("GBP");
    });

    it("should default to USD for unknown locale", () => {
      expect(detectCurrencyFromLocale("unknown")).toBe("USD");
    });
  });

  describe("isValidCurrencyCode", () => {
    it("should validate currency codes", () => {
      expect(isValidCurrencyCode("USD")).toBe(true);
      expect(isValidCurrencyCode("EUR")).toBe(true);
      expect(isValidCurrencyCode("GBP")).toBe(true);
      expect(isValidCurrencyCode("INVALID")).toBe(false);
      expect(isValidCurrencyCode("")).toBe(false);
    });
  });
});
