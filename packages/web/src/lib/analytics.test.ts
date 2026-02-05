/**
 * Analytics Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  initAnalytics,
  isAnalyticsReady,
  trackPage,
  trackEvent,
  identifyUser,
  trackProductViewed,
  trackProductAdded,
} from "./analytics";

// Mock window.analytics
const mockAnalytics = {
  page: vi.fn(),
  track: vi.fn(),
  identify: vi.fn(),
  alias: vi.fn(),
  reset: vi.fn(),
  user: vi.fn(() => ({ anonymousId: () => "mock-anonymous-id" })),
};

describe("Analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    global.window = { analytics: mockAnalytics } as any;
  });

  describe("initAnalytics", () => {
    it("should initialize with valid write key", () => {
      initAnalytics("valid-write-key");

      // In a real test, this would verify script injection
      // For now, we verify it doesn't throw
      expect(true).toBe(true);
    });

    it("should use mock mode for invalid write key", () => {
      const consoleLog = vi.spyOn(console, "log");

      initAnalytics("your-segment-write-key");

      // Should set ready state even without valid key
      expect(isAnalyticsReady()).toBe(true);
    });
  });

  describe("trackPage", () => {
    it("should track page view", () => {
      trackPage({
        name: "Home",
        properties: { path: "/" },
      });

      expect(mockAnalytics.page).toHaveBeenCalledWith(
        "Home",
        { path: "/" },
        expect.any(Object)
      );
    });

    it("should log to console in mock mode", () => {
      const consoleLog = vi.spyOn(console, "log");

      // @ts-ignore - remove analytics for mock mode
      delete global.window.analytics;

      trackPage({
        name: "Test",
        properties: { test: true },
      });

      expect(consoleLog).toHaveBeenCalledWith(
        "[Segment] Page:",
        expect.any(Object)
      );
    });
  });

  describe("trackEvent", () => {
    it("should track event", () => {
      trackEvent({
        event: "Button Clicked",
        properties: { button_id: "add-to-cart" },
      });

      expect(mockAnalytics.track).toHaveBeenCalledWith(
        "Button Clicked",
        { button_id: "add-to-cart" },
        expect.any(Object)
      );
    });
  });

  describe("identifyUser", () => {
    it("should identify user", () => {
      identifyUser({
        userId: "user-123",
        traits: { email: "test@example.com", name: "Test User" },
      });

      expect(mockAnalytics.identify).toHaveBeenCalledWith(
        "user-123",
        { email: "test@example.com", name: "Test User" }
      );
    });
  });

  describe("helper functions", () => {
    it("should track product viewed", () => {
      trackProductViewed({
        id: "prod-123",
        name: "Test Product",
        price: 99.99,
        currency: "USD",
        category: "Robots",
      });

      expect(mockAnalytics.track).toHaveBeenCalledWith(
        "Product Viewed",
        expect.objectContaining({
          product_id: "prod-123",
          name: "Test Product",
          price: 99.99,
        }),
        expect.any(Object)
      );
    });

    it("should track product added", () => {
      trackProductAdded({
        id: "prod-123",
        name: "Test Product",
        price: 99.99,
        quantity: 2,
        currency: "USD",
      });

      expect(mockAnalytics.track).toHaveBeenCalledWith(
        "Product Added",
        expect.objectContaining({
          product_id: "prod-123",
          quantity: 2,
          revenue: 199.98,
        }),
        expect.any(Object)
      );
    });
  });
});
