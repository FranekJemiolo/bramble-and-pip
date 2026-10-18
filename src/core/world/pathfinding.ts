import { js as EasyStar } from 'easystarjs';
import { TILE_SIZE } from '../constants';
import type { Vec2 } from '../math';
import type { CollisionGrid } from './kinematics';

export interface TilePoint {
  x: number;
  y: number;
}

/**
 * Tap-to-move pathfinding on the 16 × 16 collision grid (EasyStar.js, synchronous mode, diagonals on,
 * corner-cutting off). Young children tap where they want to go, so a tap on a solid tile (a tree, a rock)
 * is forgiven by snapping to the nearest walkable tile instead of doing nothing.
 */
export class TilePathfindingManager {
  private readonly easyStar = new EasyStar();

  constructor(private readonly grid: CollisionGrid) {
    this.easyStar.enableSync();
    this.easyStar.setAcceptableTiles([0]);
    this.easyStar.enableDiagonals();
    this.easyStar.disableCornerCutting();
    this.refresh();
  }

  /** Re-read the collision grid (after dynamic changes such as a puzzle unlocking a bridge). */
  refresh(): void {
    this.easyStar.setGrid(this.grid.toPathGrid());
  }

  worldToTile(p: Vec2): TilePoint {
    return { x: Math.floor(p.x / TILE_SIZE), y: Math.floor(p.y / TILE_SIZE) };
  }

  tileCenter(t: TilePoint): Vec2 {
    return { x: t.x * TILE_SIZE + TILE_SIZE / 2, y: t.y * TILE_SIZE + TILE_SIZE / 2 };
  }

  /** Spiral outwards (Chebyshev rings) to the nearest walkable tile within `maxRadius`. */
  nearestWalkable(tx: number, ty: number, maxRadius = 3): TilePoint | null {
    if (!this.grid.isSolid(tx, ty)) return { x: tx, y: ty };
    for (let r = 1; r <= maxRadius; r++) {
      let best: TilePoint | null = null;
      let bestD = Infinity;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          if (this.grid.isSolid(tx + dx, ty + dy)) continue;
          const d = dx * dx + dy * dy;
          if (d < bestD) {
            bestD = d;
            best = { x: tx + dx, y: ty + dy };
          }
        }
      }
      if (best) return best;
    }
    return null;
  }

  /** Path of tile coordinates including start and end, or null if unreachable. */
  findTilePath(from: TilePoint, to: TilePoint): TilePoint[] | null {
    if (this.grid.isSolid(from.x, from.y)) return null;
    const goal = this.nearestWalkable(to.x, to.y);
    if (!goal) return null;
    let result: TilePoint[] | null = null;
    this.easyStar.findPath(from.x, from.y, goal.x, goal.y, (path) => {
      result = path;
    });
    this.easyStar.calculate();
    return result;
  }

  /** World-space waypoints (tile centres, excluding the tile the character already stands on). */
  navigate(fromWorld: Vec2, toWorld: Vec2): Vec2[] | null {
    const path = this.findTilePath(this.worldToTile(fromWorld), this.worldToTile(toWorld));
    if (!path || path.length < 2) return null;
    return path.slice(1).map((t) => this.tileCenter(t));
  }
}
