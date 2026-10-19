import { IndexedImage, TRANSPARENT } from './indexed';

/**
 * Procedural Sprite Generator for Junior Ranger, Pip, and forest animals/props.
 * All art is generated as IndexedImage buffers using exclusively the 16-color Whispering Woods palette.
 */

const PALETTE_LEGEND: Readonly<Record<string, number>> = {
  '0': 0, '1': 1, '2': 2, '3': 3,
  '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, 'A': 10, 'B': 11,
  'C': 12, 'D': 13, 'E': 14, 'F': 15,
};

const BRAMBLE_RIGHT_0 = [
  '...........93...........',
  '........99999993........',
  '.......99999993333......',
  '.......99999993333......',
  '......22299999333999....',
  '......22299999999993....',
  '......22299999993999....',
  '......22299EEEEE0E......',
  '......2229988EE00E......',
  '.......399988EE008......',
  '........33388EEEEE......',
  '...99999.3388EEE2E......',
  '..2999992..EEEEEEE......',
  '...9999988EEEE8.........',
  '...9999922EEEE8.........',
  '..3333332288EEEE...0.77.',
  '..3999932288EEEE0DD0E77.',
  '..3999932288EEEE0DD0E77.',
  '..2999932288888.0DD0E77.',
  '..3999932288888....0.77.',
  '..3333338888888.........',
  '.......1111111..........',
  '.......1DDDDD1..........',
  '.......1DDDDD1..........',
  '.......1111111..........',
  '........EE.EE...........',
  '........EE.EE...........',
  '........EE.EE...........',
  '.......333.3333.........',
  '.......333.3333.........',
  '......033303333.........',
  '........................'
];

const BRAMBLE_RIGHT_1 = [
  '........................',
  '...........93...........',
  '........99999993........',
  '.......99999993333......',
  '.......99999993333......',
  '......22299999333999....',
  '......22299999999993....',
  '......22299999993999....',
  '......22299EEEEE0E......',
  '......2229988EE00E......',
  '.......399988EE008......',
  '........33388EEEEE......',
  '...99999.3388EEE2E......',
  '..2999992..EEEEEEE......',
  '...9999988EEEE8.........',
  '...9999922EEEE8.........',
  '..3333332288EEEE...0.77.',
  '..3999932288EEEE0DD0E77.',
  '..3999932288EEEE0DD0E77.',
  '..2999932288888.0DD0E77.',
  '..3999932288888....0.77.',
  '..3333338888888.........',
  '.......1111111..........',
  '.......1DDDDD1..........',
  '.......1DDDDD1..........',
  '.......1111111..........',
  '.........EEE............',
  '.........EEE............',
  '.........EEE............',
  '.........3333...........',
  '.........3333...........',
  '........03333...........'
];

const BRAMBLE_RIGHT_2 = [
  '...........93...........',
  '........99999993........',
  '.......99999993333......',
  '.......99999993333......',
  '......22299999333999....',
  '......22299999999993....',
  '......22299999993999....',
  '......22299EEEEE0E......',
  '......2229988EE00E......',
  '.......399988EE008......',
  '........33388EEEEE......',
  '...99999.3388EEE2E......',
  '..2999992..EEEEEEE......',
  '...9999988EEEE8.........',
  '...9999922EEEE8.........',
  '..3333332288EEEE...0.77.',
  '..3999932288EEEE0DD0E77.',
  '..3999932288EEEE0DD0E77.',
  '..2999932288888.0DD0E77.',
  '..3999932288888....0.77.',
  '..3333338888888.........',
  '.......1111111..........',
  '.......1DDDDD1..........',
  '.......1DDDDD1..........',
  '.......1111111..........',
  '........EE.EE...........',
  '........EE.EE...........',
  '........EE.EE...........',
  '......3333.333..........',
  '......3333.333..........',
  '......333303330.........',
  '........................'
];

