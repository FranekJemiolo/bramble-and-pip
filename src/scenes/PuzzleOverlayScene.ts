import Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from '../core/constants';
import { eventBus } from '../core/EventBus';
import { MossyGearboxPuzzle } from '../minigames/MossyGearboxPuzzle';
import { SteppingStonePuzzle } from '../minigames/SteppingStonePuzzle';
import { AutumnSeedSortingPuzzle } from '../minigames/AutumnSeedSortingPuzzle';
import { WinterTrackSpottingPuzzle } from '../minigames/WinterTrackSpottingPuzzle';
import type { IPuzzle } from '../minigames/types';

export class PuzzleOverlayScene extends Phaser.Scene {
  private puzzleType: 'mossy_gearbox' | 'stepping_stones' | 'autumn_seed_sorting' | 'winter_track_spotting' = 'mossy_gearbox';
  private puzzleInstance!: IPuzzle;
  private graphics!: Phaser.GameObjects.Graphics;
  private onCompleteCallback?: () => void;

  constructor() {
    super('PuzzleOverlayScene');
  }

  init(data: { puzzleType: 'mossy_gearbox' | 'stepping_stones' | 'autumn_seed_sorting' | 'winter_track_spotting'; onComplete?: () => void }): void {
    this.puzzleType = data.puzzleType;
    this.onCompleteCallback = data.onComplete;

    if (this.puzzleType === 'mossy_gearbox') {
      this.puzzleInstance = new MossyGearboxPuzzle();
    } else if (this.puzzleType === 'autumn_seed_sorting') {
      this.puzzleInstance = new AutumnSeedSortingPuzzle();
    } else if (this.puzzleType === 'winter_track_spotting') {
      this.puzzleInstance = new WinterTrackSpottingPuzzle();
    } else {
      this.puzzleInstance = new SteppingStonePuzzle();
    }
  }

  create(): void {
    eventBus.emit('puzzle:start', { puzzleId: this.puzzleInstance.id });

    // Semi-transparent dim background
    const dim = this.add.rectangle(0, 0, BASE_WIDTH, BASE_HEIGHT, 0x1A232A, 0.75).setOrigin(0, 0);
    dim.setInteractive(); // Blocks world clicks underneath

    // Puzzle modal container
    const modal = this.add.rectangle(BASE_WIDTH / 2, BASE_HEIGHT / 2, 280, 240, 0xF4EFEA);
    modal.setStrokeStyle(3, 0x6E4A2F);

    // Title
    this.add.text(BASE_WIDTH / 2, 38, this.puzzleInstance.title.toUpperCase(), {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#2A3E2C',
    }).setOrigin(0.5);

    // Close button
    const closeBtn = this.add.rectangle(BASE_WIDTH / 2 + 120, 38, 20, 20, 0xC49A6C);
    closeBtn.setStrokeStyle(1, 0x6E4A2F);
    this.add.text(BASE_WIDTH / 2 + 120, 38, 'X', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#1A232A',
    }).setOrigin(0.5);
    closeBtn.setInteractive().on('pointerdown', () => this.closePuzzle());

    this.graphics = this.add.graphics();

    // Setup puzzle interactions
    if (this.puzzleInstance instanceof MossyGearboxPuzzle) {
      this.setupGearbox(this.puzzleInstance);
    } else if (this.puzzleInstance instanceof SteppingStonePuzzle) {
      this.setupSteppingStones(this.puzzleInstance);
    } else if (this.puzzleInstance instanceof AutumnSeedSortingPuzzle) {
      this.setupSeedSorting(this.puzzleInstance);
    } else if (this.puzzleInstance instanceof WinterTrackSpottingPuzzle) {
      this.setupTrackSpotting(this.puzzleInstance);
    }

