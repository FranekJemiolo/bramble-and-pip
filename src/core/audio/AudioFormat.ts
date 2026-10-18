/**
 * Dual-codec format detection for universal mobile & web compatibility.
 * Older iOS Safari releases (prior to Safari 18.4) reject Ogg Vorbis,
 * so we provide an automated fallback to AAC-LC (.m4a).
 */
export class AudioFormat {
  private static cachedExtension: '.ogg' | '.m4a' | null = null;

  /**
   * Probes the browser to pick the best audio codec extension.
   */
  static pickExtension(): '.ogg' | '.m4a' {
    if (this.cachedExtension) return this.cachedExtension;

    if (typeof Audio !== 'undefined') {
      try {
        const audio = new Audio();
        const canOgg = audio.canPlayType('audio/ogg; codecs="vorbis"');
        if (canOgg === 'probably' || canOgg === 'maybe') {
          this.cachedExtension = '.ogg';
          return '.ogg';
        }
      } catch {
        // Fallback
      }
    }

    this.cachedExtension = '.m4a';
    return '.m4a';
  }

  /**
   * Given a base path like 'audio/sfx/chime', resolves the correct URL:
   * e.g. 'audio/sfx/chime.ogg' or 'audio/sfx/chime.m4a'.
   */
  static pickSource(basePath: string): string {
    const ext = this.pickExtension();
    return `${basePath}${ext}`;
  }

  /**
   * Resets cached determination (useful for tests).
   */
  static reset(): void {
    this.cachedExtension = null;
  }
}

/**
 * Phaser multi-format loader registry for universal dual-codec audio delivery (.ogg and .m4a).
 */
export class AudioPreloadRegistry {
  public static loadAcousticAsset(
    scene: { load: { audio: (key: string, urls: string[]) => void } },
    key: string,
    basePath: string
  ): void {
    scene.load.audio(key, [
      `${basePath}/${key}.ogg`,
      `${basePath}/${key}.m4a`,
    ]);
  }
}