const BRAMBLE_DOWN_0 = [
  '..........9933..........',
  '........99999933........',
  '.......9999999933.......',
  '.......9999999933.......',
  '......229999999922......',
  '......229999999922......',
  '......229999999922......',
  '......22EEEEEEEE22......',
  '......22E0E0EE0E22......',
  '.......3E0E0EE083.......',
  '........8EEEEEE8........',
  '....33..88EEEE88..33....',
  '...3333.88EEEE88.3333...',
  '...3333.38EEEE83.3333...',
  '...2222.38888883.2222...',
  '....22..38888883..22....',
  '........38888883........',
  '........880DD088........',
  '........880EE088........',
  '........88888888........',
  '.......1111111111.......',
  '.......1DDDDDDDD1.......',
  '.......1DDDDDDDD1.......',
  '.......1111111111.......',
  '........EE....EE........',
  '........EE....EE........',
  '........EE....EE........',
  '.......3333..3333.......',
  '.......3333..3333.......',
  '......033330033330......',
  '........................',
  '........................'
];

const BRAMBLE_DOWN_1 = [
  '........................',
  '..........9933..........',
  '........99999933........',
  '.......9999999933.......',
  '.......9999999933.......',
  '......229999999922......',
  '......229999999922......',
  '......229999999922......',
  '......22EEEEEEEE22......',
  '......22E0E0EE0E22......',
  '.......3E0E0EE083.......',
  '........8EEEEEE8........',
  '....33..88EEEE88..33....',
  '...3333.88EEEE88.3333...',
  '...3333.38EEEE83.3333...',
  '...2222.38888883.2222...',
  '....22..38888883..22....',
  '........38888883........',
  '........880DD088........',
  '........880EE088........',
  '........88888888........',
  '.......1111111111.......',
  '.......1DDDDDDDD1.......',
  '.......1DDDDDDDD1.......',
  '.......1111111111.......',
  '..........EEEE..........',
  '..........EEEE..........',
  '..........EEEE..........',
  '.........333333.........',
  '.........333333.........',
  '........03333330........',
  '........................'
];

const BRAMBLE_UP_0 = [
  '..........9933..........',
  '........99999933........',
  '.......9999999933.......',
  '.......9999999933.......',
  '......229999999922......',
  '......229999999922......',
  '......229999999922......',
  '......222222222222......',
  '......222222222222......',
  '.......3333333333.......',
  '........33333333........',
  '....33..33333333..33....',
  '...3333.33333333.3333...',
  '...3333.33333333.3333...',
  '...2222.33333333.2222...',
  '....22..33333333..22....',
  '........33333333........',
  '........88888888........',
  '........88888888........',
  '........88888888........',
  '.......1111111111.......',
  '.......1DDDDDDDD1.......',
  '.......1DDDDDDDD1.......',
  '.......1111111111.......',
  '........EE....EE........',
  '........EE....EE........',
  '........EE....EE........',
  '.......3333..3333.......',
  '.......3333..3333.......',
  '......033330033330......',
  '........................',
  '........................'
];

const PIP_ROWS_0 = [
  '........................',
  '........................',
  '.............7..........',
  '....4......57.5.........',
  '...445...555554.........',
  '.944444..5555544........',
  '.99444..55555554........',
  '9999499.455555444.......',
  '.299999..5555544........',
  '.999999.944544449.......',
  '.99999999944444EE9......',
  '..299999988E4EEE0E......',
  '..999999988EEEE00E0.....',
  '....9.9998EEEEE00EE.....',
  '.......9888EEEEEE28.....',
  '.......9988E88EEEE......',
  '.......9988888EEE8......',
  '........988888E888......',
  '.........98888888.......',
  '.........33.9833........',
  '.........33...33........',
  '........................',
  '........................',
  '........................'
];

const PIP_ROWS_1 = [
  '........................',
  '.............7..........',
  '....4......57.5.........',
  '...445...555554.........',
  '.944444..5555544........',
  '.99444..55555554........',
  '9999499.455555444.......',
  '.299999..5555544........',
  '.999999.944544449.......',
  '.99999999944444EE9......',
  '..299999988E4EEE0E......',
  '..999999988EEEE00E0.....',
  '....9.9998EEEEE00EE.....',
  '.......9888EEEEEE28.....',
  '.......9988E88EEEE......',
  '.......9988888EEE8......',
  '........988888E888......',
  '.........93383388.......',
  '..........33933.........',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................'
];

const PIP_ROWS_2 = [
  '.............7..........',
  '....4......57.5.........',
  '...445...555554.........',
  '.944444..5555544........',
  '.99444..55555554........',
  '9999499.455555444.......',
  '.299999..5555544........',
  '.999999.944544449.......',
  '.99999999944444EE9......',
  '..299999988E4EEE0E......',
  '..999999988EEEE00E0.....',
  '....9.9998EEEEE00EE.....',
  '.......9888EEEEEE28.....',
  '.......9988E88EEEE......',
  '.......9988888EEE8......',
  '........988888E888......',
  '.........93383388.......',
  '..........33933.........',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................'
];

