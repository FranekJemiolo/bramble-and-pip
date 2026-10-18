import { IndexedImage, TRANSPARENT } from './indexed';
import { TILE_SIZE } from '../core/constants';

export class TileGenerator {
  /**
   * Generates a 16x16 tile corresponding to a 4-bit autotile bitmask (0..15).
   * primaryColor: tile center fill (e.g. 5 for grass, 8 for dirt)
   * edgeColor: outer border color (e.g. 4 for moss edge, 3 for dirt border)
   */
  static generateAutotile(bitmask: number, primaryColor: number, edgeColor: number): IndexedImage {
    const img = IndexedImage.create(TILE_SIZE, TILE_SIZE, primaryColor);

    const hasNorth = (bitmask & 1) !== 0;
    const hasEast = (bitmask & 2) !== 0;
    const hasSouth = (bitmask & 4) !== 0;
    const hasWest = (bitmask & 8) !== 0;

    // Apply edge border where neighbor is missing
    if (!hasNorth) img.hline(0, 0, TILE_SIZE, edgeColor);
    if (!hasEast) img.vline(TILE_SIZE - 1, 0, TILE_SIZE, edgeColor);
    if (!hasSouth) img.hline(0, TILE_SIZE - 1, TILE_SIZE, edgeColor);
    if (!hasWest) img.vline(0, 0, TILE_SIZE, edgeColor);

    // Subtle corner accents
    if (!hasNorth && !hasWest) img.set(1, 1, edgeColor);
    if (!hasNorth && !hasEast) img.set(TILE_SIZE - 2, 1, edgeColor);
    if (!hasSouth && !hasWest) img.set(1, TILE_SIZE - 2, edgeColor);
    if (!hasSouth && !hasEast) img.set(TILE_SIZE - 2, TILE_SIZE - 2, edgeColor);

    return img;
  }

  /**
   * Generates water tile with gentle wave ripple (frame 0..2).
   */
  static generateWaterTile(frame: number): IndexedImage {
    const img = IndexedImage.create(TILE_SIZE, TILE_SIZE, 12); // 12 Twilight Mist Blue
    // Wave ripple offsets (13 Frost Glaze Blue)
    const y1 = (3 + frame * 4) % TILE_SIZE;
    const y2 = (9 + frame * 4) % TILE_SIZE;
    img.hline(2, y1, 5, 13);
    img.hline(9, y2, 6, 13);
    return img;
  }

  /**
   * Generates Lily Pad with explicit subitizing dot counts (1 to 5).
   */
  static generateLilyPad(dots: number): IndexedImage {
    const img = IndexedImage.create(TILE_SIZE * 2, TILE_SIZE * 2, TRANSPARENT);
    // Green round pad
    img.disk(16, 16, 13, 5); // 5 Woodland Olive
    img.disk(16, 16, 12, 6); // 6 Golden Willow rim
    // Notch in pad
    img.line(16, 16, 28, 14, TRANSPARENT);
    img.line(16, 16, 28, 18, TRANSPARENT);

    // Subitizing dots in high-contrast Rowan Berry Red (11) or Sprout Yellow (7)
    const dotColor = 11;
    const dotPositions: Record<number, Array<[number, number]>> = {
      1: [[16, 16]],
      2: [[12, 16], [20, 16]],
      3: [[12, 19], [16, 13], [20, 19]],
      4: [[12, 12], [20, 12], [12, 20], [20, 20]],
      5: [[12, 12], [20, 12], [16, 16], [12, 20], [20, 20]],
    };

    const pts = dotPositions[dots] ?? [[16, 16]];
    for (const [x, y] of pts) {
      img.disk(x, y, 2, dotColor);
      img.set(x, y, 15); // highlight in center
    }

    return img;
  }

  /**
   * Generates pine tree prop (24x32).
   */
  static generatePineTree(): IndexedImage {
    const img = IndexedImage.create(24, 32, TRANSPARENT);
    // Trunk
    img.fillRect(10, 24, 4, 8, 2); // 2 Deep Bark Umber
    // 3 tiers of needles (4 Deep Moss Green, 5 Woodland Olive, 6 Golden Willow highlights)
    // Tier 1 (bottom)
    for (let i = 0; i < 6; i++) img.hline(12 - 2 - i * 2, 24 - i, 5 + i * 4, 4);
    // Tier 2 (middle)
    for (let i = 0; i < 6; i++) img.hline(12 - 2 - i * 2, 18 - i, 5 + i * 4, 5);
    // Tier 3 (top)
    for (let i = 0; i < 7; i++) img.hline(12 - 1 - i, 12 - i, 3 + i * 2, 6);

    return img;
  }

  /**
   * Generates cabin furniture & architectural props.
   */
  static generateCabinProp(kind: 'wall' | 'door' | 'bed' | 'hearth' | 'window'): IndexedImage {
    const img = IndexedImage.create(TILE_SIZE, TILE_SIZE, TRANSPARENT);
    switch (kind) {
      case 'wall':
        img.fill(3); // Weathered Oak
        img.hline(0, 3, TILE_SIZE, 2);
        img.hline(0, 7, TILE_SIZE, 2);
        img.hline(0, 11, TILE_SIZE, 2);
        img.hline(0, 15, TILE_SIZE, 2);
        break;
      case 'door':
        img.fill(2); // Deep Bark
        img.strokeRect(1, 1, 14, 15, 3);
        img.disk(12, 9, 1, 7); // Brass knob
        break;
      case 'bed':
        img.fillRect(1, 2, 14, 14, 8); // Wood frame
        img.fillRect(2, 2, 12, 5, 15); // Pillow (Cream)
        img.fillRect(2, 7, 12, 8, 5); // Blanket (Moss Green)
        break;
      case 'hearth':
        img.fillRect(1, 2, 14, 13, 1); // Slate stones
        img.disk(8, 10, 4, 0); // Hearth cavity
        img.disk(8, 11, 2, 10); // Ember amber
        img.set(8, 9, 7); // Flame yellow
        break;
      case 'window':
        img.fillRect(1, 1, 14, 14, 3);
        img.fillRect(3, 3, 10, 10, 13); // Frost glaze glass
        img.hline(3, 8, 10, 3);
        img.vline(8, 3, 10, 3);
        break;
    }
    return img;
  }
}
