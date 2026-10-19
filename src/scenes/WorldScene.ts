import Phaser from 'phaser';
import {
  BASE_WIDTH,
  SESSION,
} from '../core/constants';
import {
  CollisionGrid,
  KinematicMovementController,
  type Facing,
  type KinBody,
} from '../core/world/kinematics';
import { PixelPerfectCameraController } from '../core/world/camera';
import { PipCompanion } from '../core/companion/PipCompanion';
import { TilePathfindingManager } from '../core/world/pathfinding';
import { TolerantInputManager } from '../core/input/TolerantInputManager';
import { TextureBank } from '../render/TextureBank';
import { SpriteGenerator } from '../render/sprites';
import { TileGenerator } from '../render/tiles';
import { CampaignManager } from '../core/campaign/CampaignManager';
import { eventBus } from '../core/EventBus';
import type { Vec2 } from '../core/math';
import { audioManager } from '../core/audio/AcousticAudioManager';
import { registerCanonicalTextures } from '../render/canonicalAssets';
import { ChapterMapModal } from '../ui/ChapterMapModal';

export interface GameStateInspection {
  player: { x: number; y: number; facing: Facing };
  pip: { x: number; y: number; state: string };
  chapter: number;
  season: string;
  sessionElapsedSeconds: number;
  isBedtime: boolean;
  satchelCount: number;
}

export interface InteractiveAnimal {
  kind: 'hedgehog' | 'duckling' | 'sparrow' | 'rabbit' | 'badger';
  x: number;
  y: number;
  sprite: Phaser.GameObjects.Sprite;
  name: string;
  sightWords: string[];
  pictogramKey: string;
}

export interface CollectibleItem {
  id: string;
  name: string;
  description: string;
  pictogramKey: string;
  x: number;
  y: number;
  sprite: Phaser.GameObjects.Sprite;
}

export class WorldScene extends Phaser.Scene {
  private textureBank = new TextureBank();
  private campaign = new CampaignManager();

  private movementController!: KinematicMovementController;
  private cameraController!: PixelPerfectCameraController;
  private pipCompanion!: PipCompanion;
  private pathfinder!: TilePathfindingManager;
  private inputManager!: TolerantInputManager;
  private collisionGrid!: CollisionGrid;

  private playerBody: KinBody = { x: 105, y: 80, facing: 'right' };
  private currentWaypoints: Vec2[] = [];
  private walkCycleTimer = 0;

  private playerSprite!: Phaser.GameObjects.Sprite;
  private pipSprite!: Phaser.GameObjects.Sprite;

  private sessionElapsedSeconds = 0;
  private isBedtime = false;
  private isSunsetTriggered = false;

