import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const MAP_ASSETS_PATH = path.resolve('src/render/extractedMapAssets.json');
const OUT_PNG = path.resolve('public/assets/maps/visual_collision_map.png');
const ARTIFACT_PNG = '/Users/franek/.gemini/antigravity-ide/brain/405c7d12-042f-4df5-bc65-b58f3639186e/visual_collision_map.png';

export const ACCURATE_MAP_COLLISIONS = {
  ranger_cabin: {
    id: 'ranger_cabin',
    title: '1. RANGER CABIN & BACKYARD (Spring Dawn - Safe Interior)',
    textureKey: 'ranger_cabin_bg',
    rows: [
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
      '########...#########'
    ],
    exits: [{ x: 9, y: 11, label: 'EXIT SOUTH -> PEBBLE CREEK' }]
  },
  pebble_creek: {
    id: 'pebble_creek',
    title: '2. PEBBLE CREEK (Spring - River & Stepping Stone Bridge)',
    textureKey: 'pebble_creek_bg',
    rows: [
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
      '####################'
    ],
    exits: [
      { x: 5, y: 0, label: 'EXIT NORTH -> CABIN' },
      { x: 19, y: 6, label: 'EXIT EAST -> MOSSY HOLLOW' }
    ]
  },
  mossy_hollow: {
    id: 'mossy_hollow',
    title: '3. MOSSY HOLLOW (Summer - Overgrown Watermill & Clearing)',
    textureKey: 'mossy_hollow_bg',
    rows: [
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
      '####################'
    ],
    exits: [
      { x: 0, y: 5, label: 'EXIT WEST -> PEBBLE CREEK' },
      { x: 19, y: 6, label: 'EXIT EAST -> SUNSET MEADOW' }
    ]
  },
  sunset_meadow: {
    id: 'sunset_meadow',
    title: '4. SUNSET MEADOW (Autumn - Golden Meadow & Leaf Piles)',
    textureKey: 'sunset_meadow_bg',
    rows: [
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
      '####################'
    ],
    exits: [
      { x: 0, y: 8, label: 'EXIT WEST -> MOSSY HOLLOW' },
      { x: 19, y: 6, label: 'EXIT EAST -> PINE RIDGE' }
    ]
  },
  pine_ridge: {
    id: 'pine_ridge',
    title: '5. THE PINE RIDGE (Winter - Alpine Snow Trail & Den)',
    textureKey: 'pine_ridge_bg',
    rows: [
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
      '####################'
    ],
    exits: [
      { x: 0, y: 6, label: 'EXIT WEST -> SUNSET MEADOW' },
      { x: 19, y: 6, label: 'EXIT EAST -> RANGER LODGE' }
    ]
  },
  ranger_lodge: {
    id: 'ranger_lodge',
    title: '6. THE RANGER LODGE (Year-End - Campfire & Celebration)',
    textureKey: 'ranger_lodge_bg',
    rows: [
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
      '####################'
    ],
    exits: [
      { x: 0, y: 6, label: 'EXIT WEST -> PINE RIDGE' },
      { x: 16, y: 6, label: 'DOORWAY -> HEARTH' }
    ]
  }
};

