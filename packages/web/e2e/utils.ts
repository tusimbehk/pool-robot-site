/**
 * E2E Test Utilities
 *
 * Helper functions and test data for E2E tests
 */

/**
 * Test user credentials
 */
export const testUsers = {
  valid: {
    email: "test@example.com",
    password: "Test1234!",
    name: "Test User",
  },
  invalid: {
    email: "invalid@example.com",
    password: "WrongPassword123!",
  },
};

/**
 * Test products
 */
export const testProducts = {
  elite: {
    slug: "poolclean-elite",
    name: "PoolClean Elite X1",
    price: "1299",
  },
  essential: {
    slug: "poolclean-essential",
    name: "PoolClean Essential E1",
    price: "449",
  },
};

/**
 * Navigation URLs
 */
export const urls = {
  home: "/",
  products: "/products",
  cart: "/cart",
  checkout: "/checkout",
  login: "/login",
  register: "/register",
  account: "/account",
  orders: "/account/orders",
  about: "/about",
  contact: "/contact",
  faq: "/faq",
  support: "/support",
};

/**
 * Selectors
 */
export const selectors = {
  // Header
  header: "header",
  logo: '[alt="PoolClean Pro"]',
  cartIcon: '[aria-label*="Cart"], button:has-text("Cart")',
  mobileMenuButton: '[aria-label*="Menu"], button:has-text("Menu")',

  // Product
  productCard: "[data-testid^='product-card']",
  addToCartButton: 'button:has-text("Add to cart")',
  buyNowButton: 'button:has-text("Buy now")',

  // Cart
  cartItem: "[data-testid='cart-item']",
  cartCount: "[data-testid='cart-count']",

  // Auth
  loginForm: "#login-form",
  registerForm: "#register-form",
  emailInput: "input[name='email'], input[type='email']",
  passwordInput: "input[name='password'], input[type='password']",

  // Account
  accountOverview: "[data-testid='account-overview']",
  orderCard: "[data-testid='order-card']",

  // General
  loadingSpinner: "[data-testid='loading'], [role='status']",
  toast: "[data-testid='toast']",
};

/**
 * Custom actions
 */

/**
 * Login as test user
 */
export async function loginAsTestUser(page: any) {
  await page.goto("/login");

  await page.fill(selectors.emailInput, testUsers.valid.email);
  await page.fill(selectors.passwordInput, testUsers.valid.password);
  await page.click('button[type="submit"]');

  await page.waitForURL("/account");
}

/**
 * Add product to cart
 */
export async function addToCart(page: any, productSlug: string) {
  await page.goto(`/products/${productSlug}`);
  await page.click(selectors.addToCartButton);

  // Wait for toast
  await page.waitForSelector(selectors.toast, { state: "visible", timeout: 5000 });
}

/**
 * Open cart drawer
 */
export async function openCart(page: any) {
  await page.click(selectors.cartIcon);
  await page.waitForSelector('[role="dialog"]', { state: "visible" });
}

/**
 * Get cart item count
 */
export async function getCartCount(page: any): Promise<number> {
  const countElement = await page.locator(selectors.cartCount);
  const text = await countElement.textContent();
  return parseInt(text || "0", 10);
}

/**
 * Wait for page to be stable
 */
export async function waitForPageStable(page: any) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500); // Extra wait for animations
}

/**
 * Take screenshot on failure
 */
export async function screenshotOnFailure(page: any, testName: string) {
  await page.screenshot({
    path: `test-results/screenshots/${testName}-failure.png`,
    fullPage: true,
  });
}
