import { describe, expect, it } from 'vitest';
import {
  CompositeBezier,
  angleDiff,
  clamp,
  createRng,
  cubicBezierPoint,
  dbToGain,
  degToRad,
  easeInCubic,
  easeInOutCubic,
  easeOutCubic,
  gainToDb,
  hashSeed,
  inverseLerp,
  lerp,
  pediatricTouchOffset,
  wrapAngle,
  type CubicSegment,
  type Vec2,
} from '../../src/core/math';
import { clientToLogical, computeIntegerScale, computeLayout, logicalToClient } from '../../src/core/scaling';
import { ActionDebouncer, PointTween, findMagneticTarget, magneticPull } from '../../src/core/input/magnetic';
import { BezierTraceTracker } from '../../src/core/input/BezierTraceTracker';
import { WaxCrayonTraceRenderer } from '../../src/render/WaxCrayonTraceRenderer';
import { TRANSPARENT } from '../../src/render/indexed';

const P = (x: number, y: number): Vec2 => ({ x, y });
const line: CubicSegment = [P(0, 0), P(100, 0), P(200, 0), P(300, 0)];

describe('scalar helpers', () => {
  it('clamp / lerp / inverseLerp', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(lerp(10, 20, 0.25)).toBe(12.5);
    expect(inverseLerp(10, 20, 15)).toBe(0.5);
    expect(inverseLerp(5, 5, 9)).toBe(0);
  });

  it('easing curves hit endpoints and are monotonic', () => {
    for (const f of [easeOutCubic, easeInCubic, easeInOutCubic]) {
      expect(f(0)).toBeCloseTo(0, 10);
      expect(f(1)).toBeCloseTo(1, 10);
      let prev = -1;
      for (let i = 0; i <= 100; i++) {
        const v = f(i / 100);
        expect(v).toBeGreaterThanOrEqual(prev);
        prev = v;
      }
    }
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875, 10); // 1-(0.5)^3
    expect(easeOutCubic(-3)).toBe(0);
    expect(easeOutCubic(9)).toBe(1);
  });

  it('decibel conversions round-trip', () => {
    expect(dbToGain(-12)).toBeCloseTo(0.2512, 3);
    expect(gainToDb(dbToGain(-20))).toBeCloseTo(-20, 10);
    expect(gainToDb(0)).toBe(-Infinity);
  });

  it('angle helpers wrap into (−π, π]', () => {
    expect(wrapAngle(3 * Math.PI)).toBeCloseTo(Math.PI, 10);
    expect(wrapAngle(-3 * Math.PI)).toBeCloseTo(Math.PI, 10);
    expect(angleDiff(degToRad(350), degToRad(10))).toBeCloseTo(degToRad(-20), 10);
  });
});

describe('seeded RNG', () => {
  it('is deterministic per seed and differs across seeds', () => {
    const a = createRng(42);
    const b = createRng(42);
    const c = createRng(43);
    const sa = Array.from({ length: 8 }, () => a.next());
    const sb = Array.from({ length: 8 }, () => b.next());
    const sc = Array.from({ length: 8 }, () => c.next());
    expect(sa).toEqual(sb);
    expect(sa).not.toEqual(sc);
    expect(sa.every((v) => v >= 0 && v < 1)).toBe(true);
  });

  it('int/pick/shuffle stay in range and preserve elements', () => {
    const r = createRng(7);
    for (let i = 0; i < 200; i++) expect(r.int(5)).toBeLessThan(5);
    const items = [1, 2, 3, 4, 5, 6];
    const sh = r.shuffle(items);
    expect([...sh].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5, 6]); // not mutated
    expect(items).toContain(r.pick(items));
  });

  it('Box–Muller gaussian has the requested mean and σ (statistical)', () => {
    const r = createRng(2024);
    const n = 20000;
    let sum = 0;
    let sumSq = 0;
    for (let i = 0; i < n; i++) {
      const g = r.gaussian(10, 3);
      sum += g;
      sumSq += g * g;
    }
    const mean = sum / n;
    const sd = Math.sqrt(sumSq / n - mean * mean);
    expect(mean).toBeGreaterThan(9.9);
    expect(mean).toBeLessThan(10.1);
    expect(sd).toBeGreaterThan(2.9);
    expect(sd).toBeLessThan(3.1);
  });

  it('pediatric touch offsets have σx=18 and σy=22', () => {
    const r = createRng(99);
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i < 20000; i++) {
      const o = pediatricTouchOffset(r);
      xs.push(o.x);
      ys.push(o.y);
    }
    const sd = (v: number[]): number => {
      const m = v.reduce((a, b) => a + b, 0) / v.length;
      return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length);
    };
    expect(sd(xs)).toBeGreaterThan(17.3);
    expect(sd(xs)).toBeLessThan(18.7);
    expect(sd(ys)).toBeGreaterThan(21.2);
    expect(sd(ys)).toBeLessThan(22.8);
  });

  it('hashSeed is stable', () => {
    expect(hashSeed('CH-07')).toBe(hashSeed('CH-07'));
    expect(hashSeed('CH-07')).not.toBe(hashSeed('CH-08'));
  });
});

