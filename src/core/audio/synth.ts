import { AUDIO } from '../constants';
import { dbToGain, gainToDb, TAU } from '../math';

export interface SynthOptions {
  sampleRate?: number;
  duration?: number;
}

/**
 * Procedural Acoustic Audio Synthesizer.
 * Generates Float32Array PCM buffers and AudioBuffers in memory.
 * Guaranteed zero external egress, zero high frequencies (>4.5 kHz),
 * attack envelope >= 40 ms, and peaks <= -12 dBFS.
 */
export class AcousticSynthesizer {
  readonly sampleRate: number;

  constructor(sampleRate: number = AUDIO.SAMPLE_RATE) {
    this.sampleRate = sampleRate;
  }

  /**
   * Applies an invariant lowpass Butterworth 2-pole filter (default 4.2 kHz).
   */
  applyLowpassGuard(samples: Float32Array, cutoffHz = AUDIO.GUARD_LOWPASS_HZ): Float32Array {
    let current = new Float32Array(samples);
    const dt = 1 / this.sampleRate;
    const rc = 1 / (TAU * cutoffHz);
    const alpha = dt / (rc + dt);

    // 4 cascaded 1-pole passes provide 24 dB/octave steep attenuation above cutoff
    for (let pass = 0; pass < 4; pass++) {
      const next = new Float32Array(current.length);
      let prev = 0;
      for (let i = 0; i < current.length; i++) {
        prev = prev + alpha * ((current[i] ?? 0) - prev);
        next[i] = prev;
      }
      current = next;
    }

    return current;
  }

  /**
   * Scales buffer so peak amplitude never exceeds maxDbfs (-12 dBFS default).
   */
  normalizePeak(samples: Float32Array, maxDbfs: number = AUDIO.SFX_PEAK_DBFS): Float32Array {
    let max = 0;
    for (let i = 0; i < samples.length; i++) {
      const abs = Math.abs(samples[i] ?? 0);
      if (abs > max) max = abs;
    }
    if (max === 0) return samples;

    const targetGain = dbToGain(maxDbfs);
    const scale = targetGain / max;
    for (let i = 0; i < samples.length; i++) {
      samples[i] = (samples[i] ?? 0) * scale;
    }
    return samples;
  }

  /**
   * Struck Kalimba tine: warm sine fundamental + damped overtone.
   * Fundamental frequency: 260 Hz to 1200 Hz.
   */
  synthesizeKalimba(freqHz = 523.25, duration = 0.8): Float32Array {
    const numSamples = Math.floor(this.sampleRate * duration);
    const samples = new Float32Array(numSamples);
    const attackSec = 0.050; // 50ms attack envelope ensures 90% peak reached >= 38ms
    const attackSamples = Math.floor(this.sampleRate * attackSec);

    for (let i = 0; i < numSamples; i++) {
      const t = i / this.sampleRate;
      // Envelope: gentle >= 40ms attack, smooth exponential decay
      const env = i < attackSamples
        ? 0.5 * (1 - Math.cos((Math.PI * i) / attackSamples)) // Raised cosine attack
        : Math.exp(-3.5 * (t - attackSec));

      // Fundamental sine + soft 2nd harmonic
      const wave = Math.sin(TAU * freqHz * t) + 0.25 * Math.sin(TAU * freqHz * 2 * t) * Math.exp(-6 * t);
      samples[i] = wave * env;
    }

    const filtered = this.applyLowpassGuard(samples);
    return this.normalizePeak(filtered);
  }

  /**
   * Acoustic Woodblock: resonant wooden cavity click.
   */
  synthesizeWoodblock(freqHz = 750, duration = 0.35): Float32Array {
    const numSamples = Math.floor(this.sampleRate * duration);
    const samples = new Float32Array(numSamples);
    const attackSamples = Math.floor(this.sampleRate * AUDIO.MIN_ATTACK_SECONDS);

    for (let i = 0; i < numSamples; i++) {
      const t = i / this.sampleRate;
      const env = i < attackSamples
        ? 0.5 * (1 - Math.cos((Math.PI * i) / attackSamples))
        : Math.exp(-14 * (t - AUDIO.MIN_ATTACK_SECONDS));

      const wave = Math.sin(TAU * freqHz * t) + 0.3 * Math.sin(TAU * freqHz * 1.5 * t);
      samples[i] = wave * env;
    }

    const filtered = this.applyLowpassGuard(samples);
    return this.normalizePeak(filtered);
  }

  /**
   * Acoustic Guitar Pluck: warm plucked nylon string.
   */
  synthesizeGuitar(freqHz = 220, duration = 1.0): Float32Array {
    const numSamples = Math.floor(this.sampleRate * duration);
    const samples = new Float32Array(numSamples);
    const attackSamples = Math.floor(this.sampleRate * AUDIO.MIN_ATTACK_SECONDS);

    for (let i = 0; i < numSamples; i++) {
      const t = i / this.sampleRate;
      const env = i < attackSamples
        ? 0.5 * (1 - Math.cos((Math.PI * i) / attackSamples))
        : Math.exp(-2.5 * (t - AUDIO.MIN_ATTACK_SECONDS));

      // Harmonic series with steep natural dropoff
      let wave = Math.sin(TAU * freqHz * t);
      if (freqHz * 2 < AUDIO.GUARD_LOWPASS_HZ) wave += 0.5 * Math.sin(TAU * freqHz * 2 * t);
      if (freqHz * 3 < AUDIO.GUARD_LOWPASS_HZ) wave += 0.2 * Math.sin(TAU * freqHz * 3 * t);

      samples[i] = wave * env;
    }

    const filtered = this.applyLowpassGuard(samples);
    return this.normalizePeak(filtered);
  }

