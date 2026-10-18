# Bramble & Pip — Architecture

Stack: **Vite + TypeScript (strict)**, **Phaser 3** (`pixelArt: true`),
**Workbox** (precache + routing, `workbox-window` for registration),
**Capacitor** wrapper config, **pdfmake** (client-side vector PDFs),
**Vitest** (unit + integration), **Playwright** (E2E, functional, stochastic).

## 0. Guiding principle: *pure core, thin Phaser shell*

```
src/
  core/      ← NO Phaser, NO DOM at import time. Pure TypeScript. 100 % unit-testable in Node.
  render/    ← Indexed-colour pixel art: palette, procedural sprites/tiles/font, texture bank.
  game/      ← Phaser scenes & objects. Wire core + render to the screen. No game rules live here.
  ui/        ← DOM overlays (Parental Gate, Parent Panel). Semantic HTML, no external fonts.
  sw.ts      ← Workbox service worker (injectManifest).
```

Every rule that matters to a child's safety (session limit, debounce, snapping,
curfew, persistence) is in `core/` and has a unit test. Phaser only *draws* and
*forwards events*.

### Why this matters under our CSP

`connect-src 'none'` forbids `fetch`/`XHR`/`WebSocket`/`sendBeacon`, **including
same-origin**. Phaser's default `scene.load.*` for JSON/audio/atlas uses XHR and
would therefore be blocked. Consequences, accepted as design drivers:

* **All art is procedural** (indexed pixel buffers authored in code → canvas
  textures). Nothing is loaded over the network except the app's own
  `<script>`/`<link>` bundles (governed by `script-src`/`style-src`).
* **All audio is synthesised** (physically-modelled kalimba, woodblock, plucked
  guitar, filtered-noise foley) into `AudioBuffer`s at start-up. Optional
  recorded voice-over clips are streamed via `<audio>` elements (`media-src
  'self'`) with dual-codec selection (`.ogg` / `.m4a`) — *not* fetched.
* **Service worker** requests are governed by the SW's own fetch, not the page's
  `connect-src`, so precaching still works.

## 1. Rendering pipeline (320 × 288)

```
 IndexedImage (Uint8, 0‥15 | 255=transparent)
        │   authored by render/sprites.ts, tiles.ts, font.ts, mapgen.ts
        ▼
 PaletteRegistry.current  ◄── SunsetGrader(w) / NightPalette   (16 RGB entries)
        │
        ▼  TextureBank.bake(image, palette) → HTMLCanvasElement (binary alpha)
 Phaser CanvasTexture  (NEAREST filter)
        │
        ▼
 Scenes draw at integer positions ──► 320×288 Phaser canvas ──► CSS integer scale S, centred
```

* **Logical canvas** `320 × 288`. World viewport = top `320 × 192` (20 × 12
  tiles); Ranger Satchel UI = bottom `320 × 96`.
* **Integer letterboxing.** `S = max(1, min(⌊W/320⌋, ⌊H/288⌋))`. The `<canvas>`
  keeps its 320 × 288 backing store and is resized by CSS to `320S × 288S` with
  `image-rendering: pixelated`, centred on `#1A1A24`.
* **Palette = law.** Every pixel in every texture is an index into the 16-colour
  *Whispering Woods* palette. There is no alpha blending and no
  anti-aliasing anywhere in art or text (text is rendered from a built-in 5 × 7
  pixel font; Phaser `Text` objects are never used).
* **Sunset = palette swap, not a shader.** Grading runs on the 16 palette
  entries — `C' = C ⊙ ((1−w)·1 + w·(1.15, 0.82, 0.58))`, followed by a
  `(1 + 0.15·w)` contrast lift — quantised to 18 steps over the 180 s window and
  re-baked into the textures. This is renderer-agnostic (WebGL or Canvas),
  keeps the image strictly 16-colour, and is exactly how indexed hardware
  fades. *(Decision recorded as ADR-004.)*
* **Flashlight.** A 320 × 192 canvas-texture mask: 60° cone, 96 px reach,
  three tiers (core 0–48 px clear, mid 48–80 px 0 → 0.5, penumbra 80–96 px →
  0.85). Alpha is rendered with a 4 × 4 **Bayer ordered dither** of palette
  colour 00, so even darkness stays binary-alpha and on-palette.
* **Camera.** Deadzone `48 × 36` px, exponential approach (α ≈ 0.08 per 1/30 s),
  `scroll = floor(·)`. Zero shake, ever.
* **Frame rate.** Phaser `fps: { target: 30, limit: 30 }`; simulation delta is
  clamped to ≤ 100 ms.

## 2. Single-pointer input pipeline

