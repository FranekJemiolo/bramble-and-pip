import { CalmingAudioPipeline } from './CalmingAudioPipeline';
import { ResilientAudioLifecycle } from './ResilientAudioLifecycle';
import { AcousticSynthesizer } from './synth';
import { eventBus } from '../EventBus';
import { AUDIO, SESSION } from '../constants';

export class AcousticAudioManager {
  private static instance: AcousticAudioManager | null = null;

  private ctx: AudioContext | null = null;
  private pipeline: CalmingAudioPipeline | null = null;
  private synth: AcousticSynthesizer | null = null;
  private lifecycle: ResilientAudioLifecycle | null = null;

  // Cached AudioBuffers for instant zero-latency playback
  private buffers: Map<string, AudioBuffer> = new Map();
  private ambienceIntervalId: number | null = null;
  private isAmbienceRunning = false;

  private constructor() {
    this.setupListeners();
  }

  static getInstance(): AcousticAudioManager {
    if (!AcousticAudioManager.instance) {
      AcousticAudioManager.instance = new AcousticAudioManager();
    }
    return AcousticAudioManager.instance;
  }

  private ensureAudioContext(): boolean {
    if (typeof window === 'undefined') return false;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return false;

      try {
        this.ctx = new AudioCtx({ sampleRate: AUDIO.SAMPLE_RATE });
        this.pipeline = new CalmingAudioPipeline(this.ctx);
        this.synth = new AcousticSynthesizer(this.ctx.sampleRate);
        this.lifecycle = ResilientAudioLifecycle.getOrCreate(this.ctx);

        // Pre-bake procedural acoustic buffers in memory
        this.bakeBuffers();
      } catch {
        return false;
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return true;
  }

  private bakeBuffers(): void {
    if (!this.ctx || !this.synth) return;

    try {
      // 1. Kalimba pentatonic tones (gentle C major pentatonic: C5, D5, E5, G5, A5)
      const pentatonicHz = [523.25, 587.33, 659.25, 783.99, 880.0];
      pentatonicHz.forEach((f, idx) => {
        const samples = this.synth!.synthesizeKalimba(f, 0.7);
        this.buffers.set(`kalimba_${idx}`, this.synth!.createAudioBuffer(this.ctx!, samples));
      });

      // 2. Tactile woodblock click
      const woodSamples = this.synth.synthesizeWoodblock(720, 0.25);
      this.buffers.set('woodblock', this.synth.createAudioBuffer(this.ctx, woodSamples));

      // 3. Gentle water bubble (item discovery / success chime)
      const bubbleSamples = this.synth.synthesizeWaterBubble(0.4);
      this.buffers.set('water_bubble', this.synth.createAudioBuffer(this.ctx, bubbleSamples));

      // 4. Pip companion chirrup
      const pipSamples = this.synth.synthesizePipChirrup();
      this.buffers.set('pip_chirrup', this.synth.createAudioBuffer(this.ctx, pipSamples));

      // 5. Acoustic guitar chords
      const guitarSamples = this.synth.synthesizeGuitar(261.63, 1.2);
      this.buffers.set('guitar_c', this.synth.createAudioBuffer(this.ctx, guitarSamples));
    } catch {
      // Non-fatal if context buffer creation fails in tests
    }
  }

  private playBufferOnBus(bufferKey: string, bus: 'sfx' | 'music' | 'amb' | 'voice'): void {
    if (!this.ensureAudioContext() || !this.ctx || !this.pipeline) return;

    const buffer = this.buffers.get(bufferKey);
    if (!buffer) return;

    try {
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;

      const destBus =
        bus === 'sfx'
          ? this.pipeline.sfxBus
          : bus === 'music'
          ? this.pipeline.musicBus
          : bus === 'amb'
          ? this.pipeline.ambBus
          : this.pipeline.voiceBus;

      src.connect(destBus);
      src.start();
    } catch {
      // Ignore transient audio play errors
    }
  }

  playKalimba(noteIndex = 0): void {
    const idx = Math.abs(noteIndex) % 5;
    this.playBufferOnBus(`kalimba_${idx}`, 'sfx');
  }

  playWoodblock(): void {
    this.playBufferOnBus('woodblock', 'sfx');
  }

  playFootstep(): void {
    this.playBufferOnBus('woodblock', 'sfx');
  }

  playWaterBubble(): void {
    this.playBufferOnBus('water_bubble', 'sfx');
  }

  playPipChirrup(): void {
    this.playBufferOnBus('pip_chirrup', 'voice');
  }

  playSuccessChord(): void {
    this.playBufferOnBus('guitar_c', 'music');
    if (typeof window !== 'undefined') {
      window.setTimeout(() => this.playKalimba(2), 150);
      window.setTimeout(() => this.playKalimba(4), 300);
    }
  }

  startWoodlandAmbience(): void {
    if (this.isAmbienceRunning || typeof window === 'undefined') return;
    this.isAmbienceRunning = true;

    // Periodic calm acoustic melody (gentle kalimba notes every 4-6 seconds)
    let noteStep = 0;
    const melody = [0, 2, 4, 3, 2, 0, 1, 2];

    this.ambienceIntervalId = window.setInterval(() => {
      if (!this.isAmbienceRunning) return;
      if (this.ctx && this.ctx.state === 'running') {
        const note = melody[noteStep % melody.length] ?? 0;
        this.playBufferOnBus(`kalimba_${note}`, 'music');
        noteStep += 1;
      }
    }, 4500);
  }

  stopWoodlandAmbience(): void {
    this.isAmbienceRunning = false;
    if (this.ambienceIntervalId !== null && typeof window !== 'undefined') {
      window.clearInterval(this.ambienceIntervalId);
      this.ambienceIntervalId = null;
    }
  }

  get audioLifecycle(): ResilientAudioLifecycle | null {
    return this.lifecycle;
  }

  triggerSunset(durationSeconds: number = SESSION.SUNSET_DURATION_SECONDS): void {
    if (!this.ensureAudioContext() || !this.pipeline) return;
    this.pipeline.triggerSunsetSweep(durationSeconds);
  }

  triggerBedtime(): void {
    this.stopWoodlandAmbience();
    this.playBufferOnBus('guitar_c', 'music');
  }

  private setupListeners(): void {
    // Unlock on window interaction
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.ensureAudioContext();
        this.startWoodlandAmbience();
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      };
      window.addEventListener('pointerdown', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
    }

    // Event bus connections
    eventBus.on('item:collected', () => this.playWaterBubble());
    eventBus.on('puzzle:start', () => this.playWoodblock());
    eventBus.on('puzzle:solved', () => this.playSuccessChord());
    eventBus.on('sunset:start', (data) => this.triggerSunset(data.durationSeconds));
    eventBus.on('bedtime:lock', () => this.triggerBedtime());
    eventBus.on('audio:sfx', (data) => {
      if (data.sound === 'click' || data.sound === 'woodblock') {
        this.playWoodblock();
      } else if (data.sound === 'success_chime' || data.sound === 'water_bubble') {
        this.playWaterBubble();
      } else if (data.sound === 'pip_chirp') {
        this.playPipChirrup();
      } else if (data.sound === 'guitar') {
        this.playSuccessChord();
      }
    });
  }
}

export const audioManager = AcousticAudioManager.getInstance();
