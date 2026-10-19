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

  const canvas = page.locator('#game-container canvas');

  // 1. Whispering Woods exploration (Spring - Ch 1)
  console.log('Capturing whispering_woods.png...');
  await page.evaluate(() => {
    const fn = (window).__SWITCH_CHAPTER__;
    if (fn) fn(1);
  });
  await page.waitForTimeout(600);
  await canvas.screenshot({ path: path.join(OUT_DIR, 'whispering_woods.png') });

  // 2. The Ranger's Lodge Celebration (Chapter 20)
  console.log('Capturing ranger_lodge.png...');
  await page.evaluate(() => {
    const fn = (window).__SWITCH_CHAPTER__;
    if (fn) fn(20);
  });
  await page.waitForTimeout(600);
  await canvas.screenshot({ path: path.join(OUT_DIR, 'ranger_lodge.png') });

  // 3. The Pine Ridge (Winter - Chapter 16)
  console.log('Capturing pine_ridge.png...');
  await page.evaluate(() => {
    const fn = (window).__SWITCH_CHAPTER__;
    if (fn) fn(16);
  });
  await page.waitForTimeout(600);
  await canvas.screenshot({ path: path.join(OUT_DIR, 'pine_ridge.png') });

  // 4. The Mossy Gearbox (Summer - Chapter 7)
  console.log('Capturing mossy_gearbox.png...');
  await page.evaluate(() => {
    const fn = (window).__SWITCH_CHAPTER__;
    if (fn) fn(7);
  });
  await page.waitForTimeout(600);
  await canvas.screenshot({ path: path.join(OUT_DIR, 'mossy_gearbox.png') });

  // 5. Mossy Hollow (Autumn - Chapter 8)
  console.log('Capturing mossy_hollow.png...');
  await page.evaluate(() => {
    const fn = (window).__SWITCH_CHAPTER__;
    if (fn) fn(8);
  });
  await page.waitForTimeout(600);
  await canvas.screenshot({ path: path.join(OUT_DIR, 'mossy_hollow.png') });

  // 6. Nature Finds / Ranger Sketchbook (Chapter 12)
  console.log('Capturing nature_sketchbook.png...');
  await page.evaluate(() => {
    const fn = (window).__SWITCH_CHAPTER__;
    if (fn) fn(12);
  });
  await page.waitForTimeout(600);
  await canvas.screenshot({ path: path.join(OUT_DIR, 'nature_sketchbook.png') });

  // 7. Open Chapter Trail Map Modal
  console.log('Capturing trail_map.png...');
  await page.evaluate(() => {
    const fn = (window).__OPEN_CHAPTER_MAP__;
    if (fn) fn();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, 'trail_map.png') });

  // Close map
  await page.locator('#map-close-btn').click();
  await page.waitForTimeout(400);

  // 8. Open In-Game Field Manual
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

  // 9. Open Parent Dashboard
  console.log('Capturing parent_dashboard.png...');
  await page.evaluate(() => {
    const fn = (window).__OPEN_PARENT_DASHBOARD__;
    if (fn) fn();
  });
  await page.waitForTimeout(500);

  // Solve math gate to show parent insights
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

  // 10. Bedtime Resting Screen
  console.log('Capturing bedtime_resting.png...');
  await page.evaluate(() => {
    const game = (window).__GAME__;
    if (game) {
      game.scene.stop('WorldScene');
      game.scene.stop('SatchelUI');
      game.scene.start('BedtimeScene');
    }
  });
  await page.waitForTimeout(800);
  await canvas.screenshot({ path: path.join(OUT_DIR, 'bedtime_resting.png') });

  console.log('All screenshots captured successfully in docs/images/!');
  await browser.close();
  server.kill();
  process.exit(0);
}

main().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
