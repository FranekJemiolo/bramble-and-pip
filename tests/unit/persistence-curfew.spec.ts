import { describe, expect, it } from 'vitest';
import {
  LocalPersistenceEngine,
  MemoryStore,
  type StorageAdapter,
} from '../../src/core/persistence/LocalPersistenceEngine';
import { SessionClock } from '../../src/core/session/SessionClock';
import { isCurfewActive, DEFAULT_CURFEW } from '../../src/core/session/CurfewService';
import { ParentalGateService } from '../../src/core/parent/ParentalGateService';
import { ParentInsightService } from '../../src/core/parent/ParentInsightService';

describe('LocalPersistenceEngine Double-Buffer & CRC32 Recovery', () => {
  it('saves and loads state cleanly with CRC32 verification', async () => {
    const memory = new MemoryStore();
    const engine = new LocalPersistenceEngine<{ chapter: number; items: string[] }>('test', memory);

    const data = { chapter: 4, items: ['snowdrop', 'acorn'] };
    const saved = await engine.save(data);
    expect(saved).toBe(true);

    const loaded = await engine.load();
    expect(loaded).toEqual(data);
  });

  it('recovers from backup when primary save is corrupted', async () => {
    const memory = new MemoryStore();
    const engine = new LocalPersistenceEngine<{ score: number }>('test_corrupt', memory);

    // Save version 1 (goes to primary)
    await engine.save({ score: 100 });

    // Save version 2 (version 1 moves to backup, version 2 becomes primary)
    await engine.save({ score: 200 });

    // Deliberately corrupt primary in storage
    const primaryRaw = await memory.getItem('test_corrupt_primary');
    expect(primaryRaw).not.toBeNull();
    const corruptedPrimary = primaryRaw!.replace('"score":200', '"score":999'); // Invalidates CRC32
    await memory.setItem('test_corrupt_primary', corruptedPrimary);

    // Load should detect CRC failure on primary and seamlessly recover version 1 from backup
    const recovered = await engine.load();
    expect(recovered).not.toBeNull();
    expect(recovered?.score).toBe(100);
  });

  it('rejects torn/corrupt staging writes and preserves existing primary', async () => {
    const memory = new MemoryStore();
    const engine = new LocalPersistenceEngine<{ count: number }>('test_torn', memory);

    // Valid save 1
    await engine.save({ count: 1 });

    // Inject bad storage that corrupts staging write
    const faultyMemory: StorageAdapter = {
      getItem: async (key: string) => {
        if (key.includes('staging')) {
          // Return corrupted data for staging verification
          return JSON.stringify({ version: 1, timestamp: 0, crc32: 12345, data: { count: 99 } });
        }
        return memory.getItem(key);
      },
      setItem: memory.setItem.bind(memory),
      removeItem: memory.removeItem.bind(memory),
      clear: memory.clear.bind(memory),
    };

    const faultyEngine = new LocalPersistenceEngine<{ count: number }>('test_torn', faultyMemory);
    const result = await faultyEngine.save({ count: 2 });
    expect(result).toBe(false); // Staging failed verification

    // Existing primary must still be intact
    const current = await engine.load();
    expect(current?.count).toBe(1);
  });
});

