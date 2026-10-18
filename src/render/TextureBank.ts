import { type IndexedImage, TRANSPARENT } from './indexed';
import { WHISPERING_WOODS, type RGB } from './palette';

export class TextureBank {
  private readonly images = new Map<string, IndexedImage>();
  private currentPalette: readonly RGB[] = WHISPERING_WOODS.map((e) => e.rgb);

  /**
   * Registers an indexed image under a given key.
   */
  register(key: string, image: IndexedImage): void {
    if (!image.isOnPalette(16)) {
      throw new Error(`Texture "${key}" has pixels outside the 16-color palette!`);
    }
    this.images.set(key, image);
  }

  get(key: string): IndexedImage | undefined {
    return this.images.get(key);
  }

  has(key: string): boolean {
    return this.images.has(key);
  }

  getKeys(): string[] {
    return Array.from(this.images.keys());
  }

  /**
   * Updates active palette (e.g. sunset color grading or night mode).
   */
  setPalette(palette: readonly RGB[]): void {
    if (palette.length < 16) throw new Error('Palette must have at least 16 entries');
    this.currentPalette = palette;
  }

  /**
   * Bakes an IndexedImage to an HTMLCanvasElement with binary alpha and exact palette colors.
   */
  bakeToCanvas(key: string, palette = this.currentPalette): HTMLCanvasElement {
    const img = this.images.get(key);
    if (!img) throw new Error(`Texture "${key}" not registered`);

    const canvas = typeof document !== 'undefined'
      ? document.createElement('canvas')
      : ({ width: img.width, height: img.height } as HTMLCanvasElement);

    canvas.width = img.width;
    canvas.height = img.height;

    if (typeof document !== 'undefined') {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imgData = ctx.createImageData(img.width, img.height);
        const data = imgData.data;

        for (let i = 0; i < img.data.length; i++) {
          const colorIdx = img.data[i] ?? TRANSPARENT;
          const offset = i * 4;

          if (colorIdx === TRANSPARENT) {
            data[offset] = 0;
            data[offset + 1] = 0;
            data[offset + 2] = 0;
            data[offset + 3] = 0; // Pure binary 0 alpha
          } else {
            const rgb = palette[colorIdx] ?? [0, 0, 0];
            data[offset] = rgb[0];
            data[offset + 1] = rgb[1];
            data[offset + 2] = rgb[2];
            data[offset + 3] = 255; // Pure binary 255 alpha
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }
    }

    return canvas;
  }

  /**
   * Uploads or updates a canvas texture in a Phaser scene.
   */
  uploadToPhaser(scene: Phaser.Scene, key: string, palette = this.currentPalette): void {
    const canvas = this.bakeToCanvas(key, palette);
    if (scene.textures.exists(key)) {
      const phaserTex = scene.textures.get(key);
      const source = phaserTex.getSourceImage() as HTMLCanvasElement;
      if (source && source.getContext) {
        const ctx = source.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(canvas, 0, 0);
          const canvasTex = phaserTex as unknown as { refresh?: () => void };
          canvasTex.refresh?.();
        }
      }
    } else {
      scene.textures.addCanvas(key, canvas);
    }
  }

  /**
   * Verifies that all registered textures strictly adhere to the 16-color palette.
   */
  auditAllOnPalette(): { valid: boolean; violations: string[] } {
    const violations: string[] = [];
    for (const [key, img] of this.images.entries()) {
      if (!img.isOnPalette(16)) {
        violations.push(key);
      }
    }
    return {
      valid: violations.length === 0,
      violations,
    };
  }
}
