import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const BASE = process.env.BASE_PATH ?? '/bramble-and-pip/';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}${BASE}`,
    trace: 'retain-on-failure',
    video: 'off',
    // Deterministic pixel output for visual checks.
    deviceScaleFactor: 1,
    launchOptions: {
      args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
    },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    {
      name: 'tablet-touch',
      testMatch: /stochastic-touch|boot-and-nav/,
      use: { ...devices['Galaxy Tab S4'], browserName: 'chromium' },
    },
  ],
  webServer: {
    // The production build is what ships; E2E must exercise exactly that.
    command: 'npm run preview',
    url: `http://localhost:${PORT}${BASE}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