export class SpriteGenerator {
  /**
   * Generates Junior Ranger Bramble sprite in 4 directions and walk phases.
   * Directions: 'down' | 'up' | 'left' | 'right'
   * Frame: 0 (contact L), 1 (pass), 2 (contact R), 3 (pass)
   * Size: 24x32 px on Whispering Woods 16-color palette.
   */
  static generateRangerFrame(direction: 'down' | 'up' | 'left' | 'right', frame: number): IndexedImage {
    const f = frame % 4;

    if (direction === 'right') {
      const rows = f === 0 ? BRAMBLE_RIGHT_0 : f === 2 ? BRAMBLE_RIGHT_2 : BRAMBLE_RIGHT_1;
      return IndexedImage.fromRows(rows, PALETTE_LEGEND);
    }

    if (direction === 'left') {
      const rows = f === 0 ? BRAMBLE_RIGHT_0 : f === 2 ? BRAMBLE_RIGHT_2 : BRAMBLE_RIGHT_1;
      const base = IndexedImage.fromRows(rows, PALETTE_LEGEND);
      const flipped = IndexedImage.create(24, 32, TRANSPARENT);
      flipped.blit(base, 0, 0, true);
      return flipped;
    }

    if (direction === 'down') {
      const rows = f % 2 === 1 ? BRAMBLE_DOWN_1 : BRAMBLE_DOWN_0;
      const img = IndexedImage.fromRows(rows, PALETTE_LEGEND);
      if (f === 2) {
        // Step offset
        const flipped = IndexedImage.create(24, 32, TRANSPARENT);
        flipped.blit(img, 0, 0, true);
        return flipped;
      }
      return img;
    }

    // direction === 'up'
    const rows = f % 2 === 1 ? BRAMBLE_DOWN_1 : BRAMBLE_UP_0;
    const img = IndexedImage.fromRows(rows, PALETTE_LEGEND);
    if (f === 2) {
      const flipped = IndexedImage.create(24, 32, TRANSPARENT);
      flipped.blit(img, 0, 0, true);
      return flipped;
    }
    return img;
  }

  /**
   * Generates Pip companion sprite.
   * State: 'FOLLOWING' (walk hop) | 'IDLE_CURIOUS' | 'INSPECTING' | 'YAWNING' | 'SLEEPING'
   * Size: 24x24 px on Whispering Woods 16-color palette.
   */
  static generatePipFrame(
    state: 'FOLLOWING' | 'IDLE_CURIOUS' | 'INSPECTING' | 'YAWNING' | 'SLEEPING',
    frame: number
  ): IndexedImage {
    if (state === 'SLEEPING') {
      const img = IndexedImage.fromRows(PIP_ROWS_0, PALETTE_LEGEND);
      // Sleeping eyes shut (closed slit)
      img.set(16, 12, 0);
      img.set(17, 12, 0);
      img.set(18, 12, 0);
      if (frame % 2 === 1) {
        // Zzz floating
        img.set(19, 4, 14);
        img.set(20, 4, 14);
        img.set(20, 5, 14);
        img.set(19, 6, 14);
        img.set(20, 6, 14);
      }
      return img;
    }

    if (state === 'YAWNING') {
      const img = IndexedImage.fromRows(PIP_ROWS_0, PALETTE_LEGEND);
      // Open yawn mouth (Rowan Berry Red)
      img.fillRect(17, 13, 2, 2, 11);
      return img;
    }

    if (state === 'INSPECTING') {
      const img = IndexedImage.fromRows(PIP_ROWS_0, PALETTE_LEGEND);
      // Magnifying glass inspecting tracks (Frost glaze blue lens + Weathered oak handle)
      img.disk(18, 18, 2, 13);
      img.line(16, 20, 14, 22, 3);
      return img;
    }

    if (state === 'IDLE_CURIOUS') {
      const img = IndexedImage.fromRows(PIP_ROWS_0, PALETTE_LEGEND);
      // Bright alert eye with shine
      img.set(16, 11, 14);
      img.set(17, 12, 0);
      return img;
    }

    // FOLLOWING (walk hop)
    const f = frame % 4;
    const rows = f === 0 ? PIP_ROWS_0 : f === 2 ? PIP_ROWS_2 : PIP_ROWS_1;
    return IndexedImage.fromRows(rows, PALETTE_LEGEND);
  }

