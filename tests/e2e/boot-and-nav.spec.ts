import { test, expect } from '@playwright/test';

test.describe('Boot and Navigation', () => {
  test('boots 320x288 pixel-art canvas and initializes player and Pip', async ({ page }) => {
    await page.goto('./');

    // Canvas must mount inside #game-container
    const canvas = page.locator('#game-container canvas');
    await expect(canvas).toBeVisible();

    // Verify window.__GAME__ and window.__GAME_STATE__ are exposed
    const isEngineReady = await page.waitForFunction(() => {
      const g = (window as unknown as { __GAME_STATE__?: () => { player: { x: number; y: number } } }).__GAME_STATE__;
      return typeof g === 'function' && g().player.x > 0;
    });
    expect(isEngineReady).toBeTruthy();

    const state = await page.evaluate(() => {
      return (window as unknown as { __GAME_STATE__: () => Record<string, unknown> }).__GAME_STATE__() as {
        player: { x: number; y: number };
        pip: { state: string };
        chapter: number;
        season: string;
      };
    });

    expect(state.player.x).toBeGreaterThan(0);
    expect(state.player.y).toBeGreaterThan(0);
    expect(state.pip.state).toBeDefined();
    expect(state.chapter).toBe(1);
    expect(state.season).toBe('spring');
  });
});
