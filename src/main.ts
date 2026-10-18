import Phaser from 'phaser';
import './styles.css';
import { BASE_HEIGHT, BASE_WIDTH, LETTERBOX_COLOR, TARGET_FPS } from './core/constants';
import { registerServiceWorker } from './pwa';
import { WorldScene } from './scenes/WorldScene';
import { SatchelUIScene } from './scenes/SatchelUIScene';
import { PuzzleOverlayScene } from './scenes/PuzzleOverlayScene';
import { SketchbookScene } from './scenes/SketchbookScene';
import { BedtimeScene } from './scenes/BedtimeScene';

export const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  backgroundColor: LETTERBOX_COLOR,
  pixelArt: true,
  roundPixels: true,
  audio: { noAudio: true },
  fps: { target: TARGET_FPS, limit: TARGET_FPS },
  scene: [WorldScene, SatchelUIScene, PuzzleOverlayScene, SketchbookScene, BedtimeScene],
});

registerServiceWorker();
