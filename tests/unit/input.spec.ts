import { describe, expect, it } from 'vitest';
import { TolerantInputManager, type InputSample, type RawPointer } from '../../src/core/input/TolerantInputManager';

const VIEW = { width: 1000, height: 700 };
const mk = (): { m: TolerantInputManager; log: InputSample[] } => {
  const m = new TolerantInputManager({ viewport: () => VIEW });
  const log: InputSample[] = [];
  m.subscribe((s) => log.push(s));
  return { m, log };
};
const ptr = (id: number, x: number, y: number, t = 0, extra: Partial<RawPointer> = {}): RawPointer => ({
  id,
  pointerType: 'touch',
  x,
  y,
  timeMs: t,
  ...extra,
});

describe('TolerantInputManager', () => {
  it('accepts a normal tap and emits down/up at the touch position', () => {
    const { m, log } = mk();
    expect(m.pointerDown(ptr(1, 400, 300, 0))).toBe(true);
    expect(m.isDown).toBe(true);
    expect(m.pointerUp(ptr(1, 400, 300, 80))).toBe(true);
    expect(log.map((s) => s.phase)).toEqual(['down', 'up']);
    expect(log[0]).toMatchObject({ x: 400, y: 300 });
    expect(m.isDown).toBe(false);
  });

  it('single-pointer mutex: second finger is dropped, first keeps driving', () => {
    const { m, log } = mk();
    m.pointerDown(ptr(1, 400, 300, 0));
    expect(m.pointerDown(ptr(2, 500, 300, 10))).toBe(false);
    expect(m.pointerMove(ptr(2, 520, 320, 20))).toBe(false);
    expect(m.pointerUp(ptr(2, 520, 320, 30))).toBe(false);
    expect(m.activePointerId).toBe(1);
    expect(m.stats.droppedSecondary).toBe(1);
    expect(log.filter((s) => s.pointerId === 2)).toHaveLength(0);
    m.pointerUp(ptr(1, 400, 300, 40));
    // after release, the next finger may take over
    expect(m.pointerDown(ptr(2, 500, 300, 400))).toBe(true);
  });

  it('property: no second pointer ever becomes active while one is held', () => {
    const { m } = mk();
    m.pointerDown(ptr(1, 300, 300, 0));
    for (let id = 2; id < 50; id++) {
      expect(m.pointerDown(ptr(id, 200 + id * 5, 200 + id * 3, id))).toBe(false);
      expect(m.activePointerId).toBe(1);
    }
  });

  it('12 px perimeter deadzone drops screen-hug thumbs on all four edges', () => {
    const { m } = mk();
    expect(m.pointerDown(ptr(1, 11, 300))).toBe(false);
    expect(m.pointerDown(ptr(2, 989, 300))).toBe(false); // 1000-989 = 11
    expect(m.pointerDown(ptr(3, 500, 11))).toBe(false);
    expect(m.pointerDown(ptr(4, 500, 689))).toBe(false);
    expect(m.stats.droppedPerimeter).toBe(4);
    expect(m.pointerDown(ptr(5, 12, 300))).toBe(true); // exactly 12 px in is allowed
  });

  it('a perimeter thumb never blocks the index finger', () => {
    const { m } = mk();
    expect(m.pointerDown(ptr(1, 5, 650, 0))).toBe(false); // thumb on lower-left corner
    expect(m.pointerDown(ptr(2, 500, 300, 20))).toBe(true); // index finger plays
  });

  it('palm rests (large contact patches) are dropped', () => {
    const { m } = mk();
    expect(m.pointerDown(ptr(1, 400, 300, 0, { width: 80, height: 90 }))).toBe(false);
    expect(m.stats.droppedPalm).toBe(1);
    expect(m.pointerDown(ptr(2, 400, 300, 0, { width: 20, height: 24 }))).toBe(true);
  });

  it('5 px tremor deadzone suppresses jitter strictly below 5 px', () => {
    const { m, log } = mk();
    m.pointerDown(ptr(1, 400, 300, 0));
    expect(m.pointerMove(ptr(1, 403, 302, 10))).toBe(false); // 3.6 px
    expect(m.pointerMove(ptr(1, 404, 302, 20))).toBe(false); // 4.5 px
    expect(log.filter((s) => s.phase === 'move')).toHaveLength(0);
    expect(m.pointerMove(ptr(1, 404, 303, 30))).toBe(true); // exactly 5.0 px passes
  });

  it('moves ≥ 5 px are accepted and low-pass smoothed toward the raw position', () => {
    const { m, log } = mk();
    m.pointerDown(ptr(1, 400, 300, 0));
    expect(m.pointerMove(ptr(1, 410, 300, 10))).toBe(true);
    const s = log[log.length - 1] as InputSample;
    expect(s.phase).toBe('move');
    expect(s.x).toBeGreaterThan(400);
    expect(s.x).toBeLessThan(410); // smoothed, lagging the raw point
    expect(m.stats.accepted).toBe(1);
  });

  it('hysteresis is measured from the last accepted point (slow drift still moves eventually)', () => {
    const { m } = mk();
    m.pointerDown(ptr(1, 400, 300, 0));
    let accepted = 0;
    for (let i = 1; i <= 20; i++) if (m.pointerMove(ptr(1, 400 + i * 2, 300, i * 10))) accepted++;
    expect(accepted).toBeGreaterThanOrEqual(5);
    expect(m.stats.tremorSuppressed).toBeGreaterThan(0);
  });

  it('release always happens on cancel/releaseAll so nothing stays stuck to a finger', () => {
    const { m, log } = mk();
    m.pointerDown(ptr(1, 400, 300, 0));
    m.releaseAll(50);
    expect(m.isDown).toBe(false);
    expect(log[log.length - 1]?.phase).toBe('cancel');
    m.releaseAll(60); // idempotent
    m.pointerDown(ptr(3, 400, 300, 100));
    expect(m.pointerCancel(ptr(3, 0, 0, 120))).toBe(true);
    expect(m.pointerCancel(ptr(3, 0, 0, 130))).toBe(false);
    expect(m.isDown).toBe(false);
  });

  it('a stationary edge-gripping finger is pre-empted by a new finger; a moving/central one is not', () => {
    const { m, log } = mk();
    // finger resting 30 px from the edge, stationary for 2 s
    m.pointerDown(ptr(1, 30, 300, 0));
    expect(m.pointerDown(ptr(2, 500, 300, 500))).toBe(false); // only 0.5 s: not yet a grip
    expect(m.pointerDown(ptr(2, 500, 300, 2000))).toBe(true);
    expect(m.stats.preempted).toBe(1);
    expect(log.some((s) => s.phase === 'cancel' && s.pointerId === 1)).toBe(true);
    expect(m.activePointerId).toBe(2);

    const b = mk();
    b.m.pointerDown(ptr(1, 500, 300, 0)); // central, stationary: NOT a grip
    expect(b.m.pointerDown(ptr(2, 600, 300, 5000))).toBe(false);
  });

  it('events for non-active pointers are ignored', () => {
    const { m, log } = mk();
    expect(m.pointerMove(ptr(9, 400, 300))).toBe(false);
    expect(m.pointerUp(ptr(9, 400, 300))).toBe(false);
    expect(log).toHaveLength(0);
  });

  it('unsubscribe stops delivery', () => {
    const m = new TolerantInputManager({ viewport: () => VIEW });
    const seen: string[] = [];
    const off = m.subscribe((s) => seen.push(s.phase));
    m.pointerDown(ptr(1, 400, 300));
    off();
    m.pointerUp(ptr(1, 400, 300, 10));
    expect(seen).toEqual(['down']);
  });
});
