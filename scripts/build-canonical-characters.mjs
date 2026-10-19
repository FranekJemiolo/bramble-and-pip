import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const CANDIDATE_SOURCES = [
  '/Users/franek/.gemini/antigravity-ide/brain/405c7d12-042f-4df5-bc65-b58f3639186e/.user_uploaded/media_1792413552570.jpg',
  '/Users/franek/.gemini/antigravity-ide/brain/405c7d12-042f-4df5-bc65-b58f3639186e/.tempmediaStorage/media_1792415172190.jpg',
];

const SOURCE_IMAGE = CANDIDATE_SOURCES.find((p) => fs.existsSync(p));
if (!SOURCE_IMAGE) {
  console.error('Source image for Junior Ranger & Pip Sprite Sheet not found!');
  process.exit(1);
}

const OUT_DIR = path.resolve('public/assets/characters');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

export const CHARACTER_REGISTRY = [
  // ROW 1: Walk Down & Walk Up
  { id: 'ranger_walk_down_0', box: [135, 65, 215, 195], category: 'ranger_walk', name: 'Junior Ranger Walk Down (Frame 0)' },
  { id: 'ranger_walk_down_1', box: [230, 65, 310, 195], category: 'ranger_walk', name: 'Junior Ranger Walk Down (Frame 1)' },
  { id: 'ranger_walk_down_2', box: [325, 65, 405, 195], category: 'ranger_walk', name: 'Junior Ranger Walk Down (Frame 2)' },
  { id: 'ranger_walk_down_3', box: [420, 65, 500, 195], category: 'ranger_walk', name: 'Junior Ranger Walk Down (Frame 3)' },
  { id: 'ranger_walk_up_0',   box: [635, 70, 720, 200], category: 'ranger_walk', name: 'Junior Ranger Walk Up (Frame 0)' },
  { id: 'ranger_walk_up_1',   box: [735, 70, 820, 200], category: 'ranger_walk', name: 'Junior Ranger Walk Up (Frame 1)' },
  { id: 'ranger_walk_up_2',   box: [830, 70, 915, 200], category: 'ranger_walk', name: 'Junior Ranger Walk Up (Frame 2)' },
  { id: 'ranger_walk_up_3',   box: [925, 70, 1010, 200], category: 'ranger_walk', name: 'Junior Ranger Walk Up (Frame 3)' },

  // ROW 2: Walk Left & Walk Right
  { id: 'ranger_walk_left_0',  box: [135, 235, 215, 365], category: 'ranger_walk', name: 'Junior Ranger Walk Left (Frame 0)' },
  { id: 'ranger_walk_left_1',  box: [230, 235, 310, 365], category: 'ranger_walk', name: 'Junior Ranger Walk Left (Frame 1)' },
  { id: 'ranger_walk_left_2',  box: [325, 235, 405, 365], category: 'ranger_walk', name: 'Junior Ranger Walk Left (Frame 2)' },
  { id: 'ranger_walk_left_3',  box: [420, 235, 500, 365], category: 'ranger_walk', name: 'Junior Ranger Walk Left (Frame 3)' },
  { id: 'ranger_walk_right_0', box: [635, 235, 715, 365], category: 'ranger_walk', name: 'Junior Ranger Walk Right (Frame 0)' },
  { id: 'ranger_walk_right_1', box: [730, 235, 815, 365], category: 'ranger_walk', name: 'Junior Ranger Walk Right (Frame 1)' },
  { id: 'ranger_walk_right_2', box: [825, 235, 905, 365], category: 'ranger_walk', name: 'Junior Ranger Walk Right (Frame 2)' },
  { id: 'ranger_walk_right_3', box: [920, 235, 1010, 365], category: 'ranger_walk', name: 'Junior Ranger Walk Right (Frame 3)' },

  // ROW 3: Actions
  { id: 'ranger_action_flashlight',       box: [175, 360, 310, 480], category: 'ranger_action', name: 'Junior Ranger Flashlight Beam' },
  { id: 'ranger_action_kneel_inspect',    box: [310, 370, 395, 480], category: 'ranger_action', name: 'Junior Ranger Kneeling Ground Inspection' },
  { id: 'ranger_action_magnifying_glass', box: [395, 370, 505, 480], category: 'ranger_action', name: 'Junior Ranger Magnifying Glass Inspection' },
  { id: 'ranger_action_flashlight_kneel', box: [505, 365, 640, 480], category: 'ranger_action', name: 'Junior Ranger Kneeling Flashlight' },
  { id: 'ranger_action_sketchbook',       box: [640, 365, 740, 480], category: 'ranger_action', name: 'Junior Ranger Nature Field Sketching' },
  { id: 'ranger_action_kneel_rest',       box: [760, 365, 860, 480], category: 'ranger_action', name: 'Junior Ranger Kneeling Rest' },

  // ROW 4: Resting
  { id: 'ranger_rest_log_sit',      box: [185, 460, 330, 580], category: 'ranger_rest', name: 'Junior Ranger Sitting on Cedar Log' },
  { id: 'ranger_rest_log_yawn',     box: [340, 460, 485, 580], category: 'ranger_rest', name: 'Junior Ranger Log Yawning & Rubbing Eyes' },
  { id: 'ranger_rest_quilt_side',   box: [505, 495, 655, 580], category: 'ranger_rest', name: 'Junior Ranger Side Sleep Under Quilt' },
  { id: 'ranger_rest_quilt_sleep',  box: [660, 495, 820, 580], category: 'ranger_rest', name: 'Junior Ranger Peaceful Sleep Under Quilt' },
  { id: 'ranger_rest_quilt_tucked', box: [825, 495, 985, 580], category: 'ranger_rest', name: 'Junior Ranger Tucked Sleep Under Patchwork Quilt' },

  // ROW 5: Pip Movement
  { id: 'pip_move_down_0',  box: [175, 590, 260, 670], category: 'pip_move', name: 'Pip Bounding Hop Down (Frame 0)' },
  { id: 'pip_move_down_1',  box: [270, 590, 360, 670], category: 'pip_move', name: 'Pip Bounding Hop Down (Frame 1)' },
  { id: 'pip_move_up_0',    box: [415, 570, 510, 675], category: 'pip_move', name: 'Pip Bounding Hop Up (Frame 0)' },
  { id: 'pip_move_up_1',    box: [510, 570, 600, 675], category: 'pip_move', name: 'Pip Bounding Hop Up (Frame 1)' },
  { id: 'pip_move_left_0',  box: [605, 585, 705, 670], category: 'pip_move', name: 'Pip Bounding Hop Left (Frame 0)' },
  { id: 'pip_move_left_1',  box: [710, 585, 810, 670], category: 'pip_move', name: 'Pip Bounding Hop Left (Frame 1)' },
  { id: 'pip_move_right_0', box: [815, 585, 915, 670], category: 'pip_move', name: 'Pip Bounding Hop Right (Frame 0)' },
  { id: 'pip_move_right_1', box: [915, 585, 1015, 670], category: 'pip_move', name: 'Pip Bounding Hop Right (Frame 1)' },

  // ROW 6: Pip Moods
  { id: 'pip_mood_happy_jump',     box: [175, 670, 275, 765], category: 'pip_mood', name: 'Pip Excited Joyful Jump' },
  { id: 'pip_mood_leaf_helper',    box: [280, 675, 400, 765], category: 'pip_mood', name: 'Pip Holding Forest Leaf' },
  { id: 'pip_mood_gear_helper_1',  box: [400, 675, 505, 765], category: 'pip_mood', name: 'Pip Holding Watermill Cog' },
  { id: 'pip_mood_gear_helper_2',  box: [505, 675, 605, 765], category: 'pip_mood', name: 'Pip Turning Wooden Mill Gear' },
  { id: 'pip_mood_curious_perked', box: [615, 675, 705, 765], category: 'pip_mood', name: 'Pip Alert Perked Ears Curiosity' },
  { id: 'pip_mood_yawn_sleepy',    box: [715, 675, 815, 765], category: 'pip_mood', name: 'Pip Sleepy Yawning' },
  { id: 'pip_mood_nest_sleep',     box: [830, 675, 970, 765], category: 'pip_mood', name: 'Pip Curled Sleep in Moss Nest' },
];