  private animals: InteractiveAnimal[] = [];
  private collectibles: CollectibleItem[] = [];
  private stepSoundTimer = 0;
  private activeDPadDirection: 'up' | 'down' | 'left' | 'right' | null = null;
  private dpadPulseTimer = 0;

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys?: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };

  // Canonical Scene Background GameObject (320x192)
  private backdropImage!: Phaser.GameObjects.Image;

  // Carved wooden location banner in top-left
  private locationSignText!: Phaser.GameObjects.Text;
  private chapterMapModal!: ChapterMapModal;

  // Dialogue Banner GameObjects (Parchment scroll across bottom of world viewport)
  private dialogueContainer!: Phaser.GameObjects.Container;
  private dialogueText!: Phaser.GameObjects.Text;
  private dialogueAvatarText!: Phaser.GameObjects.Text;
  private wasDialogueDismissedThisFrame = false;

  // Flashlight light cone
  private flashlightGraphics?: Phaser.GameObjects.Graphics;
  private hotspotZones: Phaser.GameObjects.Zone[] = [];

  // Map dimensions (640x384 px - 40x24 tiles of 16px)
  private readonly mapTilesX = 40;
  private readonly mapTilesY = 24;

  constructor() {
    super('WorldScene');
  }

  async preload(): Promise<void> {
    this.bakeProceduralTextures();
    await registerCanonicalTextures(this);
  }

  private bakeProceduralTextures(): void {
    // Ranger walk cycles
    for (const dir of ['down', 'up', 'left', 'right'] as const) {
      for (let f = 0; f < 4; f++) {
        this.textureBank.register(`ranger_${dir}_${f}`, SpriteGenerator.generateRangerFrame(dir, f));
      }
    }

    // Pip frames
    for (const state of ['FOLLOWING', 'IDLE_CURIOUS', 'INSPECTING', 'YAWNING', 'SLEEPING'] as const) {
      for (let f = 0; f < 4; f++) {
        this.textureBank.register(`pip_${state}_${f}`, SpriteGenerator.generatePipFrame(state, f));
      }
    }

    // Environment and props
    this.textureBank.register('tile_grass', TileGenerator.generateAutotile(15, 5, 4));
    this.textureBank.register('tile_dirt', TileGenerator.generateAutotile(15, 8, 3));
    this.textureBank.register('tile_water', TileGenerator.generateWaterTile(0));
    this.textureBank.register('tile_tree', TileGenerator.generatePineTree());
    this.textureBank.register('tile_watermill', TileGenerator.generateCabinProp('wall'));
    this.textureBank.register('tile_lilypad', TileGenerator.generateLilyPad(3));

    // Animal sprites
    this.textureBank.register('animal_hedgehog', SpriteGenerator.generateAnimal('hedgehog'));
    this.textureBank.register('animal_duckling', SpriteGenerator.generateAnimal('duckling'));
    this.textureBank.register('animal_sparrow', SpriteGenerator.generateAnimal('sparrow'));
    this.textureBank.register('animal_rabbit', SpriteGenerator.generateAnimal('rabbit'));
    this.textureBank.register('animal_badger', SpriteGenerator.generateAnimal('badger'));

    // Nature items
    this.textureBank.register('item_acorn', SpriteGenerator.generateItemIcon('acorn'));
    this.textureBank.register('item_pinecone', SpriteGenerator.generateItemIcon('pinecone'));
    this.textureBank.register('item_leaf_oak', SpriteGenerator.generateItemIcon('leaf_oak'));
    this.textureBank.register('item_lantern', SpriteGenerator.generateItemIcon('lantern'));

    // Upload procedural textures
    for (const key of this.textureBank.getKeys()) {
      this.textureBank.uploadToPhaser(this, key);
    }
  }

  create(): void {
    // 1. Initialize Subsystems & Viewport
    this.cameras.main.setViewport(0, 0, BASE_WIDTH, 192);
    this.movementController = new KinematicMovementController();
    this.cameraController = new PixelPerfectCameraController(
      BASE_WIDTH,
      192,
      this.mapTilesX * 16,
      this.mapTilesY * 16,
      this.playerBody.x,
      this.playerBody.y
    );
    this.pipCompanion = new PipCompanion(this.playerBody.x - 16, this.playerBody.y);
    this.chapterMapModal = new ChapterMapModal(this.campaign, (chapterId) => {
      this.switchChapter(chapterId);
    });

    // 2. Setup Walkable Collision Grid (40x24 tiles)
    const cells = new Uint8Array(this.mapTilesX * this.mapTilesY);
    for (let y = 0; y < this.mapTilesY; y++) {
      for (let x = 0; x < this.mapTilesX; x++) {
        const isBorder = x === 0 || x === this.mapTilesX - 1 || y === 0 || y === this.mapTilesY - 1;
        // Water / millpond in NE: x: 23..27, y: 2..8, except bridge at y: 5
        const isWater = (x >= 23 && x <= 27 && y >= 2 && y <= 8 && y !== 5);
        cells[y * this.mapTilesX + x] = (isBorder || isWater) ? 1 : 0;
      }
    }
    this.collisionGrid = new CollisionGrid(this.mapTilesX, this.mapTilesY, cells);
    this.pathfinder = new TilePathfindingManager(this.collisionGrid);

    // 3. Render Full Explorable World Map Backdrop (640x384)
    const mapKey = this.textures.exists('world_full_map_bg')
      ? 'world_full_map_bg'
      : this.getBackdropKeyForChapter(this.campaign.currentChapter.id);
    this.backdropImage = this.add.image(0, 0, mapKey).setOrigin(0, 0);
    this.backdropImage.setDisplaySize(this.mapTilesX * 16, this.mapTilesY * 16);

    // 4. Setup Flashlight Lighting Cone
    this.flashlightGraphics = this.add.graphics();
    this.flashlightGraphics.setDepth(20);

    // 5. Setup Character Sprites (Active and steerable across world viewport)
    this.playerSprite = this.add.sprite(this.playerBody.x, this.playerBody.y, 'ranger_right_0');
    this.playerSprite.setDepth(25);
    this.playerSprite.setVisible(true);

    this.pipSprite = this.add.sprite(this.playerBody.x - 16, this.playerBody.y, 'pip_FOLLOWING_0');
    this.pipSprite.setDepth(24);
    this.pipSprite.setVisible(true);

    // 6. Setup Interactive Animals & Collectibles
    this.spawnWoodlandWildlife();

    // 7. Setup Carved Wooden Location Banner Clickzone (Top-Left)
    this.setupLocationSign();

    // 8. Setup Dynamic Dialogue Banner (Initially hidden to reveal canonical backdrop dialogue)
    this.setupDialogueBanner();

    // 9. Input & Controls Setup
    this.setupInputControls();

    // 10. Launch Satchel UI Overlay Scene
    this.scene.launch('SatchelUI', { campaign: this.campaign });

    // 11. Listen for Chapter & Action Events
    this.setupEventListeners();

    // 12. Setup Chapter Interactive Hotspots
    this.setupSceneHotspots();

    // 13. Expose state inspection for Playwright tests
    this.exposeStateInspection();
  }

  private getBackdropKeyForChapter(chapterId: number): string {
    if (chapterId >= 1 && chapterId <= 5) {
      return this.textures.exists('whispering_woods_bg') ? 'whispering_woods_bg' : 'tile_grass';
    }
    if (chapterId === 7) {
      return this.textures.exists('mossy_gearbox_bg') ? 'mossy_gearbox_bg' : 'whispering_woods_bg';
    }
    if (chapterId >= 6 && chapterId <= 10) {
      return this.textures.exists('mossy_hollow_bg') ? 'mossy_hollow_bg' : 'whispering_woods_bg';
    }
    if (chapterId === 12) {
      return this.textures.exists('sketchbook_bg') ? 'sketchbook_bg' : 'mossy_hollow_bg';
    }
    if (chapterId >= 11 && chapterId <= 15) {
      return this.textures.exists('mossy_hollow_bg') ? 'mossy_hollow_bg' : 'whispering_woods_bg';
    }
    if (chapterId >= 16 && chapterId <= 19) {
      return this.textures.exists('pine_ridge_bg') ? 'pine_ridge_bg' : 'whispering_woods_bg';
    }
    if (chapterId === 20) {
      return this.textures.exists('ranger_lodge_bg') ? 'ranger_lodge_bg' : 'whispering_woods_bg';
    }
    return 'whispering_woods_bg';
  }

  private setupLocationSign(): void {
    // Interactive hitzone positioned exactly over the hanging wooden sign in the top-left
    const signZone = this.add.zone(56, 14, 96, 22)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(34)
      .setInteractive({ cursor: 'pointer' });

    signZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation?.();
      audioManager.playWoodblock();
      this.chapterMapModal.open();
    });

    // Crisp high-contrast carved lettering for the location sign
    this.locationSignText = this.add.text(56, 14, 'THE WHISPERING WOODS', {
      fontFamily: 'ui-rounded, "Avenir Next", "Trebuchet MS", sans-serif',
      fontSize: '8px',
      fontStyle: 'bold',
      color: '#2C1B10',
      stroke: '#FAF6E8',
      strokeThickness: 1,
      shadow: { offsetX: 0, offsetY: 1, color: '#1A1A24', blur: 0, fill: true },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(35).setVisible(true);
  }

  private setupDialogueBanner(): void {
    // Sits pinned at bottom of world viewport (y: 172, width: 280, height: 26)
    const container = this.add.container(160, 172);
    container.setDepth(45);
    container.setScrollFactor(0);
    container.setVisible(false);

    // Parchment speech scroll
    const bg = this.add.rectangle(0, 0, 280, 26, 0xFDF8EB);
    bg.setStrokeStyle(2, 0x432F21);

    // Speech pointer notch pointing towards Pip
    const notch = this.add.triangle(96, 13, 0, 0, 6, 6, 12, 0, 0xFDF8EB);
    notch.setStrokeStyle(1.5, 0x432F21);

    // Pip / Acorn Avatar icon
    const avatar = this.add.text(-124, 0, '🌰', { fontSize: '11px' }).setOrigin(0.5);

    // Crisp, readable dialogue text
    const dialogueTxt = this.add.text(-110, 0, '', {
      fontFamily: 'ui-rounded, "Avenir Next", "Trebuchet MS", sans-serif',
      fontSize: '8px',
      fontStyle: '600',
      color: '#2C1B10',
      wordWrap: { width: 236 },
      lineSpacing: 1,
    }).setOrigin(0, 0.5);

    container.add([bg, notch, avatar, dialogueTxt]);
    this.dialogueContainer = container;
    this.dialogueText = dialogueTxt;
    this.dialogueAvatarText = avatar;

    const dismissHandler = (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation?.();
      this.wasDialogueDismissedThisFrame = true;
      this.time.delayedCall(150, () => {
        this.wasDialogueDismissedThisFrame = false;
      });
      this.hideDialogue();
    };

    bg.setInteractive({ cursor: 'pointer' }).on('pointerdown', dismissHandler);
    dialogueTxt.setInteractive({ cursor: 'pointer' }).on('pointerdown', dismissHandler);
    avatar.setInteractive({ cursor: 'pointer' }).on('pointerdown', dismissHandler);
  }

  private dialogueDismissTimer?: Phaser.Time.TimerEvent;

  private showDialogue(text: string, icon = '🌰', autoDismissSeconds = 6): void {
    this.dialogueAvatarText.setText(icon);
    this.dialogueText.setText(text);
    this.dialogueContainer.setVisible(true);

    if (this.dialogueDismissTimer) {
      this.dialogueDismissTimer.remove();
    }
    if (autoDismissSeconds > 0) {
      this.dialogueDismissTimer = this.time.delayedCall(autoDismissSeconds * 1000, () => {
        this.hideDialogue();
      });
    }
  }

  private hideDialogue(): void {
    this.dialogueContainer.setVisible(false);
    if (this.dialogueDismissTimer) {
      this.dialogueDismissTimer.remove();
      this.dialogueDismissTimer = undefined;
    }
  }

  private updateChapterDialogue(): void {
    // When chapter starts, let the canonical backdrop dialogue show cleanly.
    this.hideDialogue();
  }

  private setupSceneHotspots(): void {
    for (const z of this.hotspotZones) {
      z.destroy();
    }
    this.hotspotZones = [];

    const addHotspot = (x: number, y: number, w: number, h: number, onDown: () => void) => {
      const z = this.add.zone(x, y, w, h).setInteractive({ cursor: 'pointer' });
      z.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation?.();
        onDown();
      });
      this.hotspotZones.push(z);
      return z;
    };

    // 1. Whispering Woods (NW: 0..320, 0..192)
    addHotspot(160, 92, 36, 30, () => {
      audioManager.playPipChirrup();
      audioManager.playKalimba(2);
      this.showDialogue('Pip: Look! A hidden friend in the grass! Notice its round footprints in the soft soil 🐾 🦔', '🦔');
    });

    addHotspot(50, 155, 45, 25, () => {
      audioManager.playWaterBubble();
      this.showDialogue('Pip: Smooth stepping stones lead across the brook! Let\'s count them: 1, 2, 3... 🦆 🪨', '🦆');
    });

    addHotspot(275, 130, 40, 50, () => {
      audioManager.playWoodblock();
      this.showDialogue('Pip: The wooden windmill pumps water into Pebble Creek! Look at the wooden gears ⚙️ 🌾', '⚙️');
    });

    // 2. The Mossy Gearbox & Waterwheel (NE: 320..640, 0..192)
    addHotspot(535, 50, 40, 40, () => {
      audioManager.playWoodblock();
      this.showDialogue('Pip: Hello Mr. Beaver! He is helping us repair the wooden weir 🪵 🦫', '🦫');
    });

    addHotspot(480, 80, 70, 60, () => {
      audioManager.playWoodblock();
      this.scene.pause('WorldScene');
      this.scene.launch('PuzzleOverlayScene', {
        puzzleType: 'mossy_gearbox',
        onComplete: () => {
          this.showDialogue('Pip: The wooden gears mesh together smoothly! The waterwheel spins! ⚙️🌊', '⚙️');
          this.campaign.completeCurrentChapter();
        },
      });
    });

    // 3. Mossy Hollow (SW: 0..320, 192..384)
    addHotspot(110, 275, 44, 44, () => {
      audioManager.playKalimba(3);
      this.showDialogue('Pip: Whoa! Those mushrooms glow in the dark! Bioluminescent fungi light up the hollow 🍄 🔍', '🍄');
    });

    addHotspot(40, 290, 45, 50, () => {
      audioManager.playWoodblock();
      this.showDialogue('Pip: A cool breeze flows from the cavern entrance! What secrets are hidden inside? 🦇 🗝️', '🦇');
    });

    // 4. Pine Ridge & Ranger Lodge (SE: 320..640, 192..384)
    addHotspot(430, 280, 45, 45, () => {
      audioManager.playPipChirrup();
      this.showDialogue('Pip: Big back paws leap ahead of small front paws! The trail leads to the badger mound 🐾❄️', '🐇');
    });

    addHotspot(540, 270, 60, 60, () => {
      audioManager.playKalimba(4);
      audioManager.playPipChirrup();
      this.showDialogue('Pip: Everyone is safe and warm by the fireplace! We earned the Junior Ranger Honor! 🐻🐿️🦊', '🎖️');
    });
  }

  private switchChapter(chapterId: number): void {
    this.campaign.startChapter(chapterId);

    // Position characters in authentic canonical spots per quadrant / chapter
    if (chapterId >= 1 && chapterId <= 5) {
      // Whispering Woods (NW)
      this.playerBody.x = 105;
      this.playerBody.y = 80;
    } else if (chapterId >= 6 && chapterId <= 7) {
      // The Mossy Gearbox (NE)
      this.playerBody.x = 480;
      this.playerBody.y = 96;
    } else if (chapterId >= 8 && chapterId <= 15) {
      // Mossy Hollow (SW)
      this.playerBody.x = 160;
      this.playerBody.y = 288;
    } else if (chapterId >= 16 && chapterId <= 19) {
      // The Pine Ridge (SE)
      this.playerBody.x = 480;
      this.playerBody.y = 288;
    } else if (chapterId === 20) {
      // Ranger Lodge celebration (SE)
      this.playerBody.x = 520;
      this.playerBody.y = 270;
    }

    this.playerSprite.setPosition(this.playerBody.x, this.playerBody.y);
    this.pipSprite.setPosition(this.playerBody.x - 16, this.playerBody.y);
    this.cameraController.snapTo(this.playerBody.x, this.playerBody.y);
    const scroll = this.cameraController.scroll();
    this.cameras.main.setScroll(scroll.x, scroll.y);

    this.updateCurrentRegionName();
    this.updateChapterDialogue();
    this.setupSceneHotspots();

    // Trigger acoustic kalimba chord
    audioManager.playKalimba(chapterId % 5);
  }

  private setupEventListeners(): void {
    // Listen for chapter selection from Trail Map modal
    eventBus.on('chapter:selected', (data: { chapterId: number }) => {
      this.switchChapter(data.chapterId);
    });

    // D-Pad movement event from SatchelUIScene (tap)
    eventBus.on('input:dpad', (data: { direction: 'up' | 'down' | 'left' | 'right' }) => {
      this.activeDPadDirection = data.direction;
      this.dpadPulseTimer = 240;
    });

    // D-Pad continuous hold event from SatchelUIScene (held down)
    eventBus.on('input:dpad_hold', (data: { direction: 'up' | 'down' | 'left' | 'right' }) => {
      this.activeDPadDirection = data.direction;
      this.dpadPulseTimer = 140;
    });

    // D-Pad active direction tracking (null on release)
    eventBus.on('input:dpad_active', (data: { direction: 'up' | 'down' | 'left' | 'right' | null }) => {
      if (data.direction === null) {
        if (this.dpadPulseTimer <= 0) {
          this.activeDPadDirection = null;
        }
      } else {
        this.activeDPadDirection = data.direction;
        this.dpadPulseTimer = 140;
      }
    });

    // Look / Talk action button from SatchelUIScene
    eventBus.on('action:look_talk', () => {
      this.handleLookTalkAction();
    });

    // Pip cameo tap event
    eventBus.on('pip:interact', () => {
      this.handlePipCameoTap();
    });

    // Chapter completion event
    eventBus.on('chapter:complete', () => {
      this.updateChapterDialogue();
    });
  }

  private handleLookTalkAction(): void {
    const ch = this.campaign.currentChapter;

    if (ch.id === 20) {
      this.showDialogue('Pip: Everyone is safe and warm by the fireplace! We earned the Junior Ranger Honor! 🐻🐿️🦊', '🎖️');
      audioManager.playKalimba(4);
      audioManager.playPipChirrup();
      this.campaign.completeCurrentChapter();
      return;
    }

    if (ch.id === 16) {
      this.showDialogue('Pip: Big back paws leap ahead of small front paws! The trail leads to the badger mound 🐾❄️', '🐇');
      audioManager.playPipChirrup();
      this.campaign.completeCurrentChapter();
      return;
    }

    if (ch.id === 7) {
      audioManager.playWoodblock();
      this.scene.pause('WorldScene');
      this.scene.launch('PuzzleOverlayScene', {
        puzzleType: 'mossy_gearbox',
        onComplete: () => {
          this.showDialogue('Pip: The wooden gears mesh together smoothly! The waterwheel spins! ⚙️🌊', '⚙️');
          this.campaign.completeCurrentChapter();
        },
      });
      return;
    }

    if (ch.id === 3) {
      audioManager.playWaterBubble();
      this.scene.pause('WorldScene');
      this.scene.launch('PuzzleOverlayScene', {
        puzzleType: 'stepping_stones',
        onComplete: () => {
          this.showDialogue('Pip: 1, 2, 3, 4, 5! All the little ducklings safely crossed the pond! 🦆🌸', '🦆');
          this.campaign.completeCurrentChapter();
        },
      });
      return;
    }

    if (ch.id === 12) {
      this.scene.pause('WorldScene');
      this.scene.launch('SketchbookScene');
      return;
    }

    if (ch.id === 8) {
      audioManager.playKalimba(3);
      this.showDialogue('Pip: Whoa! Those mushrooms glow in the dark! Bioluminescent fungi light up the hollow 🍄 🔍', '🍄');
      return;
    }

    this.showDialogue(`Pip: What a lovely day in ${ch.region}! Let's explore together! 🐾🍃`, '🌰');
    audioManager.playPipChirrup();
  }

  private handlePipCameoTap(): void {
    const ch = this.campaign.currentChapter;
    this.showDialogue(`Pip: I'm right here with you! Let's explore ${ch.region}! 🐾❤️`, '🌰');
  }

  private spawnWoodlandWildlife(): void {
    // Collectibles in overworld
    const acorn = this.add.sprite(90, 100, 'item_acorn');
    const pinecone = this.add.sprite(210, 120, 'item_pinecone');
    const leaf = this.add.sprite(150, 80, 'item_leaf_oak');

    this.collectibles.push(
      { id: 'acorn', name: 'Oak Acorn', description: 'Smooth glossy acorn', pictogramKey: 'acorn', x: 90, y: 100, sprite: acorn },
      { id: 'pinecone', name: 'Pine Cone', description: 'Fragrant pine cone', pictogramKey: 'pinecone', x: 210, y: 120, sprite: pinecone },
      { id: 'leaf_oak', name: 'Autumn Oak Leaf', description: 'Crisp golden leaf', pictogramKey: 'leaf', x: 150, y: 80, sprite: leaf }
    );

    // Interactive Hedgehog
    const hedgehog = this.add.sprite(180, 85, 'animal_hedgehog');
    this.animals.push({
      kind: 'hedgehog',
      x: 180,
      y: 85,
      sprite: hedgehog,
      name: 'Hedgehog',
      sightWords: ['SNUFFLE', 'IN', 'GRASS'],
      pictogramKey: 'paw',
    });
  }

  private setupInputControls(): void {
    this.inputManager = new TolerantInputManager({
      viewport: () => ({ width: BASE_WIDTH, height: 192 }),
    });

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.wasdKeys = this.input.keyboard?.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as {
      up: Phaser.Input.Keyboard.Key;
      down: Phaser.Input.Keyboard.Key;
      left: Phaser.Input.Keyboard.Key;
      right: Phaser.Input.Keyboard.Key;
    };

    // Tap-to-move pathfinding with UI click isolation
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, currentlyOver?: Phaser.GameObjects.GameObject[]) => {
      // 1. Ignore Satchel area touches (handled by SatchelUIScene)
      if (pointer.y >= 192) return;

      // 2. Ignore if clicking on interactive GameObjects or zones
      if (currentlyOver && currentlyOver.length > 0) return;

      // 3. Ignore if clicking on the carved location sign in top-left
      if (pointer.x <= 112 && pointer.y <= 32) return;

      // 4. Ignore if dialogue banner is visible, was just dismissed, or pointer is in dialogue bounds
      if (this.wasDialogueDismissedThisFrame || (this.dialogueContainer.visible && pointer.y >= 150)) return;

      // 5. Ignore if Chapter Map modal is open
      if (this.chapterMapModal?.isOpen) return;

      // 6. Convert screen coordinates to world coordinates taking camera scroll into account
      const worldX = pointer.worldX;
      const worldY = pointer.worldY;

      const isMouse = (pointer.event as PointerEvent | undefined)?.pointerType === 'mouse' || !pointer.wasTouch;
      const accepted = isMouse || this.inputManager.pointerDown({
        id: pointer.id,
        pointerType: 'touch',
        x: pointer.x,
        y: pointer.y,
        width: 20,
        height: 20,
        timeMs: performance.now(),
      });

      if (accepted) {
        const waypoints = this.pathfinder.navigate(
          { x: this.playerBody.x, y: this.playerBody.y },
          { x: worldX, y: worldY }
        );
        if (waypoints && waypoints.length > 0) {
          this.currentWaypoints = waypoints;
        }
      }
    });
  }

  override update(_time: number, delta: number): void {
    // 1. Session Timer & Bedtime Curfew
    this.sessionElapsedSeconds += delta / 1000;
    const remaining = Math.max(0, SESSION.DAILY_LIMIT_SECONDS - this.sessionElapsedSeconds);

    const satchelScene = this.scene.get('SatchelUI') as { updateSessionTimer?: (sec: number) => void };
    satchelScene?.updateSessionTimer?.(remaining);

    if (this.sessionElapsedSeconds >= SESSION.SUNSET_START_SECONDS && !this.isSunsetTriggered) {
      this.isSunsetTriggered = true;
      eventBus.emit('sunset:start', { durationSeconds: SESSION.SUNSET_DURATION_SECONDS });
    }

    if (this.sessionElapsedSeconds >= SESSION.DAILY_LIMIT_SECONDS && !this.isBedtime) {
      this.isBedtime = true;
      eventBus.emit('bedtime:lock');
      this.scene.start('BedtimeScene');
      return;
    }

    // 2. Pulse timer countdown for tap-to-step D-Pad input
    if (this.dpadPulseTimer > 0) {
      this.dpadPulseTimer -= delta;
      if (this.dpadPulseTimer <= 0 && this.activeDPadDirection) {
        const satchel = this.scene.get('SatchelUI') as { activeDPadDirection?: string };
        if (!satchel?.activeDPadDirection) {
          this.activeDPadDirection = null;
        }
      }
    }

    // 3. Unified Navigation Movement (Keyboard WASD / Arrows + Satchel D-Pad)
    let vx = 0;
    let vy = 0;
    if (this.cursors?.left.isDown || this.wasdKeys?.left.isDown || this.activeDPadDirection === 'left') vx -= 1;
    if (this.cursors?.right.isDown || this.wasdKeys?.right.isDown || this.activeDPadDirection === 'right') vx += 1;
    if (this.cursors?.up.isDown || this.wasdKeys?.up.isDown || this.activeDPadDirection === 'up') vy -= 1;
    if (this.cursors?.down.isDown || this.wasdKeys?.down.isDown || this.activeDPadDirection === 'down') vy += 1;

    const isMoving = vx !== 0 || vy !== 0 || this.currentWaypoints.length > 0;

    if (vx !== 0 || vy !== 0) {
      this.currentWaypoints = [];
      const dir: Facing = vx < 0 ? 'left' : vx > 0 ? 'right' : vy < 0 ? 'up' : 'down';
      this.playerBody.facing = dir;

      const inputVec = { x: vx, y: vy };
      const dtSec = Math.min(delta / 1000, 0.05);
      const res = this.movementController.step(this.playerBody, inputVec, dtSec, this.collisionGrid);
      if (res.moved) {
        this.walkCycleTimer += delta;
        const f = Math.floor(this.walkCycleTimer / 140) % 4;
        this.playerSprite.setTexture(`ranger_${dir}_${f}`);
        this.playerSprite.setPosition(this.playerBody.x, this.playerBody.y);
        this.pipCompanion.recordPlayerStep(this.playerBody.x, this.playerBody.y, dir);
        const targetBc = this.pipCompanion.getTargetBreadcrumb();
        this.pipSprite.setPosition(targetBc.x, targetBc.y);
        this.pipSprite.setTexture(`pip_FOLLOWING_${f}`);

        this.stepSoundTimer += delta;
        if (this.stepSoundTimer > 320) {
          this.stepSoundTimer = 0;
          audioManager.playFootstep();
        }
      }
    } else if (this.currentWaypoints.length > 0) {
      // Waypoint pathfinding step
      const target = this.currentWaypoints[0]!;
      const dx = target.x - this.playerBody.x;
      const dy = target.y - this.playerBody.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 4) {
        this.currentWaypoints.shift();
      } else {
        const step = Math.min(dist, 1.4);
        const nx = dx / dist;
        const ny = dy / dist;
        const dir: Facing = Math.abs(nx) >= Math.abs(ny) ? (nx > 0 ? 'right' : 'left') : (ny > 0 ? 'down' : 'up');
        this.playerBody.facing = dir;
        this.playerBody.x += nx * step;
        this.playerBody.y += ny * step;
        this.walkCycleTimer += delta;
        const f = Math.floor(this.walkCycleTimer / 140) % 4;
        this.playerSprite.setTexture(`ranger_${dir}_${f}`);
        this.playerSprite.setPosition(this.playerBody.x, this.playerBody.y);
        this.pipCompanion.recordPlayerStep(this.playerBody.x, this.playerBody.y, dir);
        const targetBc = this.pipCompanion.getTargetBreadcrumb();
        this.pipSprite.setPosition(targetBc.x, targetBc.y);
        this.pipSprite.setTexture(`pip_FOLLOWING_${f}`);

        this.stepSoundTimer += delta;
        if (this.stepSoundTimer > 320) {
          this.stepSoundTimer = 0;
          audioManager.playFootstep();
        }
      }
    } else {
      // Stopped / Idle
      this.playerSprite.setTexture(`ranger_${this.playerBody.facing}_0`);
      this.pipSprite.setTexture('pip_IDLE_CURIOUS_0');
    }

    // Update Pip Companion and Camera
    this.pipCompanion.update(isMoving, this.sessionElapsedSeconds, this.isBedtime, delta / 1000);
    const scroll = this.cameraController.update(this.playerBody.x, this.playerBody.y, delta / 1000);
    this.cameras.main.setScroll(scroll.x, scroll.y);
    this.updateCurrentRegionName();

    // 3. Update Flashlight Lighting Cone pointing in facing direction
    this.updateFlashlight();

    // 4. Proximity Item Pickup
    for (const c of this.collectibles) {
      if (c.sprite.visible && Math.hypot(c.x - this.playerBody.x, c.y - this.playerBody.y) < 16) {
        c.sprite.setVisible(false);
        this.campaign.addItem({
          id: c.id,
          name: c.name,
          description: c.description,
          pictogramKey: c.pictogramKey,
        });
        audioManager.playWaterBubble();
        this.showDialogue(`Pip: Look! You found a fresh ${c.name}! Placed in satchel! 🎒`, '🌰');
      }
    }
  }

  private updateFlashlight(): void {
    if (!this.flashlightGraphics) return;
    this.flashlightGraphics.clear();

    const ch = this.campaign.currentChapter.id;
    const px = this.playerBody.x;
    const py = this.playerBody.y;
    const facing = this.playerBody.facing;

    let baseAngle = 0;
    if (facing === 'down') baseAngle = Math.PI / 2;
    else if (facing === 'left') baseAngle = Math.PI;
    else if (facing === 'up') baseAngle = -Math.PI / 2;
    else baseAngle = 0; // right

    const beamDist = 65;
    const halfSpread = 0.35; // ~20 degrees on each side

    const angle1 = baseAngle - halfSpread;
    const angle2 = baseAngle + halfSpread;

    const p1x = px + Math.cos(angle1) * beamDist;
    const p1y = py + Math.sin(angle1) * beamDist;
    const p2x = px + Math.cos(angle2) * beamDist;
    const p2y = py + Math.sin(angle2) * beamDist;

    // Soft warm outer light fan
    this.flashlightGraphics.fillStyle(0xFDF8EB, 0.12);
    this.flashlightGraphics.fillTriangle(px, py, p1x, p1y, p2x, p2y);

    // Subtle brighter inner beam core
    const p1InX = px + Math.cos(baseAngle - halfSpread * 0.5) * (beamDist * 0.85);
    const p1InY = py + Math.sin(baseAngle - halfSpread * 0.5) * (beamDist * 0.85);
    const p2InX = px + Math.cos(baseAngle + halfSpread * 0.5) * (beamDist * 0.85);
    const p2InY = py + Math.sin(baseAngle + halfSpread * 0.5) * (beamDist * 0.85);
    this.flashlightGraphics.fillStyle(0xDCE38A, 0.16);
    this.flashlightGraphics.fillTriangle(px, py, p1InX, p1InY, p2InX, p2InY);

    // Subtle living warmth over illuminated ground focal points
    if (ch >= 1 && ch <= 5) {
      const breath = 0.08 + 0.04 * Math.sin(this.sessionElapsedSeconds * 2.5);
      this.flashlightGraphics.fillStyle(0xDCE38A, breath);
      this.flashlightGraphics.fillCircle(160, 92, 22); // Soft warm halo around hedgehog in grass
    } else if (ch === 8) {
      const breath = 0.10 + 0.05 * Math.sin(this.sessionElapsedSeconds * 3.0);
      this.flashlightGraphics.fillStyle(0x789E3E, breath);
      this.flashlightGraphics.fillCircle(245, 65, 20); // Soft bioluminescent glow around mushrooms
    }
  }

  private updateCurrentRegionName(): void {
    const px = this.playerBody.x;
    const py = this.playerBody.y;
    let region = 'THE WHISPERING WOODS';
    if (px < 320 && py < 192) {
      region = 'THE WHISPERING WOODS';
    } else if (px >= 320 && py < 192) {
      region = 'THE MOSSY GEARBOX';
    } else if (px < 320 && py >= 192) {
      region = 'MOSSY HOLLOW';
    } else {
      region = (px >= 480 && py >= 240) ? 'RANGER LODGE' : 'THE PINE RIDGE';
    }
    if (this.locationSignText && this.locationSignText.text !== region) {
      this.locationSignText.setText(region);
    }
  }

  private exposeStateInspection(): void {
    if (typeof window !== 'undefined') {
      (window as unknown as { __GAME_STATE__?: () => GameStateInspection }).__GAME_STATE__ = () => ({
        player: { x: this.playerBody.x, y: this.playerBody.y, facing: this.playerBody.facing },
        pip: { x: this.pipSprite.x, y: this.pipSprite.y, state: this.pipCompanion.currentState },
        chapter: this.campaign.currentChapter.id,
        season: this.campaign.currentSeason,
        sessionElapsedSeconds: this.sessionElapsedSeconds,
        isBedtime: this.isBedtime,
        satchelCount: this.campaign.satchel.length,
      });

      (window as unknown as { __SWITCH_CHAPTER__?: (id: number) => void }).__SWITCH_CHAPTER__ = (id: number) => {
        this.switchChapter(id);
      };
    }
  }
}
