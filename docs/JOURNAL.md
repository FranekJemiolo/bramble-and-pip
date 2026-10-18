# Bramble & Pip — Engineering Journal

Living log of decisions, trade-offs and progress. Newest entries at the bottom.
Format: `[NNNN]: Title` · date · phase · *Decision / Why / Consequences*.

---

## [0001]: Project Genesis and Architectural Directives
*2026-10-18 · Phase 0*

**Context.** Starting from scratch with a long design conversation
(`bramble_and_pip.md` in the parent workspace) covering vision, pedagogy, art,
audio, input ergonomics, persistence and QA. The build brief fixes the stack
and six gated phases; this entry records the directives I am treating as
immutable and the interpretation choices where the source material was
ambiguous or internally inconsistent.

**Immutable directives (from brief)**
1. Zero network egress — CSP `connect-src 'none'`, no telemetry, ads, auth.
2. Anti-addictive limits — 15-min monotonic ceiling, 12-min sunset (180 s), bedtime lock.
3. No extrinsic dopamine loops — no streaks, bonuses, loot, confetti, competition.
4. Pediatric motor tolerance — single pointer, 12 px perimeter, 80 px snap, 48 px trace corridor, 300 ms debounce.
5. Acoustic & visual ergonomics — 16-colour indexed palette, 320 × 288 integer letterbox, 24–30 fps, acoustic-only audio < 4.5 kHz.

**Decisions**

| ID | Decision | Why |
|---|---|---|
| ADR-001 | `core/` is Phaser-free and DOM-free at import time | Makes every safety rule unit-testable in Node; Phaser touches `window` on import |
| ADR-002 | Procedural art + synthesised audio, no loaded asset files | `connect-src 'none'` blocks XHR/fetch even same-origin, which is what Phaser's loader uses |
| ADR-003 | Own typed `GlobalEventBus` instead of `Phaser.Events.EventEmitter` | Same reason as ADR-001; still mirrored on `window.__EVENT_BUS__` |
| ADR-004 | Sunset grading = 16-entry palette swap re-baked into textures (18 steps / 180 s) | Keeps image strictly 16-colour and renderer-agnostic; the design's multiply matrix (`1.15, .82, .58`) has a >1 term that blend modes cannot express |
| ADR-005 | Canvas `320 × 288`; world viewport top `320 × 192`, Satchel bottom `320 × 96` | The conversation says both "world viewport 320 × 288" and "bottom 40 % satchel"; these cannot both hold on a 320 × 288 canvas |
| ADR-006 | Pip's "16-frame ring buffer" stores one breadcrumb per 1 px of player travel | Gives the Pokémon-Yellow "exactly one tile behind" behaviour independent of frame rate |
| ADR-007 | Egress audit = source scan (strict) + bundle scan for analytics tokens + runtime Playwright audit | Phaser's bundle legitimately contains the token `XMLHttpRequest`; a naive bundle grep (as in the conversation's CI sketch) would always fail |
| ADR-008 | pdfmake with PDF base-14 fonts only (no `vfs_fonts`), dynamically imported | "Zero external fonts" literally; avoids ~1 MB of embedded Roboto in the main chunk; vector-only so DPI is irrelevant (resolution-independent, i.e. ≥ 300 DPI when printed) |
| ADR-009 | Parent area is a DOM overlay (semantic HTML) | Accessible, no custom canvas text input; still no external fonts |
| ADR-010 | Tremor filter = 5 px (brief), flat-finger centroid jitter is handled by the same filter + EMA | The conversation lists both 5 px and 8 px; the brief (5 px) wins |
| ADR-011 | Dropped `parentGatePinHash` from the save schema | The gate is a fresh word-math challenge each time; a stored PIN would be dead data |
| ADR-012 | Pinned `phaser@^3.90` | "Phaser 3" is explicit in the brief; `latest` on npm is a different major |
| ADR-013 | Recorded human voice-over is *not* in the repo; Pip speaks through a synthesised motif, and the VO slot supports dual-codec files dropped into `public/audio/voice/` | I cannot record humans. The pipeline is complete; the content is an external task |

**Consequences / risks**
* Art and sound are procedural and therefore deliberately simple; a future
  artist pass can replace `render/sprites.ts` output with authored PNG atlases
  decoded through `<img>` (allowed by `img-src`).
* Voice-over is the main content gap and is flagged as such in the final sign-off.

**Next.** Commit docs, then Phase 1 scaffolding.

---

## [0002]: Phase 1 — Repository foundation, tooling & CI/CD
*2026-10-18 · Phase 1*

**Done**
* Vite 7 + TypeScript 5.9 (strict, `noUnusedLocals/Parameters`, `verbatimModuleSyntax`), Phaser `^3.90`, EasyStar (ships its own types — dropped the stub `@types/easystarjs`), `pdfmake` 0.2.x, Workbox 7, Capacitor 7, Vitest 3, Playwright.
* `index.html` carries the mandated CSP (exact brief string + `base-uri 'self'; object-src 'none'; form-action 'none'`). A tiny Vite plugin relaxes `connect-src` **only under `vite serve`** (HMR websocket); `build` and `preview` keep `connect-src 'none'` verbatim, and the audit script asserts it in `dist/index.html`.
* ESLint 9 flat config bans `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `navigator.sendBeacon` and `Math.random` in `src/` (randomness must come from the seeded RNG, which makes puzzles/tests deterministic).
* PWA: `vite-plugin-pwa` in `injectManifest` mode → `dist/sw.js` (classic/IIFE worker) + `manifest.webmanifest`; `workbox-precaching` + `workbox-routing` navigation fallback; registration through `workbox-window`, production only.
* Icons are generated from a 32×32 *palette-indexed* pixel scene by `scripts/make-icons.mjs` (zero deps, own PNG encoder).
* CI (`ci.yml`): checkout → Node 20 → `npm ci` → typecheck → lint → Vitest → build → egress audit → Playwright (Monte-Carlo = 100). The brief lists "Playwright, then build"; E2E must run against the *production build served by `vite preview`*, so build comes first (ADR-014).
* Deploy (`deploy.yml`): `workflow_run` on CI success for pushes to `main` → rebuild the verified commit → `upload-pages-artifact` → `actions/deploy-pages@v4`. Rebuilding (rather than passing artifacts across workflows) keeps the chain simple and reproducible.
* Git hooks live in `.githooks/` (`prepare` sets `core.hooksPath`): pre-commit = typecheck + lint, pre-push = unit tests.

**Issues hit**
* `workbox-build` looks for the *literal* text `self.__WB_MANIFEST`; aliasing `self` failed the build. Fixed with a `Window` interface augmentation so the literal stays valid TypeScript.
* Default SW output format was ES module (`sw.mjs`); forced `rollupFormat: 'iife'` so `dist/sw.js` is a classic worker that registers everywhere.

**Gate:** typecheck ✔ · lint ✔ (0 warnings) · unit (charter invariants, 6 tests) ✔ · build ✔ · egress audit ✔ · `dist/sw.js`, `manifest.webmanifest`, CSP present ✔.

**Next.** Phase 2: engine runtime, tolerant input and math core.
