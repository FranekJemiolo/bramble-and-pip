import { describe, it, expect } from 'vitest';
import { CANONICAL_FAUNA_DATA, FAUNA_CATALOG } from '../../src/render/canonicalFaunaAssets';
import { CANONICAL_ASSETS } from '../../src/render/canonicalAssets';
import fs from 'node:fs';
import path from 'node:path';

describe('Canonical Fauna & Wildlife Assets (77 Sprites)', () => {
  it('contains exactly 77 sprites in CANONICAL_FAUNA_DATA', () => {
    const keys = Object.keys(CANONICAL_FAUNA_DATA);
    expect(keys.length).toBe(77);
  });

  it('contains valid base64 PNG data URIs for all 77 fauna sprites', () => {
    for (const [key, uri] of Object.entries(CANONICAL_FAUNA_DATA)) {
      expect(uri.startsWith('data:image/png;base64,')).toBe(true);
      // Valid base64 length > 100 bytes
      expect(uri.length).toBeGreaterThan(100);
      expect(key.length).toBeGreaterThan(0);
    }
  });

  it('contains 77 entries in FAUNA_CATALOG covering all 14 categories', () => {
    expect(FAUNA_CATALOG.length).toBe(77);

    const categories = new Set(FAUNA_CATALOG.map((f) => f.category));
    const expectedCategories = [
      'bear',
      'deer',
      'hedgehog',
      'dormouse',
      'badger',
      'beaver',
      'rabbit',
      'frog',
      'goose',
      'owl',
      'sparrow',
      'cardinal',
      'insect',
      'track',
    ];

    for (const cat of expectedCategories) {
      expect(categories.has(cat as never)).toBe(true);
    }
  });

  it('merges all fauna data and alias keys into CANONICAL_ASSETS', () => {
    // Check fauna data is included
    expect(CANONICAL_ASSETS.bear_sit_front).toBeDefined();
    expect(CANONICAL_ASSETS.hedgehog_idle).toBeDefined();
    expect(CANONICAL_ASSETS.track_bird_3toed).toBeDefined();

    // Check alias keys
    const aliases = [
      'animal_hedgehog',
      'animal_badger',
      'animal_rabbit',
      'animal_sparrow',
      'animal_beaver',
      'animal_bear',
      'animal_frog',
      'animal_owl',
      'animal_deer',
      'animal_cardinal',
      'animal_goose',
      'animal_dormouse',
      'animal_bumblebee',
      'animal_snail',
    ];

    for (const alias of aliases) {
      expect(CANONICAL_ASSETS[alias]).toBeDefined();
      expect(CANONICAL_ASSETS[alias]?.startsWith('data:image/png;base64,')).toBe(true);
    }
  });

  it('verifies all 77 high-resolution PNG files exist in public/assets/fauna/', () => {
    const faunaDir = path.resolve('public/assets/fauna');
    expect(fs.existsSync(faunaDir)).toBe(true);

    for (const item of FAUNA_CATALOG) {
      const filePath = path.join(faunaDir, `${item.id}.png`);
      expect(fs.existsSync(filePath)).toBe(true);
      const stat = fs.statSync(filePath);
      expect(stat.size).toBeGreaterThan(100);
    }
  });
});
