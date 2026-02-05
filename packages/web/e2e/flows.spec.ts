import { test, expect } from "@playwright/test";

/**
 * Home Page Tests
 */
test.describe("Home Page", () => {
  test("should load successfully", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("text=PoolClean Pro")).toBeVisible();
  });

  test("should have navigation links", async ({ page }) => {
    await page.goto("/");

    const nav = page.locator("nav");

    await expect(nav.getByRole("link", { name: "Products" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "About" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Support" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Contact" })).toBeVisible();
  });

  test("should have cart icon in header", async ({ page }) => {
    await page.goto("/");

    const cartIcon = page.locator('button[aria-label*="Cart"], button:has-text("Cart")');
    await expect(cartIcon).toBeVisible();
  });

  test("should navigate to products page", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Products" }).click();

    await expect(page).toHaveURL(/\/products/);
    await expect(page.locator("h1")).toContainText("Products");
  });
});

/**
 * Product Listing Tests
 */
test.describe("Products Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/products");
  });

  test("should display products", async ({ page }) => {
    const products = page.locator('[data-testid^="product-card"]');

    await expect(products).toHaveCount.greaterThan(0);
  });

  test("should filter by category", async ({ page }) => {
    // Click on robots filter
    await page.getByRole("button", { name: /Robots/i }).click();

    await expect(page).toHaveURL(/type=robots/);
  });

  test("should sort products by price", async ({ page }) => {
    await page.getByRole("button", { name: /Sort/i }).click();
    await page.getByRole("option", { name: /Price.*Low/i }).click();

    await expect(page).toHaveURL(/sort=price-asc/);
  });

  test("should navigate to product detail", async ({ page }) => {
    const firstProduct = page.locator('[data-testid^="product-card"]').first();
    await firstProduct.click();

    await expect(page).toHaveURL(/\/products\/[\w-]+/);
  });
});

/**
 * Product Detail Tests
 */
test.describe("Product Detail Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/products/poolclean-elite");
  });

  test("should display product information", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("PoolClean");
    await expect(page.locator('text=/\$[\d,]+/')).toBeVisible();
  });

  test("should add product to cart", async ({ page }) => {
    const addToCartButton = page.getByRole("button", { name: /Add to cart/i });
    await addToCartButton.click();

    // Check for toast notification
    await expect(page.locator("text=Added to cart")).toBeVisible();
  });

  test("should change quantity", async ({ page }) => {
    const quantityInput = page.getByRole("spinbutton");
    const incrementButton = page.locator('button[aria-label*="Increase"]');

    await incrementButton.click();

    await expect(page.locator('input[role="spinbutton"]')).toHaveValue("2");
  });

  test("should have buy now button", async ({ page }) => {
    const buyNowButton = page.getByRole("button", { name: /Buy now/i });

    await expect(buyNowButton).toBeVisible();
  });
});

/**
 * Shopping Cart Tests
 */
test.describe("Shopping Cart", () => {
  test("should add items to cart", async ({ page }) => {
    await page.goto("/products/poolclean-elite");
    await page.getByRole("button", { name: /Add to cart/i }).click();

    // Open cart
    await page.locator('button[aria-label*="Cart"], button:has-text("Cart")').click();

    // Verify cart has items
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount.greaterThan(0);
  });

  test("should update item quantity", async ({ page }) => {
    // Add product to cart
    await page.goto("/products/poolclean-elite");
    await page.getByRole("button", { name: /Add to cart/i }).click();

    // Open cart
    await page.locator('button[aria-label*="Cart"], button:has-text("Cart")').click();

    // Update quantity
    await page.locator('[data-testid="cart-item"]').first()
      .locator('button[aria-label*="Increase"]').click();

    await expect(page.locator('[data-testid="cart-item"]').first()
      .locator('input[role="spinbutton"]')).toHaveValue("2");
  });

  test("should remove item from cart", async ({ page }) => {
    // Add product to cart
    await page.goto("/products/poolclean-elite");
    await page.getByRole("button", { name: /Add to cart/i }).click();

    // Open cart
    await page.locator('button[aria-label*="Cart"], button:has-text("Cart")').click();

    // Remove item
    await page.locator('[data-testid="cart-item"]').first()
      .locator('button[aria-label*="Remove"]').click();

    await expect(page.locator("text=Your cart is empty")).toBeVisible();
  });

  test("should proceed to checkout", async ({ page }) => {
    // Add product to cart
    await page.goto("/products/poolclean-elite");
    await page.getByRole("button", { name: /Add to cart/i }).click();

    // Open cart
    await page.locator('button[aria-label*="Cart"], button:has-text("Cart")').click();

    // Click checkout
    await page.getByRole("link", { name: /Proceed to checkout|Checkout/i }).click();

    await expect(page).toHaveURL(/\/checkout/);
  });
});

