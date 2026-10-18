export interface IPuzzle {
  readonly id: string;
  readonly title: string;
  readonly isSolved: boolean;
  onSolve(callback: () => void): void;
  reset(): void;
  update(dtSec: number): void;
}
