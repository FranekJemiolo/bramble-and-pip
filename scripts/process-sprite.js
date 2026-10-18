import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

// Master 16-color "Whispering Woods" palette RGB values
export const WHISPERING_WOODS_RGB = [
  [26, 35, 42],    // 0: Night Pine Shadow (#1A232A)
  [44, 62, 80],    // 1: Deep Forest Slate (#2C3E50)
  [59, 47, 47],    // 2: Deep Bark Umber (#3B2F2F)
  [92, 64, 51],    // 3: Weathered Oak (#5C4033)
  [46, 83, 40],    // 4: Deep Moss Green (#2E5328)
  [74, 112, 50],   // 5: Woodland Olive (#4A7032)
  [120, 158, 62],  // 6: Golden Willow (#789E3E)
  [220, 227, 138], // 7: Soft Sprout Yellow (#DCE38A)
  [184, 138, 88],  // 8: River Clay Tan (#B88A58)
  [140, 88, 50],   // 9: Warm Acorn Brown (#8C5832)
  [201, 110, 46],  // 10: Autumn Amber (#C96E2E)
  [184, 68, 50],   // 11: Rowan Berry Red (#B84432)
  [107, 142, 158], // 12: Twilight Mist Blue (#6B8E9E)
  [168, 196, 208], // 13: Frost Glaze Blue (#A8C4D0)
  [228, 237, 240], // 14: Winter Snowdrift (#E4EDF0)
  [250, 246, 232], // 15: Warm Canvas Cream (#FAF6E8)
];

/**
 * Finds the nearest color in the Whispering Woods palette using human perceptual weighted Euclidean distance:
 * d^2 = 2*(dr)^2 + 4*(dg)^2 + 3*(db)^2
 */
export function findNearestColor(r, g, b, palette = WHISPERING_WOODS_RGB) {
  let minDistance = Infinity;
  let nearest = palette[0];
  let nearestIndex = 0;

  for (let i = 0; i < palette.length; i++) {
    const color = palette[i];
    const dr = r - color[0];
    const dg = g - color[1];
    const db = b - color[2];
    const dist = 2 * dr * dr + 4 * dg * dg + 3 * db * db;

    if (dist < minDistance) {
      minDistance = dist;
      nearest = color;
      nearestIndex = i;
    }
  }

  return { color: nearest, index: nearestIndex };
}

/**
 * Sanitizes a raw sprite image:
 * 1. Removes chroma-key background (magenta #FF00FF).
 * 2. Enforces binary alpha (0 or 255; no semi-transparent halos).
 * 3. Clamps non-transparent pixels strictly to the 16-color Whispering Woods palette.
 */
export async function processRawSprite(inputPath, outputPath, options = {}) {
  const { chromaKey = [255, 0, 255], alphaThreshold = 128 } = options;

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixelCount = info.width * info.height;
  const processedData = Buffer.from(data);

  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const r = processedData[idx];
    const g = processedData[idx + 1];
    const b = processedData[idx + 2];
    const a = processedData[idx + 3];

    // Detect magenta chroma-key (#FF00FF with slight variance tolerance)
    const isChroma = Math.abs(r - chromaKey[0]) < 15 &&
                     Math.abs(g - chromaKey[1]) < 15 &&
                     Math.abs(b - chromaKey[2]) < 15;

    if (a < alphaThreshold || isChroma) {
      // Binary transparent
      processedData[idx] = 0;
      processedData[idx + 1] = 0;
      processedData[idx + 2] = 0;
      processedData[idx + 3] = 0;
    } else {
      // Clamp to Whispering Woods palette and enforce solid binary alpha
      const { color } = findNearestColor(r, g, b);
      processedData[idx] = color[0];
      processedData[idx + 1] = color[1];
      processedData[idx + 2] = color[2];
      processedData[idx + 3] = 255;
    }
  }

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  await sharp(processedData, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toFile(outputPath);

  return {
    width: info.width,
    height: info.height,
    outputPath,
  };
}

// CLI execution helper
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  let input = '';
  let output = '';

  for (const arg of args) {
    if (arg.startsWith('--input=')) input = arg.slice(8);
    if (arg.startsWith('--output=')) output = arg.slice(9);
  }

  if (!input || !output) {
    console.error('Usage: node scripts/process-sprite.js --input=<path> --output=<path>');
    process.exit(1);
  }

  processRawSprite(input, output)
    .then((res) => {
      console.log(`Processed sprite saved: ${res.outputPath} (${res.width}x${res.height})`);
    })
    .catch((err) => {
      console.error('Sprite processing failed:', err);
      process.exit(1);
    });
}