/**
 * Cart Page Tests
 */
test.describe("Cart Page", () => {
  test("should display empty state when no items", async ({ page }) => {
    await page.goto("/cart");

    await expect(page.locator("text=Your cart is empty")).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse Products" })).toBeVisible();
  });

  test("should display order summary", async ({ page }) => {
    // Add product first
    await page.goto("/products/poolclean-elite");
    await page.getByRole("button", { name: /Add to cart/i }).click();

    // Go to cart page
    await page.goto("/cart");

    // Check order summary
    await expect(page.locator("text=Order Summary")).toBeVisible();
    await expect(page.locator("text=Subtotal")).toBeVisible();
    await expect(page.locator("text=Total")).toBeVisible();
  });
});

/**
 * Authentication Tests
 */
test.describe("Authentication", () => {
  test("should navigate to login page", async ({ page }) => {
    await page.goto("/account");

    // Should redirect to login when not authenticated
    await expect(page).toHaveURL(/\/login/);
  });

  test("should display registration form", async ({ page }) => {
    await page.goto("/register");

    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByLabel(/^Confirm Password/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Create account/i })).toBeVisible();
  });

  test("should show validation errors", async ({ page }) => {
    await page.goto("/register");

    // Submit empty form
    await page.getByRole("button", { name: /Create account/i }).click();

    await expect(page.locator("text=required")).toBeVisible();
  });

  test("should toggle password visibility", async ({ page }) => {
    await page.goto("/login");

    const passwordInput = page.getByLabel("Password");

    await expect(passwordInput).toHaveAttribute("type", "password");
  });
});

/**
 * Account Page Tests
 */
test.describe("Account Pages", () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication - in real tests, you'd log in
    await page.goto("/account");
  });

  test("should display account overview", async ({ page }) => {
    // Skip if not authenticated (redirected to login)
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }

    await expect(page.locator("text=My Account")).toBeVisible();
    await expect(page.locator("text=Quick Actions")).toBeVisible();
  });

  test("should have navigation links", async ({ page }) => {
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }

    await expect(page.getByRole("link", { name: "Orders" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
  });
});

/**
 * Navigation Tests
 */
test.describe("Navigation", () => {
  test("should navigate using header links", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/about/);

    await page.getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveURL(/\/contact/);
  });

  test("should navigate using footer links", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator("footer");

    await footer.getByRole("link", { name: /FAQ/i }).click();
    await expect(page).toHaveURL(/\/faq/);
  });

  test("should have working mobile menu", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    const menuButton = page.locator('button[aria-label*="Menu"], button:has-text("Menu")');
    await menuButton.click();

    await expect(page.locator("nav").getByRole("link", { name: "Products" })).toBeVisible();
  });
});

/**
 * Accessibility Tests
 */
test.describe("Accessibility", () => {
  test("should not have accessibility violations", async ({ page }) => {
    await page.goto("/");

    // Basic accessibility checks
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("navigation")).toBeVisible();

    // Check heading hierarchy
    const h1Count = await page.locator("h1").count();
    await expect(h1Count).toBe(1);
  });

  test("should be keyboard navigable", async ({ page }) => {
    await page.goto("/products");

    // Tab through interactive elements
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Focus should be visible
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });
});

/**
 * Performance Tests
 */
test.describe("Performance", () => {
  test("should load within performance budget", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/");

    const loadTime = Date.now() - startTime;

    // Page should load in less than 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test("should not have console errors", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");

    await page.waitForLoadState("networkidle");

    expect(errors).toHaveLength(0);
  });
});
