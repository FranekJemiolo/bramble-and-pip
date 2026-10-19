import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SOURCE_IMAGE = '/Users/franek/.gemini/antigravity-ide/brain/405c7d12-042f-4df5-bc65-b58f3639186e/.user_uploaded/media_1792413332501.jpg';
const MAPS_DIR = path.resolve('public/assets/maps');
fs.mkdirSync(MAPS_DIR, { recursive: true });

function getPixel(buf, w, x, y, ch = 4) {
  const idx = (y * w + x) * ch;
  return [buf[idx], buf[idx + 1], buf[idx + 2], buf[idx + 3]];
}

function setPixel(buf, w, x, y, [r, g, b, a = 255], ch = 4) {
  const idx = (y * w + x) * ch;
  buf[idx] = r;
  buf[idx + 1] = g;
  buf[idx + 2] = b;
  buf[idx + 3] = a;
}

// 1. RANGER CABIN & GARDEN (Cozy interior + small backyard)
async function buildRangerCabin() {
  console.log('Building Ranger Cabin & Garden...');
  const { data, info } = await sharp(SOURCE_IMAGE)
    .extract({ left: 10, top: 68, width: 326, height: 260 })
    .resize(320, 192, { fit: 'cover', position: 'top' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buf = Buffer.from(data);
  const w = info.width, h = info.height;

  // Inpaint bottom-facing arrow at dirt path (x: 118..146, y: 170..191) with path dirt
  for (let y = 170; y < h; y++) {
    for (let x = 118; x <= 146; x++) {
      const p = getPixel(buf, w, x, y);
      if ((p[0] > 215 && p[1] > 215 && p[2] > 215) || (p[0] < 55 && p[1] < 55 && p[2] < 55)) {
        const refY = 168 + ((x * 7) % 3);
        setPixel(buf, w, x, y, getPixel(buf, w, x, refY));
      }
    }
  }

  // Inpaint dashed border box near fence on right (x: 308..320, y: 145..155)
  for (let y = 145; y <= 155; y++) {
    for (let x = 308; x < w; x++) {
      const p = getPixel(buf, w, x, y);
      if (p[0] > 160 && p[1] > 160 && p[2] > 160) {
        setPixel(buf, w, x, y, getPixel(buf, w, 305, y));
      }
    }
  }

  const outPath = path.join(MAPS_DIR, 'ranger_cabin_bg.png');
  await sharp(buf, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 9, palette: true })
    .toFile(outPath);
  return fs.readFileSync(outPath).toString('base64');
}

// 2. PEBBLE CREEK (Spring)
async function buildPebbleCreek() {
  console.log('Building Pebble Creek (Spring)...');
  const { data, info } = await sharp(SOURCE_IMAGE)
    .extract({ left: 4, top: 430, width: 310, height: 285 })
    .resize(320, 192, { fit: 'cover', position: 'center' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const outPath = path.join(MAPS_DIR, 'pebble_creek_bg.png');
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ compressionLevel: 9, palette: true })
    .toFile(outPath);
  return fs.readFileSync(outPath).toString('base64');
}

// 3. MOSSY HOLLOW (Summer)
async function buildMossyHollow() {
  console.log('Building Mossy Hollow (Summer)...');
  const { data, info } = await sharp(SOURCE_IMAGE)
    .extract({ left: 360, top: 300, width: 298, height: 260 })
    .resize(320, 192, { fit: 'cover', position: 'center' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const outPath = path.join(MAPS_DIR, 'mossy_hollow_bg.png');
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ compressionLevel: 9, palette: true })
    .toFile(outPath);
  return fs.readFileSync(outPath).toString('base64');
}

// 4. SUNSET MEADOW (Autumn)
async function buildSunsetMeadow() {
  console.log('Building Sunset Meadow (Autumn)...');
  const { data, info } = await sharp(SOURCE_IMAGE)
    .extract({ left: 702, top: 495, width: 310, height: 220 })
    .resize(320, 192, { fit: 'cover', position: 'center' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const outPath = path.join(MAPS_DIR, 'sunset_meadow_bg.png');
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ compressionLevel: 9, palette: true })
    .toFile(outPath);
  return fs.readFileSync(outPath).toString('base64');
}

// 5. THE PINE RIDGE (Winter)
async function buildPineRidge() {
  console.log('Building The Pine Ridge (Winter)...');
  const { data, info } = await sharp(SOURCE_IMAGE)
    .extract({ left: 515, top: 36, width: 320, height: 192 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buf = Buffer.from(data);
  const w = info.width, h = info.height;

  // Inpaint top title text '(Winter)' completely (y: 0..12, x: 130..205) using pine needles from row 18
  for (let y = 0; y <= 12; y++) {
    for (let x = 130; x <= 205; x++) {
      setPixel(buf, w, x, y, getPixel(buf, w, x, 18));
    }
  }

  // Inpaint bottom-left corner dashed residue (y: 186..191, x: 0..18)
  for (let y = 186; y < h; y++) {
    for (let x = 0; x <= 18; x++) {
      setPixel(buf, w, x, y, getPixel(buf, w, 22, y));
    }
  }

  const outPath = path.join(MAPS_DIR, 'pine_ridge_bg.png');
  await sharp(buf, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 9, palette: true })
    .toFile(outPath);
  return fs.readFileSync(outPath).toString('base64');
}

// 6. THE RANGER'S LODGE (Year-End gateway)
async function buildRangerLodge() {
  console.log("Building The Ranger's Lodge (Year-End)...");
  const { data, info } = await sharp(SOURCE_IMAGE)
    .extract({ left: 702, top: 36, width: 320, height: 192 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buf = Buffer.from(data);
  const w = info.width, h = info.height;

  // 1. Inpaint divider at x = 148..158
  for (let y = 0; y < h; y++) {
    for (let x = 148; x <= 158; x++) {
      if (y < 40) {
        setPixel(buf, w, x, y, getPixel(buf, w, 142, y));
      } else {
        setPixel(buf, w, x, y, getPixel(buf, w, 144, y));
      }
    }
  }

  // 2. Inpaint entrance arrow box at x: 130..171, y: 122..134 with snow from y=116
  for (let y = 122; y <= 134; y++) {
    for (let x = 130; x <= 171; x++) {
      setPixel(buf, w, x, y, getPixel(buf, w, x, 116));
    }
  }

  // 3. Clean top-left title text '(r)' residue at x: 0..22, y: 0..12 with pine needles from x+26
  for (let y = 0; y <= 12; y++) {
    for (let x = 0; x <= 22; x++) {
      setPixel(buf, w, x, y, getPixel(buf, w, x + 26, y));
    }
  }

  const outPath = path.join(MAPS_DIR, 'ranger_lodge_bg.png');
  await sharp(buf, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 9, palette: true })
    .toFile(outPath);
  return fs.readFileSync(outPath).toString('base64');
}

async function main() {
  const cabin = await buildRangerCabin();
  const pebble = await buildPebbleCreek();
  const hollow = await buildMossyHollow();
  const meadow = await buildSunsetMeadow();
  const pine = await buildPineRidge();
  const lodge = await buildRangerLodge();

  // Save extracted map assets json
  const assetsJson = {
    ranger_cabin_bg: `data:image/png;base64,${cabin}`,
    pebble_creek_bg: `data:image/png;base64,${pebble}`,
    whispering_woods_bg: `data:image/png;base64,${pebble}`,
    mossy_hollow_bg: `data:image/png;base64,${hollow}`,
    mossy_gearbox_bg: `data:image/png;base64,${hollow}`,
    sunset_meadow_bg: `data:image/png;base64,${meadow}`,
    pine_ridge_bg: `data:image/png;base64,${pine}`,
    ranger_lodge_bg: `data:image/png;base64,${lodge}`,
    winter_lodge_bg: `data:image/png;base64,${lodge}`,
  };
  fs.writeFileSync('src/render/extractedMapAssets.json', JSON.stringify(assetsJson, null, 2), 'utf8');

  // Update canonicalAssets.ts
  const targetCanonicalFile = path.resolve('src/render/canonicalAssets.ts');
  let content = fs.readFileSync(targetCanonicalFile, 'utf8');

  function replaceOrAppend(key, base64) {
    const regex = new RegExp(`(${key}:\\s*'data:image/png;base64,)[^']+'`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `$1${base64}'`);
      console.log(`Updated canonical asset: ${key}`);
    } else {
      const insertPos = content.indexOf('};');
      if (insertPos !== -1) {
        const insertion = `  ${key}: 'data:image/png;base64,${base64}',\n`;
        content = content.slice(0, insertPos) + insertion + content.slice(insertPos);
        console.log(`Appended canonical asset: ${key}`);
      }
    }
  }

  replaceOrAppend('ranger_cabin_bg', cabin);
  replaceOrAppend('pebble_creek_bg', pebble);
  replaceOrAppend('whispering_woods_bg', pebble);
  replaceOrAppend('mossy_hollow_bg', hollow);
  replaceOrAppend('mossy_gearbox_bg', hollow);
  replaceOrAppend('sunset_meadow_bg', meadow);
  replaceOrAppend('pine_ridge_bg', pine);
  replaceOrAppend('ranger_lodge_bg', lodge);
  replaceOrAppend('winter_lodge_bg', lodge);

  fs.writeFileSync(targetCanonicalFile, content, 'utf8');
  console.log('Successfully generated all 6 canonical maps and updated canonicalAssets.ts!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
