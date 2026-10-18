/** Palette index that means "no pixel". Binary alpha only — there is no semi-transparency anywhere. */
export const TRANSPARENT = 255;

/**
 * A 2D buffer of palette indices (0‥15) or TRANSPARENT. Every drawing primitive here writes whole
 * pixels, so art authored with it is on-palette and un-antialiased by construction.
 */
export class IndexedImage {
  readonly data: Uint8Array;

  private constructor(
    readonly width: number,
    readonly height: number,
    data: Uint8Array,
  ) {
    this.data = data;
  }

  static create(width: number, height: number, fill: number = TRANSPARENT): IndexedImage {
    return new IndexedImage(width, height, new Uint8Array(width * height).fill(fill));
  }

  /**
   * Author from ASCII rows. `legend` maps a character to a palette index; '.' and ' ' are transparent
   * unless overridden. Rows shorter than the widest are padded transparent.
   */
  static fromRows(rows: readonly string[], legend: Readonly<Record<string, number>>): IndexedImage {
    const width = Math.max(...rows.map((r) => r.length));
    const img = IndexedImage.create(width, rows.length);
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x] as string;
        const idx = legend[ch];
        if (idx !== undefined) img.data[y * width + x] = idx;
        else if (ch !== '.' && ch !== ' ') throw new Error(`IndexedImage.fromRows: no legend entry for "${ch}"`);
      }
    });
    return img;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  get(x: number, y: number): number {
    return this.inBounds(x, y) ? (this.data[y * this.width + x] as number) : TRANSPARENT;
  }

  set(x: number, y: number, c: number): void {
    if (this.inBounds(x, y)) this.data[y * this.width + x] = c;
  }

  clone(): IndexedImage {
    return new IndexedImage(this.width, this.height, this.data.slice());
  }

  fill(c: number): this {
    this.data.fill(c);
    return this;
  }

  fillRect(x: number, y: number, w: number, h: number, c: number): this {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
    return this;
  }

  hline(x: number, y: number, w: number, c: number): this {
    return this.fillRect(x, y, w, 1, c);
  }

  vline(x: number, y: number, h: number, c: number): this {
    return this.fillRect(x, y, 1, h, c);
  }

  strokeRect(x: number, y: number, w: number, h: number, c: number): this {
    this.hline(x, y, w, c).hline(x, y + h - 1, w, c).vline(x, y, h, c).vline(x + w - 1, y, h, c);
    return this;
  }

  /** Filled disk (integer radius, pixel-centre metric — gives clean, un-aliased discs). */
  disk(cx: number, cy: number, r: number, c: number): this {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.5) this.set(cx + x, cy + y, c);
    return this;
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, c: number): this {
    for (let y = -ry; y <= ry; y++) {
      for (let x = -rx; x <= rx; x++) {
        if ((x * x) / (rx * rx + 0.25) + (y * y) / (ry * ry + 0.25) <= 1) this.set(cx + x, cy + y, c);
      }
    }
    return this;
  }

  /** Bresenham line. */
  line(x0: number, y0: number, x1: number, y1: number, c: number): this {
    const dx = Math.abs(x1 - x0);
    const sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0);
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.set(x, y, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
    return this;
  }

  /** Copy `src` onto this image at (dx,dy); transparent source pixels are skipped. */
  blit(src: IndexedImage, dx: number, dy: number, flipX = false): this {
    for (let y = 0; y < src.height; y++) {
      for (let x = 0; x < src.width; x++) {
        const c = src.data[y * src.width + (flipX ? src.width - 1 - x : x)] as number;
        if (c !== TRANSPARENT) this.set(dx + x, dy + y, c);
      }
    }
    return this;
  }

  /** Sub-image copy. */
  crop(x: number, y: number, w: number, h: number): IndexedImage {
    const out = IndexedImage.create(w, h);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.data[j * w + i] = this.get(x + i, y + j);
    return out;
  }

  /** Remap palette indices (used for seasonal role rotation). */
  remap(map: Readonly<Record<number, number>>): IndexedImage {
    const out = this.clone();
    for (let i = 0; i < out.data.length; i++) {
      const m = map[out.data[i] as number];
      if (m !== undefined) out.data[i] = m;
    }
    return out;
  }

  /** Nearest-neighbour integer upscale (kept for tools/tests; the game scales via CSS). */
  scaled(k: number): IndexedImage {
    const out = IndexedImage.create(this.width * k, this.height * k);
    for (let y = 0; y < out.height; y++) for (let x = 0; x < out.width; x++) out.data[y * out.width + x] = this.get(Math.floor(x / k), Math.floor(y / k));
    return out;
  }

  /** True iff every pixel is a valid palette index (< size) or TRANSPARENT. */
  isOnPalette(paletteSize = 16): boolean {
    for (const c of this.data) if (c !== TRANSPARENT && c >= paletteSize) return false;
    return true;
  }
}
