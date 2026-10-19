import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = '/Users/franek/.gemini/antigravity-ide/brain/405c7d12-042f-4df5-bc65-b58f3639186e';

test.describe('Screen Transitions, Natural Collisions & Visual Checks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./');
    await page.waitForSelector('#game-container canvas');
    await page.waitForTimeout(600);
  });

  test('walks through entire 6-region overworld with real movement, screen slides, and door fades', async ({ page }) => {
    const getRegionText = () => page.evaluate(() => {
      const scene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('WorldScene') as unknown as {
        locationSignText: Phaser.GameObjects.Text;
      };
      return scene.locationSignText?.text ?? '';
    });

    const getPlayerState = () => page.evaluate(() => {
      const scene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('WorldScene') as unknown as {
        playerBody: { x: number; y: number; facing: string };
        playerSprite: Phaser.GameObjects.Sprite;
        currentMapId: string;
      };
      return {
        x: scene.playerBody.x,
        y: scene.playerBody.y,
        facing: scene.playerBody.facing,
        mapId: scene.currentMapId,
        texture: scene.playerSprite.texture.key,
      };
    });

    // 1. Start at Ranger Cabin
    await page.evaluate(() => {
      (window as unknown as { __LOAD_MAP__: (id: string, spawn?: { x: number; y: number }) => void }).__LOAD_MAP__('ranger_cabin', { x: 152, y: 144 });
    });
    await page.waitForTimeout(400);

    expect(await getRegionText()).toBe('RANGER CABIN & GARDEN');
    const cabinStart = await getPlayerState();
    expect(cabinStart.mapId).toBe('ranger_cabin');

    // 2. Walk south down the cabin corridor through the south exit (x = 144, y = 176..184)
    await page.keyboard.down('ArrowDown');
    await page.waitForTimeout(600);
    await page.keyboard.up('ArrowDown');
    // Allow slide / fade transition to Pebble Creek to complete
    await page.waitForTimeout(900);

    // Assert transition to Pebble Creek succeeded
    expect(await getRegionText()).toBe('PEBBLE CREEK (SPRING)');
    const creekStart = await getPlayerState();
    expect(creekStart.mapId).toBe('pebble_creek');
    // Spawns on northern trail (x around 80, y around 24)
    expect(creekStart.x).toBeCloseTo(80, -1);
    expect(creekStart.y).toBeCloseTo(24, -1);

    // 3. In Pebble Creek: Cross stepping stones at row 2..3 and exit east to Mossy Hollow
    // Position player right before stepping stones crossing on west bank (x = 120, y = 48)
    await page.evaluate(() => {
      const scene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('WorldScene') as unknown as {
        playerBody: { x: number; y: number; facing: string };
        playerSprite: Phaser.GameObjects.Sprite;
      };
      scene.playerBody.x = 120;
      scene.playerBody.y = 48;
      scene.playerSprite.setPosition(120, 48);
    });
    await page.waitForTimeout(200);

    // Walk east across stepping stones into eastern meadow
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(200);

    const midCrossing = await getPlayerState();
    expect(midCrossing.x).toBeGreaterThan(130);

    // Position player near eastern border road (x = 296, y = 104)
    await page.evaluate(() => {
      const scene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('WorldScene') as unknown as {
        playerBody: { x: number; y: number; facing: string };
        playerSprite: Phaser.GameObjects.Sprite;
      };
      scene.playerBody.x = 296;
      scene.playerBody.y = 104;
      scene.playerSprite.setPosition(296, 104);
    });
    await page.waitForTimeout(200);

    // Step east into Mossy Hollow
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(400);
    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(900);

    expect(await getRegionText()).toBe('MOSSY HOLLOW');
    const hollowStart = await getPlayerState();
    expect(hollowStart.mapId).toBe('mossy_hollow');
    expect(hollowStart.x).toBeLessThan(60);

    // 4. In Mossy Hollow: Walk through clearing and exit east into Sunset Meadow
    await page.evaluate(() => {
      const scene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('WorldScene') as unknown as {
        playerBody: { x: number; y: number; facing: string };
        playerSprite: Phaser.GameObjects.Sprite;
      };
      scene.playerBody.x = 296;
      scene.playerBody.y = 104;
      scene.playerSprite.setPosition(296, 104);
    });
    await page.waitForTimeout(200);

    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(400);
    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(900);

    expect(await getRegionText()).toBe('SUNSET MEADOW (AUTUMN)');
    const meadowStart = await getPlayerState();
    expect(meadowStart.mapId).toBe('sunset_meadow');
    expect(meadowStart.x).toBeLessThan(60);

    // 5. In Sunset Meadow: Walk along golden leaf trail and exit east into Pine Ridge
    await page.evaluate(() => {
      const scene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('WorldScene') as unknown as {
        playerBody: { x: number; y: number; facing: string };
        playerSprite: Phaser.GameObjects.Sprite;
      };
      scene.playerBody.x = 296;
      scene.playerBody.y = 104;
      scene.playerSprite.setPosition(296, 104);
    });
    await page.waitForTimeout(200);

    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(400);
    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(900);

    expect(await getRegionText()).toBe('THE PINE RIDGE');
    const pineStart = await getPlayerState();
    expect(pineStart.mapId).toBe('pine_ridge');
    expect(pineStart.x).toBeLessThan(60);

    // 6. In Pine Ridge: Walk along snowy footprint path and exit east into The Ranger Lodge
    await page.evaluate(() => {
      const scene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('WorldScene') as unknown as {
        playerBody: { x: number; y: number; facing: string };
        playerSprite: Phaser.GameObjects.Sprite;
      };
      scene.playerBody.x = 296;
      scene.playerBody.y = 104;
      scene.playerSprite.setPosition(296, 104);
    });
    await page.waitForTimeout(200);

    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(400);
    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(900);

    expect(await getRegionText()).toBe('THE RANGER LODGE');
    const lodgeStart = await getPlayerState();
    expect(lodgeStart.mapId).toBe('ranger_lodge');
    expect(lodgeStart.x).toBeLessThan(60);

    // 7. In Ranger Lodge: Walk onto porch and step through the open door back into Ranger Cabin
    await page.evaluate(() => {
      const scene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('WorldScene') as unknown as {
        playerBody: { x: number; y: number; facing: string };
        playerSprite: Phaser.GameObjects.Sprite;
      };
      scene.playerBody.x = 250;
      scene.playerBody.y = 104;
      scene.playerSprite.setPosition(250, 104);
    });
    await page.waitForTimeout(200);

    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(400);
    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(900);

    // Returned to safe Ranger Cabin!
    expect(await getRegionText()).toBe('RANGER CABIN & GARDEN');
    const fullCircle = await getPlayerState();
    expect(fullCircle.mapId).toBe('ranger_cabin');
  });

  test('validates natural collision barriers correctly block deep river, watermill, and roof', async ({ page }) => {
    const getPos = () => page.evaluate(() => {
      const scene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('WorldScene') as unknown as {
        playerBody: { x: number; y: number };
      };
      return { x: scene.playerBody.x, y: scene.playerBody.y };
    });

    // 1. Pebble Creek River Collision Barrier:
    // At row 6 (y = 96..104), cols 5..9 are deep river water (solid '#').
    // Position player on west bank at x = 70, y = 104.
    await page.evaluate(() => {
      (window as unknown as { __LOAD_MAP__: (id: string, spawn?: { x: number; y: number }) => void }).__LOAD_MAP__('pebble_creek', { x: 70, y: 104 });
    });
    await page.waitForTimeout(300);

    const creekBefore = await getPos();
    expect(creekBefore.x).toBe(70);

    // Try to walk East straight into the river
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(400);
    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(100);

    const creekAfter = await getPos();
    // Tile 5 starts at 5 * 16 = 80px. Player feet box with halfW=5 collides at x = 75.
    // The river barrier MUST stop the player before x reaches 76!
    expect(creekAfter.x).toBeLessThanOrEqual(76);

    // 2. Mossy Hollow Waterwheel Collision Barrier:
    // Rows 2..5, cols 4..9 are waterwheel machinery (solid '#').
    // Position player at x = 100, y = 102 (row 6 clearing).
    await page.evaluate(() => {
      (window as unknown as { __LOAD_MAP__: (id: string, spawn?: { x: number; y: number }) => void }).__LOAD_MAP__('mossy_hollow', { x: 100, y: 102 });
    });
    await page.waitForTimeout(300);

    // Try to walk North into the watermill machinery
    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(400);
    await page.keyboard.up('ArrowUp');
    await page.waitForTimeout(100);

    const hollowAfter = await getPos();
    // Row 5 bottom edge is 6 * 16 = 96px. Feet box with halfH=3 collides at y = 99.
    // The waterwheel frame MUST stop the player before y reaches 98!
    expect(hollowAfter.y).toBeGreaterThanOrEqual(98);

    // 3. Ranger Lodge Roof Collision Barrier:
    // Rows 0..4, cols 11..19 are cedar lodge roof (solid '#').
    // Position player on porch below roof at x = 224, y = 88.
    await page.evaluate(() => {
      (window as unknown as { __LOAD_MAP__: (id: string, spawn?: { x: number; y: number }) => void }).__LOAD_MAP__('ranger_lodge', { x: 224, y: 88 });
    });
    await page.waitForTimeout(300);

    // Try to walk North into the roof
    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(400);
    await page.keyboard.up('ArrowUp');
    await page.waitForTimeout(100);

    const lodgeAfter = await getPos();
    // Row 4 bottom edge is 5 * 16 = 80px. The roof edge MUST stop the player before y reaches 82!
    expect(lodgeAfter.y).toBeGreaterThanOrEqual(82);
  });

  test('toggles in-game visual collision overlay with C key and captures visual check screenshots', async ({ page }) => {
    const canvas = page.locator('#game-container canvas');
    await expect(canvas).toBeVisible();

    // Verify debug overlay is initially hidden
    const initialVisible = await page.evaluate(() => {
      return (window as unknown as { __IS_COLLISION_DEBUG_VISIBLE__: () => boolean }).__IS_COLLISION_DEBUG_VISIBLE__();
    });
    expect(initialVisible).toBe(false);

    // Press 'C' key to toggle collision debug overlay
    await page.keyboard.press('KeyC');
    await page.waitForTimeout(200);

    const toggledVisible = await page.evaluate(() => {
      return (window as unknown as { __IS_COLLISION_DEBUG_VISIBLE__: () => boolean }).__IS_COLLISION_DEBUG_VISIBLE__();
    });
    expect(toggledVisible).toBe(true);

    const maps = [
      { id: 'ranger_cabin', filename: 'cabin_visual_check.png', name: 'Ranger Cabin & Backyard' },
      { id: 'pebble_creek', filename: 'pebble_creek_stepping_stones_visual_check.png', name: 'Pebble Creek Stepping Stones' },
      { id: 'mossy_hollow', filename: 'mossy_hollow_waterwheel_visual_check.png', name: 'Mossy Hollow Watermill' },
      { id: 'sunset_meadow', filename: 'sunset_meadow_trail_visual_check.png', name: 'Sunset Meadow Trail' },
      { id: 'pine_ridge', filename: 'pine_ridge_snow_visual_check.png', name: 'Pine Ridge Alpine Snow' },
      { id: 'ranger_lodge', filename: 'ranger_lodge_celebration_visual_check.png', name: 'Ranger Lodge Campfire' },
    ];

    const outDir = path.resolve('public/assets/visual_checks');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    for (const m of maps) {
      await page.evaluate((mapId) => {
        (window as unknown as { __LOAD_MAP__: (id: string) => void }).__LOAD_MAP__(mapId);
      }, m.id);
      await page.waitForTimeout(300);

      const localPath = path.join(outDir, m.filename);
      const artifactPath = path.join(ARTIFACT_DIR, m.filename);

      const buffer = await canvas.screenshot();
      fs.writeFileSync(localPath, buffer);
      fs.writeFileSync(artifactPath, buffer);
      expect(fs.existsSync(localPath)).toBe(true);
      expect(fs.statSync(localPath).size).toBeGreaterThan(1000);
    }

    // Toggle off with 'C' key
    await page.keyboard.press('KeyC');
    await page.waitForTimeout(200);
    const toggledOff = await page.evaluate(() => {
      return (window as unknown as { __IS_COLLISION_DEBUG_VISIBLE__: () => boolean }).__IS_COLLISION_DEBUG_VISIBLE__();
    });
    expect(toggledOff).toBe(false);
  });
});
