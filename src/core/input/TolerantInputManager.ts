import { INPUT } from '../constants';

export type InputPhase = 'down' | 'move' | 'up' | 'cancel';

/** A pointer event in *client* pixels, as delivered by the browser (or synthesised by tests). */
export interface RawPointer {
  id: number;
  pointerType: string;
  x: number;
  y: number;
  timeMs: number;
  /** Contact patch size in CSS px (PointerEvent.width/height), if reported. */
  width?: number;
  height?: number;
}

export interface InputSample {
  phase: InputPhase;
  pointerId: number;
  /** Filtered client-pixel position. */
  x: number;
  y: number;
  timeMs: number;
}

export type InputListener = (sample: InputSample) => void;

export interface TolerantInputOptions {
  viewport: () => { width: number; height: number };
  perimeterPx?: number;
  tremorPx?: number;
  smoothingAlpha?: number;
  palmContactPx?: number;
  edgeGripZonePx?: number;
  edgeGripStationaryMs?: number;
}

export interface InputStats {
  accepted: number;
  droppedPerimeter: number;
  droppedPalm: number;
  droppedSecondary: number;
  preempted: number;
  tremorSuppressed: number;
}

interface ActivePointer {
  id: number;
  rawX: number;
  rawY: number;
  fx: number;
  fy: number;
  lastMoveMs: number;
}

/**
 * Pediatric touch front-end. Pipeline (see docs/ARCHITECTURE.md §2):
 *   1. palm filter        – large contact patches are resting palms
 *   2. perimeter deadzone – touches starting within 12 px of the display edge are "screen hugs"
 *   3. single-pointer mutex – exactly one finger may drive the game; extra fingers are dropped,
 *      except that a *stationary edge-gripping* finger is pre-empted by a new one
 *   4. tremor filter      – moves < 5 px from the last accepted point are ignored; accepted
 *      moves are exponentially smoothed
 * Everything is in client pixels and driven by explicit timestamps (fully deterministic).
 */
export class TolerantInputManager {
  private readonly viewport: () => { width: number; height: number };
  private readonly perimeter: number;
  private readonly tremor: number;
  private readonly alpha: number;
  private readonly palm: number;
  private readonly gripZone: number;
  private readonly gripMs: number;
  private active: ActivePointer | null = null;
  private readonly listeners = new Set<InputListener>();
  readonly stats: InputStats = { accepted: 0, droppedPerimeter: 0, droppedPalm: 0, droppedSecondary: 0, preempted: 0, tremorSuppressed: 0 };

  constructor(options: TolerantInputOptions) {
    this.viewport = options.viewport;
    this.perimeter = options.perimeterPx ?? INPUT.PERIMETER_DEADZONE_PX;
    this.tremor = options.tremorPx ?? INPUT.TREMOR_DEADZONE_PX;
    this.alpha = options.smoothingAlpha ?? INPUT.SMOOTHING_ALPHA;
    this.palm = options.palmContactPx ?? INPUT.PALM_CONTACT_PX;
    this.gripZone = options.edgeGripZonePx ?? INPUT.EDGE_GRIP_ZONE_PX;
    this.gripMs = options.edgeGripStationaryMs ?? INPUT.EDGE_GRIP_STATIONARY_MS;
  }

  subscribe(listener: InputListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  get activePointerId(): number | null {
    return this.active ? this.active.id : null;
  }

  get isDown(): boolean {
    return this.active !== null;
  }

  /** Distance from the nearest display edge. */
  private edgeDistance(x: number, y: number): number {
    const { width, height } = this.viewport();
    return Math.min(x, y, width - x, height - y);
  }

  private emit(phase: InputPhase, id: number, x: number, y: number, timeMs: number): void {
    const sample: InputSample = { phase, pointerId: id, x, y, timeMs };
    this.listeners.forEach((l) => l(sample));
  }

  /** @returns true when the touch was accepted as the driving pointer. */
  pointerDown(p: RawPointer): boolean {
    if ((p.width ?? 0) >= this.palm && (p.height ?? 0) >= this.palm) {
      this.stats.droppedPalm++;
      return false;
    }
    if (this.edgeDistance(p.x, p.y) < this.perimeter) {
      this.stats.droppedPerimeter++;
      return false;
    }
    if (this.active) {
      if (this.active.id === p.id) return false; // duplicate down
      const a = this.active;
      const gripping = this.edgeDistance(a.fx, a.fy) <= this.gripZone && p.timeMs - a.lastMoveMs >= this.gripMs;
      if (!gripping) {
        this.stats.droppedSecondary++;
        return false;
      }
      this.stats.preempted++;
      this.emit('cancel', a.id, a.fx, a.fy, p.timeMs);
      this.active = null;
    }
    this.active = { id: p.id, rawX: p.x, rawY: p.y, fx: p.x, fy: p.y, lastMoveMs: p.timeMs };
    this.stats.accepted++;
    this.emit('down', p.id, p.x, p.y, p.timeMs);
    return true;
  }

  pointerMove(p: RawPointer): boolean {
    const a = this.active;
    if (!a || a.id !== p.id) return false;
    if (Math.hypot(p.x - a.rawX, p.y - a.rawY) < this.tremor) {
      this.stats.tremorSuppressed++;
      return false;
    }
    a.rawX = p.x;
    a.rawY = p.y;
    a.fx += (p.x - a.fx) * this.alpha;
    a.fy += (p.y - a.fy) * this.alpha;
    a.lastMoveMs = p.timeMs;
    this.emit('move', a.id, a.fx, a.fy, p.timeMs);
    return true;
  }

  pointerUp(p: RawPointer): boolean {
    const a = this.active;
    if (!a || a.id !== p.id) return false;
    this.active = null;
    this.emit('up', a.id, a.fx, a.fy, p.timeMs);
    return true;
  }

  pointerCancel(p: RawPointer): boolean {
    const a = this.active;
    if (!a || a.id !== p.id) return false;
    this.active = null;
    this.emit('cancel', a.id, a.fx, a.fy, p.timeMs);
    return true;
  }

  /** Forcefully release (window blur, orientation change, scene change): never leave an item stuck to a finger. */
  releaseAll(timeMs: number): void {
    const a = this.active;
    if (!a) return;
    this.active = null;
    this.emit('cancel', a.id, a.fx, a.fy, timeMs);
  }
}
