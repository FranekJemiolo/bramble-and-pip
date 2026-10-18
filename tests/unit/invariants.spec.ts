import { describe, expect, it } from 'vitest';
import {
  AUDIO,
  BASE_HEIGHT,
  BASE_WIDTH,
  CAMERA,
  DIALOGUE,
  INPUT,
  MAX_FRAME_DELTA_MS,
  MOVEMENT,
  PIP,
  SATCHEL_HEIGHT,
  SESSION,
  TARGET_FPS,
  WORLD_VIEW_HEIGHT,
} from '../../src/core/constants';

/** These pin the *charter* (docs/VISION.md §3). Changing one is a product decision, not a refactor. */
describe('charter invariants', () => {
  it('canvas is 320×288 and the world/satchel split fills it exactly', () => {
    expect(BASE_WIDTH).toBe(320);
    expect(BASE_HEIGHT).toBe(288);
    expect(WORLD_VIEW_HEIGHT + SATCHEL_HEIGHT).toBe(BASE_HEIGHT);
  });

  it('enforces the 15-minute ceiling with a 12-minute, 180 s sunset', () => {
    expect(SESSION.DAILY_LIMIT_SECONDS).toBe(900);
    expect(SESSION.SUNSET_START_SECONDS).toBe(720);
    expect(SESSION.SUNSET_DURATION_SECONDS).toBe(180);
    expect(SESSION.SUNSET_START_SECONDS + SESSION.SUNSET_DURATION_SECONDS).toBe(SESSION.DAILY_LIMIT_SECONDS);
    expect(SESSION.MAX_PARENT_LIMIT_MINUTES * 60).toBeLessThanOrEqual(SESSION.DAILY_LIMIT_SECONDS);
  });

  it('pediatric motor tolerances match the brief', () => {
    expect(INPUT.PERIMETER_DEADZONE_PX).toBe(12);
    expect(INPUT.TREMOR_DEADZONE_PX).toBe(5);
    expect(INPUT.MAGNETIC_SNAP_RADIUS_PX).toBe(80);
    expect(INPUT.MAGNETIC_SNAP_DURATION_MS).toBe(200);
    expect(INPUT.TRACE_CORRIDOR_PX).toBe(48);
    expect(INPUT.DEBOUNCE_MS).toBe(300);
    expect(INPUT.BUTTON_HIT_PX).toBeGreaterThan(INPUT.BUTTON_ART_PX);
  });

  it('frame pacing stays within 24–30 fps with tab-throttle clamp', () => {
    expect(TARGET_FPS).toBeGreaterThanOrEqual(24);
    expect(TARGET_FPS).toBeLessThanOrEqual(30);
    expect(MAX_FRAME_DELTA_MS).toBeLessThanOrEqual(100);
  });

  it('audio never exceeds 4.5 kHz and attacks are never abrupt', () => {
    expect(AUDIO.MAX_FREQUENCY_HZ).toBe(4500);
    expect(AUDIO.GUARD_LOWPASS_HZ).toBeLessThanOrEqual(AUDIO.MAX_FREQUENCY_HZ);
    expect(AUDIO.MIN_ATTACK_SECONDS).toBeGreaterThanOrEqual(0.04);
    expect(AUDIO.SFX_PEAK_DBFS).toBeLessThanOrEqual(-12);
    expect(AUDIO.SUNSET_START_HZ).toBe(18000);
    expect(AUDIO.SUNSET_END_HZ).toBe(2200);
  });

  it('camera, movement, companion and dialogue constants match the design', () => {
    expect([CAMERA.DEADZONE_W, CAMERA.DEADZONE_H]).toEqual([48, 36]);
    expect(MOVEMENT.CORNER_SLIDE_TOLERANCE_PX).toBe(6);
    expect(MOVEMENT.WALK_SPEED_PX_PER_S).toBe(64);
    expect(PIP.BREADCRUMB_BUFFER).toBe(16);
    expect(DIALOGUE.MIN_POST_AUDIO_DWELL_MS).toBe(1500);
    expect(DIALOGUE.MAX_SIGHT_WORDS).toBe(3);
  });
});
