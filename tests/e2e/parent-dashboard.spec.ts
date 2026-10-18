import { test, expect } from '@playwright/test';

test.describe('Adult / Parent Dashboard & Parental Gate', () => {
  test('opens gate, verifies word-math challenge, and reveals parent insights', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('#game-container canvas')).toBeVisible();

    // Open Parent Dashboard via global hook or HUD button
    await page.evaluate(() => {
      const openFn = (window as unknown as { __OPEN_PARENT_DASHBOARD__?: () => void }).__OPEN_PARENT_DASHBOARD__;
      if (openFn) openFn();
    });

    const modal = page.locator('#overlay-root .parent-modal-card');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Grown-Ups Area');

    // Submit invalid answer first
    const input = page.locator('#gate-answer');
    await input.fill('99999');
    await page.locator('button[type="submit"]').click();

    const errorMsg = page.locator('#gate-error');
    await expect(errorMsg).toContainText('That answer was not quite right');

    // Read the challenge prompt (e.g. "SEVEN TIMES SIX = ?") and compute the product
    const wordMap: Record<string, number> = {
      ZERO: 0, ONE: 1, TWO: 2, THREE: 3, FOUR: 4,
      FIVE: 5, SIX: 6, SEVEN: 7, EIGHT: 8, NINE: 9,
    };

    const promptText = await page.locator('#overlay-root').innerText();
    const match = promptText.match(/([A-Z]+)\s+TIMES\s+([A-Z]+)/);
    expect(match).not.toBeNull();

    const factorA = wordMap[match![1]]!;
    const factorB = wordMap[match![2]]!;
    const correctProduct = (factorA * factorB).toString();

    await input.fill(correctProduct);
    await page.locator('button[type="submit"]').click();

    // Verify unlocked dashboard
    await expect(modal).toContainText('Junior Ranger Parent Dashboard');
    await expect(modal).toContainText('Session Regulation');
    await expect(modal).toContainText('Nature Conversation Starters');

    // Close dashboard and return to wood
    await page.locator('#dash-done').click();
    await expect(modal).not.toBeVisible();
  });
});