```
 window pointerdown/move/up/cancel  (capture, passive:false, touch-action:none)
        │
        ▼
 TolerantInputManager  (client px, pure)
   1. perimeter deadzone 12 px           → drop "screen-hug" thumbs
   2. palm filter (contact ≥ 60 px)      → drop palm rests
   3. single-pointer mutex               → drop 2nd+ fingers (stationary edge-grip may be pre-empted)
   4. tremor filter: ignore Δ < 5 px, then EMA smooth
        │ InputSample{phase,x,y}
        ▼
 CanvasPointerMapper (client → logical 320×288, via integer scale + canvas rect)
        │
        ▼
 InputRouter  → active scene (HitRegions, drag handlers, trace handlers)
        │
 ActionDebouncer (300 ms) guards UI activations / scene transitions (never drags)
```

* `window` `pointerup`/`pointercancel`/`blur` always release the lock, so a drag
  that slides off the glass cannot stay stuck.
* **Magnetic snapping.** `computeMagneticTarget(p, targets, 80)` plus a
  potential-field pull while dragging; final snap uses 200 ms cubic ease-out.
* **Tracing.** `BezierTraceTracker` projects a point onto the next 15 % of a
  composite cubic Bézier within a 48 px corridor; progress is never reset on
  lift (*lift-and-resume buffering*), and completion fires at `t ≥ 0.92`.
* **Tap-to-move.** `TilePathfindingManager` wraps EasyStar (sync mode, diagonals,
  no corner-cutting) on the 16 × 16 collision grid.

## 3. Web Audio graph

```
 Music (generative kalimba/guitar) ─► musicBus ─┐
 SFX / foley / woodblock           ─► sfxBus   ─┼─► SunsetBiquad (lowpass 18 kHz→2.2 kHz, Q .707)
 Ambience (wind/brook/crickets)    ─► ambBus   ─┘          │
                                                           ▼
 Voice (VO clips / Pip motif)      ─► voiceBus ───────► masterGain ─► DynamicsCompressor(limiter) ─► destination
                                         (bypasses the sunset filter so speech stays intelligible)
```

* **One shared `AudioContext`** (Safari allows ≤ 4). `ResilientAudioLifecycle`
  keeps a hidden looping silent `<audio>` (data-URI WAV) so iOS promotes the page
  to the *media* category (audible with the ringer switch off), suspends on
  `visibilitychange: hidden`, resumes on visible / next gesture.
* **Spectral ceiling.** Every synthesised source is band-limited **< 4.5 kHz**
  and then passed through a fixed 4.2 kHz low-pass guard; unit tests measure
  energy above 4.5 kHz on each rendered buffer.
* **Envelope rules.** ≥ 40 ms attack, SFX peak ≤ −12 dBFS, music ≈ −16 LUFS-ish.
* **Dual codec.** `AudioFormat.pickSource(base)` → `.ogg` if `canPlayType('audio/ogg;
  codecs="vorbis"')`, else `.m4a`. `scripts/encode-audio.sh` documents the FFmpeg
  commands for VO clips.
* **Sunset sweep.** `CalmingAudioPipeline.triggerSunsetSweep(180)` ramps the
  filter exponentially; music tempo/gain also ease down.

## 4. Session, curfew, power

* `SessionClock` accumulates *active, visible* play using **`performance.now()`**
  (monotonic). Each frame's contribution is capped, hidden time never counts.
* `SessionController` state machine: `ACTIVE → SUNSET (≥720 s) → BEDTIME (≥900 s)
  → RESTING`. `RESTING` is entered on reload when today's tally ≥ 900 s, when a
  curfew window is active (`isCurfewActive`, midnight-crossing aware), or when a
  **clock rollback** is detected (`Date.now()` < stored last-active).
* Day key is the local `YYYY-MM-DD`; a new key resets the tally.
* `DevicePowerLifecycleManager` holds a Screen Wake Lock during `ACTIVE`/`SUNSET`
  and releases it on `BEDTIME_REACHED`.

## 5. Persistence (double-buffered, atomic)

```
 GameSaveState ─JSON─► CRC32 ─► put(save_staging)
                                   │ read-back & verify checksum
                                   ▼
        save_backup ◄── copy of old save_primary      save_primary ◄── staging payload
                                   (single readwrite transaction)
 boot: read primary → parse+validate+migrate → else backup → else fresh save
```

* `KeyValueStore` abstraction with `IndexedDbStore` and `MemoryStore`.
* A boot-time write/read probe detects Safari Private Browsing (quota 0);
  on failure the engine runs on `MemoryStore` and exposes `isEphemeral = true`,
  which the Parent Panel surfaces as a gentle note.
* Schema `version` + `migrate()` chain. `strokeAccuracyScore` is stored
  silently and never rendered to the child.

## 6. Scenes

