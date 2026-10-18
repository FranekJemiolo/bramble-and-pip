import { IndexedImage, TRANSPARENT } from './indexed';
import { angleDiff, degToRad } from '../core/math';
import { WORLD_VIEW_HEIGHT, WORLD_VIEW_WIDTH } from '../core/constants';

// Standard 4x4 Bayer ordered dither matrix normalized to [0..15] / 16
const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export interface FlashlightConfig {
  facingAngleDeg: number;
  coneAngleDeg?: number; // default 60 deg
  rangePx?: number; // default 96 px
  ambientDarkness?: number; // default 0.85 (0.0 to 1.0)
}

/**
 * Procedural Flashlight Mask using 4x4 Bayer ordered dither.
 * Renders into an IndexedImage buffer (0 = Night Pine Shadow, 255 = TRANSPARENT).
 * Transparent pixels reveal the illuminated world below;
 * dithered pixels 0 block the view with ambient shadow without subpixel blurring.
 */
export class FlashlightMask {
  private readonly mask: IndexedImage;

  constructor(
    readonly width = WORLD_VIEW_WIDTH,
    readonly height = WORLD_VIEW_HEIGHT
  ) {
    this.mask = IndexedImage.create(width, height, TRANSPARENT);
  }

  get image(): IndexedImage {
    return this.mask;
  }

  /**
   * Updates the dithered darkness overlay based on flashlight source position and facing direction.
   */
  update(
    sourceX: number,
    sourceY: number,
    config: FlashlightConfig
  ): IndexedImage {
    const {
      facingAngleDeg,
      coneAngleDeg = 60,
      rangePx = 96,
      ambientDarkness = 0.85,
    } = config;

    const facingRad = degToRad(facingAngleDeg);
    const halfConeRad = degToRad(coneAngleDeg / 2);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const dx = x - sourceX;
        const dy = y - sourceY;
        const dist = Math.hypot(dx, dy);

        let darkness = ambientDarkness;

        if (dist <= rangePx) {
          const angleToPoint = Math.atan2(dy, dx);
          const diff = Math.abs(angleDiff(angleToPoint, facingRad));

          if (diff <= halfConeRad) {
            // Three-tier concentric attenuation
            if (dist <= 48) {
              // Core beam: 100% illumination
              darkness = 0.0;
            } else if (dist <= 80) {
              // Feathered mid-ring: linear from 0.0 to 0.5
              const t = (dist - 48) / (80 - 48);
              darkness = t * 0.5;
            } else {
              // Outer penumbra: quadratic falloff to ambient darkness
              const t = (dist - 80) / (rangePx - 80);
              darkness = 0.5 + t * t * (ambientDarkness - 0.5);
            }
          }
        }

        // Apply Bayer 4x4 dither
        const threshold = (BAYER_4X4[y % 4]?.[x % 4] ?? 0) / 16;
        if (darkness > threshold) {
          this.mask.set(x, y, 0); // Palette 00 (Night Pine Shadow)
        } else {
          this.mask.set(x, y, TRANSPARENT); // Cleared / Illuminated
        }
      }
    }

    return this.mask;
  }
}

export { FlashlightMask as FlashlightManager };

