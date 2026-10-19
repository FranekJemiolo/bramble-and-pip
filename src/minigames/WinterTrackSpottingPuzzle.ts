import { INPUT } from '../core/constants';
import { dist } from '../core/math';
import type { IPuzzle } from './types';

export interface AnimalCard {
  id: string;
  name: string;
  trackType: 'badger' | 'rabbit' | 'chickadee';
  x: number;
  y: number;
  isMatched: boolean;
}

export interface TrackStamp {
  id: string;
  trackType: 'badger' | 'rabbit' | 'chickadee';
  label: string;
  x: number;
  y: number;
  initialX: number;
  initialY: number;
  isMatched: boolean;
  isDragging: boolean;
}

export class WinterTrackSpottingPuzzle implements IPuzzle {
  readonly id = 'winter_track_spotting';
  readonly title = 'Winter Track-Spotter Puzzle';

  readonly animalCards: AnimalCard[] = [
    { id: 'animal_badger', name: 'Heavy Badger', trackType: 'badger', x: 75, y: 125, isMatched: false },
    { id: 'animal_rabbit', name: 'Hopping Rabbit', trackType: 'rabbit', x: 160, y: 125, isMatched: false },
    { id: 'animal_chickadee', name: 'Tiny Chickadee', trackType: 'chickadee', x: 245, y: 125, isMatched: false },
  ];

  readonly trackStamps: TrackStamp[] = [
    { id: 'track_badger', trackType: 'badger', label: '5-Toed Digging Claw', x: 75, y: 220, initialX: 75, initialY: 220, isMatched: false, isDragging: false },
    { id: 'track_rabbit', trackType: 'rabbit', label: 'Leap-Frog Hopping', x: 160, y: 220, initialX: 160, initialY: 220, isMatched: false, isDragging: false },
    { id: 'track_chickadee', trackType: 'chickadee', label: '3-Toed Branch Hop', x: 245, y: 220, initialX: 245, initialY: 220, isMatched: false, isDragging: false },
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
    for (const a of this.animalCards) a.isMatched = false;
    for (const t of this.trackStamps) {
      t.x = t.initialX;
      t.y = t.initialY;
      t.isMatched = false;
      t.isDragging = false;
    }
  }

  update(_dtSec: number): void {
    if (!this.solved && this.animalCards.every((a) => a.isMatched)) {
      this.solved = true;
      for (const cb of this.solveCallbacks) {
        cb();
      }
    }
  }

  dragTrack(trackId: string, x: number, y: number): boolean {
    const track = this.trackStamps.find((t) => t.id === trackId);
    if (!track || track.isMatched || this.solved) return false;
    track.isDragging = true;
    track.x = x;
    track.y = y;
    return true;
  }

  releaseTrack(trackId: string): boolean {
    const track = this.trackStamps.find((t) => t.id === trackId);
    if (!track || track.isMatched || this.solved) return false;
    track.isDragging = false;

    let matchedCard: AnimalCard | null = null;
    let minD = Infinity;

    for (const card of this.animalCards) {
      if (card.isMatched) continue;
      const d = dist(track.x, track.y, card.x, card.y);
      if (d < INPUT.MAGNETIC_SNAP_RADIUS_PX && d < minD) {
        minD = d;
        matchedCard = card;
      }
    }

    if (matchedCard && matchedCard.trackType === track.trackType) {
      // Valid match: snap into card
      track.x = matchedCard.x;
      track.y = matchedCard.y;
      track.isMatched = true;
      matchedCard.isMatched = true;
      this.update(0);
      return true;
    } else {
      // Gentle return to tray without punitive buzzer
      track.x = track.initialX;
      track.y = track.initialY;
      return false;
    }
  }
}
