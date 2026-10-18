import { BASE_HEIGHT, BASE_WIDTH } from './constants';
import type { Vec2 } from './math';

/**
 * S = max(1, min(⌊W/320⌋, ⌊H/288⌋)) — whole-number scaling only, letterboxed and centred.
 * Non-finite or tiny viewports degrade to 1×.
 */
export function computeIntegerScale(viewportWidth: number, viewportHeight: number): number {
  if (!Number.isFinite(viewportWidth) || !Number.isFinite(viewportHeight)) return 1;
  return Math.max(1, Math.min(Math.floor(viewportWidth / BASE_WIDTH), Math.floor(viewportHeight / BASE_HEIGHT)));
}

export interface ScaleLayout {
  scale: number;
  /** CSS size of the canvas element. */
  width: number;
  height: number;
  /** Letterbox offsets inside the viewport (≥ 0 unless the viewport is smaller than 1×). */
  offsetX: number;
  offsetY: number;
}

export function computeLayout(viewportWidth: number, viewportHeight: number): ScaleLayout {
  const scale = computeIntegerScale(viewportWidth, viewportHeight);
  const width = BASE_WIDTH * scale;
  const height = BASE_HEIGHT * scale;
  return { scale, width, height, offsetX: Math.floor((viewportWidth - width) / 2), offsetY: Math.floor((viewportHeight - height) / 2) };
}

export interface RectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Convert client pixels to logical 320×288 canvas coordinates; `null` when outside the canvas (letterbox). */
export function clientToLogical(clientX: number, clientY: number, rect: RectLike): Vec2 | null {
  if (rect.width <= 0 || rect.height <= 0) return null;
  const x = ((clientX - rect.left) / rect.width) * BASE_WIDTH;
  const y = ((clientY - rect.top) / rect.height) * BASE_HEIGHT;
  if (x < 0 || y < 0 || x >= BASE_WIDTH || y >= BASE_HEIGHT) return null;
  return { x, y };
}

/** Inverse mapping, used by tests and the debug layout API to aim real pointer events. */
export function logicalToClient(x: number, y: number, rect: RectLike): Vec2 {
  return { x: rect.left + (x / BASE_WIDTH) * rect.width, y: rect.top + (y / BASE_HEIGHT) * rect.height };
}
