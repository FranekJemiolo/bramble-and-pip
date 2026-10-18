// Generates the PWA icons from a hand-authored 32×32 indexed pixel scene using ONLY the
// 16-colour Whispering Woods palette, scaled with nearest-neighbour. No dependencies.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const PALETTE = [
  '#1A232A', '#2C3E50', '#3B2F2F', '#5C4033', '#2E5328', '#4A7032', '#789E3E', '#DCE38A',
  '#B88A58', '#8C5832', '#C96E2E', '#B84432', '#6B8E9E', '#A8C4D0', '#E4EDF0', '#FAF6E8',
].map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));

const N = 32;
const px = new Uint8Array(N * N).fill(1); // night slate sky

const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < N && y < N) px[y * N + x] = c; };
const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, c); };
const disk = (cx, cy, r, c) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r / 2) set(cx + x, cy + y, c); };

// Hills + snow-light ground
rect(0, 24, N, 8, 4);
rect(0, 24, N, 1, 5);
// Moon / lantern glow
disk(24, 7, 4, 13);
disk(24, 7, 3, 15);
// Pine (3 tiers)
const tier = (cx, top, h, c) => { for (let r = 0; r < h; r++) rect(cx - r - 1, top + r, 2 * r + 3, 1, c); };
tier(11, 5, 7, 4); tier(11, 10, 8, 5); tier(11, 15, 9, 4);
rect(10, 24, 3, 4, 3);
// Pip: pinecone body + ears + tail
disk(21, 22, 3, 9);
rect(20, 23, 3, 2, 8);
set(19, 18, 9); set(23, 18, 9); set(19, 19, 9); set(23, 19, 9); // ears
set(20, 21, 0); set(22, 21, 0); // eyes
set(25, 21, 10); set(26, 20, 10); set(26, 19, 10); // tail
// Stars
[[3, 3], [7, 2], [17, 3], [29, 14], [4, 12]].forEach(([x, y]) => set(x, y, 15));

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, contentScale) {
  // contentScale < 1 shrinks the scene into the centre (maskable safe zone), filling the rest with sky.
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const inner = Math.floor(size * contentScale);
  const off = Math.floor((size - inner) / 2);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const sx = Math.floor(((x - off) / inner) * N);
      const sy = Math.floor(((y - off) / inner) * N);
      const inside = sx >= 0 && sy >= 0 && sx < N && sy < N;
      const [r, g, b] = PALETTE[inside ? px[sy * N + sx] : 1];
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
}

writeFileSync(join(outDir, 'icon-192.png'), png(192, 1));
writeFileSync(join(outDir, 'icon-512.png'), png(512, 1));
writeFileSync(join(outDir, 'icon-maskable-512.png'), png(512, 0.72));

// SVG favicon built from the same pixels (run-length merged rects, crisp edges).
let rects = '';
for (let y = 0; y < N; y++) {
  let x = 0;
  while (x < N) {
    const c = px[y * N + x]; let w = 1;
    while (x + w < N && px[y * N + x + w] === c) w++;
    rects += `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${PALETTE[c].reduce((s, v) => s + v.toString(16).padStart(2, '0'), '#')}"/>`;
    x += w;
  }
}
writeFileSync(join(root, 'public', 'favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges">${rects}</svg>\n`);
console.log('icons written to public/icons and public/favicon.svg');
