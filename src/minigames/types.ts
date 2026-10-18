import type * as Phaser from 'phaser';

export interface IPuzzle {
  readonly id: string;
  readonly title: string;
  readonly isSolved: boolean;
  onSolve(callback: () => void): void;
  reset(): void;
  update(dtSec: number): void;
}

/**
 * Standardized minigame lifecycle interface as specified in the architectural design charter.
 */
export interface IPuzzleScene {
  puzzleId: string;
  associatedSeason: 'spring' | 'summer' | 'autumn' | 'winter';
  initPuzzle(config: Record<string, unknown>): void;
  evaluateMove(inputEntity: string, targetSlot: string): 'valid' | 'invalid' | 'neutral';
  onInvalidMove(rejectedEntity: Phaser.GameObjects.Sprite): void; // Gentle return, no buzzers
  checkCompletion(): boolean;
  onPuzzleComplete(): Promise<void>; // Triggers acoustic chime, adds sketch, returns to map
}
