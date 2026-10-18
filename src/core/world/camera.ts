import { CAMERA, TARGET_FPS } from '../constants';
import { clamp } from '../math';

export interface CameraScroll {
  x: number;
  y: number;
}

/**
 * Pixel-perfect camera. A 48 × 36 px deadzone around the camera centre keeps the view still for small
 * player movements; beyond it the target follows with an exponential approach (α ≈ 0.08 per 1/30 s,
 * made frame-rate independent), and the resulting scroll is floor-quantised so sprites never shimmer
 * between sub-pixel positions. There is no shake, snap or flash — ever.
 */
export class PixelPerfectCameraController {
  private camX: number;
  private camY: number;
  private readonly lerpPerFrame: number;

  constructor(
    private readonly viewW: number,
    private readonly viewH: number,
    private readonly mapW: number,
    private readonly mapH: number,
    initialX: number,
    initialY: number,
    private readonly deadW: number = CAMERA.DEADZONE_W,
    private readonly deadH: number = CAMERA.DEADZONE_H,
    lerpFactor: number = CAMERA.LERP,
  ) {
    this.camX = initialX;
    this.camY = initialY;
    this.lerpPerFrame = lerpFactor;
  }

  /** Jump instantly (scene start). */
  snapTo(x: number, y: number): CameraScroll {
    this.camX = x;
    this.camY = y;
    return this.scroll();
  }

  update(playerX: number, playerY: number, dtSec: number): CameraScroll {
    let tx = this.camX;
    let ty = this.camY;
    const dx = playerX - this.camX;
    const dy = playerY - this.camY;
    if (Math.abs(dx) > this.deadW / 2) tx = playerX - Math.sign(dx) * (this.deadW / 2);
    if (Math.abs(dy) > this.deadH / 2) ty = playerY - Math.sign(dy) * (this.deadH / 2);

    const alpha = 1 - Math.pow(1 - this.lerpPerFrame, clamp(dtSec, 0, 0.1) * TARGET_FPS);
    this.camX += (tx - this.camX) * alpha;
    this.camY += (ty - this.camY) * alpha;
    return this.scroll();
  }

  get center(): CameraScroll {
    return { x: this.camX, y: this.camY };
  }

  /** Integer scroll position of the top-left corner, clamped to the map (centred if the map is smaller than the view). */
  scroll(): CameraScroll {
    const rawX = Math.floor(this.camX - this.viewW / 2);
    const rawY = Math.floor(this.camY - this.viewH / 2);
    const x = this.mapW <= this.viewW ? -Math.floor((this.viewW - this.mapW) / 2) : clamp(rawX, 0, this.mapW - this.viewW);
    const y = this.mapH <= this.viewH ? -Math.floor((this.viewH - this.mapH) / 2) : clamp(rawY, 0, this.mapH - this.viewH);
    return { x, y };
  }
}
