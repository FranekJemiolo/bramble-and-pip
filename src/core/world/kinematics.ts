import { MOVEMENT, TILE_SIZE } from '../constants';
import type { Vec2 } from '../math';

export type Facing = 'up' | 'down' | 'left' | 'right';

/** Binary tile collision grid (16 × 16 px tiles). Out-of-bounds counts as solid. */
export class CollisionGrid {
  private readonly cells: Uint8Array;

  constructor(
    readonly width: number,
    readonly height: number,
    cells?: ArrayLike<number>,
  ) {
    this.cells = new Uint8Array(width * height);
    if (cells) for (let i = 0; i < this.cells.length; i++) this.cells[i] = (cells[i] as number) ? 1 : 0;
  }

  /** Build from ASCII rows: `solidChar` ('#') is solid, everything else walkable. */
  static fromRows(rows: readonly string[], solidChar = '#'): CollisionGrid {
    const w = Math.max(...rows.map((r) => r.length));
    const g = new CollisionGrid(w, rows.length);
    rows.forEach((row, y) => {
      for (let x = 0; x < w; x++) g.cells[y * w + x] = row[x] === solidChar ? 1 : 0;
    });
    return g;
  }

  get pixelWidth(): number {
    return this.width * TILE_SIZE;
  }
  get pixelHeight(): number {
    return this.height * TILE_SIZE;
  }

  isSolid(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return true;
    return this.cells[ty * this.width + tx] === 1;
  }

  setSolid(tx: number, ty: number, solid: boolean): void {
    if (tx >= 0 && ty >= 0 && tx < this.width && ty < this.height) this.cells[ty * this.width + tx] = solid ? 1 : 0;
  }

  /** Axis-aligned box centred at (cx, cy) with the given half extents overlaps a solid tile? */
  rectCollides(cx: number, cy: number, halfW: number, halfH: number): boolean {
    const x0 = Math.floor((cx - halfW) / TILE_SIZE);
    const x1 = Math.ceil((cx + halfW) / TILE_SIZE) - 1;
    const y0 = Math.floor((cy - halfH) / TILE_SIZE);
    const y1 = Math.ceil((cy + halfH) / TILE_SIZE) - 1;
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (this.isSolid(tx, ty)) return true;
    return false;
  }

  /** 2D number grid for EasyStar: 0 walkable, 1 blocked. */
  toPathGrid(): number[][] {
    const rows: number[][] = [];
    for (let y = 0; y < this.height; y++) {
      const row: number[] = [];
      for (let x = 0; x < this.width; x++) row.push(this.cells[y * this.width + x] as number);
      rows.push(row);
    }
    return rows;
  }
}

export interface KinBody {
  /** Feet position (centre of the collision box), pixels. */
  x: number;
  y: number;
  facing: Facing;
}

export interface KinResult {
  moved: boolean;
  dx: number;
  dy: number;
  /** True if a corner-slide nudge helped this frame. */
  slid: boolean;
}

export interface KinematicOptions {
  walkSpeed?: number;
  cornerTolerance?: number;
  halfW?: number;
  halfH?: number;
}

/**
 * Velocity-decomposed kinematic mover with corner-sliding: when a diagonal-ish push is blocked by a
 * tile corner that overlaps the feet-box by ≤ `cornerTolerance` px, the body is gently nudged around
 * it instead of stopping dead. Unhurried 64 px/s walk.
 */
export class KinematicMovementController {
  readonly walkSpeed: number;
  readonly cornerTolerance: number;
  readonly halfW: number;
  readonly halfH: number;

  constructor(options: KinematicOptions = {}) {
    this.walkSpeed = options.walkSpeed ?? MOVEMENT.WALK_SPEED_PX_PER_S;
    this.cornerTolerance = options.cornerTolerance ?? MOVEMENT.CORNER_SLIDE_TOLERANCE_PX;
    this.halfW = options.halfW ?? 5;
    this.halfH = options.halfH ?? 3;
  }

  step(body: KinBody, input: Vec2, dtSec: number, grid: CollisionGrid): KinResult {
    const len = Math.hypot(input.x, input.y);
    if (len === 0) return { moved: false, dx: 0, dy: 0, slid: false };
    const nx = input.x / len;
    const ny = input.y / len;
    body.facing = Math.abs(nx) >= Math.abs(ny) ? (nx > 0 ? 'right' : 'left') : ny > 0 ? 'down' : 'up';

    const sx = body.x;
    const sy = body.y;
    const rx = this.moveAxis(body, 'x', nx * this.walkSpeed * dtSec, grid);
    const ry = this.moveAxis(body, 'y', ny * this.walkSpeed * dtSec, grid);
    const dx = body.x - sx;
    const dy = body.y - sy;
    return { moved: Math.abs(dx) + Math.abs(dy) > 1e-6, dx, dy, slid: rx || ry };
  }

  /** @returns true if a corner-slide nudge was applied. */
  private moveAxis(body: KinBody, axis: 'x' | 'y', delta: number, grid: CollisionGrid): boolean {
    if (delta === 0) return false;
    const isX = axis === 'x';
    const hit = (x: number, y: number): boolean => grid.rectCollides(x, y, this.halfW, this.halfH);

    const fx = isX ? delta : 0;
    const fy = isX ? 0 : delta;
    if (!hit(body.x + fx, body.y + fy)) {
      body.x += fx;
      body.y += fy;
      return false;
    }

    // Blocked: advance flush against the obstacle (bisection on the step fraction).
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 8; i++) {
      const mid = (lo + hi) / 2;
      if (hit(body.x + fx * mid, body.y + fy * mid)) hi = mid;
      else lo = mid;
    }
    body.x += fx * lo;
    body.y += fy * lo;

    // Corner slide: smallest perpendicular offset that frees the full step.
    for (let n = 1; n <= this.cornerTolerance; n++) {
      for (const sign of [-1, 1]) {
        const px = isX ? 0 : sign * n;
        const py = isX ? sign * n : 0;
        if (!hit(body.x + fx + px, body.y + fy + py)) {
          const nudge = Math.min(n, Math.max(Math.abs(delta), 0.75)) * sign;
          const tx = body.x + (isX ? 0 : nudge);
          const ty = body.y + (isX ? nudge : 0);
          if (!hit(tx, ty)) {
            body.x = tx;
            body.y = ty;
            return true;
          }
        }
      }
    }
    return false;
  }
}
