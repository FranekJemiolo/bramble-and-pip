import { INPUT } from '../core/constants';
import { dist, easeOutCubic } from '../core/math';
import type { IPuzzle } from './types';

export interface Gear {
  id: string;
  x: number;
  y: number;
  radius: number;
  teeth: number;
  angleRad: number;
  speedMultiplier: number;
  isFixed: boolean;
}

export class MossyGearboxPuzzle implements IPuzzle {
  readonly id = 'mossy_gearbox';
  readonly title = 'The Mossy Gearbox';

  readonly driveGear: Gear = {
    id: 'drive',
    x: 96,
    y: 136,
    radius: 32,
    teeth: 16,
    angleRad: 0,
    speedMultiplier: 1.0,
    isFixed: true,
  };

  readonly drivenGear: Gear = {
    id: 'driven',
    x: 224,
    y: 136,
    radius: 32,
    teeth: 16,
    angleRad: 0,
    speedMultiplier: 1.0, // Driven in same direction when 3-gear train meshes
    isFixed: true,
  };

  readonly idlerGear: Gear = {
    id: 'idler',
    x: 160,
    y: 230, // Idle tray position
    radius: 32,
    teeth: 16,
    angleRad: 0,
    speedMultiplier: -1.0,
    isFixed: false,
  };

  readonly targetMeshX = 160;
  readonly targetMeshY = 136;
  readonly targetRadius = INPUT.MAGNETIC_SNAP_RADIUS_PX; // 80px

  private solved = false;
  private isSnapping = false;
  private snapProgress = 0;
  private snapStartX = 160;
  private snapStartY = 230;
  private solveCallbacks: Array<() => void> = [];

  get isSolved(): boolean {
    return this.solved;
  }

  get isMeshed(): boolean {
    return this.solved || (dist(this.idlerGear.x, this.idlerGear.y, this.targetMeshX, this.targetMeshY) < 12);
  }

  onSolve(callback: () => void): void {
    this.solveCallbacks.push(callback);
  }

  /**
   * Called while user drags the idler gear.
   */
  dragIdler(x: number, y: number): void {
    if (this.solved) return;
    this.isSnapping = false;
    this.idlerGear.x = x;
    this.idlerGear.y = y;

    // Check if within 80px magnetic basin
    const d = dist(x, y, this.targetMeshX, this.targetMeshY);
    if (d < this.targetRadius) {
      this.startSnap(x, y);
    }
  }

  /**
   * Release pointer: if close enough, snap; if not, return to tray or stay.
   */
  releasePointer(): void {
    if (this.solved) return;
    const d = dist(this.idlerGear.x, this.idlerGear.y, this.targetMeshX, this.targetMeshY);
    if (d < this.targetRadius) {
      this.startSnap(this.idlerGear.x, this.idlerGear.y);
    }
  }

  private startSnap(fromX: number, fromY: number): void {
    this.isSnapping = true;
    this.snapProgress = 0;
    this.snapStartX = fromX;
    this.snapStartY = fromY;
  }

  reset(): void {
    this.solved = false;
    this.isSnapping = false;
    this.snapProgress = 0;
    this.idlerGear.x = 160;
    this.idlerGear.y = 230;
    this.driveGear.angleRad = 0;
    this.drivenGear.angleRad = 0;
    this.idlerGear.angleRad = 0;
  }

  update(dtSec: number): void {
    // Continuous rotation of the drive gear (water wheel powers it)
    const baseSpeed = 1.2; // rad/s
    this.driveGear.angleRad += baseSpeed * dtSec;

    if (this.isSnapping) {
      this.snapProgress += dtSec / (INPUT.MAGNETIC_SNAP_DURATION_MS / 1000);
      if (this.snapProgress >= 1.0) {
        this.snapProgress = 1.0;
        this.isSnapping = false;
        this.idlerGear.x = this.targetMeshX;
        this.idlerGear.y = this.targetMeshY;
        this.solved = true;
        for (const cb of this.solveCallbacks) {
          cb();
        }
      } else {
        const t = easeOutCubic(this.snapProgress);
        this.idlerGear.x = this.snapStartX + (this.targetMeshX - this.snapStartX) * t;
        this.idlerGear.y = this.snapStartY + (this.targetMeshY - this.snapStartY) * t;
      }
    }

    // If meshed or solved, transfer kinetic torque to idler and driven gear
    if (this.isMeshed) {
      // 3-gear train: Drive (CW) -> Idler (CCW) -> Driven (CW)
      this.idlerGear.angleRad -= baseSpeed * (this.driveGear.teeth / this.idlerGear.teeth) * dtSec;
      this.drivenGear.angleRad += baseSpeed * (this.driveGear.teeth / this.drivenGear.teeth) * dtSec;
    }
  }
}
