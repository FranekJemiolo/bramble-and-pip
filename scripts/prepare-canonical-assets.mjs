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

async function main() {
  console.log('Extracting and quantizing canonical assets...');

  // 1. Ranger Satchel UI (320x96)
  const satchelRaw = path.join(TMP_DIR, 'satchel_raw.png');
  const satchelQuant = path.join(TMP_DIR, 'satchel_quant.png');
  await sharp(path.join(BRAIN_DIR, 'media_1792358512416.jpg'))
    .extract({ left: 0, top: 510, width: 1024, height: 255 })
    .resize(320, 96, { kernel: 'lanczos3' })
    .png()
    .toFile(satchelRaw);
  await processRawSprite(satchelRaw, satchelQuant);

  // 2. Pip Cameo Portrait (48x48)
  const pipRaw = path.join(TMP_DIR, 'pip_cameo_raw.png');
  const pipQuant = path.join(TMP_DIR, 'pip_cameo_quant.png');
  await sharp(path.join(BRAIN_DIR, 'media_1792358512416.jpg'))
    .extract({ left: 400, top: 560, width: 220, height: 200 })
    .resize(48, 48, { kernel: 'lanczos3' })
    .png()
    .toFile(pipRaw);
  await processRawSprite(pipRaw, pipQuant);

  // 3. World Viewport Backgrounds (each 320x192)
  const scenes = [
    { key: 'whispering_woods', file: 'media_1792358613284.jpg' },
    { key: 'mossy_gearbox', file: 'media_1792358602848.jpg' },
    { key: 'mossy_hollow', file: 'media_1792358607216.jpg' },
    { key: 'pine_ridge', file: 'media_1792358529853.jpg' },
    { key: 'ranger_lodge', file: 'media_1792358512416.jpg' },
    { key: 'sketchbook', file: 'media_1792358596468.jpg' },
  ];

  const assetsRecord = {};
  assetsRecord.satchel_bg = `data:image/png;base64,${fs.readFileSync(satchelQuant).toString('base64')}`;
  assetsRecord.pip_cameo = `data:image/png;base64,${fs.readFileSync(pipQuant).toString('base64')}`;

  for (const sc of scenes) {
    const rawPath = path.join(TMP_DIR, `${sc.key}_raw.png`);
    const quantPath = path.join(TMP_DIR, `${sc.key}_quant.png`);
    await sharp(path.join(BRAIN_DIR, sc.file))
      .extract({ left: 0, top: 0, width: 1024, height: 510 })
      .resize(320, 192, { kernel: 'lanczos3' })
      .png()
      .toFile(rawPath);
    await processRawSprite(rawPath, quantPath);
    assetsRecord[`${sc.key}_bg`] = `data:image/png;base64,${fs.readFileSync(quantPath).toString('base64')}`;
    console.log(`Processed ${sc.key} (${fs.statSync(quantPath).size} bytes)`);
  }

  // Generate TypeScript module
  const tsContent = `/**
 * Canonical 16-Color Indexed Artwork Assets for Bramble & Pip.
 * Extracted and quantized strictly to the Whispering Woods palette.
 * Pre-encoded as base64 data URIs for zero network egress.
 */

export const CANONICAL_ASSETS: Record<string, string> = {
${Object.entries(assetsRecord)
  .map(([k, v]) => `  ${k}: '${v}',`)
  .join('\n')}
};
`;

  fs.writeFileSync(OUT_TS, tsContent, 'utf-8');
  console.log(`Saved canonical assets TS module: ${OUT_TS} (${Math.round(tsContent.length / 1024)} KB)`);
}

main().catch((err) => {
  console.error('Failed to prepare canonical assets:', err);
  process.exit(1);
});
