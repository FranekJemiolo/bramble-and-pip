import { INPUT } from '../core/constants';
import { dist } from '../core/math';
import type { IPuzzle } from './types';

export interface SeedItem {
  id: string;
  type: 'acorn' | 'pinecone' | 'maple_seed';
  x: number;
  y: number;
  initialX: number;
  initialY: number;
  isPlaced: boolean;
  isDragging: boolean;
}

export interface BasketSlot {
  id: string;
  acceptedType: 'acorn' | 'pinecone' | 'maple_seed';
  x: number;
  y: number;
  radius: number;
  isFilled: boolean;
}

export class AutumnSeedSortingPuzzle implements IPuzzle {
  readonly id = 'autumn_seed_sorting';
  readonly title = 'Autumn Seed & Leaf Sorting';

  readonly baskets: BasketSlot[] = [
    { id: 'basket_acorn', acceptedType: 'acorn', x: 80, y: 130, radius: 36, isFilled: false },
    { id: 'basket_pinecone', acceptedType: 'pinecone', x: 160, y: 130, radius: 36, isFilled: false },
    { id: 'basket_maple', acceptedType: 'maple_seed', x: 240, y: 130, radius: 36, isFilled: false },
  ];

  readonly seeds: SeedItem[] = [
    { id: 'seed_acorn', type: 'acorn', x: 80, y: 220, initialX: 80, initialY: 220, isPlaced: false, isDragging: false },
    { id: 'seed_pinecone', type: 'pinecone', x: 160, y: 220, initialX: 160, initialY: 220, isPlaced: false, isDragging: false },
    { id: 'seed_maple', type: 'maple_seed', x: 240, y: 220, initialX: 240, initialY: 220, isPlaced: false, isDragging: false },
  ];

  private solved = false;
  private solveCallbacks: Array<() => void> = [];

  get isSolved(): boolean {
    return this.solved;
  }

  onSolve(callback: () => void): void {
    this.solveCallbacks.push(callback);
  }

  reset(): void {
    this.solved = false;
    for (const b of this.baskets) b.isFilled = false;
    for (const s of this.seeds) {
      s.x = s.initialX;
      s.y = s.initialY;
      s.isPlaced = false;
      s.isDragging = false;
    }
  }

  update(_dtSec: number): void {
    // Check completion
    if (!this.solved && this.baskets.every((b) => b.isFilled)) {
      this.solved = true;
      for (const cb of this.solveCallbacks) {
        cb();
      }
    }
  }

  dragSeed(seedId: string, x: number, y: number): boolean {
    const seed = this.seeds.find((s) => s.id === seedId);
    if (!seed || seed.isPlaced || this.solved) return false;
    seed.isDragging = true;
    seed.x = x;
    seed.y = y;
    return true;
  }

  releaseSeed(seedId: string): boolean {
    const seed = this.seeds.find((s) => s.id === seedId);
    if (!seed || seed.isPlaced || this.solved) return false;
    seed.isDragging = false;

    // Check closest matching basket within 80px magnetic snap radius
    let matchedBasket: BasketSlot | null = null;
    let minD = Infinity;

    for (const b of this.baskets) {
      if (b.isFilled) continue;
      const d = dist(seed.x, seed.y, b.x, b.y);
      if (d < INPUT.MAGNETIC_SNAP_RADIUS_PX && d < minD) {
        minD = d;
        matchedBasket = b;
      }
    }

    if (matchedBasket && matchedBasket.acceptedType === seed.type) {
      // Valid snap into basket
      seed.x = matchedBasket.x;
      seed.y = matchedBasket.y;
      seed.isPlaced = true;
      matchedBasket.isFilled = true;
      this.update(0);
      return true;
    } else {
      // Gentle return to tray without buzzer
      seed.x = seed.initialX;
      seed.y = seed.initialY;
      return false;
    }
  }
}
