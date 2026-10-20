import { CollisionGrid } from './kinematics';

export type MapId =
  | 'whispering_woods'
  | 'mossy_gearbox'
  | 'mossy_hollow'
  | 'pine_ridge'
  | 'ranger_lodge'
  | 'sketchbook'
  | 'ranger_cabin'
  | 'pebble_creek'
  | 'sunset_meadow'
  | 'winter_lodge';

export interface MapExit {
  x: number; // tile x
  y: number; // tile y
  radius?: number; // pixel trigger radius
  direction: 'east' | 'west' | 'north' | 'south' | 'door';
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
  // 1. RANGER CABIN & GARDEN (Starting safe zone)
  ranger_cabin: {
    id: 'ranger_cabin',
    displayName: 'RANGER CABIN & GARDEN',
    textureKey: 'ranger_cabin_bg',
    tileWidth: 20,
    tileHeight: 12,
    defaultSpawn: { x: 100, y: 88 },
    collisionRows: [
      '####################',
      '###.#####.###.######',
      '###.#...#.#.#.######',
      '###.#...#.#.#.##..##',
      '###.#...#...#.....##',
      '###...............##',
      '###...............##',
      '###.........#.....##',
      '########...#########',
      '########...#########',
      '########...#########',
      '########...#########',
    ],
    exits: [
      {
        x: 9,
        y: 11,
        radius: 22,
        direction: 'south',
        targetMap: 'pebble_creek',
        targetSpawn: { x: 80, y: 24 },
      },
      {
        x: 8,
        y: 11,
        radius: 22,
        direction: 'south',
        targetMap: 'whispering_woods',
        targetSpawn: { x: 80, y: 24 },
      },
      {
        x: 3,
        y: 1,
        radius: 18,
        direction: 'door',
        targetMap: 'ranger_lodge',
        targetSpawn: { x: 100, y: 96 },
      },
      {
        x: 3,
        y: 1,
        radius: 18,
        direction: 'door',
        targetMap: 'winter_lodge',
        targetSpawn: { x: 100, y: 96 },
      },
    ],
    hotspots: [
      {
        id: 'fireplace',
        name: 'Cast Iron Stove',
        x: 125,
        y: 45,
        radius: 20,
        dialogueText: 'Pip: The warm hearth crackles softly! Safe and sound indoors. 🔥',
        soundType: 'kalimba',
      },
      {
        id: 'bookshelf',
        name: 'Ranger Field Library',
        x: 36,
        y: 50,
        radius: 20,
        dialogueText: 'Pip: Books on flora, fauna, and animal tracks across the woods! 📚',
        soundType: 'woodblock',
      },
      {
        id: 'nature_table',
        name: 'Junior Ranger Desk',
        x: 60,
        y: 90,
        radius: 22,
        dialogueText: 'Pip: A handcrafted cedar desk with nature pressings and dried acorns! 🌰',
        soundType: 'woodblock',
      },
      {
        id: 'vegetable_garden',
        name: 'Backyard Garden Patch',
        x: 245,
        y: 60,
        radius: 24,
        dialogueText: 'Pip: Crisp sweet carrots and plump cabbages for woodland snacks! 🥕',
        soundType: 'chime',
      },
    ],
  },

