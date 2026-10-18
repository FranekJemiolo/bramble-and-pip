/**
 * 4-bit cardinal (Wang / marching-squares) autotiling:
 *   mask = N·1 + E·2 + S·4 + W·8, where each term is 1 iff that neighbour shares the tile's terrain.
 * The resulting 0‥15 index addresses a 16-tile transition strip (see render/tiles.ts).
 */
export const AUTOTILE_N = 1;
export const AUTOTILE_E = 2;
export const AUTOTILE_S = 4;
export const AUTOTILE_W = 8;

export class AutotileResolver {
  static calculateBitmask(x: number, y: number, getTerrainId: (tx: number, ty: number) => number): number {
    const id = getTerrainId(x, y);
    const n = getTerrainId(x, y - 1) === id ? AUTOTILE_N : 0;
    const e = getTerrainId(x + 1, y) === id ? AUTOTILE_E : 0;
    const s = getTerrainId(x, y + 1) === id ? AUTOTILE_S : 0;
    const w = getTerrainId(x - 1, y) === id ? AUTOTILE_W : 0;
    return n + e + s + w;
  }

  /** Resolve a whole layer. `terrain` is row-major, `width × height`. Out-of-bounds neighbours count as *same* terrain (seamless map edges). */
  static resolveLayer(terrain: ArrayLike<number>, width: number, height: number): Uint8Array {
    const out = new Uint8Array(width * height);
    const at = (tx: number, ty: number): number => {
      const cx = Math.min(width - 1, Math.max(0, tx));
      const cy = Math.min(height - 1, Math.max(0, ty));
      return terrain[cy * width + cx] as number;
    };
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) out[y * width + x] = AutotileResolver.calculateBitmask(x, y, at);
    return out;
  }
}