describe('integer canvas scaler', () => {
  it('matches S = max(1, min(⌊W/320⌋, ⌊H/288⌋)) on known viewports', () => {
    expect(computeIntegerScale(320, 288)).toBe(1);
    expect(computeIntegerScale(640, 576)).toBe(2);
    expect(computeIntegerScale(1280, 900)).toBe(3); // height-limited: 900/288=3.12
    expect(computeIntegerScale(1920, 1080)).toBe(3);
    expect(computeIntegerScale(390, 844)).toBe(1); // phone portrait
    expect(computeIntegerScale(100, 100)).toBe(1); // smaller than 1× clamps to 1
    expect(computeIntegerScale(Number.NaN, 400)).toBe(1);
  });

  it('property: scale is a positive integer, canvas fits when possible, and is centred', () => {
    const r = createRng(5);
    for (let i = 0; i < 1000; i++) {
      const w = 200 + r.int(3000);
      const h = 200 + r.int(2000);
      const s = computeIntegerScale(w, h);
      expect(Number.isInteger(s)).toBe(true);
      expect(s).toBeGreaterThanOrEqual(1);
      const l = computeLayout(w, h);
      expect(l.width).toBe(320 * s);
      expect(l.height).toBe(288 * s);
      if (w >= 320 && h >= 288) {
        expect(l.width).toBeLessThanOrEqual(w);
        expect(l.height).toBeLessThanOrEqual(h);
        // the next integer scale would NOT fit
        expect(320 * (s + 1) > w || 288 * (s + 1) > h).toBe(true);
        expect(Math.abs(l.offsetX * 2 + l.width - w)).toBeLessThanOrEqual(1);
        expect(Math.abs(l.offsetY * 2 + l.height - h)).toBeLessThanOrEqual(1);
      }
    }
  });

  it('client ↔ logical conversions invert each other and reject the letterbox', () => {
    const rect = { left: 100, top: 50, width: 960, height: 864 }; // 3×
    expect(clientToLogical(100, 50, rect)).toEqual({ x: 0, y: 0 });
    const p = clientToLogical(100 + 480, 50 + 432, rect);
    expect(p?.x).toBeCloseTo(160, 10);
    expect(p?.y).toBeCloseTo(144, 10);
    expect(clientToLogical(99, 60, rect)).toBeNull();
    expect(clientToLogical(100 + 960, 60, rect)).toBeNull();
    const back = logicalToClient(160, 144, rect);
    expect(back.x).toBeCloseTo(580, 10);
    expect(back.y).toBeCloseTo(482, 10);
    expect(clientToLogical(1, 1, { left: 0, top: 0, width: 0, height: 0 })).toBeNull();
  });
});

describe('cubic Bézier', () => {
  it('interpolates endpoints and midpoint of a straight segment', () => {
    expect(cubicBezierPoint(line, 0)).toEqual(P(0, 0));
    expect(cubicBezierPoint(line, 1)).toEqual(P(300, 0));
    expect(cubicBezierPoint(line, 0.5).x).toBeCloseTo(150, 10);
  });

  it('matches the closed form for a curved segment', () => {
    const seg: CubicSegment = [P(0, 0), P(0, 100), P(100, 100), P(100, 0)];
    const t = 0.3;
    const u = 1 - t;
    const exp = { x: 3 * u * t * t * 100 + t ** 3 * 100, y: 3 * u * u * t * 100 + 3 * u * t * t * 100 };
    const got = cubicBezierPoint(seg, t);
    expect(got.x).toBeCloseTo(exp.x, 10);
    expect(got.y).toBeCloseTo(exp.y, 10);
  });

  it('composite curve: length, pointAt and projection', () => {
    const c = new CompositeBezier([line], 100);
    expect(c.length).toBeCloseTo(300, 3);
    expect(c.pointAt(0.5).x).toBeCloseTo(150, 1);
    const hit = c.project(P(90, 40), 0, 1);
    expect(hit.u).toBeCloseTo(0.3, 1);
    expect(hit.distance).toBeCloseTo(40, 0);
    // restricted forward window cannot jump backwards
    const win = c.project(P(10, 0), 0.5, 0.65);
    expect(win.u).toBeGreaterThanOrEqual(0.5);
  });

  it('multi-segment composites are continuous', () => {
    const a: CubicSegment = [P(0, 0), P(10, 0), P(20, 0), P(30, 0)];
    const b: CubicSegment = [P(30, 0), P(40, 10), P(50, 10), P(60, 0)];
    const c = new CompositeBezier([a, b], 50);
    expect(c.pointAt(0)).toEqual(P(0, 0));
    const end = c.pointAt(1);
    expect(end.x).toBeCloseTo(60, 6);
    expect(c.sampleCount).toBe(101);
    expect(() => new CompositeBezier([])).toThrow();
  });
});

