import { test, expect } from '@playwright/test';

test.describe('Steering and Canvas Scaling', () => {
  test('scales canvas dynamically to fill display height with integer crispness', async ({ page }) => {
    await page.setViewportSize({ width: 1470, height: 837 });
    await page.goto('./');

    const canvas = page.locator('#game-container canvas');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    // Viewport is 837px high. Canvas aspect ratio is 320/288 = 1.111.
    // 837 * (320 / 288) = 930px wide.
    expect(box.height).toBeCloseTo(837, 1);
    expect(box.width).toBeCloseTo(930, 1);
    expect(box.x).toBeCloseTo((1470 - 930) / 2, 1); // Centered horizontally
  });

  test('steers Bramble and animates walk cycle via keyboard WASD and Arrow Keys', async ({ page }) => {
    await page.goto('./');
    await page.waitForSelector('#game-container canvas');
    await page.waitForTimeout(500);

    const getPlayer = () => page.evaluate(() => {
      const g = (window as unknown as { __GAME_STATE__: () => { player: { x: number; y: number; facing: string } } }).__GAME_STATE__();
      return g.player;
    });

    const init = await getPlayer();

    // 1. Arrow Right
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(300);
    const midRight = await page.evaluate(() => {
      const scene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('WorldScene') as unknown as {
        playerSprite: Phaser.GameObjects.Sprite;
        pipSprite: Phaser.GameObjects.Sprite;
      };
      return {
        playerTexture: scene.playerSprite.texture.key,
        pipTexture: scene.pipSprite.texture.key,
      };
    });
    expect(midRight.playerTexture).toContain('ranger_right');
    expect(midRight.pipTexture).toContain('pip_FOLLOWING');

    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(100);

    const afterRight = await getPlayer();
    expect(afterRight.x).toBeGreaterThan(init.x + 10);
    expect(afterRight.facing).toBe('right');

    // 2. WASD Key S (down)
    await page.keyboard.down('KeyS');
    await page.waitForTimeout(300);
    await page.keyboard.up('KeyS');
    await page.waitForTimeout(100);

    const afterDown = await getPlayer();
    expect(afterDown.y).toBeGreaterThan(init.y);
    expect(afterDown.facing).toBe('down');
  });

  test('steers Bramble smoothly with continuous Satchel D-Pad hold and Pip follows', async ({ page }) => {
    await page.goto('./');
    await page.waitForSelector('#game-container canvas');
    await page.waitForTimeout(500);

    const canvas = page.locator('#game-container canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    // D-Pad Right button is at (81, 241) in 320x288 virtual canvas coords
    const scaleX = box.width / 320;
    const scaleY = box.height / 288;
    const dpadRightX = box.x + 81 * scaleX;
    const dpadRightY = box.y + 241 * scaleY;

    const getPos = () => page.evaluate(() => (window as unknown as { __GAME_STATE__: () => { player: { x: number; y: number } } }).__GAME_STATE__().player);
    const initPos = await getPos();

    await page.mouse.move(dpadRightX, dpadRightY);
    await page.mouse.down();
    await page.waitForTimeout(400);

    const holdState = await page.evaluate(() => {
      const scene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('WorldScene') as unknown as {
        playerSprite: Phaser.GameObjects.Sprite;
        pipSprite: Phaser.GameObjects.Sprite;
      };
      return {
        playerTexture: scene.playerSprite.texture.key,
        pipTexture: scene.pipSprite.texture.key,
      };
    });
    expect(holdState.playerTexture).toMatch(/^ranger_right_[0-3]$/);
    expect(holdState.pipTexture).toMatch(/^pip_FOLLOWING_[0-3]$/);

    await page.mouse.up();
    await page.waitForTimeout(200);

    const endPos = await getPos();
    expect(endPos.x).toBeGreaterThan(initPos.x + 15);
  });

  test('navigates along trail with tap-to-move pathfinding on viewport click', async ({ page }) => {
    await page.goto('./');
    await page.waitForSelector('#game-container canvas');
    await page.waitForTimeout(500);

    const canvas = page.locator('#game-container canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    const scaleX = box.width / 320;
    const scaleY = box.height / 288;
    // Click on dirt path in world viewport at (160, 80)
    const trailClickX = box.x + 160 * scaleX;
    const trailClickY = box.y + 80 * scaleY;

    const getPos = () => page.evaluate(() => (window as unknown as { __GAME_STATE__: () => { player: { x: number; y: number } } }).__GAME_STATE__().player);
    const startPos = await getPos();

    await page.mouse.click(trailClickX, trailClickY);
    await page.waitForTimeout(1000);

    const destPos = await getPos();
    expect(destPos.x).toBeGreaterThan(startPos.x + 10);
  });
});
