/**
 * Immutable product invariants. Every number here is a *charter* value from
 * docs/VISION.md §3 and docs/ARCHITECTURE.md. Tests in tests/unit/invariants.spec.ts
 * pin them so a casual edit cannot silently weaken a child-safety rule.
 */

/** Logical canvas (2× a classic Game Boy screen). */
export const BASE_WIDTH = 320;
export const BASE_HEIGHT = 288;
export const TILE_SIZE = 16;

/** Vertical split of the 320×288 canvas (ADR-005). */
export const WORLD_VIEW_WIDTH = 320;
export const WORLD_VIEW_HEIGHT = 192; // 20 × 12 tiles
export const SATCHEL_TOP = WORLD_VIEW_HEIGHT;
export const SATCHEL_HEIGHT = BASE_HEIGHT - WORLD_VIEW_HEIGHT; // 96

export const LETTERBOX_COLOR = '#1A1A24';

/** Frame pacing: 24–30 fps, tab-throttle protection. */
export const TARGET_FPS = 30;
export const MIN_FPS = 24;
export const MAX_FRAME_DELTA_MS = 100;

/** Pediatric motor tolerances. */
export const INPUT = {
  /** Touches whose client position lies within this many px of the display edge are ignored ("screen hug"). */
  PERIMETER_DEADZONE_PX: 12,
  /** Hand-tremor hysteresis radius. */
  TREMOR_DEADZONE_PX: 5,
  /** EMA factor applied to accepted moves (1 = no smoothing). */
  SMOOTHING_ALPHA: 0.6,
  /** Contact patches at least this large (CSS px, both axes) are treated as a resting palm. */
  PALM_CONTACT_PX: 60,
  /** A stationary pointer this close to the edge for this long may be pre-empted by a moving one. */
  EDGE_GRIP_ZONE_PX: 48,
  EDGE_GRIP_STATIONARY_MS: 1200,
  /** Radial magnetic capture basin for interactive puzzles. */
  MAGNETIC_SNAP_RADIUS_PX: 80,
  MAGNETIC_SNAP_DURATION_MS: 200,
  REJECT_RETURN_DURATION_MS: 400,
  /** Global debounce against rapid "rage tapping". */
  DEBOUNCE_MS: 300,
  /** Drive corridor for Bézier gesture tracing. */
  TRACE_CORRIDOR_PX: 48,
  TRACE_FORWARD_WINDOW: 0.15,
  TRACE_COMPLETE_AT: 0.92,
  /** Art size vs. active touch zone for Satchel buttons. */
  BUTTON_ART_PX: 48,
  BUTTON_HIT_PX: 64,
} as const;

/** Anti-addictive session limits (seconds). */
export const SESSION = {
  DAILY_LIMIT_SECONDS: 15 * 60,
  SUNSET_START_SECONDS: 12 * 60,
  SUNSET_DURATION_SECONDS: 180,
  /** Parent may shorten, never lengthen, the daily ceiling. */
  MIN_PARENT_LIMIT_MINUTES: 5,
  MAX_PARENT_LIMIT_MINUTES: 15,
} as const;

/** Acoustic ergonomics. */
export const AUDIO = {
  /** No synthesised energy may live above this frequency. */
  MAX_FREQUENCY_HZ: 4500,
  /** Hard anti-alias / guard low-pass on every source. */
  GUARD_LOWPASS_HZ: 4200,
  SUNSET_START_HZ: 18000,
  SUNSET_END_HZ: 2200,
  MIN_ATTACK_SECONDS: 0.04,
  /** SFX peak ceiling, dBFS. */
  SFX_PEAK_DBFS: -12,
  SAMPLE_RATE: 22050,
} as const;

/** Companion. */
export const PIP = {
  BREADCRUMB_BUFFER: 16,
  IDLE_CURIOUS_AFTER_SECONDS: 2,
} as const;

/** Camera. */
export const CAMERA = {
  DEADZONE_W: 48,
  DEADZONE_H: 36,
  LERP: 0.08,
} as const;

/** Kinematics. */
export const MOVEMENT = {
  WALK_SPEED_PX_PER_S: 64,
  CORNER_SLIDE_TOLERANCE_PX: 6,
} as const;

/** Dialogue. */
export const DIALOGUE = {
  PICTOGRAM_PX: 32,
  MIN_POST_AUDIO_DWELL_MS: 1500,
  MAX_SIGHT_WORDS: 3,
} as const;

/** Memory budget (MB) from docs/ARCHITECTURE.md §10. */
export const MEMORY_BUDGET_MB = 60;

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export type Season = (typeof SEASONS)[number];

export const SAVE_SCHEMA_VERSION = 1;
export const MAX_ITEM_QUANTITY = 3;
export const SATCHEL_SLOTS = 3;
