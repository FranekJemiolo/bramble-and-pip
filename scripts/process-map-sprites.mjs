import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SOURCE_IMAGE = '/Users/franek/.gemini/antigravity-ide/brain/405c7d12-042f-4df5-bc65-b58f3639186e/.user_uploaded/media_1792413332501.jpg';
const OUTPUT_DIR = path.resolve('public/assets/maps');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function cleanBorders(buffer, width, height) {
  const out = Buffer.from(buffer);
  const ch = 4;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * ch;
      const r = out[idx];
      const g = out[idx + 1];
      const b = out[idx + 2];

      // Inpaint dashed lines & overlay arrows near edges (x < 12 || x > width - 12 || y < 12 || y > height - 12)
      if (x < 12 || x > width - 12 || y < 12 || y > height - 12) {
        if ((r > 195 && g > 195 && b > 195) || (r < 25 && g < 25 && b < 25)) {
          const sampleX = x < 12 ? Math.min(x + 5, width - 1) : Math.max(x - 5, 0);
          const sampleY = y < 12 ? Math.min(y + 5, height - 1) : Math.max(y - 5, 0);
          const sampleIdx = (sampleY * width + sampleX) * ch;
          out[idx] = out[sampleIdx];
          out[idx + 1] = out[sampleIdx + 1];
          out[idx + 2] = out[sampleIdx + 2];
        }
      }
    }
  }
  return out;
}

async function processMap(name, cropRect) {
  console.log(`Processing map: ${name} with crop`, cropRect);

  // Extract from master image
  const extracted = await sharp(SOURCE_IMAGE)
    .extract(cropRect)
    .resize(320, 192, { fit: 'cover', position: 'center' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const cleanedData = await cleanBorders(extracted.data, extracted.info.width, extracted.info.height);

  // Save clean 320x192 PNG
  const outPngPath = path.join(OUTPUT_DIR, `${name}.png`);
  await sharp(cleanedData, { raw: { width: 320, height: 192, channels: 4 } })
    .png({ compressionLevel: 9, palette: true })
    .toFile(outPngPath);

  const pngBuf = fs.readFileSync(outPngPath);
  console.log(`Saved ${name}.png (${pngBuf.length} bytes)`);
  return pngBuf.toString('base64');
}

async function main() {
  console.log('Extracting maps from Bramble & Pip world sprite sheet...');

  // Bounding boxes in 1024 x 764 image:
  // 1. Ranger Cabin & Garden (top-left)
  const rangerCabinBase64 = await processMap('ranger_cabin_bg', {
    left: 10,
    top: 55,
    width: 325,
    height: 250,
  });

  // 2. Pebble Creek (Spring) (bottom-left)
  const pebbleCreekBase64 = await processMap('pebble_creek_bg', {
    left: 4,
    top: 425,
    width: 330,
    height: 288,
  });

  // 3. Mossy Hollow (Summer) (center)
  const mossyHollowBase64 = await processMap('mossy_hollow_bg', {
    left: 345,
    top: 310,
    width: 332,
    height: 255,
  });

  // 4. Sunset Meadow (Autumn) (bottom-right)
  const sunsetMeadowBase64 = await processMap('sunset_meadow_bg', {
    left: 686,
    top: 540,
    width: 332,
    height: 195,
  });

  // 5. The Pine Ridge (Winter) (top-right forest)
  const pineRidgeBase64 = await processMap('pine_ridge_bg', {
    left: 520,
    top: 50,
    width: 320,
    height: 240,
  });

  // 6. The Ranger's Lodge (Winter Gateway) (top-right cabin & campfire)
  // Extract the lodge and campfire gathering, framed in snow
  const lodgePanel = await sharp(SOURCE_IMAGE)
    .extract({ left: 848, top: 15, width: 172, height: 280 })
    .resize(320, 192, { fit: 'contain', background: { r: 210, g: 225, b: 240, alpha: 1 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const lodgePngPath = path.join(OUTPUT_DIR, 'ranger_lodge_bg.png');
  await sharp(lodgePanel.data, { raw: { width: 320, height: 192, channels: 4 } })
    .png({ compressionLevel: 9, palette: true })
    .toFile(lodgePngPath);
  const rangerLodgeBase64 = fs.readFileSync(lodgePngPath).toString('base64');
  console.log(`Saved ranger_lodge_bg.png (${fs.readFileSync(lodgePngPath).length} bytes)`);

  // Write base64 bundle
  const bundle = {
    ranger_cabin_bg: `data:image/png;base64,${rangerCabinBase64}`,
    pebble_creek_bg: `data:image/png;base64,${pebbleCreekBase64}`,
    mossy_hollow_bg: `data:image/png;base64,${mossyHollowBase64}`,
    sunset_meadow_bg: `data:image/png;base64,${sunsetMeadowBase64}`,
    pine_ridge_bg: `data:image/png;base64,${pineRidgeBase64}`,
    ranger_lodge_bg: `data:image/png;base64,${rangerLodgeBase64}`,
  };

  fs.writeFileSync(
    path.resolve('src/render/extractedMapAssets.json'),
    JSON.stringify(bundle, null, 2),
    'utf8'
  );
  console.log('Successfully wrote extractedMapAssets.json!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
