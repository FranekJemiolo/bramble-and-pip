import { AUDIO, SESSION } from '../constants';
import { clamp } from '../math';

/**
 * Calming Web Audio Pipeline.
 *
 *  [ Source: Music ] ──► [ Music Gain ] ──┐
 *                                         v
 *  [ Source: SFX ]   ──► [ SFX Gain ]   ──► [ Sunset Biquad Filter ] ──► [ Master Gain ] ──► [ Limiter ] ──► [ Destination ]
 *                                         ^
 *  [ Source: Amb ]   ──► [ Amb Gain ]   ──┤
 *                                         │
 *  [ Source: Voice ] ──► [ Voice Gain ] ──┴─────────────────────────────►
 *                       (Voice bypasses sunset lowpass filter for speech clarity)
 */
export class CalmingAudioPipeline {
  readonly ctx: AudioContext;
  readonly masterGain: GainNode;
  readonly limiter: DynamicsCompressorNode;
  readonly sunsetFilter: BiquadFilterNode;
  readonly musicBus: GainNode;
  readonly sfxBus: GainNode;
  readonly ambBus: GainNode;
  readonly voiceBus: GainNode;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;

    // Limiter to prevent clipping
    this.limiter = this.ctx.createDynamicsCompressor();
    this.limiter.threshold.setValueAtTime(-2, this.ctx.currentTime);
    this.limiter.knee.setValueAtTime(0, this.ctx.currentTime);
    this.limiter.ratio.setValueAtTime(20, this.ctx.currentTime);
    this.limiter.attack.setValueAtTime(0.002, this.ctx.currentTime);
    this.limiter.release.setValueAtTime(0.1, this.ctx.currentTime);
    this.limiter.connect(this.ctx.destination);

    // Master volume gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
    this.masterGain.connect(this.limiter);

    // Sunset Biquad lowpass filter (12 dB/octave)
    this.sunsetFilter = this.ctx.createBiquadFilter();
    this.sunsetFilter.type = 'lowpass';
    this.sunsetFilter.frequency.setValueAtTime(AUDIO.SUNSET_START_HZ, this.ctx.currentTime);
    this.sunsetFilter.Q.setValueAtTime(0.707, this.ctx.currentTime); // Butterworth alignment
    this.sunsetFilter.connect(this.masterGain);

    // Music Sub-bus
    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.setValueAtTime(0.75, this.ctx.currentTime);
    this.musicBus.connect(this.sunsetFilter);

    // SFX Sub-bus
    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.setValueAtTime(0.70, this.ctx.currentTime);
    this.sfxBus.connect(this.sunsetFilter);

    // Ambience Sub-bus
    this.ambBus = this.ctx.createGain();
    this.ambBus.gain.setValueAtTime(0.60, this.ctx.currentTime);
    this.ambBus.connect(this.sunsetFilter);

    // Voice Sub-bus: intentionally bypasses the sunset low-pass filter
    // so narration sight words and voiceover phonetics remain completely intelligible.
    this.voiceBus = this.ctx.createGain();
    this.voiceBus.gain.setValueAtTime(0.90, this.ctx.currentTime);
    this.voiceBus.connect(this.masterGain);
  }

  /**
   * Sweeps low-pass filter frequency downward exponentially over durationSeconds (default 180s)
   * from 18,000 Hz down to 2,200 Hz to softly reduce sensory arousal before bedtime.
   */
  triggerSunsetSweep(durationSeconds: number = SESSION.SUNSET_DURATION_SECONDS): void {
    const now = this.ctx.currentTime;
    const startFrequency = AUDIO.SUNSET_START_HZ;
    const targetFrequency = AUDIO.SUNSET_END_HZ;

    this.sunsetFilter.frequency.cancelScheduledValues(now);
    this.sunsetFilter.frequency.setValueAtTime(startFrequency, now);
    this.sunsetFilter.frequency.exponentialRampToValueAtTime(targetFrequency, now + durationSeconds);

    // Also gently taper music volume
    this.musicBus.gain.cancelScheduledValues(now);
    this.musicBus.gain.setValueAtTime(this.musicBus.gain.value, now);
    this.musicBus.gain.linearRampToValueAtTime(0.45, now + durationSeconds);
  }

  /**
   * Instantly or smoothly sets filter cutoff based on sunset progress parameter w in [0, 1].
   */
  setSunsetProgress(w: number): void {
    const clampedW = clamp(w, 0, 1);
    // Exponential interpolation from 18000 to 2200
    const freq = AUDIO.SUNSET_START_HZ * Math.pow(AUDIO.SUNSET_END_HZ / AUDIO.SUNSET_START_HZ, clampedW);
    this.sunsetFilter.frequency.setValueAtTime(freq, this.ctx.currentTime);
  }

  /**
   * Restores full daylight acoustic clarity.
   */
  resetDaylight(): void {
    const now = this.ctx.currentTime;
    this.sunsetFilter.frequency.cancelScheduledValues(now);
    this.sunsetFilter.frequency.setValueAtTime(AUDIO.SUNSET_START_HZ, now);
    this.musicBus.gain.setValueAtTime(0.75, now);
  }

  get currentCutoffFrequency(): number {
    return this.sunsetFilter.frequency.value;
  }
}
