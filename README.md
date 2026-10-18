# Bramble & Pip

A calm, offline, ad-free, non-addictive woodland adventure for children aged **3–6**,
inspired by the top-down exploration of *Pokémon Yellow* but built around real-world nature
observation, acoustic sound, and printable offline activities.

▶ **Play:** https://franekjemiolo.github.io/bramble-and-pip/

* **15 minutes a day, then bedtime.** Sunset begins at minute 12; at minute 15 the characters sleep.
* **Zero network egress.** CSP `connect-src 'none'`; no analytics, ads, accounts or telemetry.
* **No dopamine loops.** No streaks, loot, confetti, scores or notifications.
* **Built for small hands.** Single-pointer lock, edge deadzones, 80 px magnetic snapping, 48 px tracing corridors, 300 ms debounce.
* **16 colours, 320 × 288, integer-scaled.** Acoustic instruments only, nothing above 4.5 kHz.
* **Offline PWA** (Workbox) with a Capacitor wrapper config for iOS/Android.

Read the docs first: [`docs/VISION.md`](docs/VISION.md) · [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) ·
[`docs/MILESTONES.md`](docs/MILESTONES.md) · [`docs/JOURNAL.md`](docs/JOURNAL.md).

## Develop

```bash
npm ci
npm run dev            # http://localhost:5173/bramble-and-pip/
npm run typecheck && npm run lint
npm run test:unit      # Vitest (unit + integration)
npm run build          # tsc --noEmit + production PWA build into dist/
npm run audit:egress   # static zero-egress audit
npx playwright install chromium
npm run test:e2e       # Playwright (builds are served via `vite preview`)
```

Deployment: pushes to `main` run CI; on success `deploy.yml` publishes `dist/` to GitHub Pages.

## Mobile

```bash
npm run build && npx cap add ios && npx cap add android && npx cap sync
```

## License

MIT — see [LICENSE](LICENSE).
