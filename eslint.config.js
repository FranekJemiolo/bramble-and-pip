import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Zero-egress invariant: network-capable globals are banned in application code.
 * (CSP `connect-src 'none'` is the runtime backstop; this is the compile-time one.)
 */
const NETWORK_GLOBALS = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'RTCPeerConnection'].map((name) => ({
  name,
  message: 'Network APIs are forbidden: Bramble & Pip has zero network egress (see docs/VISION.md §3).',
}));

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'playwright-report/**', 'test-results/**', 'public/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      'no-restricted-globals': ['error', ...NETWORK_GLOBALS],
      'no-restricted-properties': [
        'error',
        { object: 'navigator', property: 'sendBeacon', message: 'Telemetry beacons are forbidden.' },
        { object: 'window', property: 'fetch', message: 'Network APIs are forbidden.' },
        { object: 'Math', property: 'random', message: 'Use the seeded RNG from core/math (determinism + testability).' },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Cosmetic randomness (not game logic) is allowed to opt out explicitly with a comment.
    files: ['tests/**/*.ts', 'playwright.config.ts', 'vite.config.ts', 'capacitor.config.ts'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }] },
  },
  {
    files: ['scripts/**/*.mjs', 'eslint.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
);
