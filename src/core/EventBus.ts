export type EventCallback<T = unknown> = (data: T) => void;

export interface GameEvents {
  'player:move': { x: number; y: number; facing: string };
  'chapter:start': { chapterId: number; season: string; title: string };
  'chapter:complete': { chapterId: number };
  'item:collected': { id: string; name: string; count: number };
  'puzzle:start': { puzzleId: string };
  'puzzle:solved': { puzzleId: string };
  'puzzle:closed': { puzzleId: string };
  'dialogue:open': { speaker: string; pictogramKey: string; text: string; words: string[] };
  'dialogue:close': void;
  'sunset:start': { durationSeconds: number };
  'sunset:step': { stepIndex: number; progress: number };
  'bedtime:lock': void;
  'pdf:export': { documentType: string };
  'audio:sfx': { sound: string };
}

/**
 * Global typed EventBus for game state transitions, UI synchronization,
 * and deterministic testing inspection.
 */
export class GlobalEventBus {
  private readonly listeners = new Map<keyof GameEvents, Set<EventCallback>>();

  on<K extends keyof GameEvents>(event: K, callback: EventCallback<GameEvents[K]>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(callback as EventCallback);
    return () => this.off(event, callback);
  }

  off<K extends keyof GameEvents>(event: K, callback: EventCallback<GameEvents[K]>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback as EventCallback);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit<K extends keyof GameEvents>(event: K, data?: GameEvents[K]): void {
    const set = this.listeners.get(event);
    if (set) {
      for (const cb of Array.from(set)) {
        cb(data);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

// Global singleton instance
export const eventBus = new GlobalEventBus();

// Attach to window for deterministic Playwright and testing inspection
if (typeof window !== 'undefined') {
  (window as unknown as { __EVENT_BUS__: GlobalEventBus }).__EVENT_BUS__ = eventBus;
}

export enum SatchelEvents {
  DPAD_MOVE = 'satchel:dpad_move',
  DPAD_STOP = 'satchel:dpad_stop',
  TOOL_EQUIPPED = 'satchel:tool_equipped',
  PIP_TAP = 'satchel:pip_tap',
}

export enum WorldEvents {
  PIP_MOOD_CHANGE = 'world:pip_mood_change',
  DISCOVERY_TRIGGERED = 'world:discovery_triggered',
  SUNSET_WARNING = 'world:sunset_warning',
  BEDTIME_REACHED = 'world:bedtime_reached',
}