describe('magnetic snapping (80 px basin)', () => {
  const targets = [
    { id: 'a', x: 100, y: 100 },
    { id: 'b', x: 200, y: 100 },
  ];

  it('captures the nearest target inside 80 px and nothing outside', () => {
    expect(findMagneticTarget(P(130, 100), targets)?.target.id).toBe('a');
    expect(findMagneticTarget(P(170, 100), targets)?.target.id).toBe('b');
    expect(findMagneticTarget(P(100, 181), targets)).toBeNull(); // 81 px away
    const edge = findMagneticTarget(P(100, 180), targets);
    expect(edge?.target.id).toBe('a');
    expect(edge?.strength).toBeCloseTo(0, 10);
    expect(findMagneticTarget(P(100, 100), targets)?.strength).toBe(1);
  });

  it('honours per-target radius overrides', () => {
    expect(findMagneticTarget(P(100, 150), [{ id: 'x', x: 100, y: 100, radius: 40 }])).toBeNull();
    expect(findMagneticTarget(P(100, 150), [{ id: 'x', x: 100, y: 100, radius: 64 }])).not.toBeNull();
  });

  it('potential-field pull is continuous: 0 at the rim, full at the centre, monotonic', () => {
    const t = targets[0] as { id: string; x: number; y: number };
    expect(magneticPull(P(100, 180), t)).toEqual(P(100, 180)); // rim → no pull
    expect(magneticPull(P(100, 100), t)).toEqual(P(100, 100));
    let prevDist = Infinity;
    for (let d = 80; d >= 0; d -= 4) {
      const p = magneticPull(P(100 + d, 100), t);
      const remaining = Math.abs(p.x - 100);
      expect(remaining).toBeLessThanOrEqual(prevDist + 1e-9);
      prevDist = remaining;
    }
    expect(magneticPull(P(500, 500), t)).toEqual(P(500, 500));
  });

  it('snap tween: cubic ease-out over 200 ms, starts fast, ends exactly on target', () => {
    const tw = new PointTween();
    tw.start(P(0, 0), P(100, 0), 1000, 200);
    expect(tw.active).toBe(true);
    const mid = tw.sample(1100);
    expect(mid.x).toBeCloseTo(87.5, 6); // easeOutCubic(0.5)
    expect(mid.done).toBe(false);
    const end = tw.sample(1200);
    expect(end).toEqual({ x: 100, y: 0, done: true });
    expect(tw.active).toBe(false);
    tw.start(P(0, 0), P(10, 10), 0);
    tw.cancel();
    expect(tw.active).toBe(false);
  });
});

describe('300 ms global debounce', () => {
  it('rejects rage taps and accepts spaced ones', () => {
    const d = new ActionDebouncer();
    expect(d.tryAcquire(0)).toBe(true);
    expect(d.tryAcquire(100)).toBe(false);
    expect(d.tryAcquire(299)).toBe(false);
    expect(d.tryAcquire(300)).toBe(true);
    // 10 taps/sec for 2 seconds → at most 7 accepted (every ≥300 ms)
    const rage = new ActionDebouncer();
    let accepted = 0;
    for (let t = 0; t < 2000; t += 100) if (rage.tryAcquire(t)) accepted++;
    expect(accepted).toBe(7);
    rage.reset();
    expect(rage.tryAcquire(2001)).toBe(true);
  });
});

