import { INPUT } from '../constants';
import { clamp, distSq, easeOutCubic, lerp, type Vec2 } from '../math';

/** Global 300 ms debounce against "rage tapping" on UI activations and state transitions. */
export class ActionDebouncer {
  private lastMs = Number.NEGATIVE_INFINITY;
  constructor(private readonly windowMs: number = INPUT.DEBOUNCE_MS) {}

  /** Returns true (and starts a new window) iff at least `windowMs` elapsed since the last accepted action. */
  tryAcquire(nowMs: number): boolean {
    if (nowMs - this.lastMs < this.windowMs) return false;
    this.lastMs = nowMs;
    return true;
  }

  reset(): void {
    this.lastMs = Number.NEGATIVE_INFINITY;
  }
}

export interface MagneticTarget {
  id: string;
  x: number;
  y: number;
  /** Per-target capture radius override. */
  radius?: number;
}

export interface MagneticHit<T extends MagneticTarget> {
  target: T;
  distance: number;
  /** 0 at the rim → 1 at the centre. */
  strength: number;
}

/** Nearest target whose capture basin (default 80 px) contains `p`. */
export function findMagneticTarget<T extends MagneticTarget>(
  p: Vec2,
  targets: readonly T[],
  radius: number = INPUT.MAGNETIC_SNAP_RADIUS_PX,
): MagneticHit<T> | null {
  let best: MagneticHit<T> | null = null;
  for (const target of targets) {
    const r = target.radius ?? radius;
    const d = Math.sqrt(distSq(p.x, p.y, target.x, target.y));
    if (d <= r && (!best || d < best.distance)) best = { target, distance: d, strength: 1 - d / r };
  }
  return best;
}

/**
 * Radial potential field: while dragging, the visual position is pulled toward the target by
 * (1 − d/R)². Continuous (0 at the rim, 1 at the centre) so there is no visible "jump" on entry.
 */
export function magneticPull(p: Vec2, target: MagneticTarget, radius: number = INPUT.MAGNETIC_SNAP_RADIUS_PX): Vec2 {
  const r = target.radius ?? radius;
  const d = Math.sqrt(distSq(p.x, p.y, target.x, target.y));
  if (d >= r) return { x: p.x, y: p.y };
  const k = Math.pow(1 - d / r, 2);
  return { x: lerp(p.x, target.x, k), y: lerp(p.y, target.y, k) };
}

/** Cubic ease-out tween between two points. Time-driven (no frame coupling). */
export class PointTween {
  private from: Vec2 = { x: 0, y: 0 };
  private to: Vec2 = { x: 0, y: 0 };
  private startMs = 0;
  private durationMs = 0;
  private running = false;

  start(from: Vec2, to: Vec2, nowMs: number, durationMs: number = INPUT.MAGNETIC_SNAP_DURATION_MS): void {
    this.from = { ...from };
    this.to = { ...to };
    this.startMs = nowMs;
    this.durationMs = Math.max(1, durationMs);
    this.running = true;
  }

  get active(): boolean {
    return this.running;
  }

  sample(nowMs: number): { x: number; y: number; done: boolean } {
    if (!this.running) return { x: this.to.x, y: this.to.y, done: true };
    const t = clamp((nowMs - this.startMs) / this.durationMs, 0, 1);
    const e = easeOutCubic(t);
    if (t >= 1) this.running = false;
    return { x: lerp(this.from.x, this.to.x, e), y: lerp(this.from.y, this.to.y, e), done: t >= 1 };
  }

  cancel(): void {
    this.running = false;
  }
}