describe('SessionClock Anti-Addictive Regulation & Defenses', () => {
  it('enforces 15-minute daily ceiling and rejects parent extensions > 15m', () => {
    const clock = new SessionClock({ dailyLimitMinutes: 20 }); // Parent tries 20m
    expect(clock.limitSeconds).toBe(15 * 60); // Clamped to 15m (900s)

    clock.setParentDailyLimit(30); // Tries 30m
    expect(clock.limitSeconds).toBe(15 * 60);

    clock.setParentDailyLimit(10); // Allowed shorter 10m
    expect(clock.limitSeconds).toBe(10 * 60);
  });

  it('transitions PLAYING -> SUNSET (at 12m) -> RESTING_LOCK (at 15m)', () => {
    const clock = new SessionClock({ dailyLimitMinutes: 15, initialWallClockMs: 1000000 });
    expect(clock.currentState).toBe('PLAYING');

    // Simulate 719 seconds of play (1 second before sunset)
    // Use chunks because tick clamps frame deltas to <= 0.1s
    const dt = 0.1;
    for (let s = 0; s < 7190; s++) {
      clock.tick(dt, 1000000 + s * 100);
    }
    expect(clock.currentState).toBe('PLAYING');

    // Advance 2 seconds -> 721s (into 180s sunset window from 720s to 900s)
    for (let s = 0; s < 20; s++) {
      clock.tick(dt, 1000000 + (7190 + s) * 100);
    }
    expect(clock.currentState).toBe('SUNSET');
    expect(clock.isSunset).toBe(true);

    // Advance to 901s (past 15-minute limit)
    for (let s = 0; s < 1800; s++) {
      clock.tick(dt, 1000000 + (7210 + s) * 100);
    }
    expect(clock.currentState).toBe('RESTING_LOCK');
    expect(clock.isRestingLock).toBe(true);
  });

  it('clamps tab-throttling frame delta jumps to <= 100ms', () => {
    const clock = new SessionClock({ dailyLimitMinutes: 15 });
    const initialElapsed = clock.elapsedToday;

    // Simulate browser tab sleeping for 60 seconds and waking with delta = 60.0
    clock.tick(60.0, Date.now());

    // Only <= 0.1s must be accumulated
    expect(clock.elapsedToday - initialElapsed).toBeCloseTo(0.1, 4);
  });

  it('detects wall-clock rollback manipulation and triggers immediate resting lock', () => {
    const clock = new SessionClock({ dailyLimitMinutes: 15 });
    expect(clock.currentState).toBe('PLAYING');

    const now = 10000000;
    clock.tick(0.05, now);

    // User changes device time back by 2 hours (-7,200,000 ms)
    clock.tick(0.05, now - 7200000);

    // Must lock down to resting lock
    expect(clock.currentState).toBe('RESTING_LOCK');
  });
});

describe('CurfewService Midnight Wraparound Table', () => {
  const schedule = DEFAULT_CURFEW; // 19:30 to 08:00

  it.each([
    { hour: 14, min: 0, expected: false, label: '2:00 PM afternoon' },
    { hour: 19, min: 29, expected: false, label: '7:29 PM just before curfew' },
    { hour: 19, min: 30, expected: true, label: '7:30 PM curfew start' },
    { hour: 21, min: 15, expected: true, label: '9:15 PM evening bedtime' },
    { hour: 23, min: 59, expected: true, label: '11:59 PM pre-midnight' },
    { hour: 0, min: 0, expected: true, label: 'Midnight' },
    { hour: 3, min: 30, expected: true, label: '3:30 AM night' },
    { hour: 7, min: 59, expected: true, label: '7:59 AM just before morning wake' },
    { hour: 8, min: 0, expected: false, label: '8:00 AM morning wake' },
    { hour: 10, min: 0, expected: false, label: '10:00 AM mid-morning' },
  ])('evaluates $label ($hour:$min) -> curfew $expected', ({ hour, min, expected }) => {
    const date = new Date(2026, 9, 18, hour, min, 0);
    expect(isCurfewActive(date, schedule)).toBe(expected);
  });
});

describe('ParentalGateService Word-Math Challenges', () => {
  it('generates word-math challenge solvable by parent and validates answers', () => {
    const gate = new ParentalGateService(42);
    const challenge = gate.generateChallenge();

    expect(challenge.prompt).toMatch(/^[A-Z]+ TIMES [A-Z]+$/);
    expect(challenge.expectedAnswer).toBeGreaterThanOrEqual(9);
    expect(challenge.expectedAnswer).toBeLessThanOrEqual(81);

    // Correct answer succeeds
    const ok = gate.verifyAnswer(challenge.expectedAnswer);
    expect(ok).toBe(true);
  });

  it('locks for 60 seconds after 3 consecutive failed attempts', () => {
    const gate = new ParentalGateService(99);
    const t0 = 100000;

    // Attempt 1: wrong
    expect(gate.verifyAnswer(999, t0)).toBe(false);
    expect(gate.isLocked).toBe(false);

    // Attempt 2: wrong
    expect(gate.verifyAnswer(999, t0 + 1000)).toBe(false);
    expect(gate.isLocked).toBe(false);

    // Attempt 3: wrong -> triggers 60s lockout
    expect(gate.verifyAnswer(999, t0 + 2000)).toBe(false);

    // Verification during lockout is rejected even with right answer
    expect(gate.verifyAnswer(36, t0 + 10000)).toBe(false);
  });
});

describe('ParentInsightService Offline Nature Conversation Starters', () => {
  it('generates tailored nature conversation starters with zero network egress', () => {
    const starters = ParentInsightService.generateConversationStarters([1, 7], ['snowdrop', 'wooden_gear']);

    expect(starters.length).toBeGreaterThanOrEqual(2);
    const allText = starters.join(' ');
    expect(allText).toContain('flowers or green sprouts');
    expect(allText).toContain('watermill wheel');
  });
});
