/**
 * Utils tests - Following TDD principles
 */

import { describe, it, expect } from "vitest";
import { cn, formatCurrency, formatDate, truncate, slugify } from "./utils";

describe("cn (utility function)", () => {
  it("should merge class names correctly", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("should handle conflicting classes", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
  });

  it("should handle empty input", () => {
    expect(cn()).toBe("");
  });

  it("should handle conditional classes", () => {
    expect(cn("base-class", false && "hidden", "visible")).toBe("base-class visible");
  });
});

describe("formatCurrency", () => {
  it("should format USD currency", () => {
    expect(formatCurrency(1234.56, "USD", "en-US")).toBe("$1,234.56");
  });

  it("should format EUR currency", () => {
    expect(formatCurrency(1234.56, "EUR", "de-DE")).toBe("1.234,56 €");
  });

  it("should handle zero amount", () => {
    expect(formatCurrency(0, "USD", "en-US")).toBe("$0.00");
  });

  it("should use default currency if not specified", () => {
    expect(formatCurrency(100)).toBe("$100.00");
  });
});

describe("formatDate", () => {
  const testDate = new Date("2024-06-15T12:00:00Z");

  it("should format date in US locale", () => {
    expect(formatDate(testDate, "en-US")).toContain("2024");
  });

  it("should format date in German locale", () => {
    expect(formatDate(testDate, "de-DE")).toContain("2024");
  });

  it("should handle string date input", () => {
    expect(formatDate("2024-06-15", "en-US")).toContain("2024");
  });

  it("should accept custom format options", () => {
    const result = formatDate(testDate, "en-US", { year: "numeric", month: "long" });
    expect(result).toBe("June 2024");
  });
});

describe("truncate", () => {
  it("should truncate text longer than max length", () => {
    expect(truncate("Hello world", 5)).toBe("Hello...");
  });

  it("should not truncate text shorter than max length", () => {
    expect(truncate("Hi", 5)).toBe("Hi");
  });

  it("should handle exact length match", () => {
    expect(truncate("Hello", 5)).toBe("Hello");
  });

  it("should handle empty string", () => {
    expect(truncate("", 5)).toBe("");
  });
});

describe("slugify", () => {
  it("should convert to lowercase", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("should remove special characters", () => {
    expect(slugify("Hello @#$% World!")).toBe("hello-world");
  });

  it("should replace spaces with hyphens", () => {
    expect(slugify("hello   world   test")).toBe("hello-world-test");
  });

  it("should remove leading/trailing hyphens", () => {
    expect(slugify("  hello world  ")).toBe("hello-world");
  });

  it("should collapse multiple hyphens", () => {
    expect(slugify("hello---world")).toBe("hello-world");
  });
});
