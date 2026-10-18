import { describe, it, expect } from 'vitest';
import { SeasonalAssetLifecycleManager } from '../../src/core/world/SeasonalAssetLifecycleManager';
import type * as Phaser from 'phaser';

describe('SeasonalAssetLifecycleManager (VRAM budgeting & asset purging)', () => {
  it('purges textures and audio belonging to an outgoing season', () => {
    const texturesRemoved: string[] = [];
    const audioRemoved: string[] = [];

    const mockScene = {
      textures: {
        exists: (key: string) => key.includes('summer'),
        remove: (key: string) => {
          texturesRemoved.push(key);
        },
      },
      cache: {
        audio: {
          has: (key: string) => key.includes('summer'),
          remove: (key: string) => {
            audioRemoved.push(key);
          },
        },
      },
    } as unknown as Phaser.Scene;

    const result = SeasonalAssetLifecycleManager.purgeInactiveSeason(mockScene, 'summer');

    expect(result.texturesPurged).toBeGreaterThan(0);
    expect(result.audioPurged).toBeGreaterThan(0);
    expect(texturesRemoved).toContain('tileset_summer');
    expect(texturesRemoved).toContain('props_summer');
    expect(audioRemoved).toContain('bgm_summer_meadow');
  });

  it('estimates active texture VRAM footprint accurately', () => {
    const mockScene = {
      textures: {
        list: {
          tex1: { source: [{ width: 16, height: 16 }] }, // 16 * 16 * 4 = 1024 bytes
          tex2: { source: [{ width: 32, height: 32 }] }, // 32 * 32 * 4 = 4096 bytes
        },
      },
    } as unknown as Phaser.Scene;

    const footprint = SeasonalAssetLifecycleManager.estimateVRAMFootprint(mockScene);
    expect(footprint).toBe(1024 + 4096);
  });
});
