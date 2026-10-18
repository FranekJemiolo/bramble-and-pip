import { INPUT } from '../core/constants';
import { dist } from '../core/math';
import type { IPuzzle } from './types';

export interface LilyPad {
  id: number;
  x: number;
  y: number;
  dotCount: number; // 1 to 5
  isStepped: boolean;
}

export class SteppingStonePuzzle implements IPuzzle {
  readonly id = 'stepping_stones';
  readonly title = 'Stepping Stone Subitizing';

  readonly pads: LilyPad[] = [
    { id: 1, x: 60, y: 160, dotCount: 1, isStepped: false },
    { id: 2, x: 110, y: 110, dotCount: 2, isStepped: false },
    { id: 3, x: 160, y: 170, dotCount: 3, isStepped: false },
    { id: 4, x: 210, y: 115, dotCount: 4, isStepped: false },
    { id: 5, x: 260, y: 160, dotCount: 5, isStepped: false },
  ];

  private currentTargetCount = 1;
  private solved = false;
  private solveCallbacks: Array<() => void> = [];

  get isSolved(): boolean {
    return this.solved;
  }

  get targetCount(): number {
    return this.currentTargetCount;
  }

  onSolve(callback: () => void): void {
    this.solveCallbacks.push(callback);
  }

  reset(): void {
    this.solved = false;
    this.currentTargetCount = 1;
    for (const pad of this.pads) {
      pad.isStepped = false;
    }
  }

  /**
   * Evaluates tap at (x, y) with 80px magnetic capture.
   * Returns stepped pad if target reached.
   */
  tap(x: number, y: number): LilyPad | null {
    if (this.solved) return null;

    // Find closest pad within magnetic radius (80px)
    let closestPad: LilyPad | null = null;
    let closestDist = Infinity;

    for (const pad of this.pads) {
      const d = dist(x, y, pad.x, pad.y);
      if (d < INPUT.MAGNETIC_SNAP_RADIUS_PX && d < closestDist) {
        closestDist = d;
        closestPad = pad;
      }
    }

    if (!closestPad) return null;

    // If it matches current target count, step on it
    if (closestPad.dotCount === this.currentTargetCount) {
      closestPad.isStepped = true;
      this.currentTargetCount += 1;

      // If all 5 stones crossed
      if (this.currentTargetCount > 5) {
        this.solved = true;
        for (const cb of this.solveCallbacks) {
          cb();
        }
      }
      return closestPad;
    }

    return null; // Gentle ignore without negative buzzer
  }

  update(_dtSec: number): void {
    // Calming water current idle animation update
  }
}