function isMagentaOrPink(r, g, b) {
  return r > 165 && b > 165 && ((r + b) / 2 - g > 35);
}

async function extractAllCharacters() {
  console.log('Loading Junior Ranger & Pip Sprite Sheet from:', SOURCE_IMAGE);
  const src = sharp(SOURCE_IMAGE);
  const { data: fullData, info } = await src.raw().toBuffer({ resolveWithObject: true });
  const sheetW = info.width;

  const base64Map = {};

  for (const item of CHARACTER_REGISTRY) {
    const [x1, y1, x2, y2] = item.box;
    const boxW = x2 - x1 + 1;
    const boxH = y2 - y1 + 1;
    const inData = new Uint8Array(boxW * boxH * 4);

    for (let y = 0; y < boxH; y++) {
      for (let x = 0; x < boxW; x++) {
        const sIdx = ((y1 + y) * sheetW + (x1 + x)) * 3;
        const dIdx = (y * boxW + x) * 4;
        inData[dIdx] = fullData[sIdx];
        inData[dIdx + 1] = fullData[sIdx + 1];
        inData[dIdx + 2] = fullData[sIdx + 2];
        inData[dIdx + 3] = 255;
      }
    }

    // Flood fill from borders
    const visited = new Uint8Array(boxW * boxH);
    const queue = [];

    for (let x = 0; x < boxW; x++) {
      queue.push([x, 0], [x, boxH - 1]);
    }
    for (let y = 1; y < boxH - 1; y++) {
      queue.push([0, y], [boxW - 1, y]);
    }

    while (queue.length > 0) {
      const [x, y] = queue.pop();
      if (x < 0 || x >= boxW || y < 0 || y >= boxH) continue;
      const vIdx = y * boxW + x;
      if (visited[vIdx]) continue;
      visited[vIdx] = 1;

      const pIdx = vIdx * 4;
      if (isMagentaOrPink(inData[pIdx], inData[pIdx + 1], inData[pIdx + 2])) {
        inData[pIdx + 3] = 0; // Transparent
        queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
    }

    // Two-pass defringe on transparent border pixels
    for (let pass = 0; pass < 2; pass++) {
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

          if (adjTrans && (r + b) / 2 - g > 25 && r > 110 && b > 110) {
            inData[idx + 3] = 0;
          }
        }
      }
    }

    // Find visible content bounds
    let minX = boxW, maxX = 0, minY = boxH, maxY = 0;
    let count = 0;
    for (let y = 0; y < boxH; y++) {
      for (let x = 0; x < boxW; x++) {
        const idx = (y * boxW + x) * 4;
        if (inData[idx + 3] > 0) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
          count++;
        }
      }
    }

    if (count === 0 || minX > maxX || minY > maxY) {
      console.warn(`[WARN] Empty sprite for ${item.id}`);
      continue;
    }

    // Auto-crop with 1px padding
    const pad = 1;
    const finalMinX = Math.max(0, minX - pad);
    const finalMaxX = Math.min(boxW - 1, maxX + pad);
    const finalMinY = Math.max(0, minY - pad);
    const finalMaxY = Math.min(boxH - 1, maxY + pad);
    const cropW = finalMaxX - finalMinX + 1;
    const cropH = finalMaxY - finalMinY + 1;

    const pngBuffer = await sharp(inData, { raw: { width: boxW, height: boxH, channels: 4 } })
      .extract({ left: finalMinX, top: finalMinY, width: cropW, height: cropH })
      .png({ compressionLevel: 9 })
      .toBuffer();

    const outPath = path.join(OUT_DIR, `${item.id}.png`);
    fs.writeFileSync(outPath, pngBuffer);

    base64Map[item.id] = `data:image/png;base64,${pngBuffer.toString('base64')}`;
    console.log(`Extracted [${item.id}]: ${cropW}x${cropH} px (${count} opaque px) -> ${outPath}`);
  }

  // Generate src/render/canonicalCharacterAssets.ts
  const tsContent = `/**
 * Canonical Junior Ranger & Pip Sprite Assets for Bramble & Pip.
 * Extracted directly from the master Junior Ranger & Pip Sprite Sheet.
 * Pre-encoded as base64 data URIs for zero network egress.
 */

export interface CharacterAssetMeta {
  id: string;
  name: string;
  category: 'ranger_walk' | 'ranger_action' | 'ranger_rest' | 'pip_move' | 'pip_mood';
  box: [number, number, number, number];
}

export const CANONICAL_CHARACTER_DATA: Record<string, string> = ${JSON.stringify(base64Map, null, 2)};

export const CHARACTER_CATALOG: CharacterAssetMeta[] = ${JSON.stringify(CHARACTER_REGISTRY, null, 2)};
`;

  const tsOutPath = path.resolve('src/render/canonicalCharacterAssets.ts');
  fs.writeFileSync(tsOutPath, tsContent);
  console.log(`\nSuccessfully wrote ${Object.keys(base64Map).length} character assets to ${tsOutPath}`);
}

extractAllCharacters().catch((err) => {
  console.error('Character extraction failed:', err);
  process.exit(1);
});