  /**
   * Generates woodland animals for discoveries and puzzles.
   */
  static generateAnimal(kind: 'hedgehog' | 'badger' | 'duckling' | 'sparrow' | 'rabbit' | 'chipmunk'): IndexedImage {
    const img = IndexedImage.create(24, 24, TRANSPARENT);
    switch (kind) {
      case 'hedgehog': {
        // Spiny dome (3 Weathered Oak / 2 Deep Bark)
        img.disk(12, 14, 7, 2);
        // Snout (8 River Clay)
        img.fillRect(4, 14, 5, 4, 8);
        img.set(3, 15, 0); // Black nose
        img.set(6, 14, 0); // Eye
        // Little prickles
        for (let i = 8; i <= 18; i += 2) {
          img.set(i, 7, 3);
          img.set(i + 1, 9, 3);
        }
        break;
      }
      case 'badger': {
        // Body (1 Deep Forest Slate)
        img.disk(12, 14, 8, 1);
        // White head stripe (14 Winter Snowdrift)
        img.fillRect(4, 12, 7, 4, 14);
        img.fillRect(5, 11, 2, 6, 0); // Black stripe through eye
        img.fillRect(5, 17, 2, 2, 0);
        img.set(3, 14, 0); // Nose
        break;
      }
      case 'duckling': {
        // Body (7 Soft Sprout Yellow)
        img.disk(12, 14, 5, 7);
        img.disk(15, 10, 4, 7); // Head
        img.fillRect(18, 10, 3, 2, 10); // Orange bill (10 Amber)
        img.set(16, 9, 0); // Eye
        img.fillRect(11, 19, 2, 2, 10); // Foot
        break;
      }
      case 'sparrow': {
        // Body (9 Acorn Brown / 8 Tan)
        img.disk(11, 13, 5, 9);
        img.disk(14, 9, 3, 8);
        img.fillRect(16, 9, 3, 1, 7); // Yellow beak
        img.set(14, 8, 0); // Eye
        img.line(7, 14, 4, 16, 2); // Tail
        break;
      }
      case 'rabbit': {
        // Body (14 Snowdrift White)
        img.disk(11, 14, 6, 14);
        img.disk(15, 10, 4, 14);
        // Tall ears
        img.fillRect(13, 3, 2, 6, 14);
        img.fillRect(16, 4, 2, 5, 14);
        img.set(14, 4, 11); // Pink inner ear (Rowan Berry)
        img.set(16, 10, 0); // Eye
        break;
      }
      case 'chipmunk': {
        // Body (10 Autumn Amber with stripe 15 Cream & 0 Shadow)
        img.disk(11, 14, 5, 10);
        img.line(7, 13, 15, 13, 0);
        img.line(7, 14, 15, 14, 15);
        img.disk(14, 10, 3, 10);
        img.set(15, 9, 0);
        // Bushy tail curved up
        img.line(6, 15, 4, 10, 9);
        img.line(4, 10, 5, 6, 9);
        break;
      }
    }
    return img;
  }