    this.puzzleInstance.onSolve(() => {
      eventBus.emit('puzzle:solved', { puzzleId: this.puzzleInstance.id });
      eventBus.emit('audio:sfx', { sound: 'success_chime' });

      this.time.delayedCall(1200, () => {
        if (this.onCompleteCallback) {
          this.onCompleteCallback();
        }
        this.closePuzzle();
      });
    });
  }

  private setupGearbox(gearbox: MossyGearboxPuzzle): void {
    let isDragging = false;

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const d = Phaser.Math.Distance.Between(p.x, p.y, gearbox.idlerGear.x, gearbox.idlerGear.y);
      if (d < gearbox.idlerGear.radius + 16) {
        isDragging = true;
      }
    });

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (isDragging) {
        gearbox.dragIdler(p.x, p.y);
      }
    });

    this.input.on('pointerup', () => {
      if (isDragging) {
        isDragging = false;
        gearbox.releasePointer();
      }
    });
  }

  private setupSteppingStones(stones: SteppingStonePuzzle): void {
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const stepped = stones.tap(p.x, p.y);
      if (stepped) {
        eventBus.emit('audio:sfx', { sound: 'water_bubble' });
      }
    });
  }

  private setupSeedSorting(sorting: AutumnSeedSortingPuzzle): void {
    let activeSeedId: string | null = null;

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      for (const seed of sorting.seeds) {
        if (!seed.isPlaced && Phaser.Math.Distance.Between(p.x, p.y, seed.x, seed.y) < 32) {
          activeSeedId = seed.id;
          sorting.dragSeed(seed.id, p.x, p.y);
          break;
        }
      }
    });

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (activeSeedId) {
        sorting.dragSeed(activeSeedId, p.x, p.y);
      }
    });

    this.input.on('pointerup', () => {
      if (activeSeedId) {
        const snapped = sorting.releaseSeed(activeSeedId);
        if (snapped) {
          eventBus.emit('audio:sfx', { sound: 'water_bubble' });
        }
        activeSeedId = null;
      }
    });
  }

  private setupTrackSpotting(trackSpotting: WinterTrackSpottingPuzzle): void {
    let activeTrackId: string | null = null;

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      for (const track of trackSpotting.trackStamps) {
        if (!track.isMatched && Phaser.Math.Distance.Between(p.x, p.y, track.x, track.y) < 32) {
          activeTrackId = track.id;
          trackSpotting.dragTrack(track.id, p.x, p.y);
          break;
        }
      }
    });

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (activeTrackId) {
        trackSpotting.dragTrack(activeTrackId, p.x, p.y);
      }
    });

    this.input.on('pointerup', () => {
      if (activeTrackId) {
        const snapped = trackSpotting.releaseTrack(activeTrackId);
        if (snapped) {
          eventBus.emit('audio:sfx', { sound: 'water_bubble' });
        }
        activeTrackId = null;
      }
    });
  }

  override update(_time: number, delta: number): void {
    const dt = delta / 1000;
    this.puzzleInstance.update(dt);
    this.renderPuzzleGraphics();
  }

  private renderPuzzleGraphics(): void {
    this.graphics.clear();

    if (this.puzzleInstance instanceof MossyGearboxPuzzle) {
      const gb = this.puzzleInstance;

      // Draw magnetic snap basin circle
      this.graphics.lineStyle(1, 0x8FA382, 0.4);
      this.graphics.strokeCircle(gb.targetMeshX, gb.targetMeshY, gb.targetRadius);

      // Draw Drive Gear (Fixed left)
      this.drawGear(gb.driveGear.x, gb.driveGear.y, gb.driveGear.radius, gb.driveGear.angleRad, 0x4B6B4E);

      // Draw Driven Gear (Fixed right)
      this.drawGear(gb.drivenGear.x, gb.drivenGear.y, gb.drivenGear.radius, gb.drivenGear.angleRad, 0x4B6B4E);

      // Draw Idler Gear (Movable middle)
      const idlerColor = gb.isMeshed ? 0x9B4E28 : 0xC49A6C;
      this.drawGear(gb.idlerGear.x, gb.idlerGear.y, gb.idlerGear.radius, gb.idlerGear.angleRad, idlerColor);

    } else if (this.puzzleInstance instanceof SteppingStonePuzzle) {
      const sp = this.puzzleInstance;

      // Stream representation
      this.graphics.fillStyle(0x7393B3, 0.3);
      this.graphics.fillRect(40, 90, 240, 110);

      // Draw each lily pad stone
      for (const pad of sp.pads) {
        const color = pad.isStepped ? 0x8FA382 : 0x4B6B4E;
        this.graphics.fillStyle(color, 1.0);
        this.graphics.fillCircle(pad.x, pad.y, 20);
        this.graphics.lineStyle(2, 0x2A3E2C, 1.0);
        this.graphics.strokeCircle(pad.x, pad.y, 20);

        // Draw subitizing dots on the pad
        this.drawSubitizingDots(pad.x, pad.y, pad.dotCount);
      }

      // Draw target indicator
      if (!sp.isSolved) {
        this.graphics.fillStyle(0x9B4E28, 1.0);
        this.graphics.fillCircle(BASE_WIDTH / 2, 72, 8);
      }
    } else if (this.puzzleInstance instanceof AutumnSeedSortingPuzzle) {
      const asp = this.puzzleInstance;

      // Draw Autumn forest floor container
      this.graphics.fillStyle(0xD99E5C, 0.25);
      this.graphics.fillRect(36, 68, 248, 172);

      // Draw Baskets
      for (const b of asp.baskets) {
        this.graphics.lineStyle(2, 0x6E4A2F, 0.8);
        this.graphics.strokeCircle(b.x, b.y, b.radius);
        this.graphics.fillStyle(b.isFilled ? 0x8FA382 : 0xC49A6C, 0.6);
        this.graphics.fillCircle(b.x, b.y, b.radius - 2);

        // Magnetic basin indicator
        this.graphics.lineStyle(1, 0x9B4E28, 0.3);
        this.graphics.strokeCircle(b.x, b.y, 48);
      }

      // Draw Seeds
      for (const s of asp.seeds) {
        const color = s.type === 'acorn' ? 0x6E4A2F : s.type === 'pinecone' ? 0x4B6B4E : 0xD99E5C;
        this.graphics.fillStyle(color, 1.0);
        this.graphics.fillCircle(s.x, s.y, 14);
        this.graphics.lineStyle(2, 0x1A232A, 1.0);
        this.graphics.strokeCircle(s.x, s.y, 14);

        if (s.type === 'acorn') {
          // Cap
          this.graphics.fillStyle(0x3B281B, 1.0);
          this.graphics.fillCircle(s.x, s.y - 7, 7);
        }
      }
    } else if (this.puzzleInstance instanceof WinterTrackSpottingPuzzle) {
      const wtp = this.puzzleInstance;

      // Snow ground
      this.graphics.fillStyle(0xE8F2F7, 0.5);
      this.graphics.fillRect(36, 68, 248, 172);

      // Draw animal target cards
      for (const card of wtp.animalCards) {
        this.graphics.fillStyle(card.isMatched ? 0x8FA382 : 0xF4EFEA, 0.9);
        this.graphics.fillRect(card.x - 30, card.y - 25, 60, 50);
        this.graphics.lineStyle(2, 0x4A6B82, 1.0);
        this.graphics.strokeRect(card.x - 30, card.y - 25, 60, 50);

        // Magnetic snap radius
        this.graphics.lineStyle(1, 0x7393B3, 0.3);
        this.graphics.strokeCircle(card.x, card.y, 48);
      }

      // Draw track stamps
      for (const track of wtp.trackStamps) {
        this.graphics.fillStyle(0x3A5369, 1.0);
        this.graphics.fillCircle(track.x, track.y, 12);
        this.graphics.lineStyle(1, 0xF4EFEA, 1.0);
        this.graphics.strokeCircle(track.x, track.y, 12);

        // Track prints
        this.graphics.fillStyle(0xF4EFEA, 1.0);
        if (track.trackType === 'badger') {
          for (let i = 0; i < 5; i++) {
            this.graphics.fillCircle(track.x - 6 + i * 3, track.y - 4, 1.5);
          }
          this.graphics.fillCircle(track.x, track.y + 3, 4);
        } else if (track.trackType === 'rabbit') {
          this.graphics.fillCircle(track.x - 3, track.y - 3, 2);
          this.graphics.fillCircle(track.x + 3, track.y - 3, 2);
          this.graphics.fillCircle(track.x, track.y + 4, 3);
        } else {
          this.graphics.fillCircle(track.x, track.y, 2);
          this.graphics.fillCircle(track.x - 4, track.y - 4, 1.5);
          this.graphics.fillCircle(track.x + 4, track.y - 4, 1.5);
        }
      }
    }
  }

  private drawGear(x: number, y: number, r: number, angle: number, color: number): void {
    this.graphics.fillStyle(color, 1.0);
    this.graphics.fillCircle(x, y, r);
    this.graphics.lineStyle(2, 0x2A3E2C, 1.0);
    this.graphics.strokeCircle(x, y, r);

    // Axle
    this.graphics.fillStyle(0x2A3E2C, 1.0);
    this.graphics.fillCircle(x, y, 4);

    // Spokes indicating rotation
    this.graphics.lineStyle(2, 0x2A3E2C, 0.8);
    for (let i = 0; i < 4; i++) {
      const a = angle + (i * Math.PI) / 2;
      this.graphics.lineBetween(x, y, x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
  }

  private drawSubitizingDots(cx: number, cy: number, count: number): void {
    this.graphics.fillStyle(0xF4EFEA, 1.0);
    const r = 2.5;

    switch (count) {
      case 1:
        this.graphics.fillCircle(cx, cy, r);
        break;
      case 2:
        this.graphics.fillCircle(cx - 6, cy - 6, r);
        this.graphics.fillCircle(cx + 6, cy + 6, r);
        break;
      case 3:
        this.graphics.fillCircle(cx - 6, cy - 6, r);
        this.graphics.fillCircle(cx, cy, r);
        this.graphics.fillCircle(cx + 6, cy + 6, r);
        break;
      case 4:
        this.graphics.fillCircle(cx - 6, cy - 6, r);
        this.graphics.fillCircle(cx + 6, cy - 6, r);
        this.graphics.fillCircle(cx - 6, cy + 6, r);
        this.graphics.fillCircle(cx + 6, cy + 6, r);
        break;
      case 5:
        this.graphics.fillCircle(cx - 6, cy - 6, r);
        this.graphics.fillCircle(cx + 6, cy - 6, r);
        this.graphics.fillCircle(cx, cy, r);
        this.graphics.fillCircle(cx - 6, cy + 6, r);
        this.graphics.fillCircle(cx + 6, cy + 6, r);
        break;
    }
  }

  private closePuzzle(): void {
    eventBus.emit('puzzle:closed', { puzzleId: this.puzzleInstance.id });
    this.scene.resume('WorldScene');
    this.scene.stop();
  }
}
