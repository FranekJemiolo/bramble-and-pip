# Ethical & Pedagogical Invariants for Bramble & Pip

These rules protect young children (under 7) and must never be relaxed or bypassed.

1. **Zero Network Egress:**
   - Content Security Policy `connect-src 'none'`.
   - Strictly zero telemetry, zero analytics SDKs, zero advertising endpoints, zero external font downloads.
   - All persistence is client-side in local IndexedDB.

2. **Anti-Addictive Session Regulation:**
   - Monotonic 15-minute daily exploration ceiling (`performance.now()`).
   - Sunset begins at minute 12 (180s gradual low-pass audio sweep + warm color grade).
   - Bedtime resting lock at minute 15. Cannot be bypassed.
   - Bedtime curfew between 19:30 and 08:00.

3. **No Extrinsic Dopamine Loops:**
   - Zero streaks, zero daily login incentives, zero confetti or slot-machine sound effects.
   - Zero failure penalties or buzzers in minigames.

4. **Pediatric Motor Tolerances:**
   - Single-pointer touch mutex lock (drops secondary fingers and palm rests).
   - 12px screen perimeter deadzones against screen-hugging.
   - 80px radial magnetic snapping with 200ms cubic ease-out.
   - 48px wide drive corridors for Bézier gesture tracing with lift-and-resume.
   - 300ms debounce on state transitions.
