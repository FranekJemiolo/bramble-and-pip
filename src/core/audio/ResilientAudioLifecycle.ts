/**
 * Resilient Audio Lifecycle manager for mobile Safari and cross-platform web.
 * Uses a looping silent HTML5 <audio> element to promote the page to the Media Playback
 * category on iOS WebKit, bypassing the physical hardware ringer/mute switch.
 * Manages visibility changes and AudioContext suspension gracefully.
 */
export class ResilientAudioLifecycle {
  private static instance: ResilientAudioLifecycle | null = null;
  private ctx: AudioContext | null = null;
  private silentMediaUnlocker: HTMLAudioElement | null = null;
  private isUnlocked = false;

  private constructor(audioContext?: AudioContext) {
    if (audioContext) {
      this.ctx = audioContext;
    }
    this.initSilentAudio();
    this.registerVisibilityHandlers();
    this.setupGestureUnlock();
  }

  static getOrCreate(audioContext?: AudioContext): ResilientAudioLifecycle {
    if (!ResilientAudioLifecycle.instance) {
      ResilientAudioLifecycle.instance = new ResilientAudioLifecycle(audioContext);
    } else if (audioContext && !ResilientAudioLifecycle.instance.ctx) {
      ResilientAudioLifecycle.instance.ctx = audioContext;
    }
    return ResilientAudioLifecycle.instance;
  }

  setContext(audioContext: AudioContext): void {
    this.ctx = audioContext;
  }

  getContext(): AudioContext | null {
    return this.ctx;
  }

  get unlocked(): boolean {
    return this.isUnlocked;
  }

  private initSilentAudio(): void {
    if (typeof Audio === 'undefined') return;
    try {
      // 0.1s silent mono WAV data-URI
      this.silentMediaUnlocker = new Audio(
        'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'
      );
      this.silentMediaUnlocker.loop = true;
    } catch {
      // Non-fatal if Audio constructor is restricted in environment
    }
  }

  private registerVisibilityHandlers(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', async () => {
      if (!this.ctx) return;
      if (document.visibilityState === 'hidden') {
        // Suspend context when hidden to save battery and avoid browser auto-kill
        if (this.ctx.state === 'running') {
          await this.ctx.suspend().catch(() => {});
        }
      } else if (document.visibilityState === 'visible') {
        // Resume on return
        if (this.ctx.state === 'suspended' || (this.ctx.state as string) === 'interrupted') {
          await this.ctx.resume().catch(() => {});
        }
      }
    });
  }

  private setupGestureUnlock(): void {
    if (typeof window === 'undefined') return;

    const unlockHandler = async () => {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') {
          await this.ctx.resume().catch(() => {});
        }
        if (this.ctx.state === 'running') {
          this.isUnlocked = true;
        }
      }
      if (this.silentMediaUnlocker && this.silentMediaUnlocker.paused) {
        this.silentMediaUnlocker.play().catch(() => {});
      }
      if (this.isUnlocked) {
        window.removeEventListener('pointerdown', unlockHandler);
        window.removeEventListener('keydown', unlockHandler);
      }
    };

    window.addEventListener('pointerdown', unlockHandler, { passive: true });
    window.addEventListener('keydown', unlockHandler, { passive: true });
  }

  async resume(): Promise<void> {
    const ctx = this.ctx;
    if (ctx && (ctx.state as AudioContextState) === 'suspended') {
      await ctx.resume().catch(() => {});
      this.isUnlocked = (ctx.state as AudioContextState) === 'running';
    }
  }

  async suspend(): Promise<void> {
    if (this.ctx && this.ctx.state === 'running') {
      await this.ctx.suspend().catch(() => {});
    }
  }
}