| Scene | Role |
|---|---|
| `BootScene` | Opens persistence, builds `TextureBank`/audio, decides `Title` vs `Bedtime` |
| `TitleScene` | One giant leaf: "tap to begin" (satisfies the audio-unlock gesture) |
| `WorldScene` | Tilemap, y-sorted entities, Ranger + Pip, tap-to-move, discovery zones, flashlight |
| `SatchelUIScene` | Always-on-top D-pad, tool buttons, Pip portrait, dialogue box (decoupled via `GlobalEventBus`) |
| `PuzzleOverlayScene` | Modal host for puzzle views (drag/sort, gearbox, stepping stones, trace, flashlight scan, sound match, feast) |
| `SketchbookScene` | Modal three-slot sketchbook + discovered animals |
| `BedtimeScene` | Static "Resting" cabin night; input locked until next day |

Sunset is a *controller* (palette regrade + audio sweep + Pip yawn) rather than
a scene, so the world stays interactive during the last three minutes.

**Event bus.** `GlobalEventBus` (typed emitter, no Phaser dependency) carries
`SatchelEvents.*` and `WorldEvents.*`; it is mirrored on `window.__EVENT_BUS__`
along with `window.__GAME__` and `window.__GAME_STATE__` for automated tests.

## 7. Content model

* `core/campaign/chapters.ts` — the 20-chapter matrix (season, region, objective,
  puzzle kind + manifest, bridge sheet, dialogue id).
* `core/puzzles/*` — declarative manifests + pure models implementing
  `IPuzzleScene`-style contracts (`evaluateMove`, `checkCompletion`, …).
* `render/mapgen.ts` — seeded deterministic generator producing each region's
  layers (ground, decor, collision, props, sensors).
* `core/printables/*` + `core/printables/pdf.ts` — `buildWinterTrackSpotterPDFDefinition`,
  `buildAutumnLeafPressPDFDefinition`, and a lazily-imported pdfmake runner using only
  built-in PDF base-14 fonts (no `vfs_fonts`), vectors only.

## 8. PWA & mobile

* `vite-plugin-pwa` (`injectManifest`) builds `dist/sw.js` from `src/sw.ts`
  (`workbox-precaching` + `workbox-routing` navigation fallback).
  `workbox-window` registers it, production only.
* `capacitor.config.ts` — `webDir: dist`, no navigation allow-list, https scheme.
  Platforms are generated by the user (`npx cap add ios|android`), orientation
  lock is a native-project setting.
* CSS safe-area insets are applied to `#app`.

## 9. Testing architecture

| Layer | Tool | Location | Gate |
|---|---|---|---|
| Math, input, kinematics, camera, pathfinding, autotile | Vitest | `tests/unit/math.spec.ts`, `input.spec.ts`, `world.spec.ts` | Phase 2 |
| Audio routing, spectral limits, companion FSM | Vitest | `tests/unit/audio-companion.spec.ts` | Phase 3 |
| Puzzles, campaign, dialogue, PDF definitions | Vitest | `tests/integration/scenes.spec.ts` + unit | Phase 4 |
| Persistence, curfew, parental gate, power | Vitest (+ fake-indexeddb) | `tests/unit/persistence-curfew.spec.ts` | Phase 5 |
| Boot, scaling, transitions | Playwright | `tests/e2e/boot-and-nav.spec.ts` | Phase 6 |
| Pediatric touch Monte Carlo (Box–Muller σx 18, σy 22) | Playwright | `tests/e2e/stochastic-touch.spec.ts` | Phase 6 |
| Sunset / bedtime lock | Playwright | `tests/e2e/sunset-curfew.spec.ts` | Phase 6 |
| Zero network egress | Playwright | `tests/e2e/zero-egress.spec.ts` | Phase 6 |
| PDF export | Playwright | `tests/e2e/pdf-export.spec.ts` | Phase 6 |
| Offline / SW | Playwright | `tests/e2e/pwa-offline.spec.ts` | Phase 6 |

Static gates: `tsc --noEmit`, ESLint (bans `fetch`, `XMLHttpRequest`, `sendBeacon`,
`WebSocket`, `EventSource` via `no-restricted-globals`), and
`scripts/audit-egress.mjs` (source + bundle token audit).

## 10. Performance & memory budget (≤ 60 MB)

Indexed textures are tiny (atlas ≈ 0.3 MB VRAM); synthesised audio buffers are
rendered lazily per season and freed when the season changes
(`SeasonalAssetLifecycleManager`). Target budget table:

| Category | Budget |
|---|---|
| World + character + UI textures | ≤ 2 MB |
| Active-season audio buffers | ≤ 12 MB |
| Phaser scene graph | ≤ 8 MB |
| Headroom (DOM, GC) | ≈ 38 MB |

## 11. Security & privacy posture

* CSP via `<meta>`: `default-src 'self'; script-src 'self'; style-src 'self'
  'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' data: blob:;
  connect-src 'none'` (+ `base-uri 'self'; object-src 'none'; form-action 'none'`).
* No cookies, no `localStorage` for identifiers, no third-party code.
* Info.plist / manifest declare no tracking. The only outward actions
  (downloads/prints) are behind the Semantic Parental Gate.