  /**
   * Generates item icons for the Satchel and puzzles.
   */
  static generateItemIcon(
    kind: 'lantern' | 'flashlight' | 'magnifier' | 'gear_s' | 'gear_m' | 'gear_l' | 'acorn' | 'pinecone' | 'leaf_oak' | 'leaf_willow'
  ): IndexedImage {
    const img = IndexedImage.create(24, 24, TRANSPARENT);

    switch (kind) {
      case 'lantern': {
        img.fillRect(7, 6, 10, 14, 3); // Brass frame
        img.fillRect(9, 9, 6, 8, 7); // Glowing core (Soft Sprout Yellow)
        img.fillRect(10, 11, 4, 4, 15); // White hot center
        img.line(9, 4, 15, 4, 8); // Handle
        break;
      }
      case 'flashlight': {
        img.fillRect(6, 10, 12, 6, 2); // Dark barrel
        img.fillRect(16, 8, 4, 10, 3); // Lens cone
        img.fillRect(19, 9, 2, 8, 7); // Yellow beam glass
        break;
      }
      case 'magnifier': {
        img.disk(11, 10, 6, 13); // Lens (Frost Glaze Blue)
        img.strokeRect(5, 4, 12, 12, 3); // Wood frame
        img.line(16, 15, 21, 20, 9); // Wood handle
        img.line(17, 16, 22, 21, 9);
        break;
      }
      case 'gear_s': {
        // Small gear (radius 8, 8 teeth)
        img.disk(12, 12, 6, 9);
        img.set(12, 12, 0); // Axle hole
        // 4 cardinal teeth
        img.set(12, 4, 9); img.set(12, 20, 9);
        img.set(4, 12, 9); img.set(20, 12, 9);
        break;
      }
      case 'gear_m': {
        // Medium gear (radius 10)
        img.disk(12, 12, 8, 9);
        img.disk(12, 12, 2, 0); // Axle hole
        // 8 teeth
        img.fillRect(11, 2, 2, 3, 9);
        img.fillRect(11, 19, 2, 3, 9);
        img.fillRect(2, 11, 3, 2, 9);
        img.fillRect(19, 11, 3, 2, 9);
        break;
      }
      case 'gear_l': {
        // Large gear (radius 11)
        img.disk(12, 12, 10, 9);
        img.disk(12, 12, 3, 0); // Axle hole
        // Teeth around rim
        img.fillRect(10, 0, 4, 3, 9);
        img.fillRect(10, 21, 4, 3, 9);
        img.fillRect(0, 10, 3, 4, 9);
        img.fillRect(21, 10, 3, 4, 9);
        break;
      }
      case 'acorn': {
        img.disk(12, 14, 5, 8); // Tan body
        img.fillRect(7, 9, 10, 4, 9); // Acorn cap
        img.line(12, 9, 12, 6, 3); // Stem
        break;
      }
      case 'pinecone': {
        img.disk(12, 12, 6, 9);
        // Pattern of scales
        for (let y = 8; y <= 16; y += 2) {
          for (let x = 8; x <= 16; x += 2) {
            img.set(x, y, 3);
          }
        }
        break;
      }
      case 'leaf_oak': {
        // Lobed oak leaf (10 Autumn Amber / 5 Woodland Olive)
        img.fillRect(8, 7, 8, 12, 10);
        img.set(6, 9, 10); img.set(17, 9, 10); // Lobes
        img.set(6, 13, 10); img.set(17, 13, 10);
        img.line(12, 6, 12, 21, 3); // Stem
        break;
      }
      case 'leaf_willow': {
        // Slender willow leaf (6 Golden Willow)
        img.line(12, 4, 12, 20, 6);
        img.fillRect(11, 7, 3, 10, 6);
        img.line(12, 20, 12, 23, 3); // Stem
        break;
      }
    }

    return img;
  }

  /**
   * Generates tactile Satchel button tokens.
   */
  static generateSatchelButton(
    icon: 'dpad_arrow' | 'look' | 'backpack' | 'pip_face' | 'advance_leaf',
    isPressed = false
  ): IndexedImage {
    const img = IndexedImage.create(32, 32, TRANSPARENT);
    const pressOffset = isPressed ? 2 : 0;

    // Wood token base (3 Weathered Oak outer ring, 8 River Clay Tan interior)
    img.disk(16, 16 + pressOffset, 14, 3);
    img.disk(16, 16 + pressOffset, 12, 8);

    // Inner icon
    const cy = 16 + pressOffset;
    switch (icon) {
      case 'dpad_arrow':
        img.fillRect(15, cy - 6, 3, 12, 2);
        img.fillRect(10, cy - 1, 13, 3, 2);
        break;
      case 'look':
        // Eye / Magnifier symbol
        img.disk(16, cy, 5, 2);
        img.disk(16, cy, 3, 15);
        img.set(16, cy, 0);
        break;
      case 'backpack':
        // Satchel bag
        img.fillRect(10, cy - 4, 12, 10, 2);
        img.fillRect(11, cy - 3, 10, 3, 9);
        break;
      case 'pip_face':
        // Pip face
        img.disk(16, cy, 6, 9);
        img.set(14, cy - 1, 0);
        img.set(18, cy - 1, 0);
        img.line(14, cy + 2, 18, cy + 2, 8);
        break;
      case 'advance_leaf':
        // Pulsing leaf symbol to proceed
        img.ellipse(16, cy, 6, 4, 6);
        img.line(11, cy + 3, 21, cy - 3, 4);
        break;
    }

    return img;
  }
}
