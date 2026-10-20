import { test, expect } from '@playwright/test';

test.describe('Campaign Progression & Seasonal Milestone Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./');
    await page.waitForSelector('#game-container canvas');
    await page.waitForTimeout(600);
  });

  test('walks through milestone progression across all four seasons and completes campaign', async ({ page }) => {
    const getGameState = () => page.evaluate(() => {
      return (window as unknown as { __GAME_STATE__: () => { chapter: number; season: string; satchelCount: number } }).__GAME_STATE__();
    });

    const getDialogueText = () => page.evaluate(() => {
      const scene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('WorldScene') as unknown as {
        dialogueText?: Phaser.GameObjects.Text;
      };
      return scene.dialogueText?.text ?? '';
    });

    // 1. Spring (Chapter 1) - Wake Pip & Light Lantern in Ranger Cabin
    await page.evaluate(() => {
      (window as unknown as { __SET_CHAPTER__: (id: number) => void }).__SET_CHAPTER__(1);
      (window as unknown as { __LOAD_MAP__: (id: string, spawn?: { x: number; y: number }) => void }).__LOAD_MAP__('ranger_cabin', { x: 125, y: 55 });
    });
    await page.waitForTimeout(300);

    const initStage = await getGameState();
    expect(initStage.chapter).toBe(1);
    expect(initStage.season).toBe('spring');

    // Tap the hearth hotspot to wake Pip and light the lantern
    await page.evaluate(() => {
      (window as unknown as { __TRIGGER_HOTSPOT__: (id: string) => boolean }).__TRIGGER_HOTSPOT__('fireplace');
    });
    await page.waitForTimeout(400);

    const dialogueAfterCh1 = await getDialogueText();
    expect(dialogueAfterCh1).toContain('brass lantern');
    const ch2Stage = await getGameState();
    expect(ch2Stage.chapter).toBe(2);

    // 2. Spring (Chapter 3) - Stepping Stones Subitizing in Pebble Creek
    await page.evaluate(() => {
      (window as unknown as { __SET_CHAPTER__: (id: number) => void }).__SET_CHAPTER__(3);
      (window as unknown as { __LOAD_MAP__: (id: string, spawn?: { x: number; y: number }) => void }).__LOAD_MAP__('pebble_creek', { x: 160, y: 55 });
    });
    await page.waitForTimeout(300);

    const ch3Stage = await getGameState();
    expect(ch3Stage.chapter).toBe(3);

    // Tap stepping stones hotspot to launch subitizing puzzle
    await page.evaluate(() => {
      (window as unknown as { __TRIGGER_HOTSPOT__: (id: string) => boolean }).__TRIGGER_HOTSPOT__('stepping_stones');
    });
    await page.waitForTimeout(400);

    // Verify PuzzleOverlayScene launched and solve stepping stones puzzle
    const puzzleActive = await page.evaluate(() => {
      const game = (window as unknown as { __GAME__: Phaser.Game }).__GAME__;
      return game.scene.isActive('PuzzleOverlayScene');
    });
    expect(puzzleActive).toBe(true);

    // Tap pads in order 1, 2, 3, 4, 5
    await page.evaluate(() => {
      const puzzleScene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('PuzzleOverlayScene') as unknown as {
        puzzleInstance: { pads: Array<{ x: number; y: number; dotCount: number }>; tap: (x: number, y: number) => unknown };
      };
      const pads = puzzleScene.puzzleInstance.pads;
      for (let num = 1; num <= 5; num++) {
        const pad = pads.find((p) => p.dotCount === num);
        if (pad) puzzleScene.puzzleInstance.tap(pad.x, pad.y);
      }
    });
    // Allow delay and chapter completion
    await page.waitForTimeout(1600);

    const ch4Stage = await getGameState();
    expect(ch4Stage.chapter).toBe(4);

    // 3. Summer (Chapter 7) - The Mossy Gearbox
    await page.evaluate(() => {
      (window as unknown as { __SET_CHAPTER__: (id: number) => void }).__SET_CHAPTER__(7);
      (window as unknown as { __LOAD_MAP__: (id: string, spawn?: { x: number; y: number }) => void }).__LOAD_MAP__('mossy_gearbox', { x: 136, y: 104 });
    });
    await page.waitForTimeout(300);

    const ch7Stage = await getGameState();
    expect(ch7Stage.chapter).toBe(7);
    expect(ch7Stage.season).toBe('summer');

    // Launch gearbox puzzle
    await page.evaluate(() => {
      (window as unknown as { __TRIGGER_HOTSPOT__: (id: string) => boolean }).__TRIGGER_HOTSPOT__('waterwheel');
    });
    await page.waitForTimeout(400);

    // Solve gearbox puzzle by meshing idler gear between driver and driven gear
    await page.evaluate(() => {
      const puzzleScene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('PuzzleOverlayScene') as unknown as {
        puzzleInstance: {
          targetMeshX: number;
          targetMeshY: number;
          dragIdler: (x: number, y: number) => void;
          update: (dt: number) => void;
        };
      };
      const p = puzzleScene.puzzleInstance;
      p.dragIdler(p.targetMeshX, p.targetMeshY);
      p.update(0.3);
    });
    await page.waitForTimeout(1600);

    const ch8Stage = await getGameState();
    expect(ch8Stage.chapter).toBe(8);

    // 4. Autumn (Chapter 11) - Autumn Seed Sorting in Sunset Meadow
    await page.evaluate(() => {
      (window as unknown as { __SET_CHAPTER__: (id: number) => void }).__SET_CHAPTER__(11);
      (window as unknown as { __LOAD_MAP__: (id: string, spawn?: { x: number; y: number }) => void }).__LOAD_MAP__('sunset_meadow', { x: 100, y: 104 });
    });
    await page.waitForTimeout(300);

    const ch11Stage = await getGameState();
    expect(ch11Stage.chapter).toBe(11);
    expect(ch11Stage.season).toBe('autumn');

    // Trigger seed sorting puzzle
    await page.evaluate(() => {
      (window as unknown as { __TRIGGER_HOTSPOT__: (id: string) => boolean }).__TRIGGER_HOTSPOT__('leaf_pile');
    });
    await page.waitForTimeout(400);

    // Sort all seeds into matching baskets
    await page.evaluate(() => {
      const puzzleScene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('PuzzleOverlayScene') as unknown as {
        puzzleInstance: {
          seeds: Array<{ id: string; type: string }>;
          baskets: Array<{ acceptedType: string; x: number; y: number }>;
          dragSeed: (id: string, x: number, y: number) => boolean;
          releaseSeed: (id: string) => boolean;
        };
      };
      const p = puzzleScene.puzzleInstance;
      for (const s of p.seeds) {
        const b = p.baskets.find((basket) => basket.acceptedType === s.type);
        if (b) {
          p.dragSeed(s.id, b.x, b.y);
          p.releaseSeed(s.id);
        }
      }
    });
    await page.waitForTimeout(1600);

    const ch12Stage = await getGameState();
    expect(ch12Stage.chapter).toBe(12);

    // 5. Winter (Chapter 16) - Winter Track Spotting in Pine Ridge
    await page.evaluate(() => {
      (window as unknown as { __SET_CHAPTER__: (id: number) => void }).__SET_CHAPTER__(16);
      (window as unknown as { __LOAD_MAP__: (id: string, spawn?: { x: number; y: number }) => void }).__LOAD_MAP__('pine_ridge', { x: 180, y: 104 });
    });
    await page.waitForTimeout(300);

    const ch16Stage = await getGameState();
    expect(ch16Stage.chapter).toBe(16);
    expect(ch16Stage.season).toBe('winter');

    // Trigger winter track spotting puzzle
    await page.evaluate(() => {
      (window as unknown as { __TRIGGER_HOTSPOT__: (id: string) => boolean }).__TRIGGER_HOTSPOT__('badger_burrow');
    });
    await page.waitForTimeout(400);

    // Tap all matching target tracks
    await page.evaluate(() => {
      const puzzleScene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('PuzzleOverlayScene') as unknown as {
        puzzleInstance: {
          trackStamps: Array<{ id: string; trackType: string }>;
          animalCards: Array<{ trackType: string; x: number; y: number }>;
          dragTrack: (id: string, x: number, y: number) => boolean;
          releaseTrack: (id: string) => boolean;
        };
      };
      const p = puzzleScene.puzzleInstance;
      for (const t of p.trackStamps) {
        const a = p.animalCards.find((card) => card.trackType === t.trackType);
        if (a) {
          p.dragTrack(t.id, a.x, a.y);
          p.releaseTrack(t.id);
        }
      }
    });
    await page.waitForTimeout(1600);

    const ch17Stage = await getGameState();
    expect(ch17Stage.chapter).toBe(17);

    // 6. Year-End Celebration (Chapter 20) in The Ranger Lodge
    await page.evaluate(() => {
      (window as unknown as { __SET_CHAPTER__: (id: number) => void }).__SET_CHAPTER__(20);
      (window as unknown as { __LOAD_MAP__: (id: string, spawn?: { x: number; y: number }) => void }).__LOAD_MAP__('ranger_lodge', { x: 200, y: 104 });
    });
    await page.waitForTimeout(300);

    const ch20Stage = await getGameState();
    expect(ch20Stage.chapter).toBe(20);

    // Tap celebration table hotspot
    await page.evaluate(() => {
      (window as unknown as { __TRIGGER_HOTSPOT__: (id: string) => boolean }).__TRIGGER_HOTSPOT__('celebration_table');
    });
    await page.waitForTimeout(400);

    const dialogueCelebration = await getDialogueText();
    expect(dialogueCelebration).toContain('Junior Ranger Honor');

    // Assert chapter 20 was completed!
    const isCh20Completed = await page.evaluate(() => {
      const scene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('WorldScene') as unknown as {
        campaign: { isChapterCompleted: (id: number) => boolean };
      };
      return scene.campaign.isChapterCompleted(20);
    });
    expect(isCh20Completed).toBe(true);

    // Verify full campaign completion when all chapters are fulfilled
    const isCompleted = await page.evaluate(() => {
      const scene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('WorldScene') as unknown as {
        campaign: { completedChapters: Set<number>; isAllCompleted: () => boolean };
      };
      for (let i = 1; i <= 19; i++) {
        scene.campaign.completedChapters.add(i);
      }
      return scene.campaign.isAllCompleted();
    });
    expect(isCompleted).toBe(true);
  });

  test('validates bi-directional region traversal between connected screens', async ({ page }) => {
    const getRegionText = () => page.evaluate(() => {
      const scene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('WorldScene') as unknown as {
        locationSignText: Phaser.GameObjects.Text;
      };
      return scene.locationSignText?.text ?? '';
    });

    const getPlayerPos = () => page.evaluate(() => {
      const scene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('WorldScene') as unknown as {
        playerBody: { x: number; y: number };
      };
      return { x: scene.playerBody.x, y: scene.playerBody.y };
    });

    // 1. Mossy Hollow to Pebble Creek (West exit)
    await page.evaluate(() => {
      (window as unknown as { __LOAD_MAP__: (id: string, spawn?: { x: number; y: number }) => void }).__LOAD_MAP__('mossy_hollow', { x: 20, y: 96 });
    });
    await page.waitForTimeout(300);
    expect(await getRegionText()).toBe('MOSSY HOLLOW');

    // Walk West into Pebble Creek
    await page.keyboard.down('ArrowLeft');
    await page.waitForTimeout(400);
    await page.keyboard.up('ArrowLeft');
    await page.waitForTimeout(900);

    expect(await getRegionText()).toBe('PEBBLE CREEK (SPRING)');
    const creekPos = await getPlayerPos();
    expect(creekPos.x).toBeGreaterThan(250);

    // Walk East back into Mossy Hollow
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(900);

    expect(await getRegionText()).toBe('MOSSY HOLLOW');

    // 2. Sunset Meadow to Mossy Hollow (West exit)
    await page.evaluate(() => {
      (window as unknown as { __LOAD_MAP__: (id: string, spawn?: { x: number; y: number }) => void }).__LOAD_MAP__('sunset_meadow', { x: 20, y: 136 });
    });
    await page.waitForTimeout(300);
    expect(await getRegionText()).toBe('SUNSET MEADOW (AUTUMN)');

    await page.keyboard.down('ArrowLeft');
    await page.waitForTimeout(400);
    await page.keyboard.up('ArrowLeft');
    await page.waitForTimeout(900);

    expect(await getRegionText()).toBe('MOSSY HOLLOW');
  });

  test('validates collectible pickup, satchel inventory tracking, and non-respawning', async ({ page }) => {
    // 1. Start in Pebble Creek where an Oak Acorn is at (235, 135)
    await page.evaluate(() => {
      (window as unknown as { __LOAD_MAP__: (id: string, spawn?: { x: number; y: number }) => void }).__LOAD_MAP__('pebble_creek', { x: 215, y: 135 });
    });
    await page.waitForTimeout(300);

    const initialInventory = await page.evaluate(() => {
      const scene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('WorldScene') as unknown as {
        campaign: { satchel: Array<{ item: { id: string }; count: number }> };
      };
      return scene.campaign.satchel;
    });
    const initialAcorns = initialInventory.find((s) => s.item.id === 'acorn')?.count ?? 0;

    // Walk East directly into the acorn item
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(300);

    // Verify satchel has gained the Oak Acorn!
    const inventoryAfterPickup = await page.evaluate(() => {
      const scene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('WorldScene') as unknown as {
        campaign: { satchel: Array<{ item: { id: string }; count: number }> };
      };
      return scene.campaign.satchel;
    });
    const acornsAfter = inventoryAfterPickup.find((s) => s.item.id === 'acorn')?.count ?? 0;
    expect(acornsAfter).toBe(initialAcorns + 1);

    // Reload the map and verify that the collected acorn does NOT respawn
    await page.evaluate(() => {
      (window as unknown as { __LOAD_MAP__: (id: string, spawn?: { x: number; y: number }) => void }).__LOAD_MAP__('pebble_creek', { x: 215, y: 135 });
    });
    await page.waitForTimeout(300);

    const collectiblesCount = await page.evaluate(() => {
      const scene = (window as unknown as { __GAME__: Phaser.Game }).__GAME__.scene.getScene('WorldScene') as unknown as {
        collectibles: Array<{ id: string; sprite: { visible: boolean } }>;
      };
      return scene.collectibles.filter((c) => c.id === 'acorn').length;
    });
    expect(collectiblesCount).toBe(0);
  });
});
