import { describe, expect, it } from 'vitest';
import { CollisionGrid, KinematicMovementController, type KinBody } from '../../src/core/world/kinematics';
import { PixelPerfectCameraController } from '../../src/core/world/camera';
import { TilePathfindingManager } from '../../src/core/world/pathfinding';
import { AutotileResolver } from '../../src/core/world/autotile';
import { createRng } from '../../src/core/math';

const body = (x: number, y: number): KinBody => ({ x, y, facing: 'down' });

describe('CollisionGrid', () => {
  const g = CollisionGrid.fromRows(['#####', '#...#', '#.#.#', '#...#', '#####']);

  it('parses ASCII, treats out-of-bounds as solid, exposes pixel size', () => {
    expect(g.width).toBe(5);
    expect(g.pixelWidth).toBe(80);
    expect(g.isSolid(0, 0)).toBe(true);
    expect(g.isSolid(1, 1)).toBe(false);
    expect(g.isSolid(-1, 2)).toBe(true);
    expect(g.isSolid(9, 9)).toBe(true);
    expect(g.toPathGrid()[2]).toEqual([1, 0, 1, 0, 1]);
  });

  it('rectCollides handles tile boundaries exactly (flush ≠ overlap)', () => {
    // box 10×6 centred at (24, 24) spans x 19..29 → tile 1 only (16..32): free
    expect(g.rectCollides(24, 24, 5, 3)).toBe(false);
    // push left edge to x=15.9 → overlaps solid column 0
    expect(g.rectCollides(20.9, 24, 5, 3)).toBe(true);
    // right edge exactly at 32 → still tile 1; at 32.1 → tile 2 (solid at row 2? (2,1) is '.', fine)
    expect(g.rectCollides(27, 24, 5, 3)).toBe(false);
  });
});

describe('KinematicMovementController', () => {
  const ctrl = new KinematicMovementController();

  it('walks at 64 px/s and sets facing', () => {
    const open = CollisionGrid.fromRows(Array.from({ length: 10 }, () => '.'.repeat(10)));
    const b = body(40, 40);
    for (let i = 0; i < 30; i++) ctrl.step(b, { x: 1, y: 0 }, 1 / 30, open);
    expect(b.x).toBeCloseTo(40 + 64, 5);
    expect(b.facing).toBe('right');
    ctrl.step(b, { x: 0, y: -1 }, 1 / 30, open);
    expect(b.facing).toBe('up');
    const still = ctrl.step(b, { x: 0, y: 0 }, 1 / 30, open);
    expect(still.moved).toBe(false);
  });

  it('diagonal input is normalised (no √2 speed boost)', () => {
    const open = CollisionGrid.fromRows(Array.from({ length: 12 }, () => '.'.repeat(12)));
    const b = body(30, 30);
    for (let i = 0; i < 30; i++) ctrl.step(b, { x: 1, y: 1 }, 1 / 30, open);
    expect(Math.hypot(b.x - 30, b.y - 30)).toBeCloseTo(64, 3);
  });

  it('never penetrates walls (property over random walks)', () => {
    const grid = CollisionGrid.fromRows([
      '################',
      '#..............#',
      '#...##....#....#',
      '#...##....#....#',
      '#..............#',
      '################',
    ]);
    const r = createRng(21);
    const b = body(40, 40);
    for (let i = 0; i < 4000; i++) {
      ctrl.step(b, { x: r.range(-1, 1), y: r.range(-1, 1) }, 1 / 30, grid);
      expect(grid.rectCollides(b.x, b.y, ctrl.halfW, ctrl.halfH)).toBe(false);
    }
  });

  it('stops flush against a wall instead of tunnelling or jittering', () => {
    const grid = CollisionGrid.fromRows(['#####', '#...#', '#...#', '#####']);
    const b = body(30, 32);
    for (let i = 0; i < 90; i++) ctrl.step(b, { x: 1, y: 0 }, 1 / 30, grid);
    expect(b.x).toBeLessThanOrEqual(64 - 5 + 1e-6);
    expect(b.x).toBeGreaterThan(64 - 5 - 0.5);
  });

  it('corner-slides: a body overlapping a tile corner by ≤ 6 px slides past instead of sticking', () => {
    // A pillar at tile (3,1). Body walks right along row y≈ 16+? — arrange feet-box clipping pillar top by 3 px.
    const grid = CollisionGrid.fromRows(['..........', '...#......', '..........', '..........']);
    // pillar occupies x 48..64, y 16..32. Feet-box half 5×3: centre y = 16 - 3 + 3 = 16 → spans y 13..19 (3 px into pillar row).
    const b = body(20, 16);
    let slid = false;
    for (let i = 0; i < 120; i++) {
      const res = ctrl.step(b, { x: 1, y: 0 }, 1 / 30, grid);
      slid = slid || res.slid;
    }
    expect(slid).toBe(true);
    expect(b.x).toBeGreaterThan(80); // got past the pillar (x range 48..64)
  });

  it('does NOT slide when the overlap exceeds the tolerance (a real wall)', () => {
    const grid = CollisionGrid.fromRows(['..........', '...#......', '...#......', '...#......', '...#......', '..........']);
    const b = body(20, 40); // squarely in front of a 4-tile wall
    for (let i = 0; i < 120; i++) ctrl.step(b, { x: 1, y: 0 }, 1 / 30, grid);
    expect(b.x).toBeLessThan(48);
  });
});

