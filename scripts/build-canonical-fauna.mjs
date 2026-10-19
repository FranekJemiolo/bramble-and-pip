import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SOURCE_IMAGE = '/Users/franek/.gemini/antigravity-ide/brain/405c7d12-042f-4df5-bc65-b58f3639186e/.user_uploaded/media_1792413421688.jpg';
const OUT_DIR = path.resolve('public/assets/fauna');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Exact column positions across the sheet
const COL_X = [
  { x1: 26, w: 74 },  // 0
  { x1: 105, w: 74 }, // 1
  { x1: 185, w: 74 }, // 2
  { x1: 265, w: 74 }, // 3
  { x1: 345, w: 74 }, // 4
  { x1: 425, w: 74 }, // 5
  { x1: 524, w: 74 }, // 6
  { x1: 604, w: 74 }, // 7
  { x1: 684, w: 74 }, // 8
  { x1: 764, w: 74 }, // 9
  { x1: 844, w: 74 }, // 10
  { x1: 924, w: 74 }  // 11
];

export const FAUNA_REGISTRY = [
  // ROW 1: Large Wildlife (Bears) & Deer
  { id: 'bear_sit_front', row: 1, col: 0, category: 'bear', name: 'Sitting Brown Bear' },
  { id: 'bear_sit_side', row: 1, col: 1, category: 'bear', name: 'Observing Brown Bear' },
  { id: 'bear_sleep', row: 1, col: 2, category: 'bear', name: 'Sleeping Brown Bear' },
  { id: 'bear_walk_1', row: 1, col: 3, category: 'bear', name: 'Lumbering Bear (Walk 1)' },
  { id: 'bear_walk_2', row: 1, col: 4, category: 'bear', name: 'Lumbering Bear (Walk 2)' },
  { id: 'bear_roar', row: 1, col: 5, category: 'bear', name: 'Playful Rearing Bear' },
  { id: 'deer_graze_doe', row: 1, col: 6, category: 'deer', name: 'Grazing White-Tailed Doe' },
  { id: 'deer_graze_fawn', row: 1, col: 7, category: 'deer', name: 'Grazing Spotted Fawn' },
  { id: 'deer_alert_buck', row: 1, col: 8, category: 'deer', name: 'Alert Forest Stag' },
  { id: 'deer_alert_doe', row: 1, col: 9, category: 'deer', name: 'Standing Forest Doe' },
  { id: 'deer_fawn_walk', row: 1, col: 10, category: 'deer', name: 'Walking Spotted Fawn' },
  { id: 'deer_fawn_tiny', row: 1, col: 11, category: 'deer', name: 'Tiny Woodland Fawn' },

  // ROW 2: Small Burrowers (Hedgehogs) & Dormice
  { id: 'hedgehog_walk_1', row: 2, col: 0, category: 'hedgehog', name: 'Hedgehog Trot' },
  { id: 'hedgehog_walk_2', row: 2, col: 1, category: 'hedgehog', name: 'Hedgehog Stroll' },
  { id: 'hedgehog_curled', row: 2, col: 2, category: 'hedgehog', name: 'Hedgehog Curled Ball' },
  { id: 'hedgehog_idle', row: 2, col: 3, category: 'hedgehog', name: 'Hedgehog In Grass' },
  { id: 'hedgehog_sniff', row: 2, col: 4, category: 'hedgehog', name: 'Hedgehog Snuffling' },
  { id: 'hedgehog_scoot', row: 2, col: 5, category: 'hedgehog', name: 'Hedgehog Scurrying' },
  { id: 'dormouse_sleep_1', row: 2, col: 6, category: 'dormouse', name: 'Curled Sleeping Dormouse' },
  { id: 'dormouse_sleep_2', row: 2, col: 7, category: 'dormouse', name: 'Resting Hazel Dormouse' },
  { id: 'dormouse_upright', row: 2, col: 8, category: 'dormouse', name: 'Upright Alert Dormouse' },
  { id: 'dormouse_leap', row: 2, col: 9, category: 'dormouse', name: 'Leaping Dormouse' },
  { id: 'dormouse_run', row: 2, col: 10, category: 'dormouse', name: 'Scurrying Dormouse' },

  // ROW 3: Activity Animals (Badgers) & Beavers
  { id: 'badger_stand', row: 3, col: 0, category: 'badger', name: 'Standing Woodland Badger' },
  { id: 'badger_alert', row: 3, col: 1, category: 'badger', name: 'Alert Striped Badger' },
  { id: 'badger_dig', row: 3, col: 2, category: 'badger', name: 'Badger Digging Earth' },
  { id: 'badger_walk', row: 3, col: 3, category: 'badger', name: 'Badger Prowl' },
  { id: 'badger_forage', row: 3, col: 4, category: 'badger', name: 'Badger Foraging Roots' },
  { id: 'badger_rest', row: 3, col: 5, category: 'badger', name: 'Badger Resting Near Burrow' },
  { id: 'beaver_swim_left', row: 3, col: 6, category: 'beaver', name: 'Swimming River Beaver (West)' },
  { id: 'beaver_swim_right', row: 3, col: 7, category: 'beaver', name: 'Swimming River Beaver (East)' },
  { id: 'beaver_carry_log', row: 3, col: 8, category: 'beaver', name: 'Beaver Carrying Birch Log' },
  { id: 'beaver_gnaw_log', row: 3, col: 9, category: 'beaver', name: 'Beaver Gnawing River Wood' },
  { id: 'beaver_hold_twigs', row: 3, col: 10, category: 'beaver', name: 'Beaver with Dam Twigs' },

  // ROW 4: Leaping Fauna (Rabbits) & Frogs
  { id: 'rabbit_sit', row: 4, col: 0, category: 'rabbit', name: 'Sitting Cotton-tail Rabbit' },
  { id: 'rabbit_alert', row: 4, col: 1, category: 'rabbit', name: 'Alert Ears-Up Rabbit' },
  { id: 'rabbit_crouch', row: 4, col: 2, category: 'rabbit', name: 'Crouching Meadow Rabbit' },
  { id: 'rabbit_leap_push', row: 4, col: 3, category: 'rabbit', name: 'Rabbit Leap (Push-off)' },
  { id: 'rabbit_leap_air', row: 4, col: 4, category: 'rabbit', name: 'Rabbit Leap (Mid-air)' },
  { id: 'rabbit_leap_land', row: 4, col: 5, category: 'rabbit', name: 'Rabbit Leap (Landing)' },
  { id: 'frog_idle_front', row: 4, col: 6, category: 'frog', name: 'Pebble Creek Frog (Front)' },
  { id: 'frog_idle_smile', row: 4, col: 7, category: 'frog', name: 'Pebble Creek Frog (Smiling)' },
  { id: 'frog_angle', row: 4, col: 8, category: 'frog', name: 'Lilypad Pond Frog' },
  { id: 'frog_leap', row: 4, col: 9, category: 'frog', name: 'Leaping River Frog' },

  // ROW 5: Birds (Canada Geese) & Owls
  { id: 'goose_stand', row: 5, col: 0, category: 'goose', name: 'Standing Canada Goose' },
  { id: 'goose_walk', row: 5, col: 1, category: 'goose', name: 'Walking Canada Goose' },
  { id: 'goose_fly_up', row: 5, col: 2, category: 'goose', name: 'Migrating Goose (Wings Up)' },
  { id: 'goose_fly_mid', row: 5, col: 3, category: 'goose', name: 'Migrating Goose (Wings Level)' },
  { id: 'goose_glide', row: 5, col: 4, category: 'goose', name: 'Gliding Forest Goose' },
  { id: 'goose_swim', row: 5, col: 5, category: 'goose', name: 'Swimming River Goose' },
  { id: 'owl_perched_front', row: 5, col: 6, category: 'owl', name: 'Perched Barn Owl (Front)' },
  { id: 'owl_perched_side', row: 5, col: 7, category: 'owl', name: 'Perched Barn Owl (Side)' },
  { id: 'owl_wings_open', row: 5, col: 8, category: 'owl', name: 'Owl Wings Spreading' },
  { id: 'owl_fly_flap', row: 5, col: 9, category: 'owl', name: 'Nocturnal Owl Flying' },

  // ROW 6: Small Forest Birds (Sparrows) & Cardinals
  { id: 'sparrow_stand', row: 6, col: 0, category: 'sparrow', name: 'Perched Woodland Sparrow' },
  { id: 'sparrow_look_up', row: 6, col: 1, category: 'sparrow', name: 'Curious Song Sparrow' },
  { id: 'sparrow_peck_seed', row: 6, col: 2, category: 'sparrow', name: 'Sparrow Pecking Seeds' },
  { id: 'sparrow_chirp', row: 6, col: 3, category: 'sparrow', name: 'Chirping Trail Sparrow' },
  { id: 'sparrow_nest', row: 6, col: 4, category: 'sparrow', name: 'Sparrow in Woven Nest' },
  { id: 'cardinal_perch_branch', row: 6, col: 6, category: 'cardinal', name: 'Winter Red Cardinal (Perched)' },
  { id: 'cardinal_wings_back', row: 6, col: 7, category: 'cardinal', name: 'Red Cardinal (Wings Back)' },
  { id: 'cardinal_wings_flap', row: 6, col: 8, category: 'cardinal', name: 'Red Cardinal (Wings Flutter)' },
  { id: 'cardinal_perch_turn', row: 6, col: 9, category: 'cardinal', name: 'Red Cardinal (Turning)' },
  { id: 'cardinal_glide', row: 6, col: 10, category: 'cardinal', name: 'Red Cardinal (Gliding)' },
  { id: 'track_bird_y', row: 6, col: 11, category: 'track', name: 'Tiny Bird Y-Footprints' },

  // ROW 7: Insects & Micro Fauna & Nature Tracks
  { id: 'insect_green_beetle', row: 7, col: 0, category: 'insect', name: 'Emerald Forest Beetle' },
  { id: 'insect_blue_beetle', row: 7, col: 1, category: 'insect', name: 'Cobalt River Beetle' },
  { id: 'insect_caterpillar_walk', row: 7, col: 2, category: 'insect', name: 'Leaf Caterpillar (Crawling)' },
  { id: 'insect_caterpillar_stretch', row: 7, col: 3, category: 'insect', name: 'Leaf Caterpillar (Stretching)' },
  { id: 'insect_bumblebee', row: 7, col: 4, category: 'insect', name: 'Fuzzy Clover Bumblebee' },
  { id: 'insect_snail', row: 7, col: 5, category: 'insect', name: 'Mossy Garden Snail' },
  { id: 'track_bird_3toed', row: 7, col: 6, category: 'track', name: 'Three-Toed Bird Trail' },
  { id: 'track_badger_claw', row: 7, col: 7, category: 'track', name: 'Five-Clawed Badger Tracks' },
  { id: 'track_bear_paw', row: 7, col: 8, category: 'track', name: 'Heavy Bear Paw Prints' },
  { id: 'track_rabbit_stride', row: 7, col: 9, category: 'track', name: 'Hopping Rabbit Strides' },
  { id: 'track_deer_hoof', row: 7, col: 10, category: 'track', name: 'Cloven Deer Hoof Marks' },
  { id: 'track_mud_puddle', row: 7, col: 11, category: 'track', name: 'Forest Soil Earth Mounds' }
];

