/* global window */
import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('docs/images');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function main() {
  console.log('Starting preview server...');
  const server = spawn('npx', ['vite', 'preview', '--port', '4174', '--base', '/bramble-and-pip/'], {
    stdio: 'pipe',
  });

  // Wait for server to be ready
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log('Launching Chromium...');
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });

  const page = await browser.newPage({
    viewport: { width: 960, height: 864 },
    deviceScaleFactor: 2,
  });

  const url = 'http://localhost:4174/bramble-and-pip/';
  console.log(`Navigating to ${url}...`);
  await page.goto(url);
  await page.waitForSelector('#game-container canvas');
  await page.waitForTimeout(1000);

  // 1. Whispering Woods exploration
  console.log('Capturing whispering_woods.png...');
  await page.screenshot({ path: path.join(OUT_DIR, 'whispering_woods.png') });

  // 2. Open How-to-Play Guide
  console.log('Capturing field_manual.png...');
  await page.evaluate(() => {
    const fn = (window).__OPEN_GUIDE__;
    if (fn) fn();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, 'field_manual.png') });

  // Close guide
  await page.locator('#guide-done').click();
  await page.waitForTimeout(400);

  // 3. Open Parent Dashboard
  console.log('Capturing parent_dashboard.png...');
  await page.evaluate(() => {
    const fn = (window).__OPEN_PARENT_DASHBOARD__;
    if (fn) fn();
  });
  await page.waitForTimeout(500);

  // Solve gate to capture full dashboard
  const wordMap = {
    ZERO: 0, ONE: 1, TWO: 2, THREE: 3, FOUR: 4,
    FIVE: 5, SIX: 6, SEVEN: 7, EIGHT: 8, NINE: 9,
  };
  const promptText = await page.locator('#overlay-root').innerText();
  const match = promptText.match(/([A-Z]+)\s+TIMES\s+([A-Z]+)/);
  if (match) {
    const ans = (wordMap[match[1]] * wordMap[match[2]]).toString();
    await page.locator('#gate-answer').fill(ans);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: path.join(OUT_DIR, 'parent_dashboard.png') });

  // Close dashboard
  await page.locator('#dash-done').click();
  await page.waitForTimeout(400);

  // 4. Sketchbook Scene
  console.log('Capturing nature_sketchbook.png...');
  await page.evaluate(() => {
    const game = (window).__GAME__;
    if (game) {
      const world = game.scene.getScene('WorldScene');
      world.scene.pause();
      world.scene.launch('SketchbookScene');
    }
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, 'nature_sketchbook.png') });

  // Return to world
  await page.evaluate(() => {
    const game = (window).__GAME__;
    if (game) {
      const world = game.scene.getScene('WorldScene');
      world.scene.stop('SketchbookScene');
      world.scene.resume();
    }
  });
  await page.waitForTimeout(400);

  // 5. Mossy Gearbox Puzzle Overlay
  console.log('Capturing mossy_gearbox.png...');
  await page.evaluate(() => {
    const game = (window).__GAME__;
    if (game) {
      const world = game.scene.getScene('WorldScene');
      world.scene.pause();
      world.scene.launch('PuzzleOverlayScene', { puzzleType: 'mossy_gearbox' });
    }
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, 'mossy_gearbox.png') });

  // 6. Stepping Stones Puzzle Overlay
  console.log('Capturing stepping_stones.png...');
  await page.evaluate(() => {
    const game = (window).__GAME__;
    if (game) {
      const world = game.scene.getScene('WorldScene');
      world.scene.stop('PuzzleOverlayScene');
      world.scene.launch('PuzzleOverlayScene', { puzzleType: 'stepping_stones' });
    }
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, 'stepping_stones.png') });

  // 7. Bedtime Scene
  console.log('Capturing bedtime_resting.png...');
  await page.evaluate(() => {
    const game = (window).__GAME__;
    if (game) {
      const world = game.scene.getScene('WorldScene');
      world.scene.stop('PuzzleOverlayScene');
      world.scene.pause();
      world.scene.launch('BedtimeScene');
    }
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, 'bedtime_resting.png') });

  console.log('All screenshots captured successfully!');
  await browser.close();
  server.kill();
  process.exit(0);
}

main().catch((err) => {
  console.error('Screenshot error:', err);
  process.exit(1);
});
