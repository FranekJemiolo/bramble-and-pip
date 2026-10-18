export class DevicePowerLifecycleManager {
  private wakeLockSentinel: unknown = null;
  private isRequested = false;

  get isLocked(): boolean {
    return this.wakeLockSentinel !== null;
  }

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.isRequested) {
          this.requestLock().catch(() => {});
        }
      });
    }
  }

  /**
   * Requests a Screen Wake Lock to keep the nature scene active during quiet observation.
   */
  async requestLock(): Promise<boolean> {
    this.isRequested = true;
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return false; // Wake Lock API not supported
    }

    try {
      const wakeLock = (navigator as unknown as { wakeLock: { request: (type: string) => Promise<unknown> } }).wakeLock;
      this.wakeLockSentinel = await wakeLock.request('screen');
      return true;
    } catch {
      this.wakeLockSentinel = null;
      return false;
    }
  }

  /**
   * Releases Screen Wake Lock (e.g. at bedtime / curfew) to conserve device battery
   * and allow normal device sleep.
   */
  async releaseLock(): Promise<void> {
    this.isRequested = false;
    if (this.wakeLockSentinel) {
      try {
        const sentinel = this.wakeLockSentinel as { release: () => Promise<void> };
        await sentinel.release();
      } catch {
        // Safe ignore
      }
      this.wakeLockSentinel = null;
    }
  }
}
