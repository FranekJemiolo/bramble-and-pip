import Phaser from 'phaser';
import { BASE_WIDTH } from '../core/constants';
import { eventBus } from '../core/EventBus';
import type { CampaignManager } from '../core/campaign/CampaignManager';
import { ParentDashboard } from '../ui/ParentDashboard';
import { HowToPlayModal } from '../ui/HowToPlayModal';
import { ChapterMapModal } from '../ui/ChapterMapModal';
import { audioManager } from '../core/audio/AcousticAudioManager';
import { registerCanonicalTextures } from '../render/canonicalAssets';

export class SatchelUIScene extends Phaser.Scene {
  private campaign!: CampaignManager;
  private sessionTimerText!: Phaser.GameObjects.Text;
  private chapterMapModal!: ChapterMapModal;
  private howToPlayModal = new HowToPlayModal();
  private parentDashboard!: ParentDashboard;

  // Drawer overlay container
  private packDrawerContainer?: Phaser.GameObjects.Container;
  private isDrawerOpen = false;

  constructor() {
    super('SatchelUI');
  }

  init(data: { campaign: CampaignManager }): void {
    this.campaign = data.campaign;
    this.chapterMapModal = new ChapterMapModal(this.campaign, (chapterId) => {
      eventBus.emit('chapter:selected', { chapterId });
    });
    this.parentDashboard = new ParentDashboard(this.campaign);
  }

  async create(): Promise<void> {
    // 1. Ensure canonical textures are registered in TextureManager
    await registerCanonicalTextures(this);

    // 2. Ranger Satchel Background (320x96) positioned across bottom at y = 192
    if (this.textures.exists('satchel_bg')) {
      const satchelBg = this.add.image(0, 192, 'satchel_bg').setOrigin(0, 0);
      satchelBg.setDisplaySize(320, 96);
    } else {
      // Fallback leather rect
      const bg = this.add.rectangle(0, 192, 320, 96, 0x8C5832).setOrigin(0, 0);
      bg.setStrokeStyle(3, 0x3B2F2F);
    }

    // 3. Tactile 4-Way Wooden D-Pad on the Left
    this.setupDPadButtons();

    // 4. Interactive Pip Cameo Medallion in Center
    this.setupPipMedallion();

    // 5. Tactile Green Look/Talk Button and Orange Pack Button on the Right
    this.setupActionButtons();

    // 6. Session Clock Text integrated on carved titleplate
    this.sessionTimerText = this.add.text(BASE_WIDTH / 2, 201, '15:00', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#3B2F2F',
    }).setOrigin(0.5);

    // 7. Global hooks for automated tests & debug access
    if (typeof window !== 'undefined') {
      const win = window as unknown as {
        __OPEN_PARENT_DASHBOARD__?: () => void;
        __OPEN_GUIDE__?: () => void;
        __OPEN_CHAPTER_MAP__?: () => void;
      };
      win.__OPEN_PARENT_DASHBOARD__ = () => this.parentDashboard.open();
      win.__OPEN_GUIDE__ = () => this.howToPlayModal.open();
      win.__OPEN_CHAPTER_MAP__ = () => this.chapterMapModal.open();
    }

