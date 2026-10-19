import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SOURCE_IMAGE = '/Users/franek/.gemini/antigravity-ide/brain/405c7d12-042f-4df5-bc65-b58f3639186e/.tempmediaStorage/media_1792415164817.jpg';
const OUT_DIR = path.resolve('public/assets/flora');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

export const FLORA_REGISTRY = [
  // ROW 1: Large Trees (Summer, Autumn, Winter)
  { id: 'tree_oak_spring', x1: 11, x2: 95, y1: 68, y2: 172, category: 'tree', name: 'Spring Oak Tree' },
  { id: 'tree_oak_mist', x1: 103, x2: 174, y1: 68, y2: 172, category: 'tree', name: 'Spring Morning Oak' },
  { id: 'stump_oak_healthy', x1: 181, x2: 222, y1: 113, y2: 172, category: 'tree', name: 'Oak Wood Stump' },
  { id: 'tree_oak_summer', x1: 233, x2: 310, y1: 67, y2: 172, category: 'tree', name: 'Summer Green Oak' },
  { id: 'tree_oak_summer_dark', x1: 312, x2: 393, y1: 67, y2: 172, category: 'tree', name: 'Summer Emerald Oak' },
  { id: 'tree_oak_summer_slender', x1: 399, x2: 465, y1: 68, y2: 172, category: 'tree', name: 'Slender Forest Oak' },
  { id: 'stump_summer_broken', x1: 470, x2: 508, y1: 71, y2: 170, category: 'tree', name: 'Broken Oak Stump' },
  { id: 'tree_oak_autumn_gold', x1: 534, x2: 609, y1: 66, y2: 171, category: 'tree', name: 'Autumn Golden Oak' },
  { id: 'tree_oak_autumn_orange', x1: 618, x2: 686, y1: 69, y2: 170, category: 'tree', name: 'Autumn Russet Oak' },
  { id: 'stump_autumn_splintered', x1: 690, x2: 733, y1: 71, y2: 170, category: 'tree', name: 'Splintered Autumn Stump' },
  { id: 'tree_pine_winter_frosted', x1: 754, x2: 819, y1: 68, y2: 172, category: 'tree', name: 'Frosted Winter Pine' },
  { id: 'tree_pine_winter_mist', x1: 829, x2: 877, y1: 82, y2: 168, category: 'tree', name: 'Winter Alpine Pine' },
  { id: 'tree_pine_winter_snow', x1: 884, x2: 949, y1: 71, y2: 171, category: 'tree', name: 'Snow-Capped Winter Pine' },
  { id: 'stump_winter_snow', x1: 965, x2: 999, y1: 107, y2: 166, category: 'tree', name: 'Snow-Covered Stump' },

  // ROW 2: Birches, Small Trees & Conifers
  { id: 'tree_birch_summer', x1: 29, x2: 61, y1: 188, y2: 258, category: 'tree', name: 'Summer White Birch' },
  { id: 'tree_birch_autumn', x1: 101, x2: 132, y1: 188, y2: 258, category: 'tree', name: 'Autumn Golden Birch' },
  { id: 'shrub_pine_spring', x1: 162, x2: 222, y1: 188, y2: 258, category: 'shrub', name: 'Compact Spring Pine' },
  { id: 'shrub_pine_summer', x1: 237, x2: 292, y1: 200, y2: 256, category: 'shrub', name: 'Lush Summer Conifer' },
  { id: 'shrub_pine_dark', x1: 312, x2: 366, y1: 199, y2: 255, category: 'shrub', name: 'Mountain Spruce Shrub' },
  { id: 'stump_small_cut', x1: 389, x2: 438, y1: 208, y2: 256, category: 'tree', name: 'Small Woodland Stump' },
  { id: 'stump_small_moss', x1: 462, x2: 514, y1: 200, y2: 256, category: 'tree', name: 'Small Mossy Stump' },
  { id: 'shrub_pine_autumn', x1: 534, x2: 587, y1: 190, y2: 254, category: 'shrub', name: 'Autumn Amber Conifer' },
  { id: 'shrub_pine_winter_light', x1: 610, x2: 660, y1: 190, y2: 254, category: 'shrub', name: 'Light Snow Conifer' },
  { id: 'shrub_pine_winter_heavy', x1: 678, x2: 734, y1: 189, y2: 254, category: 'shrub', name: 'Heavy Snow Pine Shrub' },
  { id: 'stump_small_birch', x1: 757, x2: 813, y1: 193, y2: 256, category: 'tree', name: 'Small Birch Stump' },
  { id: 'bush_round_summer', x1: 825, x2: 884, y1: 208, y2: 258, category: 'shrub', name: 'Summer Green Bush' },
  { id: 'bush_round_autumn', x1: 886, x2: 941, y1: 208, y2: 258, category: 'shrub', name: 'Autumn Golden Bush' },
  { id: 'bush_round_winter', x1: 943, x2: 1003, y1: 207, y2: 258, category: 'shrub', name: 'Winter Snow Bush' },

  // ROW 3: Ferns & Undergrowth
  { id: 'fern_spring', x1: 14, x2: 80, y1: 262, y2: 344, category: 'undergrowth', name: 'Spring Woodland Fern' },
  { id: 'fern_summer', x1: 88, x2: 150, y1: 262, y2: 344, category: 'undergrowth', name: 'Summer Forest Fern' },
  { id: 'fungi_bioluminescent', x1: 160, x2: 226, y1: 262, y2: 341, category: 'undergrowth', name: 'Bioluminescent Forest Mushrooms' },
  { id: 'log_hollow_small', x1: 236, x2: 300, y1: 290, y2: 328, category: 'undergrowth', name: 'Small Hollow Log' },
  { id: 'log_mossy_medium', x1: 302, x2: 374, y1: 285, y2: 327, category: 'undergrowth', name: 'Medium Mossy Log' },
  { id: 'log_mossy_large', x1: 376, x2: 456, y1: 285, y2: 327, category: 'undergrowth', name: 'Large Ancient Cedar Log' },
  { id: 'bramble_dense_summer', x1: 458, x2: 518, y1: 283, y2: 332, category: 'undergrowth', name: 'Dense Summer Bramble' },
  { id: 'fern_autumn', x1: 532, x2: 595, y1: 280, y2: 330, category: 'undergrowth', name: 'Golden Autumn Fern' },
  { id: 'fern_autumn_curled', x1: 608, x2: 673, y1: 281, y2: 330, category: 'undergrowth', name: 'Curled Russet Fern' },
  { id: 'bramble_autumn_berries', x1: 678, x2: 740, y1: 275, y2: 335, category: 'undergrowth', name: 'Autumn Berry Bramble' },
  { id: 'log_winter_snow', x1: 742, x2: 846, y1: 285, y2: 328, category: 'undergrowth', name: 'Snow-Covered Log' },
  { id: 'bramble_winter_snow', x1: 850, x2: 934, y1: 285, y2: 328, category: 'undergrowth', name: 'Snow-Draped Bramble' },
  { id: 'brush_winter_bare', x1: 944, x2: 1004, y1: 282, y2: 332, category: 'undergrowth', name: 'Winter Twig Thicket' },

  // ROW 4: Ground Flowers & Foliage
  { id: 'flower_dandelion', x1: 24, x2: 71, y1: 355, y2: 399, category: 'flower', name: 'Blooming Yellow Dandelions' },
  { id: 'flower_primrose', x1: 95, x2: 144, y1: 354, y2: 398, category: 'flower', name: 'Woodland Primroses' },
  { id: 'sprout_seedling_1', x1: 162, x2: 186, y1: 366, y2: 398, category: 'flower', name: 'Forest Tree Sprout' },
  { id: 'sprout_sapling', x1: 195, x2: 224, y1: 356, y2: 398, category: 'flower', name: 'Young Oak Sapling' },
  { id: 'clover_sprout', x1: 236, x2: 252, y1: 374, y2: 396, category: 'flower', name: 'Single Clover Sprout' },
  { id: 'clover_patch_small', x1: 262, x2: 282, y1: 363, y2: 387, category: 'flower', name: 'Small Clover Patch' },
  { id: 'clover_four_leaf', x1: 307, x2: 324, y1: 376, y2: 391, category: 'flower', name: 'Lucky Four-Leaf Clover' },
  { id: 'clover_patch_dense', x1: 333, x2: 353, y1: 364, y2: 392, category: 'flower', name: 'Dense Clover Carpet' },
  { id: 'flower_wildflower_white', x1: 373, x2: 437, y1: 359, y2: 399, category: 'flower', name: 'White Forest Wildflowers' },
  { id: 'flower_snowdrops', x1: 451, x2: 519, y1: 362, y2: 399, category: 'flower', name: 'Nodding White Snowdrops' },
  { id: 'flower_marigold', x1: 542, x2: 586, y1: 354, y2: 396, category: 'flower', name: 'Meadow Marigolds' },
  { id: 'ground_twigs_1', x1: 615, x2: 657, y1: 354, y2: 394, category: 'flower', name: 'Forest Twigs Cluster' },
  { id: 'ground_twigs_2', x1: 686, x2: 697, y1: 366, y2: 395, category: 'flower', name: 'Scattered Pine Twigs' },
  { id: 'ground_pinecone_small', x1: 706, x2: 720, y1: 366, y2: 395, category: 'flower', name: 'Small Forest Pinecone' },
  { id: 'ground_leaf_litter', x1: 723, x2: 737, y1: 360, y2: 397, category: 'flower', name: 'Crisp Autumn Leaf Litter' },
  { id: 'ground_sprouts_field', x1: 750, x2: 775, y1: 366, y2: 397, category: 'flower', name: 'Woodland Grass Sprouts' },
  { id: 'ground_wildflowers_tiny', x1: 778, x2: 796, y1: 367, y2: 396, category: 'flower', name: 'Tiny Meadow Wildflowers' },
  { id: 'ground_moss_turf', x1: 815, x2: 838, y1: 365, y2: 397, category: 'flower', name: 'Soft Green Moss Turf' },
  { id: 'snowdrift_patch_small', x1: 857, x2: 928, y1: 364, y2: 398, category: 'flower', name: 'Small Winter Snowdrift' },
  { id: 'snowdrift_patch_large', x1: 941, x2: 1005, y1: 365, y2: 398, category: 'flower', name: 'Deep Winter Snow Bank' },

  // ROW 5: Lilypads & Aquatic Items
  { id: 'lilypad_plain', x1: 19, x2: 74, y1: 406, y2: 463, category: 'lilypad', name: 'River Lily Pad' },
  { id: 'lilypad_flower', x1: 80, x2: 158, y1: 406, y2: 470, category: 'lilypad', name: 'Flowering Water Lily Pad' },
  { id: 'lilypad_subitize_5', x1: 160, x2: 218, y1: 406, y2: 470, category: 'lilypad', name: 'Subitizing Lily Pad (5 Dots)' },
  { id: 'lilypad_subitize_4', x1: 235, x2: 290, y1: 425, y2: 469, category: 'lilypad', name: 'Subitizing Lily Pad (4 Dots)' },
  { id: 'lilypad_subitize_1', x1: 306, x2: 350, y1: 425, y2: 467, category: 'lilypad', name: 'Subitizing Lily Pad (1 Dot)' },
  { id: 'lilypad_subitize_3', x1: 362, x2: 405, y1: 425, y2: 470, category: 'lilypad', name: 'Subitizing Lily Pad (3 Dots)' },
  { id: 'lilypad_subitize_2', x1: 418, x2: 461, y1: 425, y2: 471, category: 'lilypad', name: 'Subitizing Lily Pad (2 Dots)' },
  { id: 'lilypad_subitize_dots', x1: 473, x2: 517, y1: 424, y2: 471, category: 'lilypad', name: 'Counting Dot Lily Pad' },
  { id: 'reed_cattail_cluster', x1: 533, x2: 578, y1: 416, y2: 473, category: 'lilypad', name: 'Wetland Cattails Cluster' },
  { id: 'reed_cattail_pair', x1: 593, x2: 629, y1: 408, y2: 473, category: 'lilypad', name: 'Riverbank Cattails Pair' },
  { id: 'reed_cattail_single', x1: 641, x2: 675, y1: 416, y2: 473, category: 'lilypad', name: 'Slender Single Cattail' },
  { id: 'water_edge_bank', x1: 688, x2: 754, y1: 440, y2: 472, category: 'lilypad', name: 'Grassy Riverbank Turf' },
  { id: 'water_shoreline_sand', x1: 768, x2: 897, y1: 423, y2: 473, category: 'lilypad', name: 'Sandy Shoreline Edge' },
  { id: 'pond_basin_water', x1: 920, x2: 1010, y1: 414, y2: 473, category: 'lilypad', name: 'Clear Woodland Pond Basin' },

  // ROW 6: Interactive Collectibles & Natural Obstacles
  { id: 'item_stick_branch', x1: 119, x2: 151, y1: 504, y2: 551, category: 'item', name: 'Dry Fallen Branch' },
  { id: 'item_autumn_foliage', x1: 184, x2: 214, y1: 511, y2: 553, category: 'item', name: 'Autumn Oak Leaf' },
  { id: 'item_pinecone_rich', x1: 249, x2: 285, y1: 510, y2: 549, category: 'item', name: 'Fragrant Pinecone' },
  { id: 'item_acorn_glossy', x1: 307, x2: 361, y1: 506, y2: 550, category: 'item', name: 'Glossy Oak Acorn' },
  { id: 'item_maple_seed_pair', x1: 378, x2: 434, y1: 502, y2: 556, category: 'item', name: 'Winged Maple Seeds' },
  { id: 'item_maple_seed_cluster', x1: 451, x2: 480, y1: 505, y2: 553, category: 'item', name: 'Whirlybird Seed Cluster' },
  { id: 'item_acorn_caps', x1: 486, x2: 512, y1: 517, y2: 553, category: 'item', name: 'Loose Acorn Caps' },
  { id: 'obstacle_flat_stones', x1: 534, x2: 623, y1: 502, y2: 565, category: 'obstacle', name: 'Flat River Stepping Stones' },
  { id: 'obstacle_mossy_log', x1: 636, x2: 732, y1: 504, y2: 559, category: 'obstacle', name: 'Moss-Covered Cedar Log' },
  { id: 'obstacle_boulder_cluster', x1: 744, x2: 826, y1: 501, y2: 565, category: 'obstacle', name: 'Granite Boulders with Moss' },
  { id: 'obstacle_ice_step_1', x1: 841, x2: 880, y1: 507, y2: 538, category: 'obstacle', name: 'Frosted Ice Step' },
  { id: 'obstacle_ice_step_2', x1: 891, x2: 933, y1: 505, y2: 541, category: 'obstacle', name: 'Deep Frozen River Step' },
  { id: 'obstacle_ice_step_3', x1: 938, x2: 1006, y1: 516, y2: 565, category: 'obstacle', name: 'Icy River Stepping Blocks' }
];