async function renderPanel(mapDef, mapAssets) {
  const bgDataUri = mapAssets[mapDef.textureKey];
  const bgBuf = Buffer.from(bgDataUri.split(',')[1], 'base64');
  const { data } = await sharp(bgBuf).resize(320, 192).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const panelW = 320;
  const panelH = 192;
  const overlay = Buffer.from(data);

  // Apply collision overlay
  for (let r = 0; r < 12; r++) {
    const row = mapDef.rows[r];
    for (let c = 0; c < 20; c++) {
      const isSolid = row[c] === '#';
      for (let py = r * 16; py < (r + 1) * 16; py++) {
        for (let px = c * 16; px < (c + 1) * 16; px++) {
          const idx = (py * panelW + px) * 4;
          const isBorder = (py === r * 16 || py === (r + 1) * 16 - 1 || px === c * 16 || px === (c + 1) * 16 - 1);

          if (isSolid) {
            // Natural barrier (crimson tint)
            overlay[idx] = Math.min(255, overlay[idx] * 0.4 + (isBorder ? 220 : 130));
            overlay[idx + 1] = overlay[idx + 1] * 0.3;
            overlay[idx + 2] = overlay[idx + 2] * 0.3;
          } else {
            // Walkable pathway (green border highlight)
            if (isBorder) {
              overlay[idx] = overlay[idx] * 0.5;
              overlay[idx + 1] = Math.min(255, overlay[idx + 1] * 0.5 + 180);
              overlay[idx + 2] = overlay[idx + 2] * 0.5;
            }
          }
        }
      }
    }
  }

  // Draw exit points in bright gold
  for (const exit of mapDef.exits) {
    const startX = exit.x * 16;
    const startY = exit.y * 16;
    for (let py = startY; py < startY + 16; py++) {
      for (let px = startX; px < startX + 16; px++) {
        if (py >= 0 && py < panelH && px >= 0 && px < panelW) {
          const idx = (py * panelW + px) * 4;
          overlay[idx] = 255;
          overlay[idx + 1] = 215;
          overlay[idx + 2] = 0;
          overlay[idx + 3] = 220;
        }
      }
    }
  }

  return sharp(overlay, { raw: { width: panelW, height: panelH, channels: 4 } }).png().toBuffer();
}

async function main() {
  console.log('Generating master Visual Collision Map...');
  const mapAssets = JSON.parse(fs.readFileSync(MAP_ASSETS_PATH, 'utf8'));

  const mapList = Object.values(ACCURATE_MAP_COLLISIONS);
  const panelBuffers = [];
  for (const mapDef of mapList) {
    const buf = await renderPanel(mapDef, mapAssets);
    panelBuffers.push({ buf, mapDef });
  }

  // Layout: 2 columns x 3 rows
  // Each card has: title header (320x24) + map view (320x192) = 320x216
  // Card padding: 16px, background wooden slate
  const cardW = 320, cardH = 216;
  const padding = 16;
  const totalW = padding * 3 + cardW * 2; // 16 + 320 + 16 + 320 + 16 = 688
  const totalH = 60 + padding * 4 + cardH * 3; // header banner 60 + 16*4 + 216*3 = 772

  const svgHeader = `
    <svg width="${totalW}" height="${totalH}">
      <rect width="${totalW}" height="${totalH}" fill="#1E2820"/>
      <!-- Master Title -->
      <text x="${totalW / 2}" y="36" font-family="monospace, sans-serif" font-weight="bold" font-size="20" fill="#E8D5B5" text-anchor="middle">
        BRAMBLE &amp; PIP: VISUAL COLLISIONS &amp; WALKABILITY MAP
      </text>
      <text x="${totalW / 2}" y="52" font-family="monospace, sans-serif" font-size="11" fill="#A4B89D" text-anchor="middle">
        Red = Natural Collision Barriers (Water, Trees, Machinery) | Green = Walkable Paths | Gold = Zone Transitions
      </text>
    </svg>
  `;

  const composites = [
    { input: Buffer.from(svgHeader), left: 0, top: 0 }
  ];

  for (let i = 0; i < panelBuffers.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const posX = padding + col * (cardW + padding);
    const posY = 60 + padding + row * (cardH + padding);

    const titleSvg = `
      <svg width="${cardW}" height="24">
        <rect width="${cardW}" height="24" fill="#2D3A2F" rx="3"/>
        <text x="8" y="16" font-family="monospace, sans-serif" font-weight="bold" font-size="10" fill="#F4E8D1">
          ${panelBuffers[i].mapDef.title.replace(/&/g, '&amp;')}
        </text>
      </svg>
    `;

    composites.push({
      input: Buffer.from(titleSvg),
      left: posX,
      top: posY
    });

    composites.push({
      input: panelBuffers[i].buf,
      left: posX,
      top: posY + 24
    });
  }

  const finalImage = await sharp({
    create: {
      width: totalW,
      height: totalH,
      channels: 4,
      background: { r: 30, g: 40, b: 32, alpha: 1 }
    }
  })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(OUT_PNG, finalImage);
  fs.writeFileSync(ARTIFACT_PNG, finalImage);
  console.log(`Master Visual Collision Map written to:\n- ${OUT_PNG}\n- ${ARTIFACT_PNG}`);
}

main().catch(err => {
  console.error('Failed to generate visual collision map:', err);
  process.exit(1);
});
