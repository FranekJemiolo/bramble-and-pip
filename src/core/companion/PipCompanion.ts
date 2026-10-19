import { PIP } from '../constants';
import type { Facing } from '../world/kinematics';

export type PipState = 'FOLLOWING' | 'IDLE_CURIOUS' | 'INSPECTING' | 'YAWNING' | 'SLEEPING';

export interface Breadcrumb {
  x: number;
  y: number;
  facing: Facing;
}

/**
 * Pip Companion Behavior and Movement FSM.
 * Maintains a 16-sample ring buffer of player positions so Pip follows exactly
 * one tile (~16px) behind the player, mimicking the iconic Pokémon Yellow companion
 * mechanic while responding to environmental curiosity and bedtime sunset fatigue.
 */
export class PipCompanion {
  private readonly buffer: Breadcrumb[] = [];
  private readonly bufferSize: number;
  private headIdx = 0;
  private currentX: number;
  private currentY: number;
  private currentFacing: Facing = 'down';
  private state: PipState = 'FOLLOWING';
  private idleTimerSec = 0;
  private inspectingTimerSec = 0;
  private animFrame = 0;
  private animTimer = 0;

  constructor(
    initialX: number,
    initialY: number,
    delaySteps = PIP.BREADCRUMB_BUFFER
  ) {
    this.bufferSize = delaySteps + 1;
    this.currentX = initialX;
    this.currentY = initialY;

    // Pre-fill buffer with initial standing position
    for (let i = 0; i < this.bufferSize; i++) {
      this.buffer.push({ x: initialX, y: initialY, facing: 'down' });
    }
  }

  get x(): number {
    return this.currentX;
  }

  get y(): number {
    return this.currentY;
  }

  get facing(): Facing {
    return this.currentFacing;
  }

  get currentState(): PipState {
    return this.state;
  }

  get frame(): number {
    return this.animFrame;
  }

  reset(x: number, y: number, facing: Facing = 'down'): void {
    this.currentX = x;
    this.currentY = y;
    this.currentFacing = facing;
    this.headIdx = 0;
    for (let i = 0; i < this.bufferSize; i++) {
      this.buffer[i] = { x, y, facing };
    }
  }

  /**
   * Pushes a new player position breadcrumb into the ring buffer.
   * Call when player moves.
   */
  recordPlayerStep(x: number, y: number, facing: Facing): void {
    this.buffer[this.headIdx] = { x, y, facing };
    this.headIdx = (this.headIdx + 1) % this.bufferSize;
  }

  /**
   * Retrieves the breadcrumb 16 samples behind the current head.
   */
  getTargetBreadcrumb(): Breadcrumb {
    // The oldest sample is at headIdx in a full ring buffer
    return this.buffer[this.headIdx] ?? { x: this.currentX, y: this.currentY, facing: this.currentFacing };
  }

  /**
   * Trigger an inspection reaction (e.g. magnifying glass or flashlight discovery).
   */
  inspectTarget(durationSec = 3.0): void {
    if (this.state === 'SLEEPING') return;
    this.state = 'INSPECTING';
    this.inspectingTimerSec = durationSec;
  }

  onPlayerInspect(durationSec = 3.0): void {
    this.inspectTarget(durationSec);
  }

  /**
   * Updates Pip's movement, animation frame, and behavioral state machine.
   * @param isPlayerMoving Whether player is currently in motion
   * @param sessionElapsedSeconds Total session play time in seconds
   * @param isBedtime Whether 15m limit reached or curfew active
   * @param dtSec Frame delta time in seconds
   */
  update(
    isPlayerMoving: boolean,
    sessionElapsedSeconds: number,
    isBedtime: boolean,
    dtSec: number
  ): void {
    // Bedtime lock takes highest priority
    if (isBedtime) {
      this.state = 'SLEEPING';
      this.updateAnimation(dtSec, 2); // 2 fps sleepy breathing
      return;
    }

    // 12-minute sunset yawning trigger
    if (sessionElapsedSeconds >= 720 && this.state !== 'INSPECTING') {
      if (!isPlayerMoving) {
        this.state = 'YAWNING';
        this.updateAnimation(dtSec, 2);
        return;
      }
    }

    if (this.state === 'INSPECTING') {
      this.inspectingTimerSec -= dtSec;
      if (this.inspectingTimerSec <= 0 || isPlayerMoving) {
        this.state = isPlayerMoving ? 'FOLLOWING' : 'IDLE_CURIOUS';
      } else {
        this.updateAnimation(dtSec, 4);
        return;
      }
    }

    if (isPlayerMoving) {
      this.state = 'FOLLOWING';
      this.idleTimerSec = 0;

      // Read target from 16-breadcrumb lag
      const target = this.getTargetBreadcrumb();
      this.currentX = target.x;
      this.currentY = target.y;
      this.currentFacing = target.facing;

      this.updateAnimation(dtSec, 8); // 8 fps hop cycle
    } else {
      this.idleTimerSec += dtSec;
      if (this.idleTimerSec >= PIP.IDLE_CURIOUS_AFTER_SECONDS) {
        this.state = sessionElapsedSeconds >= 720 ? 'YAWNING' : 'IDLE_CURIOUS';
      }
      this.updateAnimation(dtSec, 2); // 2 fps calm idle
    }
  }

  private updateAnimation(dtSec: number, fps: number): void {
    this.animTimer += dtSec;
    const interval = 1 / fps;
    if (this.animTimer >= interval) {
      this.animTimer -= interval;
      this.animFrame = (this.animFrame + 1) % 4;
    }
  }

  /**
   * Resets position immediately (scene warp/transition).
   */
  teleport(x: number, y: number, facing: Facing = 'down'): void {
    this.currentX = x;
    this.currentY = y;
    this.currentFacing = facing;
    for (let i = 0; i < this.bufferSize; i++) {
      this.buffer[i] = { x, y, facing };
    }
    this.headIdx = 0;
    this.idleTimerSec = 0;
    this.state = 'FOLLOWING';
  }
}
