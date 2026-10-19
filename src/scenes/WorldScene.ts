import Phaser from 'phaser';
import {
  BASE_WIDTH,
  SESSION,
} from '../core/constants';
import {
  KinematicMovementController,
  type CollisionGrid,
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
import {
  MAP_DEFINITIONS,
  createCollisionGridForMap,
  getMapIdForChapter,
  type MapExit,
  type MapId,
} from '../core/world/mapData';

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
  private transitionBackdropImage?: Phaser.GameObjects.Image;
  private isTransitioning = false;
  private exitCooldownTimer = 0;

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

  // Current active map definition
  private currentMapId: MapId = 'whispering_woods';

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
    this.currentMapId = getMapIdForChapter(this.campaign.currentChapter.id);
    const mapDef = MAP_DEFINITIONS[this.currentMapId];

    this.cameras.main.setViewport(0, 0, BASE_WIDTH, 192);
    this.cameras.main.setBounds(0, 0, BASE_WIDTH, 192);
    this.movementController = new KinematicMovementController({
      walkSpeed: 64,
      halfW: 5,
      halfH: 3,
    });
    this.playerBody = {
      x: mapDef.defaultSpawn.x,
      y: mapDef.defaultSpawn.y,
      facing: 'right',
    };
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

    // 2. Setup Walkable Collision Grid for Current Map
    this.collisionGrid = createCollisionGridForMap(this.currentMapId);
    this.pathfinder = new TilePathfindingManager(this.collisionGrid);

    // 3. Render Canonical Map Backdrop (320x192)
    this.backdropImage = this.add.image(0, 0, mapDef.textureKey).setOrigin(0, 0);
    this.backdropImage.setDisplaySize(BASE_WIDTH, 192);
    this.backdropImage.setDepth(0);

    this.transitionBackdropImage = this.add.image(0, 0, mapDef.textureKey).setOrigin(0, 0);
    this.transitionBackdropImage.setDisplaySize(BASE_WIDTH, 192);
    this.transitionBackdropImage.setDepth(1);
    this.transitionBackdropImage.setVisible(false);

    // 4. Setup Flashlight Lighting Cone
    this.flashlightGraphics = this.add.graphics();
    this.flashlightGraphics.setDepth(20);

    // 5. Setup Character Sprites (origin at feet for natural depth and obstacle alignment)
    this.playerSprite = this.add.sprite(this.playerBody.x, this.playerBody.y, 'ranger_right_0');
    this.playerSprite.setOrigin(0.5, 0.9);
    this.playerSprite.setDepth(25);
    this.playerSprite.setVisible(true);

    this.pipSprite = this.add.sprite(this.playerBody.x - 16, this.playerBody.y, 'pip_FOLLOWING_0');
    this.pipSprite.setOrigin(0.5, 0.9);
    this.pipSprite.setDepth(24);
    this.pipSprite.setVisible(true);

    // 6. Setup Interactive Animals & Collectibles
    this.spawnWoodlandWildlife();

    // 7. Setup Carved Wooden Location Banner Clickzone (Top-Left)
    this.setupLocationSign();

    // 8. Setup Dynamic Dialogue Banner
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

  private loadMap(mapId: MapId, spawn?: { x: number; y: number }): void {
    this.currentMapId = mapId;
    const def = MAP_DEFINITIONS[mapId] ?? MAP_DEFINITIONS.whispering_woods;

    this.collisionGrid = createCollisionGridForMap(mapId);
    this.pathfinder = new TilePathfindingManager(this.collisionGrid);

    if (this.backdropImage) {
      this.backdropImage.setTexture(def.textureKey);
      this.backdropImage.setDisplaySize(BASE_WIDTH, 192);
      this.backdropImage.setPosition(0, 0);
    }
    if (this.transitionBackdropImage) {
      this.transitionBackdropImage.setVisible(false);
    }

    const targetPos = spawn ?? def.defaultSpawn;
    this.playerBody.x = targetPos.x;
    this.playerBody.y = targetPos.y;
    if (this.playerSprite) {
      this.playerSprite.setPosition(this.playerBody.x, this.playerBody.y);
    }
    if (this.pipCompanion) {
      this.pipCompanion.reset(this.playerBody.x - 16, this.playerBody.y, this.playerBody.facing);
    }
    if (this.pipSprite) {
      this.pipSprite.setPosition(this.playerBody.x - 16, this.playerBody.y);
    }
    this.currentWaypoints = [];

    if (this.locationSignText && def) {
      this.locationSignText.setText(def.displayName);
    }
    this.setupSceneHotspots();
    this.exitCooldownTimer = 600;
  }

  private transitionToMap(exit: MapExit): void {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.exitCooldownTimer = 600;
    this.currentWaypoints = [];

    const targetDef = MAP_DEFINITIONS[exit.targetMap];
    if (!targetDef) {
      this.isTransitioning = false;
      return;
    }

    // Doorway transition (e.g. cabin entrance/exit) or chapter jump: warm hearth cross-fade
    if (exit.direction === 'door') {
      audioManager.playKalimba(2);
      this.cameras.main.fadeOut(220, 24, 18, 12);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.loadMap(exit.targetMap, exit.targetSpawn);
        this.cameras.main.fadeIn(260, 24, 18, 12);
        this.time.delayedCall(280, () => {
          this.exitCooldownTimer = 600;
          this.isTransitioning = false;
        });
      });
      return;
    }

    // Directional Screen Slide (east / west / north / south)
    audioManager.playKalimba(3);

    if (this.transitionBackdropImage && this.backdropImage) {
      this.transitionBackdropImage.setTexture(targetDef.textureKey);
      this.transitionBackdropImage.setDisplaySize(BASE_WIDTH, 192);
      this.transitionBackdropImage.setVisible(true);

      const isEast = exit.direction === 'east';
      const isWest = exit.direction === 'west';
      const isSouth = exit.direction === 'south';
      const isNorth = exit.direction === 'north';

      // Start position of incoming backdrop
      const initIncomingX = isEast ? BASE_WIDTH : isWest ? -BASE_WIDTH : 0;
      const initIncomingY = isSouth ? 192 : isNorth ? -192 : 0;
      this.transitionBackdropImage.setPosition(initIncomingX, initIncomingY);

      // Target positions for current backdrop
      const targetCurrX = isEast ? -BASE_WIDTH : isWest ? BASE_WIDTH : 0;
      const targetCurrY = isSouth ? -192 : isNorth ? 192 : 0;

      // Start and end positions for Bramble & Pip
      const targetPlayerX = exit.targetSpawn.x;
      const targetPlayerY = exit.targetSpawn.y;
      const facing: Facing = isEast ? 'right' : isWest ? 'left' : isSouth ? 'down' : 'up';
      this.playerBody.facing = facing;

      // Animate current backdrop out
      this.tweens.add({
        targets: this.backdropImage,
        x: targetCurrX,
        y: targetCurrY,
        duration: 400,
        ease: 'Cubic.easeInOut',
      });

      // Animate incoming backdrop in
      this.tweens.add({
        targets: this.transitionBackdropImage,
        x: 0,
        y: 0,
        duration: 400,
        ease: 'Cubic.easeInOut',
      });

      // Subtle flip/fade on carved location banner
      if (this.locationSignText) {
        this.tweens.add({
          targets: this.locationSignText,
          alpha: 0,
          duration: 150,
          onComplete: () => {
            this.locationSignText.setText(targetDef.displayName);
            this.tweens.add({
              targets: this.locationSignText,
              alpha: 1,
              duration: 200,
            });
          },
        });
      }

      let walkAnimTimer = 0;
      this.tweens.add({
        targets: this.playerSprite,
        x: targetPlayerX,
        y: targetPlayerY,
        duration: 400,
        ease: 'Linear',
        onUpdate: () => {
          this.playerBody.x = this.playerSprite.x;
          this.playerBody.y = this.playerSprite.y;
          walkAnimTimer += 16;
          const frame = Math.floor(walkAnimTimer / 120) % 4;
          this.playerSprite.setTexture(`ranger_${facing}_${frame}`);
          this.pipSprite.setTexture(`pip_FOLLOWING_${frame}`);
          const pipOffset = isEast ? -16 : isWest ? 16 : 0;
          const pipOffsetY = isSouth ? -16 : isNorth ? 16 : 0;
          this.pipSprite.setPosition(this.playerSprite.x + pipOffset, this.playerSprite.y + pipOffsetY);
        },
        onComplete: () => {
          this.loadMap(exit.targetMap, exit.targetSpawn);
          this.backdropImage.setPosition(0, 0);
          this.transitionBackdropImage?.setVisible(false);
          this.exitCooldownTimer = 600;
          this.isTransitioning = false;
        },
      });
    } else {
      this.loadMap(exit.targetMap, exit.targetSpawn);
      this.exitCooldownTimer = 600;
      this.isTransitioning = false;
    }
  }

  private switchChapter(chapterId: number): void {
    this.campaign.startChapter(chapterId);
    const targetMap = getMapIdForChapter(chapterId);
    if (this.currentMapId === targetMap) {
      this.updateChapterDialogue();
      audioManager.playKalimba(chapterId % 5);
      return;
    }

    if (this.isTransitioning) {
      this.loadMap(targetMap);
      this.updateChapterDialogue();
      return;
    }

    this.isTransitioning = true;
    audioManager.playKalimba(chapterId % 5);
    this.cameras.main.fadeOut(200, 20, 16, 12);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.loadMap(targetMap);
      this.updateChapterDialogue();
      this.cameras.main.fadeIn(250, 20, 16, 12);
      this.time.delayedCall(270, () => {
        this.isTransitioning = false;
      });
    });
  }

  private setupSceneHotspots(): void {
    this.hotspotZones.forEach((z) => z.destroy());
    this.hotspotZones = [];

    const def = MAP_DEFINITIONS[this.currentMapId];
    if (!def) return;

    for (const spot of def.hotspots) {
      const z = this.add.zone(spot.x, spot.y, spot.radius * 2, spot.radius * 2)
        .setOrigin(0.5)
        .setDepth(22)
        .setInteractive({ cursor: 'pointer' });

      z.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation?.();
        if (spot.soundType === 'woodblock') audioManager.playWoodblock();
        else if (spot.soundType === 'kalimba') audioManager.playKalimba(3);
        else if (spot.soundType === 'chime') audioManager.playChime();

        if (spot.id === 'gear_chest' || spot.id === 'waterwheel') {
          if (this.campaign.currentChapter.id === 7) {
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
        } else if (spot.id === 'stepping_stones') {
          if (this.campaign.currentChapter.id === 3) {
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
        }

        this.showDialogue(spot.dialogueText, '🔍');
      });

      this.hotspotZones.push(z);
    }
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
      // 0. Ignore if scene transition is currently playing
      if (this.isTransitioning) return;

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
    if (this.isTransitioning) {
      return;
    }

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
        const nx = dx / dist;
        const ny = dy / dist;
        const dir: Facing = Math.abs(nx) >= Math.abs(ny) ? (nx > 0 ? 'right' : 'left') : (ny > 0 ? 'down' : 'up');
        this.playerBody.facing = dir;

        const dtSec = Math.min(delta / 1000, 0.05);
        const res = this.movementController.step(this.playerBody, { x: nx, y: ny }, dtSec, this.collisionGrid);
        if (!res.moved) {
          this.currentWaypoints = [];
        }
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

    // Check map exits with smooth transition
    if (this.exitCooldownTimer > 0) {
      this.exitCooldownTimer -= delta;
    }
    const currentDef = MAP_DEFINITIONS[this.currentMapId];
    if (currentDef && currentDef.exits.length > 0 && !this.isTransitioning && this.exitCooldownTimer <= 0 && isMoving) {
      for (const exit of currentDef.exits) {
        let matchesDirection = true;
        if (exit.direction === 'east') {
          matchesDirection = vx > 0 || (this.currentWaypoints.length > 0 && this.currentWaypoints[0].x > this.playerBody.x);
        } else if (exit.direction === 'west') {
          matchesDirection = vx < 0 || (this.currentWaypoints.length > 0 && this.currentWaypoints[0].x < this.playerBody.x);
        } else if (exit.direction === 'south') {
          matchesDirection = vy > 0 || (this.currentWaypoints.length > 0 && this.currentWaypoints[0].y > this.playerBody.y);
        } else if (exit.direction === 'north') {
          matchesDirection = vy < 0 || (this.currentWaypoints.length > 0 && this.currentWaypoints[0].y < this.playerBody.y);
        }
        if (!matchesDirection) continue;

        const exitPx = exit.x * 16 + 8;
        const exitPy = exit.y * 16 + 8;
        const trigRadius = exit.radius ?? 20;
        if (Math.hypot(this.playerBody.x - exitPx, this.playerBody.y - exitPy) < trigRadius) {
          this.transitionToMap(exit);
          break;
        }
      }
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

    if (px >= 320 && py < 192 && this.currentMapId !== 'mossy_gearbox' && !this.isTransitioning) {
      this.loadMap('mossy_gearbox');
    } else if (px >= 320 && py >= 192 && this.currentMapId !== 'pine_ridge' && !this.isTransitioning) {
      this.loadMap('pine_ridge');
    } else if (px < 320 && py >= 192 && this.currentMapId !== 'mossy_hollow' && !this.isTransitioning) {
      this.loadMap('mossy_hollow');
    }

    const def = MAP_DEFINITIONS[this.currentMapId];
    if (this.locationSignText && def) {
      if (this.locationSignText.text !== def.displayName) {
        this.locationSignText.setText(def.displayName);
      }
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
