# Bramble & Pip — Milestones

Work proceeds in **strictly gated phases**. A phase is *done* only when every
test gate passes locally and the journal entry is written and committed.
Each phase ends with a commit whose message names the phase.

Legend: ☐ not started · ◐ in progress · ☑ done

---

## Phase 0 — Architectural documentation & milestone gating ☑

**Deliverables**
* `docs/VISION.md`, `docs/ARCHITECTURE.md`, `docs/MILESTONES.md`, `docs/JOURNAL.md` (entry `[0001]`).

**Gate / acceptance**
* No file under `src/` exists.
* Commit message: `docs: establish architectural blueprints, milestones, and initial journal`.

---

## Phase 1 — Repository foundation, tooling & CI/CD ☑

**Deliverables**
* Vite + TS strict project; deps: `phaser`, `easystarjs`, `pdfmake`, `workbox-window`,
  `@capacitor/core`, `@capacitor/cli`, `@playwright/test`, `vitest` (+ `workbox-precaching`,
  `workbox-routing`, `vite-plugin-pwa`, ESLint, `fake-indexeddb`, `jsdom`).
* `index.html` with the mandated CSP; safe-area CSS; `touch-action: none`.
* ESLint flat config with egress-API bans; git hooks (`.githooks/`).
* `.github/workflows/ci.yml` (push to `main` + PR: checkout, Node 20, `npm ci`, typecheck, lint,
  Vitest, build, egress audit, Playwright) and `deploy.yml` (after CI success → `actions/deploy-pages@v4`).
* PWA plugin config, `capacitor.config.ts`, minimal boot that renders a 320 × 288 canvas.

**Gate / acceptance**
* `npm run typecheck`, `lint`, `test:unit`, `build` all green.
* Built `dist/index.html` contains the CSP; `dist/sw.js` and `dist/manifest.webmanifest` exist.

---

## Phase 2 — Engine runtime, tolerant input & math core ☑

**Deliverables**
`IntegerScaler`, `KinematicMovementController` (6 px corner slide), `PixelPerfectCameraController`
(48 × 36 deadzone, floor quantisation), `TolerantInputManager` (single-pointer mutex, 5 px tremor
filter, 12 px perimeter, palm filter, stationary edge-grip pre-emption), `ActionDebouncer` (300 ms),
magnetic snapping (80 px, 200 ms cubic ease-out), `BezierTraceTracker` + `WaxCrayonTraceRenderer`
(48 px corridor, lift-and-resume), `TilePathfindingManager` (EasyStar, 16 px grid), `AutotileResolver`.

**Gate / acceptance**
* `tests/unit/math.spec.ts` (+ `input.spec.ts`, `world.spec.ts`) green.
* Property checks: integer scale ∈ ℕ⁺ for random viewports; camera scroll always integer;
  second pointer never becomes active; debounce rejects taps < 300 ms apart.

---

## Phase 3 — Visual system, audio pipeline & companion FSM ☑

**Deliverables**
Palette + `PaletteGrader` (sunset/night), `IndexedImage`, 5 × 7 pixel font, procedural sprites/tiles,
`TextureBank`, flashlight mask (60° / 96 px / 3-tier / Bayer dither), synthesised acoustic
instruments, `CalmingAudioPipeline` (18 kHz → 2.2 kHz sweep), `ResilientAudioLifecycle`,
`AudioFormat` dual-codec, `PipCompanion` (16-sample breadcrumb ring buffer; `FOLLOWING`,
`IDLE_CURIOUS`, `INSPECTING`, `YAWNING`, `SLEEPING`).

**Gate / acceptance**
* `tests/unit/audio-companion.spec.ts` green, including: every rendered buffer has < −40 dB
  energy above 4.5 kHz, attack ≥ 40 ms, peak ≤ −12 dBFS; sunset ramp hits 2200 Hz at +180 s;
  Pip lags the player by exactly 16 breadcrumbs.
* Palette audit: every pixel of every registered texture is `< 16` or fully transparent.

---

## Phase 4 — Content matrix, minigames & offline vector printables ☑

**Deliverables**
`GlobalEventBus` + `window.__GAME__ / __GAME_STATE__ / __EVENT_BUS__`, `NonReaderDialogueBox`
(32 × 32 pictograms, ≥ 1.5 s post-audio dwell), Mossy Gearbox, Stepping-Stone Subitizing, drag/sort
family, trace, flashlight scan, sound match, feast; 20-chapter campaign state machine;
region map generator; `WorldScene`, `SatchelUIScene`, `PuzzleOverlayScene`, `SketchbookScene`;
`buildWinterTrackSpotterPDFDefinition`, `buildAutumnLeafPressPDFDefinition`, pdfmake runner.

**Gate / acceptance**
* `tests/integration/scenes.spec.ts` green: every one of the 20 chapters has a solvable puzzle model
  (solved by an automatic oracle), progression advances CH-01 → CH-20 and unlocks sandbox.
* PDF definitions contain only vector primitives (`canvas`, text) and no `image` nodes.

---

## Phase 5 — Persistence, parent gate, curfews & power ☑

**Deliverables**
`LocalPersistenceEngine` (double buffer + CRC32 + backup recovery + memory fallback),
`SessionClock`/`SessionController` (monotonic, 12/15 min, day rollover, clock rollback),
`isCurfewActive`, tab-throttle clamp, `ParentalGateService` (word-math), Parent Panel DOM UI,
`DevicePowerLifecycleManager` (Screen Wake Lock), `ParentInsightService`.

**Gate / acceptance**
* `tests/unit/persistence-curfew.spec.ts` green: corrupted primary recovers from backup; torn
  staging write never replaces primary; 19:30–08:00 curfew table-driven; rollback → Resting.

---

## Phase 6 — Testing hardening, E2E suites & final verification ☐

**Deliverables**
Playwright suites: `boot-and-nav`, `stochastic-touch` (Box–Muller σx 18 px, σy 22 px,
100 Monte Carlo completions), `sunset-curfew`, `zero-egress`, `pdf-export`, `pwa-offline`;
CI workflows exercised; GitHub Pages enabled; final journal sign-off.

**Gate / acceptance**
* 100 / 100 stochastic completions; zero non-same-origin requests and zero fetch/XHR in a full
  session; sunset begins at 720 s, input locks at 900 s; PDF buffer starts with `%PDF-` and
  ends with `%%EOF`; app boots and plays with the network offline after first load.
* Push to `main` → CI green → Pages deploy at
  https://franekjemiolo.github.io/bramble-and-pip/.