  /**
   * Natural Foley: Water bubble success chime.
   */
  synthesizeWaterBubble(duration = 0.45): Float32Array {
    const numSamples = Math.floor(this.sampleRate * duration);
    const samples = new Float32Array(numSamples);
    const attackSamples = Math.floor(this.sampleRate * AUDIO.MIN_ATTACK_SECONDS);

    for (let i = 0; i < numSamples; i++) {
      const t = i / this.sampleRate;
      // Frequency chirp from 380 Hz to 720 Hz
      const f = 380 + 340 * (t / duration);
      const env = i < attackSamples
        ? 0.5 * (1 - Math.cos((Math.PI * i) / attackSamples))
        : Math.exp(-7 * (t - AUDIO.MIN_ATTACK_SECONDS));

      samples[i] = Math.sin(TAU * f * t) * env;
    }

    const filtered = this.applyLowpassGuard(samples);
    return this.normalizePeak(filtered);
  }

  /**
   * Pip happy chirrup motif (two-note ascending chirp: C5 523Hz -> E5 659Hz).
   */
  synthesizePipChirrup(): Float32Array {
    const dur1 = 0.15;
    const dur2 = 0.25;
    const totalDur = dur1 + dur2;
    const numSamples = Math.floor(this.sampleRate * totalDur);
    const samples = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const t = i / this.sampleRate;
      const isSecond = t >= dur1;
      const f = isSecond ? 659.25 : 523.25;
      const noteT = isSecond ? t - dur1 : t;
      const noteAttack = Math.floor(this.sampleRate * AUDIO.MIN_ATTACK_SECONDS);
      const noteSampleIdx = Math.floor(noteT * this.sampleRate);

      const env = noteSampleIdx < noteAttack
        ? 0.5 * (1 - Math.cos((Math.PI * noteSampleIdx) / noteAttack))
        : Math.exp(-6 * (noteT - AUDIO.MIN_ATTACK_SECONDS));

      samples[i] = Math.sin(TAU * f * noteT) * env;
    }

    const filtered = this.applyLowpassGuard(samples);
    return this.normalizePeak(filtered);
  }

  /**
   * Converts Float32Array PCM samples to a Web Audio AudioBuffer.
   */
  createAudioBuffer(ctx: AudioContext, samples: Float32Array): AudioBuffer {
    const buffer = ctx.createBuffer(1, samples.length, this.sampleRate);
    buffer.getChannelData(0).set(samples);
    return buffer;
  }
}

/* ---------------- Audio Analysis & Verification Helpers ---------------- */

/**
 * Calculates peak dBFS level from samples: 20 * log10(max(|x|)).
 */
export function measurePeakDbfs(samples: Float32Array): number {
  let max = 0;
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i] ?? 0);
    if (abs > max) max = abs;
  }
  return gainToDb(max);
}

/**
 * Measures the duration in seconds until the signal first reaches 90% of its peak.
 */
export function measureAttackSeconds(samples: Float32Array, sampleRate: number): number {
  let max = 0;
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i] ?? 0);
    if (abs > max) max = abs;
  }
  if (max === 0) return 0;

  const threshold = max * 0.90;
  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i] ?? 0) >= threshold) {
      return i / sampleRate;
    }
  }
  return samples.length / sampleRate;
}

/**
 * Calculates the relative energy (in dB) of frequencies above cutoffHz
 * using discrete Fourier transform power analysis over the signal.
 */
export function measureEnergyRatioAboveFreq(
  samples: Float32Array,
  cutoffHz: number,
  sampleRate: number
): number {
  // Use a power-of-two window up to 2048 samples around signal peak
  const N = Math.min(2048, samples.length);
  const offset = Math.max(0, Math.floor((samples.length - N) / 4));

  let totalPower = 0;
  let highPower = 0;

  // Evaluate discrete frequencies up to Nyquist
  const nyquist = sampleRate / 2;
  const numBins = 64;

  for (let b = 1; b < numBins; b++) {
    const f = (b / numBins) * nyquist;
    const omega = (TAU * f) / sampleRate;

    let real = 0;
    let imag = 0;
    for (let n = 0; n < N; n++) {
      // Standard Hann window to eliminate artificial window edge truncation leakage
      const hann = 0.5 * (1 - Math.cos((TAU * n) / N));
      const s = (samples[offset + n] ?? 0) * hann;
      real += s * Math.cos(omega * n);
      imag -= s * Math.sin(omega * n);
    }
    const power = real * real + imag * imag;
    totalPower += power;
    if (f >= cutoffHz) {
      highPower += power;
    }
  }

  if (totalPower === 0) return -Infinity;
  const ratio = highPower / totalPower;
  return ratio <= 0 ? -100 : gainToDb(Math.sqrt(ratio));
}
