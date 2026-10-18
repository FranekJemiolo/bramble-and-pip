import readline from 'node:readline';
import { processRawSprite, WHISPERING_WOODS_RGB } from './process-sprite.js';
import sharp from 'sharp';
import fs from 'node:fs';

/**
 * Local Art Pipeline MCP Server.
 * Exposes tools for:
 * 1. sanitize_sprite: Strips chroma-key, clamps to Whispering Woods 16-color palette, enforces binary alpha.
 * 2. audit_palette: Inspects an image file to verify 100% compliance with the 16-color master palette.
 * 3. test_tile_seam: Measures boundary color variance along edge seams for repeating terrain tiles.
 */

async function handleAuditPalette({ imagePath }) {
  if (!fs.existsSync(imagePath)) {
    return { error: `File not found: ${imagePath}` };
  }

  const { data, info } = await sharp(imagePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixelCount = info.width * info.height;
  let nonCompliantCount = 0;
  const uniqueNonCompliant = new Set();

  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const a = data[idx + 3];
    if (a === 0) continue; // Fully transparent is allowed

    if (a > 0 && a < 255) {
      nonCompliantCount++;
      uniqueNonCompliant.add(`Semi-transparent alpha (${a}) at index ${i}`);
      continue;
    }

    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    const match = WHISPERING_WOODS_RGB.some(
      (c) => c[0] === r && c[1] === g && c[2] === b
    );

    if (!match) {
      nonCompliantCount++;
      uniqueNonCompliant.add(`rgb(${r},${g},${b})`);
    }
  }

  return {
    compliant: nonCompliantCount === 0,
    totalPixels: pixelCount,
    nonCompliantPixels: nonCompliantCount,
    samples: Array.from(uniqueNonCompliant).slice(0, 10),
  };
}

async function handleTestTileSeam({ imagePath, tileSize = 16 }) {
  if (!fs.existsSync(imagePath)) {
    return { error: `File not found: ${imagePath}` };
  }

  const { data, info } = await sharp(imagePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.width !== tileSize || info.height !== tileSize) {
    return { error: `Expected ${tileSize}x${tileSize} tile, got ${info.width}x${info.height}` };
  }

  // Calculate boundary variance between left (x=0) and right (x=tileSize-1) edges
  let horizontalSeamDelta = 0;
  for (let y = 0; y < tileSize; y++) {
    const leftIdx = (y * tileSize + 0) * 4;
    const rightIdx = (y * tileSize + (tileSize - 1)) * 4;
    for (let c = 0; c < 3; c++) {
      horizontalSeamDelta += Math.abs(data[leftIdx + c] - data[rightIdx + c]);
    }
  }

  // Calculate boundary variance between top (y=0) and bottom (y=tileSize-1) edges
  let verticalSeamDelta = 0;
  for (let x = 0; x < tileSize; x++) {
    const topIdx = (0 * tileSize + x) * 4;
    const botIdx = ((tileSize - 1) * tileSize + x) * 4;
    for (let c = 0; c < 3; c++) {
      verticalSeamDelta += Math.abs(data[topIdx + c] - data[botIdx + c]);
    }
  }

  return {
    horizontalSeamDelta,
    verticalSeamDelta,
    isSeamless: horizontalSeamDelta === 0 && verticalSeamDelta === 0,
  };
}

// Minimal stdio JSON-RPC protocol handler for MCP
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });

rl.on('line', async (line) => {
  if (!line.trim()) return;
  try {
    const req = JSON.parse(line);
    const { id, method, params } = req;

    if (method === 'tools/list') {
      const result = {
        tools: [
          {
            name: 'sanitize_sprite',
            description: 'Enforce Whispering Woods 16-color palette, chroma-key stripping, and binary alpha on a sprite.',
            inputSchema: {
              type: 'object',
              properties: {
                inputPath: { type: 'string' },
                outputPath: { type: 'string' },
              },
              required: ['inputPath', 'outputPath'],
            },
          },
          {
            name: 'audit_palette',
            description: 'Audit an asset to ensure 100% adherence to the Whispering Woods 16-color palette.',
            inputSchema: {
              type: 'object',
              properties: {
                imagePath: { type: 'string' },
              },
              required: ['imagePath'],
            },
          },
          {
            name: 'test_tile_seam',
            description: 'Measure horizontal and vertical edge variance of a 16x16 tile to test seamlessness.',
            inputSchema: {
              type: 'object',
              properties: {
                imagePath: { type: 'string' },
                tileSize: { type: 'number', default: 16 },
              },
              required: ['imagePath'],
            },
          },
        ],
      };
      console.log(JSON.stringify({ jsonrpc: '2.0', id, result }));
      return;
    }

    if (method === 'tools/call') {
      const { name, arguments: args } = params;
      let toolResult;

      if (name === 'sanitize_sprite') {
        toolResult = await processRawSprite(args.inputPath, args.outputPath);
      } else if (name === 'audit_palette') {
        toolResult = await handleAuditPalette(args);
      } else if (name === 'test_tile_seam') {
        toolResult = await handleTestTileSeam(args);
      } else {
        throw new Error(`Unknown tool: ${name}`);
      }

      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id,
        result: { content: [{ type: 'text', text: JSON.stringify(toolResult, null, 2) }] },
      }));
      return;
    }

    // Default response for init / ping
    console.log(JSON.stringify({ jsonrpc: '2.0', id, result: {} }));
  } catch (err) {
    console.error('MCP Error:', err);
  }
});
