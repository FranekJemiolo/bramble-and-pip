import { SESSION } from '../constants';
import { clamp } from '../math';

export type SessionState = 'PLAYING' | 'SUNSET' | 'RESTING_LOCK';

export interface SessionConfig {
  dailyLimitMinutes?: number;
  lastDateStr?: string;
  accumulatedSecondsToday?: number;
  initialWallClockMs?: number;
}

export class SessionClock {
  private dailyLimitSeconds: number;
  private elapsedSecondsToday: number;
  private lastDateStr: string;
  private lastWallClockMs: number;
  private state: SessionState = 'PLAYING';

  constructor(config: SessionConfig = {}) {
    // Parent may set 5..15 minutes, never > 15m
    const limitMins = clamp(
      config.dailyLimitMinutes ?? 15,
      SESSION.MIN_PARENT_LIMIT_MINUTES,
      SESSION.MAX_PARENT_LIMIT_MINUTES
    );
    this.dailyLimitSeconds = limitMins * 60;
    this.elapsedSecondsToday = config.accumulatedSecondsToday ?? 0;
    this.lastDateStr = config.lastDateStr ?? this.getTodayDateString();
    this.lastWallClockMs = config.initialWallClockMs ?? Date.now();

    this.checkDayRollover();
    this.updateState();
  }

  get currentState(): SessionState {
    return this.state;
  }

  get limitSeconds(): number {
    return this.dailyLimitSeconds;
  }

  get elapsedToday(): number {
    return this.elapsedSecondsToday;
  }

  get remainingSeconds(): number {
    return Math.max(0, this.dailyLimitSeconds - this.elapsedSecondsToday);
  }

  get isSunset(): boolean {
    return this.state === 'SUNSET';
  }

  get isRestingLock(): boolean {
    return this.state === 'RESTING_LOCK';
  }

  /**
   * Updates time monotonically.
   * Frame deltas are clamped to <= 100ms (0.1s) to defend against background tab throttling jumps.
   */
  tick(rawDeltaSeconds: number, currentWallClockMs: number = Date.now()): SessionState {
    // 1. Clock rollback defense: if wall clock jumped backwards > 60 seconds
    if (currentWallClockMs < this.lastWallClockMs - 60000) {
      this.state = 'RESTING_LOCK';
      return this.state;
    }
    this.lastWallClockMs = currentWallClockMs;

    // 2. Day rollover check
    this.checkDayRollover();

    if (this.state === 'RESTING_LOCK') {
      return this.state;
    }

    // 3. Tab throttle defense: clamp frame delta to <= 0.1s
    const clampedDelta = Math.min(rawDeltaSeconds, 0.1);
    this.elapsedSecondsToday += clampedDelta;

    this.updateState();
    return this.state;
  }

  private updateState(): void {
    if (this.elapsedSecondsToday >= this.dailyLimitSeconds) {
      this.state = 'RESTING_LOCK';
    } else if (this.elapsedSecondsToday >= this.dailyLimitSeconds - SESSION.SUNSET_DURATION_SECONDS) {
      this.state = 'SUNSET';
    } else {
      this.state = 'PLAYING';
    }
  }

  private checkDayRollover(): void {
    const today = this.getTodayDateString();
    if (today !== this.lastDateStr) {
      this.lastDateStr = today;
      this.elapsedSecondsToday = 0;
      this.state = 'PLAYING';
    }
  }

  private getTodayDateString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  }

  /**
   * Parent gate action: set custom daily limit (5-15 min).
   */
  setParentDailyLimit(minutes: number): void {
    const limitMins = clamp(
      minutes,
      SESSION.MIN_PARENT_LIMIT_MINUTES,
      SESSION.MAX_PARENT_LIMIT_MINUTES
    );
    this.dailyLimitSeconds = limitMins * 60;
    this.updateState();
  }
}
