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
    // Click on open dirt path in world viewport at (205, 80)
    const trailClickX = box.x + 205 * scaleX;
    const trailClickY = box.y + 80 * scaleY;

    const getPos = () => page.evaluate(() => (window as unknown as { __GAME_STATE__: () => { player: { x: number; y: number } } }).__GAME_STATE__().player);
    const startPos = await getPos();

    await page.mouse.click(trailClickX, trailClickY);
    await page.waitForTimeout(1000);

    const destPos = await getPos();
    expect(destPos.x).toBeGreaterThan(startPos.x + 10);
  });

  test('clicking on location sign or dialogue text does NOT move Bramble', async ({ page }) => {
    await page.goto('./');
    await page.waitForSelector('#game-container canvas');
    await page.waitForTimeout(500);

    const canvas = page.locator('#game-container canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    const scaleX = box.width / 320;
    const scaleY = box.height / 288;

    const getPos = () => page.evaluate(() => (window as unknown as { __GAME_STATE__: () => { player: { x: number; y: number } } }).__GAME_STATE__().player);
    const startPos = await getPos();

    // 1. Click on carved location sign in top-left (52, 14)
    const signClickX = box.x + 52 * scaleX;
    const signClickY = box.y + 14 * scaleY;
    await page.mouse.click(signClickX, signClickY);
    await page.waitForTimeout(400);

    // Close the map modal if opened
    const modalCloseBtn = page.locator('#map-close-btn');
    if (await modalCloseBtn.isVisible()) {
      await modalCloseBtn.click();
      await page.waitForTimeout(200);
    }

    const posAfterSign = await getPos();
    expect(posAfterSign.x).toBe(startPos.x);
    expect(posAfterSign.y).toBe(startPos.y);

    // 2. Open dialogue and click on dialogue text area (160, 172)
    await page.evaluate(() => {
      const scene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('WorldScene') as unknown as {
        showDialogue: (txt: string) => void;
      };
      scene.showDialogue('Pip: Hello! Testing text click isolation.');
    });
    await page.waitForTimeout(200);

    const dialogueClickX = box.x + 160 * scaleX;
    const dialogueClickY = box.y + 172 * scaleY;
    await page.mouse.click(dialogueClickX, dialogueClickY);
    await page.waitForTimeout(400);

    const posAfterDialogue = await getPos();
    expect(posAfterDialogue.x).toBe(startPos.x);
    expect(posAfterDialogue.y).toBe(startPos.y);
  });

  test('walks across full 640x384 map: camera scrolls and carved sign updates region dynamically', async ({ page }) => {
    await page.goto('./');
    await page.waitForSelector('#game-container canvas');
    await page.waitForTimeout(500);

    // Inspect sign text before walk
    const getRegionText = () => page.evaluate(() => {
      const scene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('WorldScene') as unknown as {
        locationSignText: Phaser.GameObjects.Text;
      };
      return scene.locationSignText.text;
    });

    const initRegion = await getRegionText();
    expect(initRegion).toBe('THE WHISPERING WOODS');

    // Walk East into The Mossy Gearbox (across x = 320)
    await page.evaluate(() => {
      const scene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('WorldScene') as unknown as {
        playerBody: { x: number; y: number };
      };
      scene.playerBody.x = 400;
      scene.playerBody.y = 80;
    });
    await page.waitForTimeout(300);

    const gearboxRegion = await getRegionText();
    expect(gearboxRegion).toBe('THE MOSSY GEARBOX');

    // Walk South into Pine Ridge
    await page.evaluate(() => {
      const scene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('WorldScene') as unknown as {
        playerBody: { x: number; y: number };
      };
      scene.playerBody.x = 400;
      scene.playerBody.y = 260;
    });
    await page.waitForTimeout(300);

    const ridgeRegion = await getRegionText();
    expect(ridgeRegion).toBe('THE PINE RIDGE');
  });

  test('smooth screen slide transition along connecting road from Whispering Woods into Mossy Gearbox and back', async ({ page }) => {
    await page.goto('./');
    await page.waitForSelector('#game-container canvas');
    await page.waitForTimeout(500);

    const getRegionText = () => page.evaluate(() => {
      const scene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('WorldScene') as unknown as {
        locationSignText: Phaser.GameObjects.Text;
      };
      return scene.locationSignText.text;
    });

    const getPlayerPos = () => page.evaluate(() => {
      const scene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('WorldScene') as unknown as {
        playerBody: { x: number; y: number };
      };
      return { x: scene.playerBody.x, y: scene.playerBody.y };
    });

    expect(await getRegionText()).toBe('THE WHISPERING WOODS');

    // Position player near East exit on the road (x = 295, y = 96)
    await page.evaluate(() => {
      const scene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('WorldScene') as unknown as {
        playerBody: { x: number; y: number; facing: string };
        playerSprite: Phaser.GameObjects.Sprite;
      };
      scene.playerBody.x = 295;
      scene.playerBody.y = 96;
      scene.playerBody.facing = 'right';
      scene.playerSprite.setPosition(295, 96);
    });
    await page.waitForTimeout(100);

    // Step East across the road exit boundary
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(350);
    await page.keyboard.up('ArrowRight');
    // Allow smooth slide transition (400ms tween) to complete
    await page.waitForTimeout(700);

    // Assert smooth transition to Mossy Gearbox completed
    expect(await getRegionText()).toBe('THE MOSSY GEARBOX');
    const posInGearbox = await getPlayerPos();
    // Player entered on the matching West road at x around 16..40, y = 96
    expect(posInGearbox.x).toBeLessThan(60);
    expect(posInGearbox.y).toBeCloseTo(96, -1);

    // Step West back across the road exit boundary
    await page.keyboard.down('ArrowLeft');
    await page.waitForTimeout(400);
    await page.keyboard.up('ArrowLeft');
    await page.waitForTimeout(700);

    // Assert smooth return transition to Whispering Woods
    expect(await getRegionText()).toBe('THE WHISPERING WOODS');
    const posInWoods = await getPlayerPos();
    expect(posInWoods.x).toBeGreaterThan(260);
    expect(posInWoods.y).toBeCloseTo(96, -1);
  });
});
