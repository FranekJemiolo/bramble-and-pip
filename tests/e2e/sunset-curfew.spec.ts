import { test, expect } from '@playwright/test';

interface MockScene {
  sessionElapsedSeconds: number;
  update: (time: number, delta: number) => void;
}

interface MockGame {
  scene?: {
    getScene: (name: string) => MockScene;
    isActive: (name: string) => boolean;
  };
}

test.describe('Sunset and Curfew Bedtime Lock', () => {
  test('transitions smoothly into sunset at 12m and locks into bedtime at 15m', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('#game-container canvas')).toBeVisible();

    await page.waitForFunction(() => {
      const g = (window as unknown as { __GAME_STATE__?: () => unknown }).__GAME_STATE__;
      return typeof g === 'function';
    });

    // Advance session time to 725 seconds (past 12m sunset trigger)
    const sunsetTriggered = await page.evaluate(() => {
      let sunsetFired = false;
      const bus = (window as unknown as { __EVENT_BUS__?: { on: (ev: string, cb: () => void) => void } }).__EVENT_BUS__;
      bus?.on('sunset:start', () => {
        sunsetFired = true;
      });

      // Fast forward world scene elapsed seconds
      const game = (window as unknown as { __GAME__?: MockGame }).__GAME__;
      const worldScene = game?.scene?.getScene('WorldScene');
      if (worldScene) {
        worldScene.sessionElapsedSeconds = 725;
        worldScene.update(0, 16);
      }
      return sunsetFired;
    });

    expect(sunsetTriggered).toBe(true);

    // Advance session time to 901 seconds (past 15m bedtime limit)
    const bedtimeTriggered = await page.evaluate(() => {
      let bedtimeFired = false;
      const bus = (window as unknown as { __EVENT_BUS__?: { on: (ev: string, cb: () => void) => void } }).__EVENT_BUS__;
      bus?.on('bedtime:lock', () => {
        bedtimeFired = true;
      });

      const game = (window as unknown as { __GAME__?: MockGame }).__GAME__;
      const worldScene = game?.scene?.getScene('WorldScene');
      if (worldScene) {
        worldScene.sessionElapsedSeconds = 901;
        worldScene.update(0, 16);
      }
      return bedtimeFired;
    });

    expect(bedtimeTriggered).toBe(true);

    // Wait for Phaser scene manager to activate BedtimeScene
    const isBedtimeActive = await page.waitForFunction(() => {
      const game = (window as unknown as { __GAME__?: MockGame }).__GAME__;
      return game?.scene?.isActive('BedtimeScene') ?? false;
    });
    expect(isBedtimeActive).toBeTruthy();
  });
});
