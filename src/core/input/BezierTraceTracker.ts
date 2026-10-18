import { INPUT } from '../constants';
import type { CompositeBezier, Vec2 } from '../math';

export interface TraceUpdate {
  progressed: boolean;
  completed: boolean;
  fromU: number;
  toU: number;
  /** Distance from the touch to the curve inside the search window (px). */
  distance: number;
}

export interface TraceOptions {
  corridor?: number;
  forwardWindow?: number;
  completeAt?: number;
  /** Extra forward reach on the first point after a lift (lift-and-resume buffering). */
  resumeWindowMultiplier?: number;
}

/**
 * Evaluates finger positions against a target Bézier with a tolerant corridor:
 *   u_proj = argmin ‖P_touch − B(u)‖ over u ∈ [u_cur, u_cur + Δ]   (Δ = 0.15)
 * A touch within `corridor` (48 px) advances the progress; anything else is silently ignored — there is
 * no failure state and no penalty. Progress survives lifting the finger (*lift-and-resume buffering*):
 * the first touch after a lift is allowed a wider forward reach so a child who lifted and moved on does
 * not have to retrace. Completion at u ≥ 0.92 accommodates imperfect endings.
 */
export class BezierTraceTracker {
  private u = 0;
  private lifted = false;
  private done = false;
  private distSum = 0;
  private distCount = 0;
  readonly corridor: number;
  readonly forwardWindow: number;
  readonly completeAt: number;
  readonly resumeMultiplier: number;

  constructor(
    readonly curve: CompositeBezier,
    options: TraceOptions = {},
  ) {
    this.corridor = options.corridor ?? INPUT.TRACE_CORRIDOR_PX;
    this.forwardWindow = options.forwardWindow ?? INPUT.TRACE_FORWARD_WINDOW;
    this.completeAt = options.completeAt ?? INPUT.TRACE_COMPLETE_AT;
    this.resumeMultiplier = options.resumeWindowMultiplier ?? 2;
  }

  get progress(): number {
    return this.u;
  }
  get completed(): boolean {
    return this.done;
  }
  /** Where the child should continue from (the "crayon head"). */
  get head(): Vec2 {
    return this.curve.pointAt(this.u);
  }
  get isLifted(): boolean {
    return this.lifted;
  }

  /**
   * Silent accuracy in [0,1] (1 = perfectly on the line). Stored in the sketchbook, never shown to the child.
   */
  get accuracyScore(): number {
    if (this.distCount === 0) return 0;
    const mean = this.distSum / this.distCount;
    return Math.max(0, Math.min(1, 1 - mean / this.corridor));
  }

  processPoint(p: Vec2): TraceUpdate {
    if (this.done) return { progressed: false, completed: true, fromU: this.u, toU: this.u, distance: 0 };
    const window = this.forwardWindow * (this.lifted ? this.resumeMultiplier : 1);
    const hit = this.curve.project(p, this.u, Math.min(1, this.u + window));
    this.lifted = false;
    if (hit.distance <= this.corridor && hit.u > this.u) {
      const fromU = this.u;
      this.u = hit.u;
      this.distSum += hit.distance;
      this.distCount++;
      if (this.u >= this.completeAt) this.done = true;
      return { progressed: true, completed: this.done, fromU, toU: this.u, distance: hit.distance };
    }
    return { progressed: false, completed: false, fromU: this.u, toU: this.u, distance: hit.distance };
  }

  /** Finger lifted: progress is kept, resume reach widens. */
  lift(): void {
    this.lifted = true;
  }

  reset(): void {
    this.u = 0;
    this.lifted = false;
    this.done = false;
    this.distSum = 0;
    this.distCount = 0;
  }
}
