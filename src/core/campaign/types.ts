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
  title: string;
  objective: string;
  pictogramKey: string;
  sightWords: [string] | [string, string] | [string, string, string];
  puzzleType?: 'gearbox' | 'subitizing' | 'tracing' | 'sorting';
  rewardItem?: CampaignItem;
}

export const CAMPAIGN_CHAPTERS: readonly Chapter[] = [
  // Spring (Chapters 1-5)
  {
    id: 1,
    season: 'spring',
    title: 'The Thawing Stream',
    objective: 'Look at the snowdrops near the melting brook.',
    pictogramKey: 'leaf',
    sightWords: ['LOOK', 'A', 'FLOWER'],
    rewardItem: { id: 'snowdrop', name: 'Snowdrop', description: 'Gentle white petal', pictogramKey: 'leaf' },
  },
  {
    id: 2,
    season: 'spring',
    title: "Pip's Muddy Paws",
    objective: 'Follow Pip along the damp woodland trail.',
    pictogramKey: 'paw',
    sightWords: ['FOLLOW', 'PIP', 'HERE'],
  },
  {
    id: 3,
    season: 'spring',
    title: 'Stepping Stone Subitizing',
    objective: 'Count the lily pads to cross the bubbling stream.',
    pictogramKey: 'lilypad',
    sightWords: ['COUNT', 'THE', 'STONES'],
    puzzleType: 'subitizing',
    rewardItem: { id: 'smooth_stone', name: 'River Pebble', description: 'Cool smooth stone', pictogramKey: 'lilypad' },
  },
  {
    id: 4,
    season: 'spring',
    title: 'Nesting Twigs',
    objective: 'Find soft pine needles for the robin nest.',
    pictogramKey: 'leaf',
    sightWords: ['FIND', 'SOFT', 'TWIG'],
    rewardItem: { id: 'pine_twig', name: 'Pine Twig', description: 'Sweet-smelling needle', pictogramKey: 'leaf' },
  },
  {
    id: 5,
    season: 'spring',
    title: 'First Green Shoots',
    objective: 'Watch the fiddlehead ferns uncurl in the morning light.',
    pictogramKey: 'leaf',
    sightWords: ['SEE', 'GREEN', 'FERN'],
  },

  // Summer (Chapters 6-10)
  {
    id: 6,
    season: 'summer',
    title: 'Sunlit Canopy',
    objective: 'Trace the warm patterns of dappled sunlight.',
    pictogramKey: 'bramble',
    sightWords: ['WARM', 'SUMMER', 'SUN'],
  },
  {
    id: 7,
    season: 'summer',
    title: 'The Mossy Gearbox',
    objective: 'Mesh the wooden watermill gears so the waterwheel turns.',
    pictogramKey: 'gear',
    sightWords: ['TURN', 'THE', 'WHEEL'],
    puzzleType: 'gearbox',
    rewardItem: { id: 'wooden_gear', name: 'Small Gear', description: 'Carved oak cog', pictogramKey: 'gear' },
  },
  {
    id: 8,
    season: 'summer',
    title: 'Honeybee Flight',
    objective: 'Trace the gentle figure-eight path of a foraging bee.',
    pictogramKey: 'paw',
    sightWords: ['TRACE', 'THE', 'BEE'],
    puzzleType: 'tracing',
  },
  {
    id: 9,
    season: 'summer',
    title: 'Shaded Brook Splash',
    objective: 'Dip your fingers in the cool river shallows with Pip.',
    pictogramKey: 'pip',
    sightWords: ['COOL', 'RIVER', 'WATER'],
  },
  {
    id: 10,
    season: 'summer',
    title: 'Berry Patch Feast',
    objective: 'Gather wild blackberries for the woodland picnic.',
    pictogramKey: 'leaf',
    sightWords: ['GATHER', 'SWEET', 'BERRY'],
    rewardItem: { id: 'blackberry', name: 'Wild Berry', description: 'Sweet dark berry', pictogramKey: 'leaf' },
  },

  // Autumn (Chapters 11-15)
  {
    id: 11,
    season: 'autumn',
    title: 'The Golden Birch',
    objective: 'Collect golden birch leaves for the nature press.',
    pictogramKey: 'leaf',
    sightWords: ['GOLDEN', 'FALLING', 'LEAF'],
    rewardItem: { id: 'golden_leaf', name: 'Birch Leaf', description: 'Golden heart-shaped leaf', pictogramKey: 'leaf' },
  },
  {
    id: 12,
    season: 'autumn',
    title: "Squirrel's Secret Cache",
    objective: 'Sort acorns by size near the hollow cedar stump.',
    pictogramKey: 'acorn',
    sightWords: ['SORT', 'LITTLE', 'ACORN'],
    puzzleType: 'sorting',
    rewardItem: { id: 'acorn', name: 'Oak Acorn', description: 'Smooth glossy acorn', pictogramKey: 'acorn' },
  },
  {
    id: 13,
    season: 'autumn',
    title: 'Mushroom Spore Ring',
    objective: 'Discover the fairy ring of velvet chanterelles.',
    pictogramKey: 'leaf',
    sightWords: ['LOOK', 'A', 'RING'],
  },
  {
    id: 14,
    season: 'autumn',
    title: 'Whistling Autumn Wind',
    objective: 'Listen to the soothing wooden wind chimes in the trees.',
    pictogramKey: 'pip',
    sightWords: ['LISTEN', 'TO', 'WIND'],
  },
  {
    id: 15,
    season: 'autumn',
    title: 'Preparing the Den',
    objective: 'Stack dry cedar boughs for a cozy woodland den.',
    pictogramKey: 'bramble',
    sightWords: ['BUILD', 'COZY', 'BED'],
  },

  // Winter (Chapters 16-20)
  {
    id: 16,
    season: 'winter',
    title: 'First Frost',
    objective: 'Trace the delicate crystal geometry across the window.',
    pictogramKey: 'leaf',
    sightWords: ['TRACE', 'COLD', 'FROST'],
    puzzleType: 'tracing',
  },
  {
    id: 17,
    season: 'winter',
    title: 'The Sleeping Hedgehog',
    objective: 'Walk quietly on the soft snow past the sleeping friend.',
    pictogramKey: 'paw',
    sightWords: ['SOFT', 'QUIET', 'STEPS'],
  },
  {
    id: 18,
    season: 'winter',
    title: 'Winter Track Spotter',
    objective: 'Identify wildlife footprints in the fresh powdered snow.',
    pictogramKey: 'paw',
    sightWords: ['SPOT', 'ANIMAL', 'TRACKS'],
    rewardItem: { id: 'pinecone', name: 'Snowy Cone', description: 'Dusted pinecone', pictogramKey: 'leaf' },
  },
  {
    id: 19,
    season: 'winter',
    title: 'Northern Lights Glow',
    objective: 'Gaze at the gentle emerald curtains waving in the night.',
    pictogramKey: 'pip',
    sightWords: ['LIGHTS', 'IN', 'SKY'],
  },
  {
    id: 20,
    season: 'winter',
    title: "The Ranger's Lodge",
    objective: 'Gather with Bramble, Pip, and forest friends by the warm fire.',
    pictogramKey: 'bedtime',
    sightWords: ['REST', 'TOGETHER', 'NOW'],
  },
];
