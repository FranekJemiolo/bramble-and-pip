import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

/** Deployed under https://franekjemiolo.github.io/bramble-and-pip/ */
const BASE = process.env.BASE_PATH ?? '/bramble-and-pip/';

/**
 * Production keeps `connect-src 'none'` verbatim. The Vite dev server needs a
 * HMR websocket, so ONLY when serving (never in `build`/`preview`) we relax it.
 */
function devCspRelaxation(): Plugin {
  return {
    name: 'bramble-dev-csp',
    apply: 'serve',
    transformIndexHtml(html) {
      return html.replace("connect-src 'none'", "connect-src 'self' ws: wss:");
    },
  };
}

export default defineConfig({
  base: BASE,
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 2600,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        testbed: resolve(__dirname, 'testbed.html'),
      },

      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/phaser')) return 'vendor-phaser';
          if (id.includes('node_modules/pdfmake') || id.includes('node_modules/pdfkit')) return 'vendor-pdf';
          return undefined;
        },
      },
    },
  },
  server: { host: true, port: 5173 },
  plugins: [
    devCspRelaxation(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: false,
      manifestFilename: 'manifest.webmanifest',
      includeAssets: ['icons/*.png', 'favicon.svg'],
      injectManifest: {
        rollupFormat: 'iife',
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest,ico}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
      manifest: {
        name: 'Bramble & Pip',
        short_name: 'Bramble & Pip',
        description: 'A calm, offline nature-observation adventure for little rangers.',
        lang: 'en',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#1A1A24',
        theme_color: '#1A1A24',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  test: {
    include: ['tests/unit/**/*.spec.ts', 'tests/integration/**/*.spec.ts'],
    environment: 'node',
    globals: false,
    testTimeout: 20_000,
    coverage: {
      provider: 'v8',
      include: ['src/core/**', 'src/render/**'],
      reporter: ['text-summary', 'lcov'],
    },
  },
});
