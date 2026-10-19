import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { processRawSprite } from './process-sprite.js';

const BRAIN_DIR = '/Users/franek/.gemini/antigravity-ide/brain/405c7d12-042f-4df5-bc65-b58f3639186e/.user_uploaded';
const TMP_DIR = path.resolve('scratch/canonical_tmp');
const OUT_TS = path.resolve('src/render/canonicalAssets.ts');

if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

async function processAsset(inputPath, extractOpts, resizeOpts, outputName, circularMask = false) {
  const rawPath = path.join(TMP_DIR, `${outputName}_raw.png`);
  const quantPath = path.join(TMP_DIR, `${outputName}_quant.png`);

  let pipeline = sharp(inputPath);
  if (extractOpts) {
    pipeline = pipeline.extract(extractOpts);
  }
  if (resizeOpts) {
    pipeline = pipeline.resize(resizeOpts.width, resizeOpts.height, {
      kernel: 'lanczos3',
      fit: resizeOpts.fit || 'cover',
    });
  }

  if (circularMask) {
    const { data, info } = await pipeline.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const w = info.width, h = info.height;
    const cx = (w - 1) / 2, cy = (h - 1) / 2, r = w / 2;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const dist = Math.hypot(x - cx, y - cy);
        if (dist >= r - 1.5) {
          data[idx + 3] = 0;
        }
      }
    }
    await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toFile(rawPath);
  } else {
    await pipeline.png().toFile(rawPath);
  }

  await processRawSprite(rawPath, quantPath);
  const base64Data = fs.readFileSync(quantPath).toString('base64');
  console.log(`Processed ${outputName} (${fs.statSync(quantPath).size} bytes)`);
  return `data:image/png;base64,${base64Data}`;
}

async function main() {
  console.log('Extracting and quantizing canonical 16-color Whispering Woods assets...');
  const assetsRecord = {};

  // 1. Ranger Satchel HUD Base (320x96) from Whispering Woods reference
  assetsRecord.satchel_bg = await processAsset(
    path.join(BRAIN_DIR, 'media_1792358613284.jpg'),
    { left: 0, top: 508, width: 1024, height: 257 },
    { width: 320, height: 96 },
    'satchel_bg'
  );

  // 2. Pip Cameos (48x48) with Circular Alpha Mask
  assetsRecord.pip_cameo_happy = await processAsset(
    path.join(BRAIN_DIR, 'media_1792358613284.jpg'),
    { left: 425, top: 570, width: 174, height: 174 },
    { width: 48, height: 48 },
    'pip_cameo_happy',
    true
  );

  assetsRecord.pip_cameo_thinking = await processAsset(
    path.join(BRAIN_DIR, 'media_1792358602848.jpg'),
    { left: 425, top: 570, width: 174, height: 174 },
    { width: 48, height: 48 },
    'pip_cameo_thinking',
    true
  );

  assetsRecord.pip_cameo_winter = await processAsset(
    path.join(BRAIN_DIR, 'media_1792358529853.jpg'),
    { left: 425, top: 570, width: 174, height: 174 },
    { width: 48, height: 48 },
    'pip_cameo_winter',
    true
  );

  // Default alias
  assetsRecord.pip_cameo = assetsRecord.pip_cameo_happy;

  // 3. World Viewport Backgrounds (each 320x192)
  const scenes = [
    { key: 'whispering_woods', file: 'whispering_woods_empty.jpg', extract: { left: 0, top: 0, width: 1200, height: 596 } },
    { key: 'mossy_gearbox', file: 'media_1792358602848.jpg', extract: { left: 0, top: 0, width: 1024, height: 508 } },
    { key: 'mossy_hollow', file: 'media_1792358607216.jpg', extract: { left: 0, top: 0, width: 1024, height: 508 } },
    { key: 'sketchbook', file: 'media_1792358596468.jpg', extract: { left: 0, top: 0, width: 1024, height: 508 } },
    { key: 'pine_ridge', file: 'media_1792358529853.jpg', extract: { left: 0, top: 0, width: 1024, height: 508 } },
    { key: 'ranger_lodge', file: 'media_1792358512416.jpg', extract: { left: 0, top: 0, width: 1024, height: 508 } },
  ];

  for (const sc of scenes) {
    const filePath = fs.existsSync(path.join(BRAIN_DIR, sc.file))
      ? path.join(BRAIN_DIR, sc.file)
      : path.resolve('scratch', sc.file);
    assetsRecord[`${sc.key}_bg`] = await processAsset(
      filePath,
      sc.extract,
      { width: 320, height: 192, fit: 'fill' },
      `${sc.key}_bg`
    );
  }

  // 3b. Full Interconnected World Map (640x384 px - 40x24 tiles)
  assetsRecord.world_full_map_bg = await processAsset(
    path.resolve('scratch/clean_full_map.png'),
    undefined,
    { width: 640, height: 384, fit: 'fill' },
    'world_full_map_bg'
  );

  // 4. Woodland Creature & Prop Sprites
  assetsRecord.beaver_sprite = await processAsset(
    path.join(BRAIN_DIR, 'media_1792358602848.jpg'),
    { left: 620, top: 45, width: 140, height: 140 },
    { width: 36, height: 36 },
    'beaver_sprite'
  );

  // Generate TypeScript module
  const tsContent = `/**
 * Canonical 16-Color Indexed Artwork Assets for Bramble & Pip.
 * Extracted and quantized strictly to the Whispering Woods palette.
 * Pre-encoded as base64 data URIs for zero network egress.
 */

import type Phaser from 'phaser';

export const CANONICAL_ASSETS: Record<string, string> = {
${Object.entries(assetsRecord)
  .map(([k, v]) => `  ${k}: '${v}',`)
  .join('\n')}
};

/**
 * Registers all canonical textures synchronously or asynchronously into the Phaser TextureManager
 * using in-memory HTMLImageElement data decoding (zero network egress).
 */
export function registerCanonicalTextures(scene: Phaser.Scene): Promise<void> {
  const entries = Object.entries(CANONICAL_ASSETS);
  return Promise.all(
    entries.map(([key, dataUri]) => {
      return new Promise<void>((resolve) => {
        if (scene.textures.exists(key)) {
          resolve();
          return;
        }
        if (typeof Image === 'undefined') {
          resolve();
          return;
        }
        const img = new Image();
        img.onload = () => {
          scene.textures.addImage(key, img);
          resolve();
        };
        img.onerror = () => {
          resolve();
        };
        img.src = dataUri;
      });
    })
  ).then(() => {});
}
`;

  fs.writeFileSync(OUT_TS, tsContent, 'utf-8');
  console.log(`Saved canonical assets TS module: ${OUT_TS} (${Math.round(tsContent.length / 1024)} KB)`);
}

main().catch((err) => {
  console.error('Failed to prepare canonical assets:', err);
  process.exit(1);
});
