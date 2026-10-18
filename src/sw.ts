/// Service worker (Workbox injectManifest). No remote caching strategy exists on purpose:
/// the app has no runtime network traffic; everything it needs is precached at install.
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

declare global {
  interface Window {
    /** Replaced at build time by workbox-build with the precache manifest. */
    __WB_MANIFEST: Array<string | { url: string; revision: string | null }>;
  }
}

interface SwScope {
  skipWaiting(): Promise<void>;
  clients: { claim(): Promise<void> };
  addEventListener(type: string, listener: (event: unknown) => void): void;
}
const sw = self as unknown as SwScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Single-page app shell: every navigation within scope resolves to the precached index.html.
registerRoute(new NavigationRoute(createHandlerBoundToURL(`${import.meta.env.BASE_URL}index.html`)));

sw.addEventListener('install', () => {
  void sw.skipWaiting();
});

sw.addEventListener('message', (event: unknown) => {
  const msg = event as { data?: { type?: string } };
  if (msg.data?.type === 'SKIP_WAITING') void sw.skipWaiting();
});
void sw.clients.claim();
