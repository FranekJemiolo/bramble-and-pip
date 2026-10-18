import Phaser from 'phaser';
import {
  BASE_HEIGHT,
  BASE_WIDTH,
  DIALOGUE,
  MOVEMENT,
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
import { NonReaderDialogueBox } from '../ui/NonReaderDialogueBox';
import { eventBus } from '../core/EventBus';
import type { Vec2 } from '../core/math';

export interface GameStateInspection {
  player: { x: number; y: number; facing: Facing };
  pip: { x: number; y: number; state: string };
  chapter: number;
  season: string;
  sessionElapsedSeconds: number;
  isBedtime: boolean;
  satchelCount: number;
}

export class WorldScene extends Phaser.Scene {
  private textureBank = new TextureBank();
  private campaign = new CampaignManager();
  private dialogueBox = new NonReaderDialogueBox();

  private movementController!: KinematicMovementController;
  private cameraController!: PixelPerfectCameraController;
  private pipCompanion!: PipCompanion;
  private pathfinder!: TilePathfindingManager;
  private inputManager!: TolerantInputManager;
  private collisionGrid!: CollisionGrid;

  private playerBody: KinBody = { x: 128, y: 128, facing: 'down' };
  private currentWaypoints: Vec2[] = [];

  private playerSprite!: Phaser.GameObjects.Sprite;
  private pipSprite!: Phaser.GameObjects.Sprite;

  private sessionElapsedSeconds = 0;
  private isBedtime = false;
  private isSunsetTriggered = false;

  // Dialogue Box GameObjects
  private dialogueContainer!: Phaser.GameObjects.Container;
  private dialogueWordsText!: Phaser.GameObjects.Text;
  private dialoguePictogramRect!: Phaser.GameObjects.Rectangle;

  // Map dimensions
  private readonly mapTilesX = 30;
  private readonly mapTilesY = 24;
  private readonly tileSize = 16;

  constructor() {
    super('WorldScene');
  }

  preload(): void {
    this.bakeProceduralTextures();
  }

  private bakeProceduralTextures(): void {
    // 1. Ranger walk cycles
    for (const dir of ['down', 'up', 'left', 'right'] as const) {
      for (let f = 0; f < 4; f++) {
        this.textureBank.register(`ranger_${dir}_${f}`, SpriteGenerator.generateRangerFrame(dir, f));
      }
    }

    // 2. Pip frames
    for (const state of ['FOLLOWING', 'IDLE_CURIOUS', 'INSPECTING', 'YAWNING', 'SLEEPING'] as const) {
      for (let f = 0; f < 4; f++) {
        this.textureBank.register(`pip_${state}_${f}`, SpriteGenerator.generatePipFrame(state, f));
      }
    }

    // 3. Environment tiles
    this.textureBank.register('tile_grass', TileGenerator.generateAutotile(15, 5, 4));
    this.textureBank.register('tile_dirt', TileGenerator.generateAutotile(15, 8, 3));
    this.textureBank.register('tile_water', TileGenerator.generateWaterTile(0));
    this.textureBank.register('tile_tree', TileGenerator.generatePineTree());
    this.textureBank.register('tile_watermill', TileGenerator.generateCabinProp('wall'));
    this.textureBank.register('tile_lilypad', TileGenerator.generateLilyPad(3));

    // Upload baked textures into Phaser
    for (const key of [
      'ranger_down_0', 'ranger_down_1', 'ranger_down_2', 'ranger_down_3',
      'ranger_up_0', 'ranger_up_1', 'ranger_up_2', 'ranger_up_3',
      'ranger_left_0', 'ranger_left_1', 'ranger_left_2', 'ranger_left_3',
      'ranger_right_0', 'ranger_right_1', 'ranger_right_2', 'ranger_right_3',
      'pip_FOLLOWING_0', 'pip_FOLLOWING_1', 'pip_FOLLOWING_2', 'pip_FOLLOWING_3',
      'pip_IDLE_CURIOUS_0', 'pip_INSPECTING_0', 'pip_YAWNING_0', 'pip_SLEEPING_0',
      'tile_grass', 'tile_dirt', 'tile_water', 'tile_tree', 'tile_watermill', 'tile_lilypad',
    ]) {
      this.textureBank.uploadToPhaser(this, key);
    }
  }

  create(): void {
    // Build map and collision grid
    this.buildWorldGrid();

    // Controllers
    const startX = 8 * 16;
    const startY = 8 * 16;
    this.playerBody = { x: startX, y: startY, facing: 'down' };

    this.movementController = new KinematicMovementController({
      walkSpeed: MOVEMENT.WALK_SPEED_PX_PER_S,
      cornerTolerance: MOVEMENT.CORNER_SLIDE_TOLERANCE_PX,
    });

    this.pipCompanion = new PipCompanion(startX, startY);
    this.pathfinder = new TilePathfindingManager(this.collisionGrid);

    this.cameraController = new PixelPerfectCameraController(
      BASE_WIDTH,
      BASE_HEIGHT,
      this.mapTilesX * this.tileSize,
      this.mapTilesY * this.tileSize,
      startX,
      startY
    );

    // Create Sprites
    this.playerSprite = this.add.sprite(startX, startY, 'ranger_down_0').setOrigin(0.5, 0.7);
    this.playerSprite.setDepth(10);

    this.pipSprite = this.add.sprite(startX, startY, 'pip_FOLLOWING_0').setOrigin(0.5, 0.5);
    this.pipSprite.setDepth(9);

    // Setup tolerant touch / click input
    this.inputManager = new TolerantInputManager({
      viewport: () => ({ width: BASE_WIDTH, height: BASE_HEIGHT }),
    });
    this.setupInputHandlers();

    // Create dialogue UI container
    this.createDialogueBoxUI();

    // Launch Satchel UI overlay
    this.scene.launch('SatchelUI', { campaign: this.campaign });

    // Expose global test inspection hooks
    this.exposeGlobalHooks();

    // Show initial chapter prompt
    this.time.delayedCall(500, () => {
      const ch = this.campaign.currentChapter;
      this.dialogueBox.open({
        speaker: 'Pip',
        pictogramKey: ch.pictogramKey,
        text: ch.objective,
        words: [...ch.sightWords],
      });
      this.updateDialogueBoxUI();
    });
  }

  private buildWorldGrid(): void {
    const cells = new Uint8Array(this.mapTilesX * this.mapTilesY);

    for (let y = 0; y < this.mapTilesY; y++) {
      for (let x = 0; x < this.mapTilesX; x++) {
        const isBorder = x === 0 || x === this.mapTilesX - 1 || y === 0 || y === this.mapTilesY - 1;
        const isRiver = (x >= 18 && x <= 20) && !(y === 10 || y === 11);
        const isGrove = (x >= 22 && y <= 6);
        const isMill = (x === 17 && y >= 14 && y <= 16);

        const isSolid = isBorder || isRiver || isGrove || isMill;
        cells[y * this.mapTilesX + x] = isSolid ? 1 : 0;

        const px = x * this.tileSize;
        const py = y * this.tileSize;
        if (isRiver) {
          this.add.image(px, py, 'tile_water').setOrigin(0, 0);
        } else if (isGrove || isBorder) {
          this.add.image(px, py, 'tile_tree').setOrigin(0, 0);
        } else if (isMill) {
          this.add.image(px, py, 'tile_watermill').setOrigin(0, 0);
        } else if (x === 19 && (y === 10 || y === 11)) {
          this.add.image(px, py, 'tile_lilypad').setOrigin(0, 0);
        } else {
          this.add.image(px, py, (x + y) % 2 === 0 ? 'tile_grass' : 'tile_dirt').setOrigin(0, 0);
        }
      }
    }

    this.collisionGrid = new CollisionGrid(this.mapTilesX, this.mapTilesY, cells);
  }

  private setupInputHandlers(): void {
    this.inputManager.subscribe((sample) => {
      if (sample.phase === 'down') {
        const scroll = this.cameraController.scroll();
        const worldTarget = { x: sample.x + scroll.x, y: sample.y + scroll.y };
        const nav = this.pathfinder.navigate(
          { x: this.playerBody.x, y: this.playerBody.y },
          worldTarget
        );
        if (nav && nav.length > 0) {
          this.currentWaypoints = nav;
        }
      }
    });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.dialogueBox.isOpen) {
        if (this.dialogueBox.advance()) {
          this.hideDialogueBoxUI();
        }
        return;
      }

      const pointerType = (p.event as PointerEvent)?.pointerType ?? 'touch';
      this.inputManager.pointerDown({
        id: p.id,
        pointerType,
        x: p.x,
        y: p.y,
        timeMs: Date.now(),
      });
    });

    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      const pointerType = (p.event as PointerEvent)?.pointerType ?? 'touch';
      this.inputManager.pointerUp({
        id: p.id,
        pointerType,
        x: p.x,
        y: p.y,
        timeMs: Date.now(),
      });
    });
  }

  private createDialogueBoxUI(): void {
    this.dialogueContainer = this.add.container(0, 0).setDepth(100);

    const bg = this.add.rectangle(BASE_WIDTH / 2, BASE_HEIGHT - 30, BASE_WIDTH - 20, 48, 0xF4EFEA);
    bg.setStrokeStyle(2, 0x6E4A2F);

    this.dialoguePictogramRect = this.add.rectangle(36, BASE_HEIGHT - 30, DIALOGUE.PICTOGRAM_PX, DIALOGUE.PICTOGRAM_PX, 0xC49A6C);
    this.dialoguePictogramRect.setStrokeStyle(1, 0x2A3E2C);

    this.dialogueWordsText = this.add.text(64, BASE_HEIGHT - 38, '', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#2A3E2C',
      fontStyle: 'bold',
    });

    this.dialogueContainer.add([bg, this.dialoguePictogramRect, this.dialogueWordsText]);
    this.dialogueContainer.setVisible(false);
  }

  private updateDialogueBoxUI(): void {
    if (!this.dialogueBox.isOpen) {
      this.hideDialogueBoxUI();
      return;
    }
    this.dialogueWordsText.setText(this.dialogueBox.words.join(' '));
    this.dialogueContainer.setVisible(true);
  }

  private hideDialogueBoxUI(): void {
    this.dialogueContainer.setVisible(false);
  }

  override update(_time: number, delta: number): void {
    const dt = delta / 1000;
    this.sessionElapsedSeconds += dt;

    const satchelScene = this.scene.get('SatchelUI') as { updateSessionTimer?: (s: number) => void };
    const secondsRemaining = Math.max(0, SESSION.DAILY_LIMIT_SECONDS - this.sessionElapsedSeconds);
    satchelScene?.updateSessionTimer?.(secondsRemaining);

    if (this.sessionElapsedSeconds >= SESSION.SUNSET_START_SECONDS && !this.isSunsetTriggered) {
      this.isSunsetTriggered = true;
      eventBus.emit('sunset:start', { durationSeconds: SESSION.SUNSET_DURATION_SECONDS });
    }

    if (this.sessionElapsedSeconds >= SESSION.DAILY_LIMIT_SECONDS && !this.isBedtime) {
      this.isBedtime = true;
      this.scene.pause();
      this.scene.launch('BedtimeScene');
      return;
    }

    // Kinematic waypoint navigation
    const prevX = this.playerBody.x;
    const prevY = this.playerBody.y;
    let isMoving = false;

    const nextWp = this.currentWaypoints[0];
    if (nextWp) {
      const dx = nextWp.x - this.playerBody.x;
      const dy = nextWp.y - this.playerBody.y;
      const distToWp = Math.hypot(dx, dy);

      if (distToWp < 3) {
        this.currentWaypoints.shift();
      } else {
        const res = this.movementController.step(this.playerBody, { x: dx, y: dy }, dt, this.collisionGrid);
        isMoving = res.moved;
      }
    } else {
      this.movementController.step(this.playerBody, { x: 0, y: 0 }, dt, this.collisionGrid);
    }

    // Pip Companion update
    if (isMoving) {
      this.pipCompanion.recordPlayerStep(
        this.playerBody.x,
        this.playerBody.y,
        this.playerBody.facing
      );
    }
    this.pipCompanion.update(isMoving, this.sessionElapsedSeconds, this.isBedtime, dt);

    // Update player sprite position and texture
    this.playerSprite.setPosition(this.playerBody.x, this.playerBody.y);
    const walkFrame = Math.floor((this.sessionElapsedSeconds * 6) % 4);
    const rangerTex = isMoving
      ? `ranger_${this.playerBody.facing}_${walkFrame}`
      : `ranger_${this.playerBody.facing}_0`;
    if (this.textures.exists(rangerTex)) {
      this.playerSprite.setTexture(rangerTex);
    }

    // Update Pip sprite position and texture
    this.pipSprite.setPosition(this.pipCompanion.x, this.pipCompanion.y);
    const pipTex = `pip_${this.pipCompanion.currentState}_0`;
    if (this.textures.exists(pipTex)) {
      this.pipSprite.setTexture(pipTex);
    }

    // Camera follow with deadzone
    const scroll = this.cameraController.update(this.playerBody.x, this.playerBody.y, dt);
    this.cameras.main.setScroll(scroll.x, scroll.y);

    // Check Hotspots when player moved
    if (prevX !== this.playerBody.x || prevY !== this.playerBody.y) {
      this.checkHotspots();
    }
  }

  private checkHotspots(): void {
    const tileX = Math.floor(this.playerBody.x / this.tileSize);
    const tileY = Math.floor(this.playerBody.y / this.tileSize);

    // Stepping stones hotspot (river bridge at 19, 10 or 19, 11)
    if (tileX === 19 && (tileY === 10 || tileY === 11)) {
      if (this.campaign.currentChapter.puzzleType === 'subitizing') {
        this.openPuzzleOverlay('stepping_stones');
      }
    }

    // Watermill hotspot (near 16, 14)
    if (tileX === 16 && (tileY >= 14 && tileY <= 16)) {
      if (this.campaign.currentChapter.puzzleType === 'gearbox') {
        this.openPuzzleOverlay('mossy_gearbox');
      }
    }
  }

  private openPuzzleOverlay(type: 'mossy_gearbox' | 'stepping_stones'): void {
    this.scene.pause();
    this.scene.launch('PuzzleOverlayScene', {
      puzzleType: type,
      onComplete: () => {
        this.campaign.completeCurrentChapter();
        const nextCh = this.campaign.currentChapter;
        this.dialogueBox.open({
          speaker: 'Pip',
          pictogramKey: nextCh.pictogramKey,
          text: nextCh.objective,
          words: [...nextCh.sightWords],
        });
        this.updateDialogueBoxUI();
      },
    });
  }

  private exposeGlobalHooks(): void {
    if (typeof window !== 'undefined') {
      (window as unknown as { __GAME__: Phaser.Game }).__GAME__ = this.game;
      (window as unknown as { __GAME_STATE__: () => GameStateInspection }).__GAME_STATE__ = () => ({
        player: {
          x: this.playerBody.x,
          y: this.playerBody.y,
          facing: this.playerBody.facing,
        },
        pip: {
          x: this.pipCompanion.x,
          y: this.pipCompanion.y,
          state: this.pipCompanion.currentState,
        },
        chapter: this.campaign.currentChapter.id,
        season: this.campaign.currentSeason,
        sessionElapsedSeconds: this.sessionElapsedSeconds,
        isBedtime: this.isBedtime,
        satchelCount: this.campaign.satchel.length,
      });
    }
  }
}
