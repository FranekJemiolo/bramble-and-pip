import type * as Phaser from 'phaser';

/**
 * Manages VRAM budgeting and dynamic seasonal asset disposal.
 * Keeps memory usage under the strict 60MB ceiling on mobile devices
 * by releasing textures and audio buffers when switching seasonal biomes.
 */
export class SeasonalAssetLifecycleManager {
  /**
   * Explicitly purges textures and audio buffers belonging to an outgoing season
   * to free GPU memory before the new season's assets are loaded.
   */
  public static purgeInactiveSeason(scene: Phaser.Scene, outgoingSeason: string): { texturesPurged: number; audioPurged: number } {
    let texturesPurged = 0;
    let audioPurged = 0;

    const texturesToRemove = [
      `tileset_${outgoingSeason}`,
      `props_${outgoingSeason}`,
      `foliage_${outgoingSeason}`,
      `wildlife_${outgoingSeason}`,
      `ambient_${outgoingSeason}`,
    ];

    texturesToRemove.forEach((textureKey) => {
      if (scene.textures && scene.textures.exists(textureKey)) {
        scene.textures.remove(textureKey);
        texturesPurged++;
      }
    });

    const audioToRemove = [
      `bgm_${outgoingSeason}_meadow`,
      `sfx_${outgoingSeason}_ambient`,
      `sfx_${outgoingSeason}_leaves`,
      `sfx_${outgoingSeason}_stream`,
    ];

    audioToRemove.forEach((audioKey) => {
      if (scene.cache?.audio && scene.cache.audio.has(audioKey)) {
        scene.cache.audio.remove(audioKey);
        audioPurged++;
      }
    });

    return { texturesPurged, audioPurged };
  }

  /**
   * Calculates the approximate VRAM footprint of active registered textures.
   */
  public static estimateVRAMFootprint(scene: Phaser.Scene): number {
    let totalBytes = 0;
    if (!scene.textures) return 0;

    const list = scene.textures.list as Record<string, { source?: Array<{ width?: number; height?: number }> }>;
    for (const key of Object.keys(list)) {
      const texture = list[key];
      if (texture && texture.source && texture.source.length > 0) {
        for (const source of texture.source) {
          totalBytes += (source.width || 0) * (source.height || 0) * 4; // 4 bytes per RGBA pixel
        }
      }
    }

    return totalBytes;
  }
}