describe('PixelPerfectCameraController', () => {
  it('stays still while the player moves inside the 48×36 deadzone', () => {
    const cam = new PixelPerfectCameraController(320, 192, 640, 480, 320, 240);
    cam.snapTo(320, 240);
    const s0 = cam.scroll();
    for (let i = 0; i < 30; i++) cam.update(320 + 20, 240 + 15, 1 / 30);
    expect(cam.scroll()).toEqual(s0);
  });

  it('follows once the player leaves the deadzone and always reports integer scroll', () => {
    const cam = new PixelPerfectCameraController(320, 192, 640, 480, 320, 240);
    cam.snapTo(320, 240);
    const r = createRng(8);
    let px = 320;
    let py = 240;
    for (let i = 0; i < 600; i++) {
      px += r.range(-2.3, 2.9);
      py += r.range(-2, 2.1);
      const s = cam.update(px, py, 1 / 30);
      expect(Number.isInteger(s.x)).toBe(true);
      expect(Number.isInteger(s.y)).toBe(true);
    }
    // player stays within deadzone/2 + lag of the camera centre
    expect(Math.abs(px - cam.center.x)).toBeLessThan(60);
  });

  it('clamps to map bounds and centres maps smaller than the view', () => {
    const cam = new PixelPerfectCameraController(320, 192, 640, 480, 0, 0);
    expect(cam.update(0, 0, 1 / 30)).toEqual({ x: 0, y: 0 });
    for (let i = 0; i < 400; i++) cam.update(10_000, 10_000, 1 / 30);
    const s = cam.scroll();
    expect(s.x).toBe(640 - 320);
    expect(s.y).toBe(480 - 192);
    const small = new PixelPerfectCameraController(320, 192, 240, 160, 120, 80);
    expect(small.scroll()).toEqual({ x: -40, y: -16 });
  });

  it('is frame-rate independent for the same elapsed time (±1 px)', () => {
    const a = new PixelPerfectCameraController(320, 192, 2000, 2000, 500, 500);
    const b = new PixelPerfectCameraController(320, 192, 2000, 2000, 500, 500);
    for (let i = 0; i < 60; i++) a.update(700, 500, 1 / 60);
    for (let i = 0; i < 30; i++) b.update(700, 500, 1 / 30);
    expect(Math.abs(a.center.x - b.center.x)).toBeLessThan(1.5);
  });
});

