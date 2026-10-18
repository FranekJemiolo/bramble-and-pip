import Phaser from 'phaser';
import { registerCanonicalTextures } from '../render/canonicalAssets';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  async create(): Promise<void> {
    await registerCanonicalTextures(this);
    this.scene.start('WorldScene');
  }
}
