import { clamp } from '../core/math';

export type RGB = readonly [r: number, g: number, b: number];

export interface PaletteEntry {
  readonly index: number;
  readonly name: string;
  readonly hex: string;
  readonly rgb: RGB;
  readonly luminance: number;
}

/**
 * Master 16-color "Whispering Woods" indexed palette (Indices 00–15).
 * Strictly enforced across all visual assets to guarantee cognitive comfort,
 * parasympathetic calming, and zero mixels.
 */
export const WHISPERING_WOODS: readonly PaletteEntry[] = [
  { index: 0, name: 'Night Pine Shadow', hex: '#1A232A', rgb: [26, 35, 42], luminance: 0.13 },
  { index: 1, name: 'Deep Forest Slate', hex: '#2C3E50', rgb: [44, 62, 80], luminance: 0.24 },
  { index: 2, name: 'Deep Bark Umber', hex: '#3B2F2F', rgb: [59, 47, 47], luminance: 0.20 },
  { index: 3, name: 'Weathered Oak', hex: '#5C4033', rgb: [92, 64, 51], luminance: 0.28 },
  { index: 4, name: 'Deep Moss Green', hex: '#2E5328', rgb: [46, 83, 40], luminance: 0.28 },
  { index: 5, name: 'Woodland Olive', hex: '#4A7032', rgb: [74, 112, 50], luminance: 0.41 },
  { index: 6, name: 'Golden Willow', hex: '#789E3E', rgb: [120, 158, 62], luminance: 0.58 },
  { index: 7, name: 'Soft Sprout Yellow', hex: '#DCE38A', rgb: [220, 227, 138], luminance: 0.86 },
  { index: 8, name: 'River Clay Tan', hex: '#B88A58', rgb: [184, 138, 88], luminance: 0.54 },
  { index: 9, name: 'Warm Acorn Brown', hex: '#8C5832', rgb: [140, 88, 50], luminance: 0.38 },
  { index: 10, name: 'Autumn Amber', hex: '#C96E2E', rgb: [201, 110, 46], luminance: 0.49 },
  { index: 11, name: 'Rowan Berry Red', hex: '#B84432', rgb: [184, 68, 50], luminance: 0.36 },
  { index: 12, name: 'Twilight Mist Blue', hex: '#6B8E9E', rgb: [107, 142, 158], luminance: 0.52 },
  { index: 13, name: 'Frost Glaze Blue', hex: '#A8C4D0', rgb: [168, 196, 208], luminance: 0.74 },
  { index: 14, name: 'Winter Snowdrift', hex: '#E4EDF0', rgb: [228, 237, 240], luminance: 0.92 },
  { index: 15, name: 'Warm Canvas Cream', hex: '#FAF6E8', rgb: [250, 246, 232], luminance: 0.96 },
];

/**
 * 16-color palette grader for sunset and night transitions.
 * Formula from docs/VISION.md / docs/ARCHITECTURE.md ADR-004:
 * C' = C * ((1 - w) * 1.0 + w * [1.15, 0.82, 0.58]) with contrast lift +0.15*w
 * w in [0, 1] represents the 180-second sunset progression.
 */
export class PaletteGrader {
  /**
   * Applies the warm sunset color grading matrix and contrast adjustment to an RGB tuple.
   */
  static gradeColor(baseRgb: RGB, w: number): RGB {
    const weight = clamp(w, 0, 1);
    const redFactor = (1 - weight) * 1.0 + weight * 1.15;
    const greenFactor = (1 - weight) * 1.0 + weight * 0.82;
    const blueFactor = (1 - weight) * 1.0 + weight * 0.58;

    // Shift channels
    let r = baseRgb[0] * redFactor;
    let g = baseRgb[1] * greenFactor;
    let b = baseRgb[2] * blueFactor;

    // Contrast adjustment (+15% * weight towards median luminance ~128)
    const contrast = 1 + 0.15 * weight;
    r = clamp(Math.round((r - 128) * contrast + 128), 0, 255);
    g = clamp(Math.round((g - 128) * contrast + 128), 0, 255);
    b = clamp(Math.round((b - 128) * contrast + 128), 0, 255);

    return [r, g, b];
  }

  /**
   * Builds a full 16-color table for sunset progress w in [0, 1].
   */
  static getGradedPalette(w: number): RGB[] {
    return WHISPERING_WOODS.map((entry) => this.gradeColor(entry.rgb, w));
  }

  /**
   * Pre-generates 18 discrete steps (quantized every 10 seconds across 180s)
   * to avoid continuous re-baking while maintaining smooth perceptual change.
   */
  static generateGradedSteps(numSteps = 18): RGB[][] {
    const steps: RGB[][] = [];
    for (let i = 0; i <= numSteps; i++) {
      steps.push(this.getGradedPalette(i / numSteps));
    }
    return steps;
  }
}
