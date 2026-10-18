import { test, expect } from '@playwright/test';

test.describe('Zero Egress Runtime Invariant', () => {
  test('asserts zero non-same-origin network requests during full session', async ({ page }) => {
    const externalRequests: string[] = [];

    // Intercept all network traffic
    await page.route('**/*', (route) => {
      const url = route.request().url();
      // Only local preview origin is allowed (http://localhost:4173)
      if (!url.startsWith('http://localhost:4173/')) {
        externalRequests.push(url);
        route.abort('blockedbyclient');
      } else {
        route.continue();
      }
    });

    await page.goto('./');
    await expect(page.locator('#game-container canvas')).toBeVisible();

    // Interact with game
    await page.waitForTimeout(1000);
    await page.mouse.click(200, 200);
    await page.waitForTimeout(500);

    // Verify zero external requests occurred
    expect(externalRequests).toHaveLength(0);
  });
});