    // Listen for chapter selection
    eventBus.on('chapter:selected', () => {
      this.closePackDrawer();
    });
  }

  private setupDPadButtons(): void {
    // D-Pad Hitbox Coordinates: Center (58, 240)
    const dirs: Array<{ dir: 'up' | 'down' | 'left' | 'right'; x: number; y: number; w: number; h: number }> = [
      { dir: 'up', x: 58, y: 218, w: 26, h: 22 },
      { dir: 'down', x: 58, y: 262, w: 26, h: 22 },
      { dir: 'left', x: 36, y: 240, w: 22, h: 26 },
      { dir: 'right', x: 80, y: 240, w: 22, h: 26 },
    ];

    for (const d of dirs) {
      const zone = this.add.zone(d.x, d.y, d.w, d.h).setInteractive();

      // Soft visual press highlight
      const highlight = this.add.rectangle(d.x, d.y, d.w - 4, d.h - 4, 0xFAF6E8, 0.25);
      highlight.setVisible(false);

      zone.on('pointerdown', () => {
        highlight.setVisible(true);
        audioManager.playWoodblock();
        eventBus.emit('input:dpad', { direction: d.dir });
      });

      zone.on('pointerup', () => {
        highlight.setVisible(false);
      });

      zone.on('pointerout', () => {
        highlight.setVisible(false);
      });
    }
  }

  private setupPipMedallion(): void {
    // Pip circular cameo medallion centered at (x: 160, y: 242), radius 24px
    const pipZone = this.add.circle(160, 242, 24).setInteractive({ cursor: 'pointer' });

    // Subtle press pulse effect
    const glowRing = this.add.circle(160, 242, 25);
    glowRing.setStrokeStyle(2, 0xDCE38A, 0.5);
    glowRing.setVisible(false);

    pipZone.on('pointerdown', () => {
      glowRing.setVisible(true);
      audioManager.playPipChirrup();
      audioManager.playKalimba(2);
      eventBus.emit('pip:interact');
    });

    pipZone.on('pointerup', () => {
      glowRing.setVisible(false);
    });

    pipZone.on('pointerout', () => {
      glowRing.setVisible(false);
    });
  }

  private setupActionButtons(): void {
    // 1. Look / Talk Button (Green circular button on top-right, x: 275, y: 220, r: 18)
    const lookZone = this.add.circle(275, 220, 18).setInteractive({ cursor: 'pointer' });
    const lookRing = this.add.circle(275, 220, 19).setStrokeStyle(2, 0xFAF6E8, 0.6).setVisible(false);

    lookZone.on('pointerdown', () => {
      lookRing.setVisible(true);
      audioManager.playWoodblock();
      eventBus.emit('action:look_talk');
    });

    lookZone.on('pointerup', () => lookRing.setVisible(false));
    lookZone.on('pointerout', () => lookRing.setVisible(false));

    // 2. Pack Button (Orange circular button on bottom-right, x: 242, y: 260, r: 18)
    const packZone = this.add.circle(242, 260, 18).setInteractive({ cursor: 'pointer' });
    const packRing = this.add.circle(242, 260, 19).setStrokeStyle(2, 0xFAF6E8, 0.6).setVisible(false);

    packZone.on('pointerdown', () => {
      packRing.setVisible(true);
      audioManager.playWoodblock();
      this.togglePackDrawer();
    });

    packZone.on('pointerup', () => packRing.setVisible(false));
    packZone.on('pointerout', () => packRing.setVisible(false));
  }

  private togglePackDrawer(): void {
    if (this.isDrawerOpen) {
      this.closePackDrawer();
    } else {
      this.openPackDrawer();
    }
  }

  private openPackDrawer(): void {
    if (this.packDrawerContainer) {
      this.packDrawerContainer.destroy();
    }

    this.isDrawerOpen = true;
    const container = this.add.container(160, 115);

    // Parchment drawer backdrop (width: 280, height: 110)
    const bg = this.add.rectangle(0, 0, 280, 110, 0xFAF6E8);
    bg.setStrokeStyle(3, 0x5C4033);

    // Header label
    const header = this.add.text(0, -42, '🎒 RANGER PACK & ACTIVITIES', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#3B2F2F',
    }).setOrigin(0.5);

    // Close button (X)
    const closeBtn = this.add.rectangle(125, -42, 16, 14, 0x8C5832).setInteractive({ cursor: 'pointer' });
    closeBtn.setStrokeStyle(1, 0x3B2F2F);
    const closeTxt = this.add.text(125, -42, '✕', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#FAF6E8',
    }).setOrigin(0.5);
    closeBtn.on('pointerdown', () => this.closePackDrawer());

    // 4 Main Action Buttons
    const buttons = [
      { label: '🗺️ MAP', bgCol: 0x4A7032, x: -84, cb: () => this.chapterMapModal.open() },
      { label: '✏️ DRAW', bgCol: 0x789E3E, x: -28, cb: () => {
        this.closePackDrawer();
        this.scene.pause('WorldScene');
        this.scene.launch('SketchbookScene');
      }},
      { label: '📖 GUIDE', bgCol: 0x2C3E50, x: 28, cb: () => this.howToPlayModal.open() },
      { label: '🛡️ ADULT', bgCol: 0x8C5832, x: 84, cb: () => this.parentDashboard.open() },
    ];

    const btnObjects: Phaser.GameObjects.GameObject[] = [];
    for (const b of buttons) {
      const btn = this.add.rectangle(b.x, -16, 50, 22, b.bgCol).setInteractive({ cursor: 'pointer' });
      btn.setStrokeStyle(1.5, 0x3B2F2F);
      const txt = this.add.text(b.x, -16, b.label, {
        fontFamily: 'monospace',
        fontSize: '7px',
        color: '#FAF6E8',
      }).setOrigin(0.5);

      btn.on('pointerdown', () => {
        audioManager.playWoodblock();
        b.cb();
      });

      btnObjects.push(btn, txt);
    }

    // Satchel Item Inventory Preview (3 slots along bottom of drawer)
    const slots = this.campaign.satchel;
    const slotObjects: Phaser.GameObjects.GameObject[] = [];
    const slotStartX = -60;
    const slotSpacing = 60;

    for (let i = 0; i < 3; i++) {
      const sx = slotStartX + i * slotSpacing;
      const sy = 24;

      const slotBox = this.add.rectangle(sx, sy, 48, 26, 0xE4EDF0);
      slotBox.setStrokeStyle(1.5, 0xB88A58);

      const slotData = slots[i];
      if (slotData) {
        const itemTxt = this.add.text(sx, sy - 4, slotData.item.name.slice(0, 6).toUpperCase(), {
          fontFamily: 'monospace',
          fontSize: '6px',
          color: '#2C3E50',
        }).setOrigin(0.5);

        const countTxt = this.add.text(sx, sy + 5, `x${slotData.count}`, {
          fontFamily: 'monospace',
          fontSize: '6px',
          color: '#8C5832',
        }).setOrigin(0.5);

        slotObjects.push(slotBox, itemTxt, countTxt);
      } else {
        const emptyTxt = this.add.text(sx, sy, 'EMPTY', {
          fontFamily: 'monospace',
          fontSize: '6px',
          color: '#A8C4D0',
        }).setOrigin(0.5);
        slotObjects.push(slotBox, emptyTxt);
      }
    }

    container.add([bg, header, closeBtn, closeTxt, ...btnObjects, ...slotObjects]);
    this.packDrawerContainer = container;
  }

  private closePackDrawer(): void {
    if (this.packDrawerContainer) {
      this.packDrawerContainer.destroy();
      this.packDrawerContainer = undefined;
    }
    this.isDrawerOpen = false;
  }

  updateSessionTimer(secondsRemaining: number): void {
    const mins = Math.floor(secondsRemaining / 60);
    const secs = Math.floor(secondsRemaining % 60);
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    if (this.sessionTimerText) {
      this.sessionTimerText.setText(formatted);
      if (secondsRemaining <= 180) {
        // Warm sunset amber color in last 3 minutes
        this.sessionTimerText.setColor('#C96E2E');
      }
    }
  }
}
