import { describe, it, expect } from 'vitest';
import { CANONICAL_FLORA_DATA, FLORA_CATALOG } from '../../src/render/canonicalFloraAssets';
import { CANONICAL_ASSETS } from '../../src/render/canonicalAssets';
import fs from 'node:fs';
import path from 'node:path';

describe('Canonical Vegetation & Flora Assets (88 Sprites)', () => {
  it('contains exactly 88 sprites in CANONICAL_FLORA_DATA', () => {
    const keys = Object.keys(CANONICAL_FLORA_DATA);
    expect(keys.length).toBe(88);
  });

  it('contains valid base64 PNG data URIs for all 88 flora sprites', () => {
    for (const [key, uri] of Object.entries(CANONICAL_FLORA_DATA)) {
      expect(uri.startsWith('data:image/png;base64,')).toBe(true);
      expect(uri.length).toBeGreaterThan(100);
      expect(key.length).toBeGreaterThan(0);
    }
  });

  it('contains 88 entries in FLORA_CATALOG covering all 7 categories', () => {
    expect(FLORA_CATALOG.length).toBe(88);

    const categories = new Set(FLORA_CATALOG.map((f) => f.category));
    const expectedCategories = [
      'tree',
      'shrub',
      'undergrowth',
      'flower',
      'lilypad',
      'item',
      'obstacle',
    ];

    for (const cat of expectedCategories) {
      expect(categories.has(cat as never)).toBe(true);
    }
  });

  it('verifies seasonal tree varieties across Spring, Summer, Autumn, Winter', () => {
    const treeKeys = [
      'tree_oak_spring',
      'tree_oak_mist',
      'stump_oak_healthy',
      'tree_oak_summer',
      'tree_oak_summer_dark',
      'tree_oak_summer_slender',
      'stump_summer_broken',
      'tree_oak_autumn_gold',
      'tree_oak_autumn_orange',
      'stump_autumn_splintered',
      'tree_pine_winter_frosted',
      'tree_pine_winter_mist',
      'tree_pine_winter_snow',
      'stump_winter_snow',
      'tree_birch_summer',
      'tree_birch_autumn',
    ];

    for (const key of treeKeys) {
      expect(CANONICAL_FLORA_DATA[key]).toBeDefined();
      expect(CANONICAL_FLORA_DATA[key].startsWith('data:image/png;base64,')).toBe(true);
    }
  });

  it('verifies subitizing counting lily pads (1 to 5 dots) and aquatic items', () => {
    const subitizingKeys = [
      'lilypad_plain',
      'lilypad_flower',
      'lilypad_subitize_5',
      'lilypad_subitize_4',
      'lilypad_subitize_1',
      'lilypad_subitize_3',
      'lilypad_subitize_2',
      'lilypad_subitize_dots',
      'reed_cattail_cluster',
      'reed_cattail_pair',
      'reed_cattail_single',
      'water_edge_bank',
      'water_shoreline_sand',
      'pond_basin_water',
    ];

    for (const key of subitizingKeys) {
      expect(CANONICAL_FLORA_DATA[key]).toBeDefined();
      expect(CANONICAL_FLORA_DATA[key].startsWith('data:image/png;base64,')).toBe(true);
    }
  });

  it('verifies undergrowth, fungi and natural obstacles', () => {
    const obstacleKeys = [
      'fungi_bioluminescent',
      'log_hollow_small',
      'log_mossy_medium',
      'log_mossy_large',
      'log_winter_snow',
      'bramble_dense_summer',
      'bramble_autumn_berries',
      'bramble_winter_snow',
      'brush_winter_bare',
      'fern_spring',
      'fern_summer',
      'fern_autumn',
      'fern_autumn_curled',
      'obstacle_flat_stones',
      'obstacle_mossy_log',
      'obstacle_boulder_cluster',
      'obstacle_ice_step_1',
      'obstacle_ice_step_2',
      'obstacle_ice_step_3',
    ];

    for (const key of obstacleKeys) {
      expect(CANONICAL_FLORA_DATA[key]).toBeDefined();
      expect(CANONICAL_FLORA_DATA[key].startsWith('data:image/png;base64,')).toBe(true);
    }
  });

  it('merges all flora data and canonical aliases into CANONICAL_ASSETS', () => {
    expect(CANONICAL_ASSETS.tree_oak_summer).toBeDefined();
    expect(CANONICAL_ASSETS.lilypad_subitize_3).toBeDefined();
    expect(CANONICAL_ASSETS.fungi_bioluminescent).toBeDefined();

    const aliases = [
      'tile_tree',
      'tile_tree_spring',
      'tile_tree_summer',
      'tile_tree_autumn',
      'tile_tree_winter',
      'tile_lilypad',
      'tile_water',
      'item_acorn',
      'item_pinecone',
      'item_leaf_oak',
    ];

    for (const alias of aliases) {
      expect(CANONICAL_ASSETS[alias]).toBeDefined();
      expect(CANONICAL_ASSETS[alias]?.startsWith('data:image/png;base64,')).toBe(true);
    }
  });

  it('verifies all 88 high-resolution PNG files exist in public/assets/flora/', () => {
    const floraDir = path.resolve('public/assets/flora');
    expect(fs.existsSync(floraDir)).toBe(true);

    for (const item of FLORA_CATALOG) {
      const filePath = path.join(floraDir, `${item.id}.png`);
      expect(fs.existsSync(filePath)).toBe(true);
      const stat = fs.statSync(filePath);
      expect(stat.size).toBeGreaterThan(100);
    }
  });
});
