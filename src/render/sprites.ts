import { IndexedImage, TRANSPARENT } from './indexed';

/**
 * Procedural Sprite Generator for Junior Ranger, Pip, and forest animals/props.
 * All art is generated as IndexedImage buffers using exclusively the 16-color Whispering Woods palette.
 */

// Helper to draw a character sprite on a 16x16 or 24x24 canvas
export class SpriteGenerator {
  /**
   * Generates Junior Ranger sprite in 4 directions and walk phases.
   * Directions: 'down' | 'up' | 'left' | 'right'
   * Frame: 0 (contact L), 1 (pass), 2 (contact R), 3 (pass)
   */
  static generateRangerFrame(direction: 'down' | 'up' | 'left' | 'right', frame: number): IndexedImage {
    const img = IndexedImage.create(16, 20, TRANSPARENT);
    const walkBob = frame % 2 === 1 ? 0 : 1; // 1px vertical bob during contact

    // Head / Hat (Hat: 3 Weathered Oak, Brim: 8 River Clay Tan)
    img.fillRect(5, 1 + walkBob, 6, 2, 3); // Hat crown
    img.fillRect(4, 3 + walkBob, 8, 1, 8); // Hat brim

    // Face / Hair
    if (direction === 'down') {
      img.fillRect(5, 4 + walkBob, 6, 4, 15); // Face cream
      img.set(6, 5 + walkBob, 0); // Left eye
      img.set(9, 5 + walkBob, 0); // Right eye
      img.fillRect(5, 4 + walkBob, 1, 2, 2); // Left hair tuft
      img.fillRect(10, 4 + walkBob, 1, 2, 2); // Right hair tuft
    } else if (direction === 'up') {
      img.fillRect(5, 4 + walkBob, 6, 4, 2); // Back hair umber
    } else if (direction === 'left') {
      img.fillRect(5, 4 + walkBob, 5, 4, 15);
      img.set(6, 5 + walkBob, 0); // Eye
      img.fillRect(8, 4 + walkBob, 2, 4, 2); // Back hair
    } else {
      img.fillRect(6, 4 + walkBob, 5, 4, 15);
      img.set(9, 5 + walkBob, 0); // Eye
      img.fillRect(6, 4 + walkBob, 2, 4, 2); // Back hair
    }

    // Woolen Coat (5 Woodland Olive with 4 Deep Moss Green shading)
    img.fillRect(4, 8 + walkBob, 8, 6, 5);
    img.strokeRect(4, 8 + walkBob, 8, 6, 4);

    // Satchel on hip (8 River Clay Tan, strap 9 Warm Acorn Brown)
    if (direction === 'down' || direction === 'right') {
      img.fillRect(10, 11 + walkBob, 3, 3, 8);
      img.line(5, 8 + walkBob, 10, 11 + walkBob, 9);
    } else if (direction === 'left') {
      img.fillRect(3, 11 + walkBob, 3, 3, 8);
      img.line(10, 8 + walkBob, 5, 11 + walkBob, 9);
    }

    // Boots (3 Weathered Oak)
    const legOffset = frame === 0 ? -1 : frame === 2 ? 1 : 0;
    img.fillRect(5 + legOffset, 14 + walkBob, 2, 4, 3);
    img.fillRect(9 - legOffset, 14 + walkBob, 2, 4, 3);

    return img;
  }

  /**
   * Generates Pip companion sprite.
   * State: 'FOLLOWING' (walk hop) | 'IDLE_CURIOUS' | 'INSPECTING' | 'YAWNING' | 'SLEEPING'
   */
  static generatePipFrame(
    state: 'FOLLOWING' | 'IDLE_CURIOUS' | 'INSPECTING' | 'YAWNING' | 'SLEEPING',
    frame: number
  ): IndexedImage {
    const img = IndexedImage.create(16, 16, TRANSPARENT);

    if (state === 'SLEEPING') {
      // Curled up sleeping in a moss/leaf nest
      img.disk(8, 9, 5, 9); // Acorn brown body
      img.disk(8, 10, 3, 8); // River clay belly
      img.ellipse(11, 8, 3, 2, 10); // Curled tail
      // Sleeping shut eye slits
      img.set(6, 9, 0);
      img.set(7, 9, 0);
      // Small "Z" indicator if frame % 2 === 1
      if (frame % 2 === 1) {
        img.set(12, 3, 14);
        img.set(13, 3, 14);
        img.set(13, 4, 14);
        img.set(12, 5, 14);
        img.set(13, 5, 14);
      }
      return img;
    }

    if (state === 'YAWNING') {
      img.disk(8, 8, 5, 9); // Body
      img.disk(8, 9, 3, 8); // Belly
      // Oversized ears slumping
      img.fillRect(4, 3, 2, 3, 9);
      img.fillRect(10, 3, 2, 3, 9);
      // Closed eyes + open mouth
      img.set(6, 7, 0);
      img.set(10, 7, 0);
      img.fillRect(7, 8, 2, 2, 11); // Open yawn mouth (Rowan Berry Red)
      return img;
    }

    // Hop offset for following
    const hopY = state === 'FOLLOWING' && (frame === 1 || frame === 2) ? -2 : 0;

    // Body (9 Warm Acorn Brown)
    img.disk(8, 9 + hopY, 5, 9);

    // Belly patch (8 River Clay Tan)
    img.disk(8, 10 + hopY, 3, 8);

    // Large ears (9 Acorn Brown, inner 7 Sprout Yellow)
    img.fillRect(4, 2 + hopY, 3, 4, 9);
    img.set(5, 3 + hopY, 7);
    img.fillRect(9, 2 + hopY, 3, 4, 9);
    img.set(10, 3 + hopY, 7);

    // Curled squirrel tail (10 Autumn Amber)
    img.fillRect(12, 5 + hopY, 3, 5, 10);
    img.set(13, 4 + hopY, 10);

    // Eyes
    if (state === 'IDLE_CURIOUS') {
      // Alert wide eyes with highlight
      img.fillRect(6, 6 + hopY, 2, 2, 0);
      img.set(6, 6 + hopY, 15);
      img.fillRect(9, 6 + hopY, 2, 2, 0);
      img.set(9, 6 + hopY, 15);
    } else if (state === 'INSPECTING') {
      // Looking down focused
      img.fillRect(6, 7 + hopY, 2, 2, 0);
      img.fillRect(9, 7 + hopY, 2, 2, 0);
      // Small magnifying glass held in front paws (13 Frost Glaze + 3 Oak handle)
      img.disk(5, 11 + hopY, 2, 13);
      img.line(4, 13 + hopY, 2, 15 + hopY, 3);
    } else {
      // Normal friendly eyes
      img.set(6, 7 + hopY, 0);
      img.set(9, 7 + hopY, 0);
    }

    return img;
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
