import Phaser from 'phaser';
import { BASE_WIDTH, BASE_HEIGHT } from './core/constants';
import { TextureBank } from './render/TextureBank';
import { SpriteGenerator } from './render/sprites';
import { TileGenerator } from './render/tiles';
import { FlashlightMask } from './render/flashlight';

export class TestbedScene extends Phaser.Scene {
  private textureBank = new TextureBank();
  private flashlightMask = new FlashlightMask(BASE_WIDTH, BASE_HEIGHT);
  private flashlightImage!: Phaser.GameObjects.Image;

  constructor() {
    super('TestbedScene');
  }

  preload(): void {
    // 1. Register procedural character frames
    this.textureBank.register('player_down', SpriteGenerator.generateRangerFrame('down', 0));
    this.textureBank.register('player_up', SpriteGenerator.generateRangerFrame('up', 0));
    this.textureBank.register('player_left', SpriteGenerator.generateRangerFrame('left', 0));
    this.textureBank.register('player_right', SpriteGenerator.generateRangerFrame('right', 0));

    // 2. Register Pip companion frames
    this.textureBank.register('pip_idle', SpriteGenerator.generatePipFrame('IDLE_CURIOUS', 0));
    this.textureBank.register('pip_yawn', SpriteGenerator.generatePipFrame('YAWNING', 0));
    this.textureBank.register('pip_sleep', SpriteGenerator.generatePipFrame('SLEEPING', 0));

    // 3. Register wildlife
    this.textureBank.register('hedgehog', SpriteGenerator.generateAnimal('hedgehog'));
    this.textureBank.register('badger', SpriteGenerator.generateAnimal('badger'));
    this.textureBank.register('rabbit', SpriteGenerator.generateAnimal('rabbit'));
    this.textureBank.register('duckling', SpriteGenerator.generateAnimal('duckling'));

    // 4. Register seasonal autotiles
    this.textureBank.register('grass_spring', TileGenerator.generateAutotile(15, 4, 5));
    this.textureBank.register('grass_summer', TileGenerator.generateAutotile(15, 5, 4));
    this.textureBank.register('dirt_autumn', TileGenerator.generateAutotile(15, 8, 3));
    this.textureBank.register('snow_winter', TileGenerator.generateAutotile(15, 14, 13));
    this.textureBank.register('water_tile', TileGenerator.generateWaterTile(0));
    this.textureBank.register('lily_pad', TileGenerator.generateLilyPad(3));

    // 5. Flashlight mask image
    this.textureBank.register('flashlight_mask', this.flashlightMask.image);

    // Bake and upload all registered textures to Phaser
    for (const key of this.textureBank.getKeys()) {
      this.textureBank.uploadToPhaser(this, key);
    }
  }

  create(): void {
    // 1. Draw 4 seasonal terrain quadrant swatches
    // Top-Left: Spring
    for (let y = 0; y < 9; y++) {
      for (let x = 0; x < 10; x++) {
        this.add.image(x * 16 + 8, y * 16 + 8, 'grass_spring');
      }
    }

    // Top-Right: Summer
    for (let y = 0; y < 9; y++) {
      for (let x = 10; x < 20; x++) {
        this.add.image(x * 16 + 8, y * 16 + 8, 'grass_summer');
      }
    }

    // Bottom-Left: Autumn
    for (let y = 9; y < 18; y++) {
      for (let x = 0; x < 10; x++) {
        this.add.image(x * 16 + 8, y * 16 + 8, 'dirt_autumn');
      }
    }

    // Bottom-Right: Winter
    for (let y = 9; y < 18; y++) {
      for (let x = 10; x < 20; x++) {
        this.add.image(x * 16 + 8, y * 16 + 8, 'snow_winter');
      }
    }

    // Water channel & Lily Pad in Spring zone
    this.add.image(48, 48, 'water_tile');
    this.add.image(64, 48, 'water_tile');
    this.add.image(56, 48, 'lily_pad');

    // 2. Character & Wildlife Sprites
    this.add.sprite(80, 72, 'player_down');
    this.add.sprite(98, 72, 'pip_idle');

    this.add.sprite(240, 72, 'badger');
    this.add.sprite(80, 216, 'hedgehog');
    this.add.sprite(240, 216, 'rabbit');

    // Walking stances in a row
    this.add.sprite(130, 144, 'player_down');
    this.add.sprite(150, 144, 'player_up');
    this.add.sprite(170, 144, 'player_left');
    this.add.sprite(190, 144, 'player_right');

    // Pip emotional states
    this.add.sprite(130, 168, 'pip_idle');
    this.add.sprite(160, 168, 'pip_yawn');
    this.add.sprite(190, 168, 'pip_sleep');

    // 3. Flashlight overlay
    this.flashlightImage = this.add.image(BASE_WIDTH / 2, BASE_HEIGHT / 2, 'flashlight_mask');
    this.flashlightImage.setVisible(false);

    // Mark testbed ready for automated QA
    if (typeof window !== 'undefined') {
      (window as unknown as { __TESTBED_READY__: boolean }).__TESTBED_READY__ = true;
      (window as unknown as { __TESTBED_FLASHLIGHT__: (v: boolean) => void }).__TESTBED_FLASHLIGHT__ = (v: boolean) => {
        if (v) {
          this.flashlightMask.update(160, 144, { facingAngleDeg: 45, rangePx: 96, ambientDarkness: 0.85 });
          this.textureBank.uploadToPhaser(this, 'flashlight_mask');
        }
        this.flashlightImage.setVisible(v);
      };
    }
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  parent: 'testbed-container',
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#1A1A24',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [TestbedScene],
};

export const testbedGame = new Phaser.Game(config);
