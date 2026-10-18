import { BezierTraceTracker, type TraceOptions } from '../core/input/BezierTraceTracker';
import type { CompositeBezier, Rng, Vec2 } from '../core/math';
import { IndexedImage } from './indexed';

export interface WaxResult {
  progressed: boolean;
  completed: boolean;
}

/**
 * Wax-crayon tracing renderer. Rather than an anti-aliased vector stroke, progress is written into an
 * off-screen *indexed* layer as clusters of jittered, grainy wax specks (≈ 70 % coverage inside each
 * dab so the paper "shows through"). Pure pixels, palette-index only → no blur, no alpha, deterministic
 * for a given RNG seed. A scene uploads `layer` into a canvas texture whenever `consumeDirty()` is true.
 */
export class WaxCrayonTraceRenderer {
  readonly layer: IndexedImage;
  readonly tracker: BezierTraceTracker;
  private dirty = true;

  constructor(
    width: number,
    height: number,
    curve: CompositeBezier,
    private readonly rng: Rng,
    private readonly colorIndex: number = 3, // Weathered Oak — earthy wax brown
    private readonly highlightIndex: number = 8, // River Clay Tan — lighter wax grain
    options: TraceOptions = {},
  ) {
    this.layer = IndexedImage.create(width, height);
    this.tracker = new BezierTraceTracker(curve, options);
  }

  get curve(): CompositeBezier {
    return this.tracker.curve;
  }

  processTouchPoint(x: number, y: number): WaxResult {
    const update = this.tracker.processPoint({ x, y });
    if (update.progressed) {
      this.drawWaxDabs(update.fromU, update.toU);
      this.dirty = true;
    }
    return { progressed: update.progressed, completed: update.completed };
  }

  /** Lift the finger: keeps progress; the next touch may resume with a wider reach. */
  lift(): void {
    this.tracker.lift();
  }

  consumeDirty(): boolean {
    const d = this.dirty;
    this.dirty = false;
    return d;
  }

  /** Fill the remainder (used when a puzzle is auto-completed after the 0.92 threshold). */
  finish(): void {
    if (this.tracker.progress < 1) {
      this.drawWaxDabs(this.tracker.progress, 1);
      this.dirty = true;
    }
  }

  private drawWaxDabs(fromU: number, toU: number): void {
    const steps = Math.max(2, Math.ceil((toU - fromU) * this.curve.length));
    for (let i = 0; i <= steps; i++) {
      const u = fromU + ((toU - fromU) * i) / steps;
      this.dab(this.curve.pointAt(u));
    }
  }

  /** A cluster of 6 micro-specks (radius 1–2 px) within ±3 px of the curve point. */
  private dab(p: Vec2): void {
    for (let s = 0; s < 6; s++) {
      const jx = Math.round(p.x + (this.rng.next() - 0.5) * 6);
      const jy = Math.round(p.y + (this.rng.next() - 0.5) * 6);
      const r = 1 + this.rng.int(2);
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy > r * r + 1) continue;
          if (this.rng.next() < 0.3) continue; // waxy grain: paper shows through
          this.layer.set(jx + dx, jy + dy, this.rng.next() < 0.2 ? this.highlightIndex : this.colorIndex);
        }
      }
    }
  }
}
