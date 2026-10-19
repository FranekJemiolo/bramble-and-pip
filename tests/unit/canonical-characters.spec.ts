import { describe, it, expect } from 'vitest';
import { CANONICAL_CHARACTER_DATA, CHARACTER_CATALOG } from '../../src/render/canonicalCharacterAssets';
import { CANONICAL_ASSETS } from '../../src/render/canonicalAssets';
import fs from 'node:fs';
import path from 'node:path';

describe('Canonical Junior Ranger & Pip Character Assets (42 Sprites)', () => {
  it('contains exactly 42 sprites in CANONICAL_CHARACTER_DATA', () => {
    const keys = Object.keys(CANONICAL_CHARACTER_DATA);
    expect(keys.length).toBe(42);
  });

  it('contains valid base64 PNG data URIs for all 42 character sprites', () => {
    for (const [key, uri] of Object.entries(CANONICAL_CHARACTER_DATA)) {
      expect(uri.startsWith('data:image/png;base64,')).toBe(true);
      expect(uri.length).toBeGreaterThan(100);
      expect(key.length).toBeGreaterThan(0);
    }
  });

  it('contains 42 entries in CHARACTER_CATALOG covering all 5 categories', () => {
    expect(CHARACTER_CATALOG.length).toBe(42);

    const categories = new Set(CHARACTER_CATALOG.map((c) => c.category));
    const expectedCategories = [
      'ranger_walk',
      'ranger_action',
      'ranger_rest',
      'pip_move',
      'pip_mood',
    ];

    for (const cat of expectedCategories) {
      expect(categories.has(cat as never)).toBe(true);
    }

    const countsByCategory: Record<string, number> = {};
    for (const item of CHARACTER_CATALOG) {
      countsByCategory[item.category] = (countsByCategory[item.category] || 0) + 1;
    }

    expect(countsByCategory['ranger_walk']).toBe(16);
    expect(countsByCategory['ranger_action']).toBe(6);
    expect(countsByCategory['ranger_rest']).toBe(5);
    expect(countsByCategory['pip_move']).toBe(8);
    expect(countsByCategory['pip_mood']).toBe(7);
  });

  it('merges character sprites and directional walk/mood aliases into CANONICAL_ASSETS', () => {
    // 4 directional walk cycles for Junior Ranger
    const directions = ['down', 'up', 'left', 'right'];
    for (const dir of directions) {
      for (let f = 0; f < 4; f++) {
        const canonicalKey = `ranger_walk_${dir}_${f}`;
        const aliasKey = `ranger_${dir}_${f}`;
        expect(CANONICAL_ASSETS[canonicalKey]).toBeDefined();
        expect(CANONICAL_ASSETS[aliasKey]).toBeDefined();
        expect(CANONICAL_ASSETS[aliasKey]?.startsWith('data:image/png;base64,')).toBe(true);
      }
    }

    // Ranger action states
    const actionKeys = [
      'ranger_action_flashlight',
      'ranger_action_kneel_inspect',
      'ranger_action_magnifying_glass',
      'ranger_action_flashlight_kneel',
      'ranger_action_sketchbook',
      'ranger_action_kneel_rest',
    ];
    for (const key of actionKeys) {
      expect(CANONICAL_ASSETS[key]).toBeDefined();
    }

    // Ranger resting states
    const restKeys = [
      'ranger_rest_log_sit',
      'ranger_rest_log_yawn',
      'ranger_rest_quilt_side',
      'ranger_rest_quilt_sleep',
      'ranger_rest_quilt_tucked',
    ];
    for (const key of restKeys) {
      expect(CANONICAL_ASSETS[key]).toBeDefined();
    }

    // Pip directional movement states
    for (const dir of directions) {
      for (let f = 0; f < 2; f++) {
        const key = `pip_move_${dir}_${f}`;
        expect(CANONICAL_ASSETS[key]).toBeDefined();
        expect(CANONICAL_ASSETS[key]?.startsWith('data:image/png;base64,')).toBe(true);
      }
    }

    // Pip mood / expressive states
    const pipMoods = [
      'pip_mood_happy_jump',
      'pip_mood_leaf_helper',
      'pip_mood_gear_helper_1',
      'pip_mood_gear_helper_2',
      'pip_mood_curious_perked',
      'pip_mood_yawn_sleepy',
      'pip_mood_nest_sleep',
    ];
    for (const mood of pipMoods) {
      expect(CANONICAL_ASSETS[mood]).toBeDefined();
      expect(CANONICAL_ASSETS[mood]?.startsWith('data:image/png;base64,')).toBe(true);
    }

    // Pip companion state aliases
    const pipStateAliases = [
      'pip_FOLLOWING_0',
      'pip_FOLLOWING_1',
      'pip_FOLLOWING_2',
      'pip_FOLLOWING_3',
      'pip_IDLE_CURIOUS_0',
      'pip_IDLE_CURIOUS_1',
      'pip_IDLE_CURIOUS_2',
      'pip_IDLE_CURIOUS_3',
      'pip_INSPECTING_0',
      'pip_INSPECTING_1',
      'pip_INSPECTING_2',
      'pip_INSPECTING_3',
      'pip_YAWNING_0',
      'pip_YAWNING_1',
      'pip_YAWNING_2',
      'pip_YAWNING_3',
      'pip_SLEEPING_0',
      'pip_SLEEPING_1',
      'pip_SLEEPING_2',
      'pip_SLEEPING_3',
    ];
    for (const alias of pipStateAliases) {
      expect(CANONICAL_ASSETS[alias]).toBeDefined();
      expect(CANONICAL_ASSETS[alias]?.startsWith('data:image/png;base64,')).toBe(true);
    }
  });

  it('verifies all 42 high-resolution PNG files exist in public/assets/characters/', () => {
    const charactersDir = path.resolve('public/assets/characters');
    expect(fs.existsSync(charactersDir)).toBe(true);

    for (const item of CHARACTER_CATALOG) {
      const filePath = path.join(charactersDir, `${item.id}.png`);
      expect(fs.existsSync(filePath)).toBe(true);
      const stat = fs.statSync(filePath);
      expect(stat.size).toBeGreaterThan(100);
    }
  });
});