describe('Bézier trace tracker (48 px corridor, lift-and-resume)', () => {
  const curve = new CompositeBezier([line], 100);

  it('advances only inside the corridor and never jumps beyond the 0.15 forward window', () => {
    const t = new BezierTraceTracker(curve);
    expect(t.processPoint(P(30, 47)).progressed).toBe(true); // 47 px < 48
    expect(t.processPoint(P(60, 49)).progressed).toBe(false); // outside corridor
    const before = t.progress;
    const jump = t.processPoint(P(290, 0)); // far ahead: best in-window sample is within window but far from touch
    expect(jump.progressed).toBe(false);
    expect(t.progress).toBe(before);
  });

  it('never goes backwards and completes at u ≥ 0.92', () => {
    const t = new BezierTraceTracker(curve);
    for (let x = 10; x <= 300; x += 10) t.processPoint(P(x, 5));
    expect(t.completed).toBe(true);
    expect(t.progress).toBeGreaterThanOrEqual(0.92);
    const p = t.progress;
    t.processPoint(P(5, 0));
    expect(t.progress).toBe(p);
  });

  it('lift-and-resume keeps progress and widens the first forward reach', () => {
    const t = new BezierTraceTracker(curve);
    for (let x = 10; x <= 90; x += 10) t.processPoint(P(x, 0));
    const kept = t.progress;
    expect(kept).toBeGreaterThan(0.25);
    t.lift();
    expect(t.isLifted).toBe(true);
    // 0.35 further along: well beyond the normal 0.15 window (≥ 48 px away), reachable with the doubled window
    const resumeX = (kept + 0.35) * 300;
    const normal = new BezierTraceTracker(curve);
    for (let x = 10; x <= 90; x += 10) normal.processPoint(P(x, 0));
    const jumped = normal.processPoint(P(resumeX, 0));
    const resumed = t.processPoint(P(resumeX, 0));
    expect(jumped.distance).toBeGreaterThan(48); // normal reach cannot see it
    expect(resumed.progressed).toBe(true);
    expect(t.isLifted).toBe(false);
  });

  it('keeps a silent accuracy score in [0,1]', () => {
    const exact = new BezierTraceTracker(curve);
    const sloppy = new BezierTraceTracker(curve);
    for (let x = 10; x <= 300; x += 10) {
      exact.processPoint(P(x, 0));
      sloppy.processPoint(P(x, 40));
    }
    expect(exact.accuracyScore).toBeGreaterThan(0.95);
    expect(sloppy.accuracyScore).toBeLessThan(exact.accuracyScore);
    expect(sloppy.accuracyScore).toBeGreaterThanOrEqual(0);
    exact.reset();
    expect(exact.progress).toBe(0);
    expect(exact.accuracyScore).toBe(0);
  });
});

describe('WaxCrayonTraceRenderer', () => {
  it('draws only palette pixels near the curve, deterministically, and flags dirty', () => {
    const curve = new CompositeBezier([[P(20, 100), P(100, 60), P(200, 140), P(300, 100)]], 80);
    const make = (): WaxCrayonTraceRenderer => new WaxCrayonTraceRenderer(320, 192, curve, createRng(11));
    const a = make();
    const b = make();
    expect(a.consumeDirty()).toBe(true);
    expect(a.consumeDirty()).toBe(false);
    for (let u = 0.02; u <= 1; u += 0.02) {
      const p = curve.pointAt(u);
      a.processTouchPoint(p.x, p.y + 10);
      b.processTouchPoint(p.x, p.y + 10);
    }
    expect(a.consumeDirty()).toBe(true);
    expect(Array.from(a.layer.data)).toEqual(Array.from(b.layer.data));
    expect(a.layer.isOnPalette()).toBe(true);
    let inked = 0;
    for (let y = 0; y < a.layer.height; y++) {
      for (let x = 0; x < a.layer.width; x++) {
        if (a.layer.get(x, y) === TRANSPARENT) continue;
        inked++;
        // every ink pixel lies within ~8 px of the curve polyline
        let best = Infinity;
        for (let i = 0; i < curve.sampleCount; i++) {
          const s = curve.sampleAt(i);
          best = Math.min(best, Math.hypot(s.x - x, s.y - y));
        }
        expect(best).toBeLessThan(8);
      }
    }
    expect(inked).toBeGreaterThan(100);
    expect(a.tracker.completed).toBe(true);
  });

  it('lift preserves progress; finish() paints the remainder', () => {
    const curve = new CompositeBezier([line], 80);
    const w = new WaxCrayonTraceRenderer(320, 192, curve, createRng(3));
    for (let x = 10; x < 120; x += 10) w.processTouchPoint(x, 0);
    const p = w.tracker.progress;
    w.lift();
    expect(w.tracker.progress).toBe(p);
    w.finish();
    expect(w.consumeDirty()).toBe(true);
  });
});
