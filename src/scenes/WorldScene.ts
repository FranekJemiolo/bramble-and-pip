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

  private playerBody: KinBody = { x: 120, y: 130, facing: 'down' };
  private currentWaypoints: Vec2[] = [];

  private playerSprite!: Phaser.GameObjects.Sprite;
  private pipSprite!: Phaser.GameObjects.Sprite;

  private sessionElapsedSeconds = 0;
  private isBedtime = false;
  private isSunsetTriggered = false;

  private animals: InteractiveAnimal[] = [];
  private collectibles: CollectibleItem[] = [];
  private stepSoundTimer = 0;

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

  // Flashlight light cone
  private flashlightGraphics?: Phaser.GameObjects.Graphics;

  // Map dimensions
  private readonly mapTilesX = 20;
  private readonly mapTilesY = 12;

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
    // 1. Initialize Subsystems
    this.movementController = new KinematicMovementController();
    this.cameraController = new PixelPerfectCameraController(
      BASE_WIDTH,
      192,
      BASE_WIDTH,
      192,
      this.playerBody.x,
      this.playerBody.y
    );
    this.pipCompanion = new PipCompanion(this.playerBody.x - 16, this.playerBody.y);
    this.chapterMapModal = new ChapterMapModal(this.campaign, (chapterId) => {
      this.switchChapter(chapterId);
    });

    // 2. Setup Walkable Collision Grid (20x12 tiles)
    const cells = new Uint8Array(this.mapTilesX * this.mapTilesY);
    for (let y = 0; y < this.mapTilesY; y++) {
      for (let x = 0; x < this.mapTilesX; x++) {
        const isBorder = x === 0 || x === this.mapTilesX - 1 || y === 0 || y === this.mapTilesY - 1;
        cells[y * this.mapTilesX + x] = isBorder ? 1 : 0;
      }
    }
    this.collisionGrid = new CollisionGrid(this.mapTilesX, this.mapTilesY, cells);
    this.pathfinder = new TilePathfindingManager(this.collisionGrid);

    // 3. Render Canonical 16-Color Scene Backdrop (320x192)
    const bgKey = this.getBackdropKeyForChapter(this.campaign.currentChapter.id);
    this.backdropImage = this.add.image(0, 0, bgKey).setOrigin(0, 0);
    this.backdropImage.setDisplaySize(320, 192);

    // 4. Setup Flashlight Lighting Cone
    this.flashlightGraphics = this.add.graphics();
    this.flashlightGraphics.setDepth(20);

    // 5. Setup Character Sprites
    this.playerSprite = this.add.sprite(this.playerBody.x, this.playerBody.y, 'ranger_down_0');
    this.playerSprite.setDepth(10);

    this.pipSprite = this.add.sprite(this.playerBody.x - 16, this.playerBody.y, 'pip_FOLLOWING_0');
    this.pipSprite.setDepth(9);

    // 6. Setup Interactive Animals & Collectibles
    this.spawnWoodlandWildlife();

    // 7. Setup Carved Wooden Location Banner (Top-Left)
    this.setupLocationSign();

    // 8. Setup Dynamic Dialogue Banner (Bottom of World Viewport)
    this.setupDialogueBanner();

    // 9. Input & Controls Setup
    this.setupInputControls();

    // 10. Launch Satchel UI Overlay Scene
    this.scene.launch('SatchelUI', { campaign: this.campaign });

    // 11. Listen for Chapter & Action Events
    this.setupEventListeners();

    // 12. Display Initial Chapter Welcome Dialogue
    this.updateChapterDialogue();

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
    const container = this.add.container(12, 12);
    container.setDepth(30);

    // Wooden signpost backing
    const signBg = this.add.rectangle(0, 0, 110, 20, 0xB88A58).setOrigin(0, 0);
    signBg.setStrokeStyle(1.5, 0x3B2F2F);
    signBg.setInteractive({ cursor: 'pointer' });

    const signText = this.add.text(55, 10, this.campaign.currentChapter.region, {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#3B2F2F',
    }).setOrigin(0.5);

    // Map pin icon on left
    const pin = this.add.text(8, 10, '📍', { fontSize: '8px' }).setOrigin(0.5);

    container.add([signBg, pin, signText]);

    signBg.on('pointerdown', () => {
      audioManager.playWoodblock();
      this.chapterMapModal.open();
    });

    this.locationSignText = signText;
  }

  private setupDialogueBanner(): void {
    // Sits at bottom of world viewport (y: 156..188, width: 290, height: 28)
    const container = this.add.container(160, 172);
    container.setDepth(40);

    // Parchment speech scroll
    const bg = this.add.rectangle(0, 0, 290, 28, 0xFAF6E8);
    bg.setStrokeStyle(2, 0x3B2F2F);

    // Speech pointer notch pointing towards characters
    const notch = this.add.triangle(100, 14, 0, 0, 6, 6, 12, 0, 0xFAF6E8);
    notch.setStrokeStyle(1.5, 0x3B2F2F);

    // Pip / Acorn Avatar icon
    const avatar = this.add.text(-130, 0, '🌰', { fontSize: '11px' }).setOrigin(0.5);

    // Text content
    const dialogueTxt = this.add.text(-114, 0, '', {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#3B2F2F',
      wordWrap: { width: 245 },
    }).setOrigin(0, 0.5);

    container.add([bg, notch, avatar, dialogueTxt]);
    this.dialogueContainer = container;
    this.dialogueText = dialogueTxt;
    this.dialogueAvatarText = avatar;
  }

  private showDialogue(text: string, icon = '🌰'): void {
    this.dialogueAvatarText.setText(icon);
    this.dialogueText.setText(text);
    this.dialogueContainer.setVisible(true);
  }

  private updateChapterDialogue(): void {
    const ch = this.campaign.currentChapter;
    let text = `Pip: ${ch.objective} (${ch.sightWords.join(' ')})`;

    // Tailored dialogue matching canonical mockups
    if (ch.id === 20) {
      text = 'Pip: Look at everyone we helped! We are honorary junior rangers now 🎖️❤️';
    } else if (ch.id === 16) {
      text = "Pip: Look at those footprints in the snow! Let's trace where they go 🐾❄️";
    } else if (ch.id === 7) {
      text = 'Pip: We can place these wooden gears on the pegs to turn the wheel! Match the sizes ⚙️';
    } else if (ch.id === 8) {
      text = "Pip: Whoa! Those mushrooms glow in the dark! Let's examine them 🍄🔍";
    } else if (ch.id === 3) {
      text = 'Pip: Count the lily pad dots to help our duckling friends cross the brook! 🦆🐾';
    }

    this.showDialogue(text, '🌰');
  }

  private switchChapter(chapterId: number): void {
    this.campaign.startChapter(chapterId);

    // Update backdrop image
    const bgKey = this.getBackdropKeyForChapter(chapterId);
    if (this.textures.exists(bgKey)) {
      this.backdropImage.setTexture(bgKey);
      this.backdropImage.setDisplaySize(320, 192);
    }

    // Toggle overworld animal/item props based on region
    const isForestOverworld = chapterId >= 1 && chapterId <= 5;
    for (const c of this.collectibles) {
      c.sprite.setVisible(isForestOverworld);
    }
    for (const a of this.animals) {
      a.sprite.setVisible(isForestOverworld);
    }

    // Position characters in authentic canonical spots per chapter
    if (chapterId === 20) {
      // Ranger Lodge celebration
      this.playerBody.x = 126;
      this.playerBody.y = 126;
      this.playerSprite.setPosition(126, 126);
      this.pipSprite.setPosition(146, 134);
    } else if (chapterId === 16) {
      // The Pine Ridge winter path
      this.playerBody.x = 122;
      this.playerBody.y = 124;
      this.playerSprite.setPosition(122, 124);
      this.pipSprite.setPosition(186, 130);
    }

    // Update location sign
    this.locationSignText.setText(this.campaign.currentChapter.region);

    // Update dialogue
    this.updateChapterDialogue();

    // Trigger acoustic kalimba chord
    audioManager.playKalimba(chapterId % 5);
  }

  private setupEventListeners(): void {
    // Listen for chapter selection from Trail Map modal
    eventBus.on('chapter:selected', (data: { chapterId: number }) => {
      this.switchChapter(data.chapterId);
    });

    // D-Pad movement event from SatchelUIScene
    eventBus.on('input:dpad', (data: { direction: 'up' | 'down' | 'left' | 'right' }) => {
      this.handleDPadMove(data.direction);
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

  private handleDPadMove(direction: 'up' | 'down' | 'left' | 'right'): void {
    const inputVec = {
      x: direction === 'left' ? -1 : direction === 'right' ? 1 : 0,
      y: direction === 'up' ? -1 : direction === 'down' ? 1 : 0,
    };

    const res = this.movementController.step(this.playerBody, inputVec, 0.1, this.collisionGrid);
    if (res.moved) {
      this.playerSprite.setPosition(this.playerBody.x, this.playerBody.y);
      this.pipCompanion.recordPlayerStep(this.playerBody.x, this.playerBody.y, this.playerBody.facing);
      const targetBc = this.pipCompanion.getTargetBreadcrumb();
      this.pipSprite.setPosition(targetBc.x, targetBc.y);
    }
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
      this.showDialogue('Pip: The wooden gears mesh together smoothly! The waterwheel spins! ⚙️🌊', '⚙️');
      this.scene.pause('WorldScene');
      this.scene.launch('MinigameGearbox');
      return;
    }

    if (ch.id === 3) {
      this.showDialogue('Pip: 1, 2, 3, 4, 5! All the little ducklings safely crossed the pond! 🦆🌸', '🦆');
      this.scene.pause('WorldScene');
      this.scene.launch('MinigameSubitizing');
      return;
    }

    if (ch.id === 12) {
      this.scene.pause('WorldScene');
      this.scene.launch('SketchbookScene');
      return;
    }

    this.showDialogue(`Pip: What a lovely day on ${ch.region}! Let's find ${ch.sightWords[0]}! 🍃`, '🌰');
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

    // Tap-to-move pathfinding
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y >= 192) return; // Satchel bar touches handled by UI
      const accepted = this.inputManager.pointerDown({
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
          { x: pointer.x, y: pointer.y }
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

    // 2. Keyboard Navigation Movement
    let vx = 0;
    let vy = 0;
    if (this.cursors?.left.isDown || this.wasdKeys?.left.isDown) vx -= 1;
    if (this.cursors?.right.isDown || this.wasdKeys?.right.isDown) vx += 1;
    if (this.cursors?.up.isDown || this.wasdKeys?.up.isDown) vy -= 1;
    if (this.cursors?.down.isDown || this.wasdKeys?.down.isDown) vy += 1;

    const isMoving = vx !== 0 || vy !== 0 || this.currentWaypoints.length > 0;

    if (vx !== 0 || vy !== 0) {
      this.currentWaypoints = [];
      const dir: Facing = vx < 0 ? 'left' : vx > 0 ? 'right' : vy < 0 ? 'up' : 'down';
      this.playerBody.facing = dir;
      this.handleDPadMove(dir);

      this.stepSoundTimer += delta;
      if (this.stepSoundTimer > 350) {
        this.stepSoundTimer = 0;
        audioManager.playWoodblock();
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
        const step = Math.min(dist, 1.2);
        this.playerBody.x += (dx / dist) * step;
        this.playerBody.y += (dy / dist) * step;
        this.playerSprite.setPosition(this.playerBody.x, this.playerBody.y);
        this.pipCompanion.recordPlayerStep(this.playerBody.x, this.playerBody.y, this.playerBody.facing);
        const targetBc = this.pipCompanion.getTargetBreadcrumb();
        this.pipSprite.setPosition(targetBc.x, targetBc.y);
      }
    }

    // Update Pip Companion and Camera
    this.pipCompanion.update(isMoving, this.sessionElapsedSeconds, this.isBedtime, delta / 1000);
    this.cameraController.update(this.playerBody.x, this.playerBody.y, delta / 1000);

    // 3. Update Flashlight Lighting Cone in Winter/Cave Chapters
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
    // Show flashlight beam in dark cave or winter chapters (Ch 8, 16)
    if (ch === 8 || ch === 16) {
      this.flashlightGraphics.fillStyle(0xFFEAA7, 0.22);
      this.flashlightGraphics.beginPath();
      this.flashlightGraphics.moveTo(this.playerBody.x, this.playerBody.y);
      this.flashlightGraphics.lineTo(this.playerBody.x + 85, this.playerBody.y - 25);
      this.flashlightGraphics.lineTo(this.playerBody.x + 95, this.playerBody.y + 25);
      this.flashlightGraphics.closePath();
      this.flashlightGraphics.fillPath();
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
