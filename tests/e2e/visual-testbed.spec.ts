import { test, expect } from '@playwright/test';

test.describe('Visual QA Testbed (testbed.html)', () => {
  test('boots isolated visual testbed canvas and renders without errors', async ({ page }) => {
    const failedRequests: string[] = [];
    page.on('requestfailed', (req) => failedRequests.push(req.url()));

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('./testbed.html');

    // Wait for the testbed scene to initialize
    await page.waitForFunction(() => (window as unknown as { __TESTBED_READY__?: boolean }).__TESTBED_READY__ === true, {
      timeout: 10_000,
    });

    const canvas = page.locator('#testbed-container canvas');
    await expect(canvas).toBeVisible();

    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(canvasBox!.width).toBeGreaterThanOrEqual(320);
    expect(canvasBox!.height).toBeGreaterThanOrEqual(288);

    // Toggle flashlight overlay and ensure no rendering exceptions
    await page.evaluate(() => {
      const toggle = (window as unknown as { __TESTBED_FLASHLIGHT__?: (v: boolean) => void }).__TESTBED_FLASHLIGHT__;
      if (toggle) toggle(true);
    });

    await page.waitForTimeout(500);

    // Assert zero console errors
    expect(consoleErrors).toHaveLength(0);
  });
});
