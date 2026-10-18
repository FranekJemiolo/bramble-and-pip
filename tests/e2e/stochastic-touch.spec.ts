import { test, expect } from '@playwright/test';

test.describe('Stochastic Touch Tolerance (Monte Carlo)', () => {
  test('survives 100 perturbed child touches without fatal state or crash', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await page.goto('./');
    const canvas = page.locator('#game-container canvas');
    await expect(canvas).toBeVisible();

    await page.waitForFunction(() => {
      const g = (window as unknown as { __GAME_STATE__?: () => { player: { x: number } } }).__GAME_STATE__;
      return typeof g === 'function' && g().player.x > 0;
    });

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;

    // Run 100 Monte Carlo stochastic taps with Gaussian perturbation (sigmaX=18, sigmaY=22)
    for (let i = 0; i < 100; i++) {
      // Box-Muller pseudo-random values
      const u1 = Math.max(1e-6, Math.random());
      const u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);

      const tapX = cx + z0 * 18;
      const tapY = cy + z1 * 22;

      await page.mouse.click(tapX, tapY);
      if (i % 20 === 0) {
        await page.waitForTimeout(50);
      }
    }

    // Engine must remain fully operational
    const finalState = await page.evaluate(() => {
      return (window as unknown as { __GAME_STATE__: () => { player: { x: number } } }).__GAME_STATE__();
    });

    expect(finalState).toBeDefined();
    expect(finalState.player.x).toBeGreaterThan(0);
    expect(jsErrors).toHaveLength(0);
  });
});