  // 2. PEBBLE CREEK / WHISPERING WOODS (Spring)
  whispering_woods: {
    id: 'whispering_woods',
    displayName: 'THE WHISPERING WOODS',
    textureKey: 'whispering_woods_bg',
    tileWidth: 20,
    tileHeight: 12,
    defaultSpawn: { x: 64, y: 48 },
    collisionRows: [
      '####...#############',
      '###....#############',
      '##...........#######',
      '##...........#######',
      '#.....###......#####',
      '#....#####..........',
      '##...#####..........',
      '##..######.....#####',
      '#...#######....#####',
      '#...#######...######',
      '############..######',
      '####################',
    ],
    exits: [
      {
        x: 19,
        y: 6,
        radius: 22,
        direction: 'east',
        targetMap: 'mossy_gearbox',
        targetSpawn: { x: 16, y: 96 },
      },
      {
        x: 19,
        y: 5,
        radius: 22,
        direction: 'east',
        targetMap: 'mossy_hollow',
        targetSpawn: { x: 16, y: 96 },
      },
      {
        x: 5,
        y: 0,
        radius: 22,
        direction: 'north',
        targetMap: 'ranger_cabin',
        targetSpawn: { x: 144, y: 168 },
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
        x: 160,
        y: 48,
        radius: 20,
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

  pebble_creek: {
    id: 'pebble_creek',
    displayName: 'PEBBLE CREEK (SPRING)',
    textureKey: 'pebble_creek_bg',
    tileWidth: 20,
    tileHeight: 12,
    defaultSpawn: { x: 64, y: 48 },
    collisionRows: [
      '####...#############',
      '###....#############',
      '##...........#######',
      '##...........#######',
      '#.....###......#####',
      '#....#####..........',
      '##...#####..........',
      '##..######.....#####',
      '#...#######....#####',
      '#...#######...######',
      '############..######',
      '####################',
    ],
    exits: [
      {
        x: 19,
        y: 6,
        radius: 22,
        direction: 'east',
        targetMap: 'mossy_hollow',
        targetSpawn: { x: 16, y: 96 },
      },
      {
        x: 5,
        y: 0,
        radius: 22,
        direction: 'north',
        targetMap: 'ranger_cabin',
        targetSpawn: { x: 144, y: 168 },
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
        id: 'stepping_stones',
        name: 'Pebble Creek Stepping Stones',
        x: 160,
        y: 48,
        radius: 20,
        dialogueText: 'Pip: Cool smooth river stones help us cross the bubbling brook! 🌊',
        soundType: 'woodblock',
      },
    ],
  },

  // 3. MOSSY GEARBOX & MOSSY HOLLOW (Summer)
  mossy_gearbox: {
    id: 'mossy_gearbox',
    displayName: 'THE MOSSY GEARBOX',
    textureKey: 'mossy_gearbox_bg',
    tileWidth: 20,
    tileHeight: 12,
    defaultSpawn: { x: 136, y: 104 },
    collisionRows: [
      '####################',
      '####################',
      '###.######...#######',
      '##..######...#######',
      '#...######...#######',
      '....######..########',
      '....................',
      '#...................',
      '###................#',
      '####........########',
      '####################',
      '####################',
    ],
    exits: [
      {
        x: 0,
        y: 5,
        radius: 22,
        direction: 'west',
        targetMap: 'whispering_woods',
        targetSpawn: { x: 296, y: 96 },
      },
      {
        x: 19,
        y: 6,
        radius: 22,
        direction: 'east',
        targetMap: 'sunset_meadow',
        targetSpawn: { x: 16, y: 128 },
      },
      {
        x: 19,
        y: 7,
        radius: 22,
        direction: 'east',
        targetMap: 'pine_ridge',
        targetSpawn: { x: 16, y: 96 },
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
    defaultSpawn: { x: 136, y: 104 },
    collisionRows: [
      '####################',
      '####################',
      '###.######...#######',
      '##..######...#######',
      '#...######...#######',
      '....######..########',
      '....................',
      '#...................',
      '###................#',
      '####........########',
      '####################',
      '####################',
    ],
    exits: [
      {
        x: 0,
        y: 5,
        radius: 22,
        direction: 'west',
        targetMap: 'pebble_creek',
        targetSpawn: { x: 296, y: 96 },
      },
      {
        x: 0,
        y: 6,
        radius: 22,
        direction: 'west',
        targetMap: 'whispering_woods',
        targetSpawn: { x: 296, y: 96 },
      },
      {
        x: 19,
        y: 6,
        radius: 22,
        direction: 'east',
        targetMap: 'sunset_meadow',
        targetSpawn: { x: 16, y: 128 },
      },
      {
        x: 19,
        y: 7,
        radius: 22,
        direction: 'east',
        targetMap: 'pine_ridge',
        targetSpawn: { x: 16, y: 96 },
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

  // 4. SUNSET MEADOW (Autumn)
  sunset_meadow: {
    id: 'sunset_meadow',
    displayName: 'SUNSET MEADOW (AUTUMN)',
    textureKey: 'sunset_meadow_bg',
    tileWidth: 20,
    tileHeight: 12,
    defaultSpawn: { x: 60, y: 140 },
    collisionRows: [
      '####################',
      '####################',
      '#######...##########',
      '######....##########',
      '####.......#########',
      '###.................',
      '##..................',
      '##.................#',
      '...................#',
      '...................#',
      '####################',
      '####################',
    ],
    exits: [
      {
        x: 0,
        y: 8,
        radius: 22,
        direction: 'west',
        targetMap: 'mossy_hollow',
        targetSpawn: { x: 296, y: 96 },
      },
      {
        x: 0,
        y: 9,
        radius: 22,
        direction: 'west',
        targetMap: 'mossy_gearbox',
        targetSpawn: { x: 296, y: 96 },
      },
      {
        x: 19,
        y: 6,
        radius: 22,
        direction: 'east',
        targetMap: 'pine_ridge',
        targetSpawn: { x: 16, y: 96 },
      },
    ],
    hotspots: [
      {
        id: 'squirrel_acorn',
        name: 'Autumn Squirrels',
        x: 100,
        y: 70,
        radius: 22,
        dialogueText: 'Pip: Friendly squirrels gathering acorns for the winter cache! 🐿️🌰',
        soundType: 'woodblock',
      },
      {
        id: 'leaf_pile',
        name: 'Crisp Leaf Pile',
        x: 156,
        y: 104,
        radius: 20,
        dialogueText: 'Pip: Rustling golden leaves! Perfect for soft woodland burrows! 🍂',
        soundType: 'kalimba',
      },
    ],
  },

  // 5. THE PINE RIDGE (Winter)
  pine_ridge: {
    id: 'pine_ridge',
    displayName: 'THE PINE RIDGE',
    textureKey: 'pine_ridge_bg',
    tileWidth: 20,
    tileHeight: 12,
    defaultSpawn: { x: 48, y: 96 },
    collisionRows: [
      '####################',
      '####################',
      '######...###########',
      '#####....###########',
      '###.......##########',
      '#...................',
      '....................',
      '....................',
      '####.........#######',
      '#####........#######',
      '####################',
      '####################',
    ],
    exits: [
      {
        x: 0,
        y: 6,
        radius: 22,
        direction: 'west',
        targetMap: 'sunset_meadow',
        targetSpawn: { x: 296, y: 96 },
      },
      {
        x: 0,
        y: 7,
        radius: 22,
        direction: 'west',
        targetMap: 'mossy_hollow',
        targetSpawn: { x: 296, y: 96 },
      },
      {
        x: 1,
        y: 6,
        radius: 22,
        direction: 'west',
        targetMap: 'mossy_gearbox',
        targetSpawn: { x: 296, y: 96 },
      },
      {
        x: 19,
        y: 6,
        radius: 22,
        direction: 'east',
        targetMap: 'ranger_lodge',
        targetSpawn: { x: 16, y: 96 },
      },
      {
        x: 19,
        y: 7,
        radius: 22,
        direction: 'east',
        targetMap: 'winter_lodge',
        targetSpawn: { x: 16, y: 96 },
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

  // 6. THE RANGER'S LODGE (Year-End gateway & celebration)
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
      '#######.############',
      '######..############',
      '#####...############',
      '##......#####..#####',
      '.............#.....#',
      '.............#.....#',
      '#####........#.....#',
      '######.......#######',
      '####################',
      '####################',
    ],
    exits: [
      {
        x: 0,
        y: 6,
        radius: 22,
        direction: 'west',
        targetMap: 'pine_ridge',
        targetSpawn: { x: 296, y: 96 },
      },
      {
        x: 16,
        y: 6,
        radius: 24,
        direction: 'door',
        targetMap: 'ranger_cabin',
        targetSpawn: { x: 144, y: 112 },
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

  winter_lodge: {
    id: 'winter_lodge',
    displayName: "THE RANGER'S LODGE",
    textureKey: 'winter_lodge_bg',
    tileWidth: 20,
    tileHeight: 12,
    defaultSpawn: { x: 110, y: 90 },
    collisionRows: [
      '####################',
      '####################',
      '#######.############',
      '######..############',
      '#####...############',
      '##......#####..#####',
      '.............#.....#',
      '.............#.....#',
      '#####........#.....#',
      '######.......#######',
      '####################',
      '####################',
    ],
    exits: [
      {
        x: 0,
        y: 6,
        radius: 22,
        direction: 'west',
        targetMap: 'pine_ridge',
        targetSpawn: { x: 296, y: 96 },
      },
      {
        x: 16,
        y: 6,
        radius: 24,
        direction: 'door',
        targetMap: 'ranger_cabin',
        targetSpawn: { x: 144, y: 112 },
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
  if (chapterId >= 8 && chapterId <= 10) return 'mossy_hollow';
  if (chapterId === 12) return 'sketchbook';
  if (chapterId >= 11 && chapterId <= 15) return 'sunset_meadow';
  if (chapterId >= 16 && chapterId <= 19) return 'pine_ridge';
  if (chapterId === 20) return 'ranger_lodge';
  return 'whispering_woods';
}
