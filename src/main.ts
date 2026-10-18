import Phaser from 'phaser';
import './styles.css';
import { BASE_HEIGHT, BASE_WIDTH, LETTERBOX_COLOR, TARGET_FPS } from './core/constants';
import { registerServiceWorker } from './pwa';

// Phase 1 foundation: a 320×288 pixel-art canvas boots under the strict CSP.
// Scenes, input and content arrive in later phases (see docs/MILESTONES.md).
class FoundationScene extends Phaser.Scene {
  constructor() {
    super('Foundation');
  }
  create(): void {
    this.cameras.main.setBackgroundColor('#2C3E50');
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  backgroundColor: LETTERBOX_COLOR,
  pixelArt: true,
  roundPixels: true,
  audio: { noAudio: true },
  fps: { target: TARGET_FPS, limit: TARGET_FPS },
  scene: [FoundationScene],
});

registerServiceWorker();
