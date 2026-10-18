/**
 * Pure math utilities. No DOM, no Phaser. Everything is deterministic given a seed
 * (Math.random is banned in src/ by ESLint so puzzles & tests are reproducible).
 */

export interface Vec2 {
  x: number;
  y: number;
}

export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const inverseLerp = (a: number, b: number, v: number): number => (a === b ? 0 : (v - a) / (b - a));
export const dist = (ax: number, ay: number, bx: number, by: number): number => Math.hypot(bx - ax, by - ay);
export const distSq = (ax: number, ay: number, bx: number, by: number): number => {
  const dx = bx - ax;
  const dy = by - ay;
  return dx * dx + dy * dy;
};

/* ---------------- easing ---------------- */
export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
export const easeInCubic = (t: number): number => Math.pow(clamp(t, 0, 1), 3);
export const easeInOutCubic = (t: number): number => {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

/* ---------------- decibels ---------------- */
export const dbToGain = (db: number): number => Math.pow(10, db / 20);
export const gainToDb = (gain: number): number => (gain <= 0 ? -Infinity : 20 * Math.log10(gain));

/* ---------------- angles ---------------- */
export const TAU = Math.PI * 2;
/** Wrap to (−π, π]. */
export function wrapAngle(a: number): number {
  let r = a % TAU;
  if (r > Math.PI) r -= TAU;
  if (r <= -Math.PI) r += TAU;
  return r;
}
export const angleDiff = (a: number, b: number): number => wrapAngle(a - b);
export const degToRad = (d: number): number => (d * Math.PI) / 180;
export const radToDeg = (r: number): number => (r * 180) / Math.PI;

/* ---------------- seeded RNG ---------------- */
export interface Rng {
  /** [0, 1) */
  next(): number;
  range(min: number, max: number): number;
  /** integer in [0, n) */
  int(n: number): number;
  pick<T>(items: readonly T[]): T;
  shuffle<T>(items: readonly T[]): T[];
  /** Standard normal sample (Box–Muller). */
  gaussian(mean?: number, sigma?: number): number;
}

/** Mulberry32 — tiny, fast, good enough for gameplay & Monte-Carlo testing. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let spare: number | null = null;
  const rng: Rng = {
    next,
    range: (min, max) => min + (max - min) * next(),
    int: (n) => Math.floor(next() * n),
    pick: (items) => items[Math.floor(next() * items.length)] as never,
    shuffle: (items) => {
      const out = items.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j] as never, out[i] as never];
      }
      return out;
    },
    gaussian: (mean = 0, sigma = 1) => {
      if (spare !== null) {
        const s = spare;
        spare = null;
        return mean + sigma * s;
      }
      let u = 0;
      while (u === 0) u = next();
      const v = next();
      const mag = Math.sqrt(-2 * Math.log(u));
      spare = mag * Math.sin(TAU * v);
      return mean + sigma * mag * Math.cos(TAU * v);
    },
  };
  return rng;
}

/** Hash a string to a 32-bit seed (FNV-1a). */
export function hashSeed(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Box–Muller bivariate Gaussian perturbation used to model pediatric touch offsets
 * (σx = 18 px, σy = 22 px by default per the QA brief).
 */
export function pediatricTouchOffset(rng: Rng, sigmaX = 18, sigmaY = 22): Vec2 {
  return { x: rng.gaussian(0, sigmaX), y: rng.gaussian(0, sigmaY) };
}

/* ---------------- cubic Béziers ---------------- */
export type CubicSegment = readonly [Vec2, Vec2, Vec2, Vec2];

/** B(t) = (1−t)³P0 + 3(1−t)²t P1 + 3(1−t)t² P2 + t³ P3 */
export function cubicBezierPoint(seg: CubicSegment, t: number): Vec2 {
  const u = 1 - t;
  const w0 = u * u * u;
  const w1 = 3 * u * u * t;
  const w2 = 3 * u * t * t;
  const w3 = t * t * t;
  return {
    x: w0 * seg[0].x + w1 * seg[1].x + w2 * seg[2].x + w3 * seg[3].x,
    y: w0 * seg[0].y + w1 * seg[1].y + w2 * seg[2].y + w3 * seg[3].y,
  };
}

/** A composite curve: consecutive cubic segments sampled uniformly in parameter space. */
export class CompositeBezier {
  readonly segments: readonly CubicSegment[];
  private readonly samples: Vec2[];

  constructor(segments: readonly CubicSegment[], samplesPerSegment = 64) {
    if (segments.length === 0) throw new Error('CompositeBezier needs at least one segment');
    this.segments = segments;
    const pts: Vec2[] = [];
    segments.forEach((seg, si) => {
      for (let i = si === 0 ? 0 : 1; i <= samplesPerSegment; i++) pts.push(cubicBezierPoint(seg, i / samplesPerSegment));
    });
    this.samples = pts;
  }

  /** Number of polyline samples (≥ 2). */
  get sampleCount(): number {
    return this.samples.length;
  }

  sampleAt(index: number): Vec2 {
    return this.samples[clamp(Math.round(index), 0, this.samples.length - 1)] as Vec2;
  }

  /** Point at normalised parameter u ∈ [0,1] (linear in sample index). */
  pointAt(u: number): Vec2 {
    const f = clamp(u, 0, 1) * (this.samples.length - 1);
    const i = Math.floor(f);
    const a = this.samples[i] as Vec2;
    const b = this.samples[Math.min(i + 1, this.samples.length - 1)] as Vec2;
    const k = f - i;
    return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) };
  }

  /** Polyline length in px. */
  get length(): number {
    let len = 0;
    for (let i = 1; i < this.samples.length; i++) {
      const a = this.samples[i - 1] as Vec2;
      const b = this.samples[i] as Vec2;
      len += dist(a.x, a.y, b.x, b.y);
    }
    return len;
  }

  /**
   * Project `p` onto the curve restricted to u ∈ [uFrom, uTo]; returns the minimising u and distance.
   * (t_proj = argmin ‖P_touch − B(t)‖ over the forward window.)
   */
  project(p: Vec2, uFrom: number, uTo: number): { u: number; distance: number } {
    const last = this.samples.length - 1;
    const i0 = clamp(Math.floor(uFrom * last), 0, last);
    const i1 = clamp(Math.ceil(uTo * last), 0, last);
    let bestI = i0;
    let best = Infinity;
    for (let i = i0; i <= i1; i++) {
      const s = this.samples[i] as Vec2;
      const d = distSq(p.x, p.y, s.x, s.y);
      if (d < best) {
        best = d;
        bestI = i;
      }
    }
    return { u: bestI / last, distance: Math.sqrt(best) };
  }
}