const ROW_Y = {
  1: { y1: 88, y2: 162 },
  2: { y1: 187, y2: 256 },
  3: { y1: 280, y2: 349 },
  4: { y1: 374, y2: 443 },
  5: { y1: 467, y2: 537 },
  6: { y1: 561, y2: 631 },
  7: { y1: 656, y2: 725 }
};

async function extractAllFauna() {
  console.log('Loading Fauna & Wildlife Sprite Sheet:', SOURCE_IMAGE);
  const src = sharp(SOURCE_IMAGE);
  const { data: fullData, info } = await src.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const sheetW = info.width;

  const base64Map = {};

  for (const item of FAUNA_REGISTRY) {
    const colInfo = COL_X[item.col];
    const rowInfo = ROW_Y[item.row];
    const boxX = colInfo.x1;
    const boxY = rowInfo.y1;
    const boxW = colInfo.w;
    const boxH = rowInfo.y2 - rowInfo.y1 + 1;

    // Crop box with 3px inset to eliminate outer border
    const inset = 3;
    const inW = boxW - inset * 2;
    const inH = boxH - inset * 2;
    const inData = new Uint8Array(inW * inH * 4);

    for (let y = 0; y < inH; y++) {
      for (let x = 0; x < inW; x++) {
        const srcIdx = ((boxY + y + inset) * sheetW + (boxX + x + inset)) * 4;
        const dstIdx = (y * inW + x) * 4;
        inData[dstIdx] = fullData[srcIdx];
        inData[dstIdx + 1] = fullData[srcIdx + 1];
        inData[dstIdx + 2] = fullData[srcIdx + 2];
        inData[dstIdx + 3] = fullData[srcIdx + 3];
      }
    }

    // Flood fill sage green background
    const visited = new Uint8Array(inW * inH);
    const queue = [];

    function isSage(idx) {
      const r = inData[idx], g = inData[idx + 1], b = inData[idx + 2];
      const dr = r - 132, dg = g - 163, db = b - 128;
      return Math.sqrt(dr * dr + dg * dg + db * db) < 46;
    }

    for (let x = 0; x < inW; x++) {
      queue.push([x, 0], [x, inH - 1]);
    }
    for (let y = 1; y < inH - 1; y++) {
      queue.push([0, y], [inW - 1, y]);
    }

    while (queue.length > 0) {
      const [x, y] = queue.pop();
      if (x < 0 || x >= inW || y < 0 || y >= inH) continue;
      const vIdx = y * inW + x;
      if (visited[vIdx]) continue;
      visited[vIdx] = 1;

      const pIdx = vIdx * 4;
      if (isSage(pIdx)) {
        inData[pIdx + 3] = 0; // Transparent
        queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
    }

    // Find visible bounds
    let minX = inW, maxX = 0, minY = inH, maxY = 0;
    let count = 0;
    for (let y = 0; y < inH; y++) {
      for (let x = 0; x < inW; x++) {
        const idx = (y * inW + x) * 4;
        if (inData[idx + 3] > 0) {
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
          count++;
        }
      }
    }

    if (count === 0 || minX > maxX || minY > maxY) {
      console.warn(`Warning: empty sprite for ${item.id}`);
      continue;
    }

    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;

    // Save PNG buffer
    const pngBuffer = await sharp(inData, { raw: { width: inW, height: inH, channels: 4 } })
      .extract({ left: minX, top: minY, width: cropW, height: cropH })
      .png({ compressionLevel: 9 })
      .toBuffer();

    const outPath = path.join(OUT_DIR, `${item.id}.png`);
    fs.writeFileSync(outPath, pngBuffer);

    base64Map[item.id] = `data:image/png;base64,${pngBuffer.toString('base64')}`;
    console.log(`Extracted [${item.id}]: ${cropW}x${cropH} (${count} px) -> ${outPath}`);
  }

  // Write TypeScript asset file
  const tsContent = `/**
 * Canonical Fauna & Wildlife Sprite Assets for Bramble & Pip.
 * Extracted directly from the master Fauna & Wildlife Sprite Sheet.
 * Pre-encoded as base64 data URIs for zero network egress.
 */

export interface FaunaAssetMeta {
  id: string;
  name: string;
  category: 'bear' | 'deer' | 'hedgehog' | 'dormouse' | 'badger' | 'beaver' | 'rabbit' | 'frog' | 'goose' | 'owl' | 'sparrow' | 'cardinal' | 'insect' | 'track';
  dataUri: string;
}

export const CANONICAL_FAUNA_DATA: Record<string, string> = ${JSON.stringify(base64Map, null, 2)};

export const FAUNA_CATALOG = ${JSON.stringify(FAUNA_REGISTRY, null, 2)};
`;

  const tsOutPath = path.resolve('src/render/canonicalFaunaAssets.ts');
  fs.writeFileSync(tsOutPath, tsContent);
  console.log(`\nSuccessfully wrote ${Object.keys(base64Map).length} fauna assets to ${tsOutPath}`);
}

extractAllFauna().catch((err) => {
  console.error('Fauna extraction failed:', err);
  process.exit(1);
});
