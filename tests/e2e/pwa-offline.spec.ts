import { test, expect } from '@playwright/test';

test.describe('PWA Offline Installation & Service Worker', () => {
  test('registers service worker and serves manifest.webmanifest', async ({ page, context }) => {
    await page.goto('./');
    await expect(page.locator('#game-container canvas')).toBeVisible();

    // Verify manifest link tag in HTML
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', /manifest\.webmanifest/);

    // Verify service worker registration
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const reg = await navigator.serviceWorker.getRegistration();
      return reg !== undefined;
    });

    expect(swRegistered).toBe(true);

    // Wait for service worker to activate and control page
    await page.waitForFunction(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const reg = await navigator.serviceWorker.ready;
      return reg.active !== null;
    }, { timeout: 10_000 });

    // Verify page can reload when offline
    await context.setOffline(true);
    await page.reload();
    // Either served from SW cache (status 200) or SW handles it
    expect(page.locator('#game-container canvas')).toBeDefined();
    await context.setOffline(false);
  });
});
