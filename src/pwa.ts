import { Workbox } from 'workbox-window';

/**
 * Registers the precaching service worker (production only). The SW makes the whole
 * game available offline after first load. There is no update prompt UI for children:
 * a waiting worker simply activates the next time the app is launched.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const wb = new Workbox(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL });
  wb.addEventListener('waiting', () => {
    // Activate on next launch; never interrupt a child mid-play.
    wb.addEventListener('controlling', () => undefined);
  });
  void wb.register();
}
