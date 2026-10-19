import { CollisionGrid } from './kinematics';

export type MapId =
  | 'whispering_woods'
  | 'mossy_gearbox'
  | 'mossy_hollow'
  | 'pine_ridge'
  | 'ranger_lodge'
  | 'sketchbook';

export interface MapExit {
  x: number; // tile x
  y: number; // tile y
  targetMap: MapId;
  targetSpawn: { x: number; y: number }; // pixel position
}

export interface MapHotspot {
  id: string;
  name: string;
  x: number; // pixel x
  y: number; // pixel y
  radius: number;
  dialogueText: string;
  soundType: 'woodblock' | 'kalimba' | 'chime';
}

export interface MapDefinition {
  id: MapId;
  displayName: string;
  textureKey: string;
  tileWidth: number;
  tileHeight: number;
  defaultSpawn: { x: number; y: number };
  collisionRows: readonly string[];
  exits: readonly MapExit[];
  hotspots: readonly MapHotspot[];
}

export const MAP_DEFINITIONS: Record<MapId, MapDefinition> = {
  whispering_woods: {
    id: 'whispering_woods',
    displayName: 'THE WHISPERING WOODS',
    textureKey: 'whispering_woods_bg',
    tileWidth: 20,
    tileHeight: 12,
    defaultSpawn: { x: 105, y: 88 },
    collisionRows: [
      '##...###############',
      '##...###############',
      '##...###############',
      '#............#######',
      '.............#######',
      '...................#',
      '..............######',
      '..............######',
      '##.#####.#...#######',
      '##.#####.....#######',
      '########.....#######',
      '########.....#######',
    ],
    exits: [
      {
        x: 18,
        y: 5,
        targetMap: 'mossy_gearbox',
        targetSpawn: { x: 24, y: 80 },
      },
      {
        x: 10,
        y: 11,
        targetMap: 'mossy_hollow',
        targetSpawn: { x: 160, y: 24 },
      },
    ],
    hotspots: [
      {
        id: 'hedgehog',
        name: 'Little Hedgehog',
        x: 164,
        y: 72,
        radius: 18,
        dialogueText: 'Pip: Look! A hidden friend in the grass! 🦔🔍',
        soundType: 'woodblock',
      },
      {
        id: 'windmill',
        name: 'Windmill Water Pump',
        x: 275,
        y: 120,
        radius: 24,
        dialogueText: 'Pip: The gentle breeze spins the wooden windmill cogs! ⚙️',
        soundType: 'kalimba',
      },
      {
        id: 'stepping_stones',
        name: 'Pebble Creek Stepping Stones',
        x: 44,
        y: 136,
        radius: 18,
        dialogueText: 'Pip: Cool smooth river stones help us cross the bubbling brook! 🌊',
        soundType: 'woodblock',
      },
      {
        id: 'tree_stump',
        name: 'Mossy Tree Stump',
        x: 156,
        y: 134,
        radius: 14,
        dialogueText: 'Pip: Rings on this oak stump tell stories of past seasons. 🌳',
        soundType: 'woodblock',
      },
    ],
  },

  mossy_gearbox: {
    id: 'mossy_gearbox',
    displayName: 'THE MOSSY GEARBOX',
    textureKey: 'mossy_gearbox_bg',
    tileWidth: 20,
    tileHeight: 12,
    defaultSpawn: { x: 136, y: 104 },
    collisionRows: [
      '####################',
      '#######.########...#',
      '#######.########...#',
      '#######.##.#####...#',
      '#######.##.#####...#',
      '..................##',
      '#######...#.....####',
      '#######...##....####',
      '########........####',
      '########........####',
      '########........####',
      '####################',
    ],
    exits: [
      {
        x: 0,
        y: 5,
        targetMap: 'whispering_woods',
        targetSpawn: { x: 288, y: 80 },
      },
      {
        x: 12,
        y: 10,
        targetMap: 'pine_ridge',
        targetSpawn: { x: 140, y: 24 },
      },
    ],
    hotspots: [
      {
        id: 'beaver',
        name: 'Mr. Beaver',
        x: 216,
        y: 28,
        radius: 20,
        dialogueText: 'Mr. Beaver: "Help us mesh the gears to turn the millwheel!" 🦫',
        soundType: 'chime',
      },
      {
        id: 'waterwheel',
        name: 'Giant Waterwheel',
        x: 84,
        y: 64,
        radius: 36,
        dialogueText: 'Pip: The wooden wheel is steady and strong, waiting for gears! ⚙️',
        soundType: 'kalimba',
      },
      {
        id: 'gear_chest',
        name: 'Carved Gear Chest',
        x: 282,
        y: 44,
        radius: 22,
        dialogueText: 'Pip: Wooden gears of all diameters! Let us match the axles! 📦',
        soundType: 'chime',
      },
    ],
  },

  mossy_hollow: {
    id: 'mossy_hollow',
    displayName: 'MOSSY HOLLOW',
    textureKey: 'mossy_hollow_bg',
    tileWidth: 20,
    tileHeight: 12,
    defaultSpawn: { x: 140, y: 116 },
    collisionRows: [
      '########....########',
      '########....########',
      '###.........########',
      '###.........########',
      '###.........########',
      '###.........########',
      '###...............##',
      '..................##',
      '............########',
      '###.........########',
      '###.........########',
      '####################',
    ],
    exits: [
      {
        x: 10,
        y: 0,
        targetMap: 'whispering_woods',
        targetSpawn: { x: 160, y: 160 },
      },
      {
        x: 18,
        y: 7,
        targetMap: 'pine_ridge',
        targetSpawn: { x: 24, y: 80 },
      },
    ],
    hotspots: [
      {
        id: 'glowing_mushrooms',
        name: 'Bioluminescent Mushrooms',
        x: 256,
        y: 56,
        radius: 22,
        dialogueText: 'Pip: Whoa! These mushrooms glow gently in the hollow shade! 🍄✨',
        soundType: 'kalimba',
      },
      {
        id: 'cavern_entrance',
        name: 'Ancient Stone Cavern',
        x: 28,
        y: 88,
        radius: 22,
        dialogueText: 'Pip: The cool archway leads into the hollow mountain rock! 🪨',
        soundType: 'woodblock',
      },
    ],
  },

  pine_ridge: {
    id: 'pine_ridge',
    displayName: 'THE PINE RIDGE',
    textureKey: 'pine_ridge_bg',
    tileWidth: 20,
    tileHeight: 12,
    defaultSpawn: { x: 48, y: 96 },
    collisionRows: [
      '######....##########',
      '####........########',
      '####...##...########',
      '......####.......###',
      '......####.......###',
      '......####.......###',
      '.......##........###',
      '..................##',
      '##.#####.........###',
      '##.#####.........###',
      '########....########',
      '########....########',
    ],
    exits: [
      {
        x: 0,
        y: 5,
        targetMap: 'mossy_hollow',
        targetSpawn: { x: 280, y: 116 },
      },
      {
        x: 9,
        y: 0,
        targetMap: 'mossy_gearbox',
        targetSpawn: { x: 190, y: 156 },
      },
      {
        x: 14,
        y: 4,
        targetMap: 'ranger_lodge',
        targetSpawn: { x: 260, y: 90 },
      },
    ],
    hotspots: [
      {
        id: 'badger_burrow',
        name: 'Badger Burrow',
        x: 280,
        y: 104,
        radius: 20,
        dialogueText: 'Pip: Look at those five-toed tracks leading into the cozy burrow! 🐾',
        soundType: 'woodblock',
      },
      {
        id: 'birdhouse',
        name: 'Winter Chickadee Roost',
        x: 132,
        y: 48,
        radius: 18,
        dialogueText: 'Pip: Friendly winter birds resting safe in the snowy pine! 🐦❄️',
        soundType: 'chime',
      },
    ],
  },

  ranger_lodge: {
    id: 'ranger_lodge',
    displayName: 'THE RANGER LODGE',
    textureKey: 'ranger_lodge_bg',
    tileWidth: 20,
    tileHeight: 12,
    defaultSpawn: { x: 110, y: 90 },
    collisionRows: [
      '####################',
      '####################',
      '######..............',
      '######..............',
      '######..............',
      '######..............',
      '######..########....',
      '######..########....',
      '######..########....',
      '######..########....',
      '##..................',
      '####################',
    ],
    exits: [
      {
        x: 18,
        y: 5,
        targetMap: 'pine_ridge',
        targetSpawn: { x: 220, y: 80 },
      },
    ],
    hotspots: [
      {
        id: 'fireplace',
        name: 'Stone Hearth Fireplace',
        x: 96,
        y: 48,
        radius: 24,
        dialogueText: 'Pip: A warm, crackling cedar fire warms the snowy night! 🔥',
        soundType: 'kalimba',
      },
      {
        id: 'sleeping_bear',
        name: 'Sleeping Brown Bear',
        x: 64,
        y: 116,
        radius: 26,
        dialogueText: 'Pip: Shh... the big bear is fast asleep until spring! 🐻💤',
        soundType: 'woodblock',
      },
      {
        id: 'celebration_table',
        name: 'Celebration Banquet Table',
        x: 200,
        y: 96,
        radius: 28,
        dialogueText: 'Pip: A joyful forest harvest feast with all our woodland friends! 🍎🫐',
        soundType: 'chime',
      },
    ],
  },

  sketchbook: {
    id: 'sketchbook',
    displayName: 'RANGER SKETCHBOOK',
    textureKey: 'sketchbook_bg',
    tileWidth: 20,
    tileHeight: 12,
    defaultSpawn: { x: 160, y: 96 },
    collisionRows: [
      '####################',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '####################',
    ],
    exits: [],
    hotspots: [],
  },
};

/** Creates a CollisionGrid instance for the given map ID. */
export function createCollisionGridForMap(mapId: MapId): CollisionGrid {
  const def = MAP_DEFINITIONS[mapId] ?? MAP_DEFINITIONS.whispering_woods;
  return CollisionGrid.fromRows(def.collisionRows, '#');
}

/** Resolves map ID for a given chapter ID. */
export function getMapIdForChapter(chapterId: number): MapId {
  if (chapterId >= 1 && chapterId <= 5) return 'whispering_woods';
  if (chapterId === 6 || chapterId === 7) return 'mossy_gearbox';
  if (chapterId >= 8 && chapterId <= 11) return 'mossy_hollow';
  if (chapterId === 12) return 'sketchbook';
  if (chapterId >= 13 && chapterId <= 15) return 'mossy_hollow';
  if (chapterId >= 16 && chapterId <= 19) return 'pine_ridge';
  if (chapterId === 20) return 'ranger_lodge';
  return 'whispering_woods';
}