async function extractAllFlora() {
  console.log('Loading Vegetation & Flora Sprite Sheet:', SOURCE_IMAGE);
  const src = sharp(SOURCE_IMAGE);
  const { data: fullData, info } = await src.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const sheetW = info.width;

  const base64Map = {};

  function isMagenta(r, g, b) {
    const magScore = (r + b) / 2 - g;
    const absDiff = Math.abs(r - b);
    if (r > 130 && b > 120 && g < 130) return true;
    if (magScore > 18 && absDiff < 65 && (r > 60 || b > 60)) return true;
    if (r > 60 && b > 55 && g < 50 && absDiff < 40) return true;
    if (magScore > 12 && absDiff < 50 && (r > 85 || b > 80) && g < 140) return true;
    return false;
  }

  for (const item of FLORA_REGISTRY) {
    const boxW = item.x2 - item.x1 + 1;
    const boxH = item.y2 - item.y1 + 1;
    const inData = new Uint8Array(boxW * boxH * 4);

    for (let y = 0; y < boxH; y++) {
      for (let x = 0; x < boxW; x++) {
        const sIdx = ((item.y1 + y) * sheetW + (item.x1 + x)) * 4;
        const dIdx = (y * boxW + x) * 4;
        inData[dIdx] = fullData[sIdx];
        inData[dIdx + 1] = fullData[sIdx + 1];
        inData[dIdx + 2] = fullData[sIdx + 2];
        inData[dIdx + 3] = 255;
      }
    }

    // Flood fill from edges to remove surrounding magenta/pink background
    const visited = new Uint8Array(boxW * boxH);
    const queue = [];
    for (let x = 0; x < boxW; x++) { queue.push([x, 0], [x, boxH - 1]); }
    for (let y = 1; y < boxH - 1; y++) { queue.push([0, y], [boxW - 1, y]); }

    while (queue.length > 0) {
      const [x, y] = queue.pop();
      if (x < 0 || x >= boxW || y < 0 || y >= boxH) continue;
      const vIdx = y * boxW + x;
      if (visited[vIdx]) continue;
      visited[vIdx] = 1;
      const pIdx = vIdx * 4;
      const r = inData[pIdx], g = inData[pIdx + 1], b = inData[pIdx + 2];
      if (isMagenta(r, g, b)) {
        inData[pIdx + 3] = 0;
        queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
    }

    // Three-pass defringe on transparent border pixels to remove pink/magenta halos
    for (let pass = 0; pass < 3; pass++) {
      for (let y = 0; y < boxH; y++) {
        for (let x = 0; x < boxW; x++) {
          const idx = (y * boxW + x) * 4;
          if (inData[idx + 3] === 0) continue;
          const r = inData[idx], g = inData[idx + 1], b = inData[idx + 2];

          let adjTrans = false;
          for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= boxW || ny < 0 || ny >= boxH || inData[(ny * boxW + nx) * 4 + 3] === 0) {
              adjTrans = true;
              break;
            }
          }

          if (adjTrans && isMagenta(r, g, b)) {
            inData[idx + 3] = 0;
          }
        }
      }
    }

    // Final clean sweep: zero tolerance for any stray magenta/pink pixels
    for (let y = 0; y < boxH; y++) {
      for (let x = 0; x < boxW; x++) {
        const idx = (y * boxW + x) * 4;
        if (inData[idx + 3] === 0) continue;
        const r = inData[idx], g = inData[idx + 1], b = inData[idx + 2];
        if (isMagenta(r, g, b)) {
          inData[idx + 3] = 0;
        }
      }
    }

    // Auto-crop to visible content bounding box with 1px padding
    let minX = boxW, maxX = 0, minY = boxH, maxY = 0;
    for (let y = 0; y < boxH; y++) {
      for (let x = 0; x < boxW; x++) {
        if (inData[(y * boxW + x) * 4 + 3] > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (minX > maxX) {
      console.warn(`[WARN] Empty sprite for ${item.id}, providing clean transparent fallback`);
      const fallbackPng = await sharp({
        create: {
          width: 32,
          height: 32,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .png()
        .toBuffer();
      const pngPath = path.join(OUT_DIR, `${item.id}.png`);
      fs.writeFileSync(pngPath, fallbackPng);
      base64Map[item.id] = `data:image/png;base64,${fallbackPng.toString('base64')}`;
      continue;
    }

    const pad = 1;
    const finalMinX = Math.max(0, minX - pad);
    const finalMaxX = Math.min(boxW - 1, maxX + pad);
    const finalMinY = Math.max(0, minY - pad);
    const finalMaxY = Math.min(boxH - 1, maxY + pad);

    const cropW = finalMaxX - finalMinX + 1;
    const cropH = finalMaxY - finalMinY + 1;
    const cropped = new Uint8Array(cropW * cropH * 4);

    for (let y = 0; y < cropH; y++) {
      for (let x = 0; x < cropW; x++) {
        const s = ((finalMinY + y) * boxW + (finalMinX + x)) * 4;
        const d = (y * cropW + x) * 4;
        cropped[d] = inData[s];
        cropped[d + 1] = inData[s + 1];
        cropped[d + 2] = inData[s + 2];
        cropped[d + 3] = inData[s + 3];
      }
    }

    const pngBuffer = await sharp(cropped, { raw: { width: cropW, height: cropH, channels: 4 } })
      .png()
      .toBuffer();

    const pngPath = path.join(OUT_DIR, `${item.id}.png`);
    fs.writeFileSync(pngPath, pngBuffer);

    base64Map[item.id] = `data:image/png;base64,${pngBuffer.toString('base64')}`;
    console.log(`Extracted [${item.id}]: ${cropW}x${cropH} px -> ${pngPath}`);
  }

  // Generate canonicalFloraAssets.ts
  const code = `/**
 * Canonical Vegetation & Flora Sprite Assets for Bramble & Pip.
 * Extracted directly from the master Vegetation & Flora Sprite Sheet.
 * Pre-encoded as base64 data URIs for zero network egress.
 */

export interface FloraAssetMeta {
  id: string;
  name: string;
  category: 'tree' | 'shrub' | 'undergrowth' | 'flower' | 'lilypad' | 'item' | 'obstacle';
  dataUri: string;
}

export const CANONICAL_FLORA_DATA: Record<string, string> = ${JSON.stringify(base64Map, null, 2)};

export const FLORA_CATALOG = ${JSON.stringify(FLORA_REGISTRY.map(f => ({
  id: f.id,
  category: f.category,
  name: f.name
})), null, 2)};
`;

  const tsPath = path.resolve('src/render/canonicalFloraAssets.ts');
  fs.writeFileSync(tsPath, code, 'utf-8');
  console.log(`\nSuccessfully saved ${Object.keys(base64Map).length} flora assets to ${tsPath}!`);
}

extractAllFlora().catch(err => {
  console.error('Fatal error extracting flora:', err);
  process.exit(1);
});
