import { describe, it, expect } from 'vitest';
import { findNearestColor, processRawSprite, WHISPERING_WOODS_RGB } from '../../scripts/process-sprite';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

describe('Sprite Sanitizer & Palette Quantizer (scripts/process-sprite.js)', () => {
  it('finds exact match for native Whispering Woods colors', () => {
    for (let i = 0; i < WHISPERING_WOODS_RGB.length; i++) {
      const c = WHISPERING_WOODS_RGB[i];
      const match = findNearestColor(c[0], c[1], c[2]);
      expect(match.index).toBe(i);
      expect(match.color).toEqual(c);
    }
  });

  it('maps an off-palette color to the perceptually nearest palette color', () => {
    // A slightly off-moss green (48, 85, 42) should map to Deep Moss Green index 4 [46, 83, 40]
    const match = findNearestColor(48, 85, 42);
    expect(match.index).toBe(4);
    expect(match.color).toEqual([46, 83, 40]);
  });

  it('sanitizes a raw image with chroma-key and semi-transparency into binary alpha and 16-color palette', async () => {
    const tmpDir = path.resolve('node_modules/.tmp-test');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const rawInput = path.join(tmpDir, 'test_raw.png');
    const sanitizedOutput = path.join(tmpDir, 'test_sanitized.png');

    // Create a 2x2 test image:
    // Pixel 0: Magenta chroma-key #FF00FF
    // Pixel 1: Deep forest slate #2C3E50 with 100% alpha
    // Pixel 2: Semi-transparent blue with alpha 50 (should become transparent)
    // Pixel 3: Slightly off acorn brown (142, 90, 52) with alpha 200 (should become solid acorn brown)
    const rawPixels = Buffer.from([
      255, 0, 255, 255, // 0: chroma-key
      44, 62, 80, 255,   // 1: native color
      44, 62, 80, 50,    // 2: low alpha
      142, 90, 52, 200,  // 3: off color, high alpha
    ]);

    await sharp(rawPixels, { raw: { width: 2, height: 2, channels: 4 } })
      .png()
      .toFile(rawInput);

    await processRawSprite(rawInput, sanitizedOutput);

    const { data } = await sharp(sanitizedOutput)
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Pixel 0 should be transparent (alpha 0)
    expect(data[3]).toBe(0);

    // Pixel 1 should have alpha 255 and exact color
    expect(data[4]).toBe(44);
    expect(data[5]).toBe(62);
    expect(data[6]).toBe(80);
    expect(data[7]).toBe(255);

    // Pixel 2 should be transparent (alpha was < 128)
    expect(data[11]).toBe(0);

    // Pixel 3 should be clamped to Warm Acorn Brown [140, 88, 50] with alpha 255
    expect(data[12]).toBe(140);
    expect(data[13]).toBe(88);
    expect(data[14]).toBe(50);
    expect(data[15]).toBe(255);

    // Clean up
    if (fs.existsSync(rawInput)) fs.unlinkSync(rawInput);
    if (fs.existsSync(sanitizedOutput)) fs.unlinkSync(sanitizedOutput);
  });
});
