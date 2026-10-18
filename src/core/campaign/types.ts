import type { Season } from '../constants';

export interface CampaignItem {
  id: string;
  name: string;
  description: string;
  pictogramKey: string;
}

export interface Chapter {
  id: number;
  season: Season;
  region: string;
  title: string;
  objective: string;
  pedagogicalInteraction: string;
  bridgeSheet: string;
  pictogramKey: string;
  sightWords: [string] | [string, string] | [string, string, string];
  puzzleType?: 'gearbox' | 'subitizing' | 'tracing' | 'sorting';
  rewardItem?: CampaignItem;
}

export const CAMPAIGN_CHAPTERS: readonly Chapter[] = [
  // Spring (Chapters 1-5: Pebble Creek & Awakening)
  {
    id: 1,
    season: 'spring',
    region: 'Ranger Cabin',
    title: 'Wake Pip & Light Lantern',
    objective: 'Wake Pip and light the brass lantern with gentle guidance.',
    pedagogicalInteraction: 'Candle drag-and-drop to lantern',
    bridgeSheet: 'Cabin Orientation Card',
    pictogramKey: 'bramble',
    sightWords: ['WAKE', 'UP', 'PIP'],
    rewardItem: { id: 'brass_lantern', name: 'Brass Lantern', description: 'Warm brass lantern', pictogramKey: 'bramble' },
  },
  {
    id: 2,
    season: 'spring',
    region: 'Pebble Creek West',
    title: 'Clear Winter Branches',
    objective: 'Clear fallen winter branches from the damp woodland trail.',
    pedagogicalInteraction: 'Size-sorting logs into brush piles',
    bridgeSheet: 'Twig Collector Card',
    pictogramKey: 'paw',
    sightWords: ['CLEAR', 'THE', 'PATH'],
  },
  {
    id: 3,
    season: 'spring',
    region: 'Pebble Creek Central',
    title: 'Stepping Stone Subitizing',
    objective: 'Count the lily pads to help the ducklings cross the brook.',
    pedagogicalInteraction: 'Counting lily pads (1 to 5 dots)',
    bridgeSheet: 'Pond Stepping Card',
    pictogramKey: 'lilypad',
    sightWords: ['COUNT', 'THE', 'STONES'],
    puzzleType: 'subitizing',
    rewardItem: { id: 'smooth_stone', name: 'River Pebble', description: 'Cool smooth stone', pictogramKey: 'lilypad' },
  },
  {
    id: 4,
    season: 'spring',
    region: 'Meadow Edge',
    title: 'Budding Wildflowers',
    objective: 'Identify yellow dandelions and soft primroses in the morning sun.',
    pedagogicalInteraction: 'Color matching (Dandelion / Primrose)',
    bridgeSheet: 'Sprout Spotter Guide',
    pictogramKey: 'leaf',
    sightWords: ['FIND', 'BRIGHT', 'BLOOM'],
    rewardItem: { id: 'primrose', name: 'Spring Primrose', description: 'Delicate yellow petal', pictogramKey: 'leaf' },
  },
  {
    id: 5,
    season: 'spring',
    region: 'Bird Hollow',
    title: 'Robin Nest Building',
    objective: 'Observe robin nest building and trace the bird flight path.',
    pedagogicalInteraction: 'Trace bird flight trajectory',
    bridgeSheet: 'Tiny Nest Craft Sheet',
    pictogramKey: 'leaf',
    sightWords: ['WATCH', 'BIRD', 'FLY'],
  },

  // Summer (Chapters 6-10: Mossy Hollow & Waterwheel)
  {
    id: 6,
    season: 'summer',
    region: 'Mossy Hollow Entrance',
    title: 'Clear Stream Debris',
    objective: 'Clear dry stream debris to let cool water trickle through.',
    pedagogicalInteraction: 'Horizontal sliding stone puzzle',
    bridgeSheet: 'Water Way Marker',
    pictogramKey: 'paw',
    sightWords: ['MOVE', 'COOL', 'STONE'],
  },
  {
    id: 7,
    season: 'summer',
    region: 'The Water Wheel',
    title: 'The Mossy Gearbox',
    objective: 'Mesh wooden gears so the waterwheel turns and stream flows.',
    pedagogicalInteraction: 'Match 3 gear diameters to axles',
    bridgeSheet: 'Gear Cutout Kit',
    pictogramKey: 'gear',
    sightWords: ['TURN', 'THE', 'WHEEL'],
    puzzleType: 'gearbox',
    rewardItem: { id: 'wooden_gear', name: 'Small Gear', description: 'Carved oak cog', pictogramKey: 'gear' },
  },
  {
    id: 8,
    season: 'summer',
    region: 'Deep Hollow Shade',
    title: 'Insects in Log Shadows',
    objective: 'Spot friendly beetles and isopods in shaded log hollows.',
    pedagogicalInteraction: 'Flashlight scanning in shaded zone',
    bridgeSheet: 'Bug Spotter Sheet',
    pictogramKey: 'paw',
    sightWords: ['LOOK', 'IN', 'SHADE'],
  },
  {
    id: 9,
    season: 'summer',
    region: 'Whispering Brook',
    title: 'Cooling Thirsty Friends',
    objective: 'Share cool river water with woodland animals resting in the heat.',
    pedagogicalInteraction: 'Water barrel drag-and-pour',
    bridgeSheet: 'Backyard Water Tracker',
    pictogramKey: 'pip',
    sightWords: ['SHARE', 'FRESH', 'WATER'],
  },
  {
    id: 10,
    season: 'summer',
    region: 'Willow Bank',
    title: 'Comparing Leaf Shapes',
    objective: 'Sort slender willow leaves vs. wide lobed oak leaves.',
    pedagogicalInteraction: 'Sorting oval willow vs. broad oak',
    bridgeSheet: 'Leaf Outline Card',
    pictogramKey: 'leaf',
    sightWords: ['SORT', 'OAK', 'LEAF'],
    rewardItem: { id: 'willow_leaf', name: 'Willow Leaf', description: 'Slender green blade', pictogramKey: 'leaf' },
  },

  // Autumn (Chapters 11-15: Sunset Meadow & Seed Harvest)
  {
    id: 11,
    season: 'autumn',
    region: 'Sunset Meadow West',
    title: 'Harvest Fallen Acorns',
    objective: 'Gather fallen golden acorns into the squirrel forage pouch.',
    pedagogicalInteraction: '1-to-1 counting into squirrel pouch',
    bridgeSheet: 'Acorn Match Card',
    pictogramKey: 'acorn',
    sightWords: ['COUNT', 'GOLD', 'ACORN'],
    rewardItem: { id: 'acorn', name: 'Oak Acorn', description: 'Smooth glossy acorn', pictogramKey: 'acorn' },
  },
  {
    id: 12,
    season: 'autumn',
    region: 'Amber Woods',
    title: 'Tracing Dry Oak Leaves',
    objective: 'Trace the wavy veins of crisp autumn leaves with wax crayon.',
    pedagogicalInteraction: 'Bézier finger tracing (48 px buffer)',
    bridgeSheet: 'Leaf-Press Guide',
    pictogramKey: 'leaf',
    sightWords: ['TRACE', 'WAVY', 'LEAF'],
    puzzleType: 'tracing',
  },
  {
    id: 13,
    season: 'autumn',
    region: 'The Great Oak',
    title: 'Insulate Chipmunk Burrow',
    objective: 'Gather dry moss and soft birch bark to insulate the winter nest.',
    pedagogicalInteraction: 'Drag dry moss and bark into nest',
    bridgeSheet: 'Burrow Insulator Sheet',
    pictogramKey: 'bramble',
    sightWords: ['MAKE', 'WARM', 'NEST'],
  },
  {
    id: 14,
    season: 'autumn',
    region: 'Wind Ridge',
    title: 'Migrating Bird Flocks',
    objective: 'Trace the majestic V-formation of wild geese heading south.',
    pedagogicalInteraction: 'Binocular search; trace V-formation',
    bridgeSheet: 'Sky Migration Map',
    pictogramKey: 'pip',
    sightWords: ['FLY', 'TO', 'SOUTH'],
  },
  {
    id: 15,
    season: 'autumn',
    region: 'Hollow Log Rest',
    title: 'Match Autumn Bird Calls',
    objective: 'Listen carefully and match 3 peaceful acoustic bird calls.',
    pedagogicalInteraction: 'Acoustic 3-note pitch recognition',
    bridgeSheet: 'Sound Catcher Card',
    pictogramKey: 'pip',
    sightWords: ['HEAR', 'SWEET', 'SONG'],
  },

  // Winter (Chapters 16-20: Pine Ridge & Ranger Lodge Celebration)
  {
    id: 16,
    season: 'winter',
    region: 'Pine Ridge Trail',
    title: 'Rabbit Footprint Trail',
    objective: 'Follow hopping rabbit tracks across powdered snow trails.',
    pedagogicalInteraction: 'Trace "Big Back, Small Front" prints',
    bridgeSheet: 'Winter Track Card A',
    pictogramKey: 'paw',
    sightWords: ['FOLLOW', 'SNOW', 'TRACK'],
    puzzleType: 'tracing',
  },
  {
    id: 17,
    season: 'winter',
    region: 'Frost Creek',
    title: 'Frozen Brook Crossing',
    objective: 'Match sturdy fallen branches to bridge the frozen ice gaps.',
    pedagogicalInteraction: 'Match log lengths to ice gaps',
    bridgeSheet: 'Stick Sizing Card',
    pictogramKey: 'lilypad',
    sightWords: ['FIT', 'STRONG', 'STICK'],
  },
  {
    id: 18,
    season: 'winter',
    region: 'Snow Pine Hollow',
    title: 'Pinecone Bird Feeders',
    objective: 'Hang seed-rolled pinecone feeders high in the evergreen branches.',
    pedagogicalInteraction: 'Balance feeders on tree branches',
    bridgeSheet: 'DIY Pinecone Feeder',
    pictogramKey: 'leaf',
    sightWords: ['HANG', 'SWEET', 'CONE'],
    rewardItem: { id: 'pinecone', name: 'Sugar Pinecone', description: 'Fragrant pinecone', pictogramKey: 'leaf' },
  },
  {
    id: 19,
    season: 'winter',
    region: 'The Badger Mound',
    title: 'Resting Woodland Friends',
    objective: 'Look quietly into the deep badger burrow with gentle lantern glow.',
    pedagogicalInteraction: 'Soft flashlight scan inside burrow',
    bridgeSheet: 'Winter Sleeping Guide',
    pictogramKey: 'paw',
    sightWords: ['SLEEP', 'SAFE', 'WARM'],
  },
  {
    id: 20,
    season: 'winter',
    region: "The Ranger's Lodge",
    title: "The Ranger's Lodge Celebration",
    objective: 'Gather with Bramble, Pip, and forest friends around the warm hearth.',
    pedagogicalInteraction: 'Interactive feast; tap all animal friends',
    bridgeSheet: 'Ranger Honor Certificate',
    pictogramKey: 'bedtime',
    sightWords: ['REST', 'TOGETHER', 'NOW'],
  },
];
