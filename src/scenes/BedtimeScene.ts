import Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from '../core/constants';
import { eventBus } from '../core/EventBus';

export class BedtimeScene extends Phaser.Scene {
  private fireGlow!: Phaser.GameObjects.Rectangle;
  private glowTimer = 0;

  constructor() {
    super('BedtimeScene');
  }

  create(): void {
    eventBus.emit('bedtime:lock');

    // Deep nocturnal background (Shadow umber 0 / Deep bark 2)
    this.add.rectangle(0, 0, BASE_WIDTH, BASE_HEIGHT, 0x1A232A).setOrigin(0, 0);

    // Lodge floor rug (River clay 8)
    this.add.rectangle(BASE_WIDTH / 2, 210, 240, 70, 0x6E4A2F);
    this.add.rectangle(BASE_WIDTH / 2, 210, 220, 54, 0xC49A6C);

    // Warm Fireplace Hearth in center-top
    this.add.rectangle(BASE_WIDTH / 2, 110, 80, 80, 0x423832); // Stone chimney
    this.add.rectangle(BASE_WIDTH / 2, 125, 48, 50, 0x1A232A); // Firebox

    // Fire glow
    this.fireGlow = this.add.rectangle(BASE_WIDTH / 2, 130, 36, 36, 0xD48038);
    this.add.rectangle(BASE_WIDTH / 2, 135, 20, 20, 0xE5C158); // Yellow ember core

    // Window showing night sky with stars
    const winX = 60;
    const winY = 80;
    this.add.rectangle(winX, winY, 44, 54, 0x3A546E); // Night blue
    this.add.rectangle(winX, winY, 44, 54).setStrokeStyle(3, 0x6E4A2F); // Window frame
    // Crossbars
    this.add.line(winX, winY, 0, -27, 0, 27, 0x6E4A2F).setLineWidth(2);
    this.add.line(winX, winY, -22, 0, 22, 0, 0x6E4A2F).setLineWidth(2);

    // Sleeping Pip on the rug
    this.add.circle(BASE_WIDTH / 2 + 30, 215, 12, 0x9B4E28); // Pip body
    this.add.circle(BASE_WIDTH / 2 + 30, 216, 7, 0xC49A6C); // Belly
    this.add.text(BASE_WIDTH / 2 + 45, 195, 'Zzz...', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#F4EFEA',
    });

    // Reassuring messages
    this.add.text(BASE_WIDTH / 2, 26, 'TIME TO REST', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#E5C158',
    }).setOrigin(0.5);

    this.add.text(BASE_WIDTH / 2, 260, 'The forest is sleeping peacefully.', {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#EAE6DF',
    }).setOrigin(0.5);

    this.add.text(BASE_WIDTH / 2, 274, 'See you tomorrow, little explorer!', {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#D48038',
    }).setOrigin(0.5);
  }

  override update(_time: number, delta: number): void {
    // Gentle hearth flickering
    this.glowTimer += delta / 1000;
    if (this.fireGlow) {
      const flicker = 1.0 + Math.sin(this.glowTimer * 4) * 0.08;
      this.fireGlow.setScale(flicker);
    }
  }
}
