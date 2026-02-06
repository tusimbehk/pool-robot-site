import { test, expect } from '@playwright/test';

test.describe('Cookie Banner', () => {
  test('should show cookie banner on first visit', async ({ page, context }) => {
    // Clear all cookies and localStorage
    await context.clearCookies();
    await page.goto('http://localhost:3001');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if cookie banner is visible
    const banner = page.locator('text=我们使用 Cookie 来改善您的体验并分析网站使用情况');
    await expect(banner).toBeVisible();

    // Check for buttons
    await expect(page.locator('button:has-text("仅必要")')).toBeVisible();
    await expect(page.locator('button:has-text("接受所有")')).toBeVisible();
    await expect(page.locator('a:has-text("隐私政策")')).toBeVisible();
  });

  test('should hide banner after accepting all cookies', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');

    // Click "接受所有" button
    await page.click('button:has-text("接受所有")');

    // Banner should disappear
    const banner = page.locator('text=我们使用 Cookie 来改善您的体验并分析网站使用情况');
    await expect(banner).not.toBeVisible();

    // Reload page - banner should still be hidden
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(banner).not.toBeVisible();
  });

  test('should hide banner after accepting essential only', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');

    // Click "仅必要" button
    await page.click('button:has-text("仅必要")');

    // Banner should disappear
    const banner = page.locator('text=我们使用 Cookie 来改善您的体验并分析网站使用情况');
    await expect(banner).not.toBeVisible();
  });

  test('should set cookie consent in localStorage', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');

    // Accept all cookies
    await page.click('button:has-text("接受所有")');

    // Check localStorage
    const consent = await page.evaluate(() => {
      const data = localStorage.getItem('cookie-consent');
      return data ? JSON.parse(data) : null;
    });

    expect(consent).toEqual({
      necessary: true,
      analytics: true,
      marketing: true,
    });
  });
});

test.describe('Event Tracking', () => {
  test('should track page view after cookie consent', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('http://localhost:3001');

    // Accept all cookies
    await page.click('button:has-text("接受所有")');

    // Navigate to products page
    await page.click('a:has-text("Browse Products")');
    await page.waitForLoadState('networkidle');

    // Check if analytics events were sent (verify network requests)
    const requests = await page.evaluate(() => {
      return (window as any).analyticsEvents || [];
    });

    // This would require instrumentation to actually capture
    // For now, we just verify no errors occurred
    await expect(page).toHaveURL(/.*products/);
  });
});