describe('TilePathfindingManager (EasyStar)', () => {
  const grid = CollisionGrid.fromRows([
    '##########',
    '#........#',
    '#.######.#',
    '#........#',
    '##########',
  ]);
  const pf = new TilePathfindingManager(grid);

  it('finds a path around obstacles and returns centred world waypoints', () => {
    const wp = pf.navigate({ x: 24, y: 24 }, { x: 8 * 16 + 8, y: 3 * 16 + 8 });
    expect(wp).not.toBeNull();
    const last = wp?.[wp.length - 1];
    expect(last).toEqual({ x: 8 * 16 + 8, y: 3 * 16 + 8 });
    // every waypoint is walkable and consecutive waypoints are neighbours (no teleporting)
    let prev = { x: 24, y: 24 };
    for (const w of wp ?? []) {
      expect(grid.isSolid(Math.floor(w.x / 16), Math.floor(w.y / 16))).toBe(false);
      expect(Math.max(Math.abs(w.x - prev.x), Math.abs(w.y - prev.y))).toBeLessThanOrEqual(16);
      prev = w;
    }
  });

  it('forgives taps on solid tiles by snapping to the nearest walkable tile', () => {
    const wp = pf.navigate({ x: 24, y: 24 }, { x: 3 * 16 + 8, y: 2 * 16 + 8 }); // inside the wall bar
    expect(wp).not.toBeNull();
    const end = wp?.[wp.length - 1] as { x: number; y: number };
    expect(grid.isSolid(Math.floor(end.x / 16), Math.floor(end.y / 16))).toBe(false);
  });

  it('returns null when already there or unreachable', () => {
    expect(pf.navigate({ x: 24, y: 24 }, { x: 24, y: 24 })).toBeNull();
    const sealed = CollisionGrid.fromRows(['#####', '#.#.#', '#####']);
    expect(new TilePathfindingManager(sealed).navigate({ x: 24, y: 24 }, { x: 56, y: 24 })).toBeNull();
    expect(pf.findTilePath({ x: 0, y: 0 }, { x: 2, y: 1 })).toBeNull(); // start inside a wall
  });

  it('respects dynamic changes after refresh() and no corner cutting', () => {
    const g = CollisionGrid.fromRows(['.....', '.....', '.....']);
    const m = new TilePathfindingManager(g);
    expect(m.findTilePath({ x: 0, y: 1 }, { x: 4, y: 1 })?.length).toBe(5);
    for (let y = 0; y < 3; y++) g.setSolid(2, y, true);
    m.refresh();
    expect(m.findTilePath({ x: 0, y: 1 }, { x: 4, y: 1 })).toBeNull();
    const diag = CollisionGrid.fromRows(['.#', '#.']);
    expect(new TilePathfindingManager(diag).findTilePath({ x: 0, y: 0 }, { x: 1, y: 1 })).toBeNull(); // cannot squeeze diagonally
  });
});

describe('AutotileResolver (4-bit cardinal bitmask)', () => {
  const terrain = (rows: string[]) => (x: number, y: number): number => {
    const r = rows[y];
    return r === undefined || r[x] === undefined ? -1 : r[x] === '#' ? 1 : 0;
  };

  it('N·1 + E·2 + S·4 + W·8', () => {
    const t = terrain(['.#.', '###', '.#.']);
    expect(AutotileResolver.calculateBitmask(1, 1, t)).toBe(15);
    expect(AutotileResolver.calculateBitmask(1, 0, t)).toBe(4); // only S neighbour matches
    expect(AutotileResolver.calculateBitmask(0, 1, t)).toBe(2); // only E
    expect(AutotileResolver.calculateBitmask(2, 1, t)).toBe(8); // only W
    expect(AutotileResolver.calculateBitmask(1, 2, t)).toBe(1); // only N
    expect(AutotileResolver.calculateBitmask(0, 0, t)).toBe(0); // isolated grass tile? neighbours (1,0)=# (0,1)=# differ, OOB differ
  });

  it('every mask is in 0‥15 and an isolated tile is 0, an interior tile is 15', () => {
    const r = createRng(4);
    const w = 12;
    const h = 9;
    const cells = Array.from({ length: w * h }, () => r.int(3));
    const masks = AutotileResolver.resolveLayer(cells, w, h);
    for (const m of masks) {
      expect(m).toBeGreaterThanOrEqual(0);
      expect(m).toBeLessThanOrEqual(15);
    }
    const uniform = AutotileResolver.resolveLayer(new Array(9).fill(2), 3, 3);
    expect(Array.from(uniform)).toEqual(new Array(9).fill(15)); // map edges are seamless
    const lone = AutotileResolver.resolveLayer([0, 0, 0, 0, 1, 0, 0, 0, 0], 3, 3);
    expect(lone[4]).toBe(0);
  });
});
