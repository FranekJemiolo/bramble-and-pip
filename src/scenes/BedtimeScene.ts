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

    if (this.textures.exists('ranger_lodge_bg')) {
      // 1. Canonical Ranger Lodge pixel art backdrop
      const lodgeBg = this.add.image(0, 0, 'ranger_lodge_bg').setOrigin(0, 0);
      lodgeBg.setDisplaySize(BASE_WIDTH, 192);

      // Nocturnal moonlit twilight overlay across lodge
      const nightOverlay = this.add.rectangle(0, 0, BASE_WIDTH, 192, 0x1A232A, 0.42).setOrigin(0, 0);
      nightOverlay.setBlendMode(Phaser.BlendModes.MULTIPLY);

      // Warm Fireplace flickering ember overlay
      this.fireGlow = this.add.rectangle(102, 108, 28, 20, 0xE5C158, 0.35);

      // "Zzz..." above sleeping bear and Pip
      this.add.text(75, 78, 'Zzz...', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#FAF6E8',
      });
      this.add.text(142, 116, 'zzz...', {
        fontFamily: 'monospace',
        fontSize: '7px',
        color: '#E5C158',
      });

      // Bottom night satchel panel (y: 192..288)
      this.add.rectangle(0, 192, BASE_WIDTH, 96, 0x1A232A).setOrigin(0, 0);
      this.add.rectangle(BASE_WIDTH / 2, 192, BASE_WIDTH - 16, 2, 0x6E4A2F);
    } else {
      // Fallback
      this.add.rectangle(0, 0, BASE_WIDTH, BASE_HEIGHT, 0x1A232A).setOrigin(0, 0);
      this.fireGlow = this.add.rectangle(BASE_WIDTH / 2, 130, 36, 36, 0xD48038);
    }

    // Reassuring bedtime banners
    this.add.text(BASE_WIDTH / 2, 212, '🌙 TIME TO REST 💤', {
      fontFamily: 'monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#E5C158',
    }).setOrigin(0.5);

    this.add.text(BASE_WIDTH / 2, 236, 'The forest is sleeping peacefully.', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#FAF6E8',
    }).setOrigin(0.5);

    this.add.text(BASE_WIDTH / 2, 256, 'See you tomorrow, little explorer! 🌲⭐', {
      fontFamily: 'monospace',
      fontSize: '8px',
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
