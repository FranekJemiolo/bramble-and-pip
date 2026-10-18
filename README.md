# Bramble & Pip 🌲🐾

A calm, non-addictive, offline-first pedagogical adventure for children under seven, inspired by the top-down nature exploration of *Pokémon Yellow*, but built around real-world nature observation, acoustic audio, and physical offline activities.

▶ **Live GitHub Pages Deployment:** [https://franekjemiolo.github.io/bramble-and-pip/](https://franekjemiolo.github.io/bramble-and-pip/)

---

## 1. Core Architectural & Ethical Invariants

1. **Zero Network Egress:**
   - Content Security Policy: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' data: blob:; connect-src 'none'; base-uri 'self'; object-src 'none'; form-action 'none';`
   - Zero telemetry, zero analytics SDKs, zero advertising endpoints, zero third-party font calls.
   - Complies strictly with COPPA and GDPR-K regulations.

2. **Anti-Addictive Session Regulation:**
   - Monotonic 15-minute daily exploration ceiling tracked via `performance.now()`.
   - At minute 12, a 180-second gradual sunset initiates:
     - 18-step warm amber color grading.
     - Exponential Web Audio low-pass filter sweep ($18\text{ kHz} \to 2.2\text{ kHz}$).
   - At minute 15, the game transitions into a serene nocturnal "Resting" state (`BedtimeScene`).
   - Clock rollbacks or midnight curfew (19:30 to 08:00) lock into peaceful rest.

3. **No Extrinsic Dopamine Loops:**
   - Zero streaks, zero daily login bonuses, zero random loot, zero confetti or slot-machine chimes.
   - Puzzles feature zero failure penalties or buzzers; incorrect moves gently return to their tray.

4. **Pediatric Motor Tolerance (Ages 3–6):**
   - **Single-Pointer Lock:** Rejects secondary finger contacts and accidental resting palms.
   - **12px Screen Perimeter Deadzone:** Eliminates edge-gripping "screen hug" touches.
   - **80px Magnetic Capture Basin:** Snaps puzzle pieces into alignment over a 200ms cubic ease-out.
   - **48px Bézier Corridor:** Provides forgiving gesture tracing with lift-and-resume progress preservation ($u \ge 0.92$).
   - **300ms Global Debounce:** Discards rapid "rage tapping".

5. **Acoustic & Visual Ergonomics:**
   - Master 16-color "Whispering Woods" indexed palette (no mixels, no anti-aliased blur, binary alpha).
   - $320 \times 288$ integer letterboxing centered on screen.
   - Unhurried pacing: 24–30 fps rendering, 64 px/s walking speed, 6 px corner sliding.
   - Acoustic procedural audio only (kalimba, woodblocks, gentle guitar, natural water bubble). Frequency strictly capped $<4.5\text{ kHz}$, attack $\ge 40\text{ms}$, peak $\le -12\text{ dBFS}$.
   - Silent HTML5 audio bridge bypasses the iOS hardware ringer switch.

---

## 2. The 20-Chapter Four-Season Progression Matrix

| Chapter | Season | Region | Narrative Objective | Pedagogical Interaction | Offline Bridge Sheet |
|---|---|---|---|---|---|
| **CH-01** | Spring | Ranger Cabin | Wake Pip & Light Lantern | Candle drag-and-drop to lantern | Cabin Orientation Card |
| **CH-02** | Spring | Pebble Creek West | Clear Winter Branches | Size-sorting logs into brush piles | Twig Collector Card |
| **CH-03** | Spring | Pebble Creek Central | Stepping Stone Subitizing | Count lily pad dots (1 to 5) to cross brook | Pond Stepping Card |
| **CH-04** | Spring | Meadow Edge | Budding Wildflowers | Color matching (Dandelion / Primrose) | Sprout Spotter Guide |
| **CH-05** | Spring | Bird Hollow | Robin Nest Building | Trace bird flight trajectory | Tiny Nest Craft Sheet |
| **CH-06** | Summer | Mossy Hollow Entrance | Clear Stream Debris | Horizontal sliding stone puzzle | Water Way Marker |
| **CH-07** | Summer | The Water Wheel | The Mossy Gearbox | Match 3 gear diameters to axles | Gear Cutout Kit |
| **CH-08** | Summer | Deep Hollow Shade | Insects in Log Shadows | Flashlight scanning in shaded zone | Bug Spotter Sheet |
| **CH-09** | Summer | Whispering Brook | Cooling Thirsty Friends | Water barrel drag-and-pour | Backyard Water Tracker |
| **CH-10** | Summer | Willow Bank | Comparing Leaf Shapes | Sorting oval willow vs. broad oak | Leaf Outline Card |
| **CH-11** | Autumn | Sunset Meadow West | Harvest Fallen Acorns | 1-to-1 counting into squirrel pouch | Acorn Match Card |
| **CH-12** | Autumn | Amber Woods | Tracing Dry Oak Leaves | Bézier finger tracing (48 px buffer) | Leaf-Press Guide |
| **CH-13** | Autumn | The Great Oak | Insulate Chipmunk Burrow | Drag dry moss and bark into nest | Burrow Insulator Sheet |
| **CH-14** | Autumn | Wind Ridge | Migrating Bird Flocks | Binocular search; trace V-formation | Sky Migration Map |
| **CH-15** | Autumn | Hollow Log Rest | Match Autumn Bird Calls | Acoustic 3-note pitch recognition | Sound Catcher Card |
| **CH-16** | Winter | Pine Ridge Trail | Rabbit Footprint Trail | Trace "Big Back, Small Front" prints | Winter Track Card A |
| **CH-17** | Winter | Frost Creek | Frozen Brook Crossing | Match log lengths to ice gaps | Stick Sizing Card |
| **CH-18** | Winter | Snow Pine Hollow | Pinecone Bird Feeders | Balance feeders on tree branches | DIY Pinecone Feeder |
| **CH-19** | Winter | The Badger Mound | Resting Woodland Friends | Soft flashlight scan inside burrow | Winter Sleeping Guide |
| **CH-20** | Winter | The Ranger's Lodge | Year-End Forest Reunion | Interactive feast; tap all animal friends | Ranger Honor Certificate |

---

## 3. Physical-Digital Bridging: Offline Vector Printables

The game generates resolution-independent vector PDFs in memory via client-side `pdfmake` with zero network egress:
- **Winter Footprint Detective:** 4-card pocket guide (Hopping Rabbit, Tiny Songbird, Digging Badger, DIY Fist-Stamp).
- **Autumn Leaf-Press Journal:** Specimen attachment cards with step-by-step leaf preservation crafts.
- **4-Badge Outdoor Scavenger Hunt:** Field checklist for Leaf Detective, Natural Tracker, Whispering Ear, and Path Maker badges.
- **Junior Ranger Honor Certificate:** Awarded upon gathering at the Ranger's Lodge.

---

## 4. Multi-Agent AI Tooling & Antigravity IDE Integration

- **Sprite Sanitizer (`scripts/process-sprite.js`):** Strips chroma-key backgrounds, clamps pixels to the 16-color Whispering Woods palette, and enforces binary alpha.
- **Local Art Pipeline MCP (`scripts/art-pipeline-mcp.js`):** JSON-RPC tool exposing `sanitize_sprite`, `audit_palette`, and `test_tile_seam` for automated asset generation.
- **Rules & Skills:**
  - `.agents/rules/art-pipeline.md`: 16-color palette, 320x288 resolution, zero mixels.
  - `.agents/rules/pedagogy-invariants.md`: Zero egress, anti-addictive limits, motor tolerance.
  - `.agents/skills/generate-sprite/SKILL.md`: Procedural sprite generation workflow.
- **Visual QA Testbed (`testbed.html`):** Isolated visual preview canvas for inspecting sprites, companion animations, autotiling Wang-sets, and flashlight Bayer dithering.

---

## 5. Development & Verification Workflow

```bash
# Install dependencies
npm ci

# Start development server
npm run dev

# Run full static and compile-time checks
npm run typecheck
npm run lint

# Audit zero-egress invariants (source, bundle, and CSP)
npm run audit:egress

# Run Vitest unit & functional test suite (114 tests)
npm run test:unit

# Run Playwright E2E browser tests (including 100 Monte Carlo stochastic touch trials)
npm run test:e2e

# Compile production PWA bundle (dual entry: index.html & testbed.html)
npm run build

# Preview production build locally
npm run preview
```

---

## 6. Mobile Distribution (Capacitor)

```bash
npm run build
npx cap add ios      # Generates Xcode iOS wrapper
npx cap add android  # Generates Android Studio wrapper
npx cap sync
```

---

## 7. Architectural Documentation

- [`docs/VISION.md`](docs/VISION.md) — Pedagogical vision, anti-addictive charter, and sensory limits.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Technical blueprint, Web Audio graphs, math models, and IndexedDB schemas.
- [`docs/MILESTONES.md`](docs/MILESTONES.md) — Gated phase deliverables and test acceptance criteria (Phases 0–7).
- [`docs/JOURNAL.md`](docs/JOURNAL.md) — Architectural decision records (ADRs) and living progress logs.

---

## License

MIT License — see [LICENSE](LICENSE).
