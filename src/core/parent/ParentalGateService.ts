import { mulberry32, type Rng } from '../math';

const WORD_NUMBERS = [
  'ZERO', 'ONE', 'TWO', 'THREE', 'FOUR',
  'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
] as const;

export interface Challenge {
  prompt: string;
  expectedAnswer: number;
}

export class ParentalGateService {
  private rng: Rng;
  private currentChallenge: Challenge | null = null;
  private consecutiveFailures = 0;
  private lockedUntilMs = 0;

  constructor(seed = 1337) {
    this.rng = mulberry32(seed);
  }

  get isLocked(): boolean {
    return Date.now() < this.lockedUntilMs;
  }

  get lockRemainingSeconds(): number {
    return Math.max(0, Math.ceil((this.lockedUntilMs - Date.now()) / 1000));
  }

  /**
   * Generates a word-math multiplication problem, e.g. "SEVEN TIMES SIX".
   */
  generateChallenge(): Challenge {
    // Pick two single digits between 3 and 9
    const a = 3 + this.rng.int(7);
    const b = 3 + this.rng.int(7);

    const wordA = WORD_NUMBERS[a]!;
    const wordB = WORD_NUMBERS[b]!;

    this.currentChallenge = {
      prompt: `${wordA} TIMES ${wordB}`,
      expectedAnswer: a * b,
    };

    return this.currentChallenge;
  }

  /**
   * Verifies the parent's answer.
   */
  verifyAnswer(answer: number | string, currentTimeMs: number = Date.now()): boolean {
    if (currentTimeMs < this.lockedUntilMs) {
      return false; // Still locked
    }

    if (!this.currentChallenge) {
      this.generateChallenge();
    }

    const numericAnswer = typeof answer === 'string' ? parseInt(answer.trim(), 10) : answer;

    if (numericAnswer === this.currentChallenge!.expectedAnswer) {
      this.consecutiveFailures = 0;
      this.currentChallenge = null;
      return true;
    } else {
      this.consecutiveFailures += 1;
      if (this.consecutiveFailures >= 3) {
        // Lock gate for 60 seconds
        this.lockedUntilMs = currentTimeMs + 60000;
        this.consecutiveFailures = 0;
      }
      this.generateChallenge(); // Rotate challenge
      return false;
    }
  }

  reset(): void {
    this.currentChallenge = null;
    this.consecutiveFailures = 0;
    this.lockedUntilMs = 0;
  }
}
