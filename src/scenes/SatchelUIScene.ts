import Phaser from 'phaser';
import { BASE_WIDTH, INPUT } from '../core/constants';
import { eventBus } from '../core/EventBus';
import type { CampaignManager } from '../core/campaign/CampaignManager';
import { ParentDashboard } from '../ui/ParentDashboard';


export class SatchelUIScene extends Phaser.Scene {
  private campaign!: CampaignManager;
  private slotContainers: Phaser.GameObjects.Container[] = [];
  private sessionTimerText!: Phaser.GameObjects.Text;

  constructor() {
    super('SatchelUI');
  }

  init(data: { campaign: CampaignManager }): void {
    this.campaign = data.campaign;
  }

  create(): void {
    // 3 Satchel slots in top-right corner
    const slotY = 24;
    const slotSpacing = 36;
    const startX = BASE_WIDTH - 24 - 2 * slotSpacing;

    for (let i = 0; i < 3; i++) {
      const x = startX + i * slotSpacing;
      const container = this.add.container(x, slotY);

      // Slot background (River clay 8, border 3)
      const bg = this.add.rectangle(0, 0, 28, 28, 0xC49A6C);
      bg.setStrokeStyle(2, 0x6E4A2F);
      container.add(bg);

      this.slotContainers.push(container);
    }

    // Sketchbook button in top-left corner
    const sketchBtn = this.add.container(28, 24);
    const btnBg = this.add.rectangle(0, 0, INPUT.BUTTON_ART_PX * 0.6, INPUT.BUTTON_ART_PX * 0.6, 0x4B6B4E);
    btnBg.setStrokeStyle(2, 0x2A3E2C);
    const btnLabel = this.add.text(0, 0, 'DRAW', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    sketchBtn.add([btnBg, btnLabel]);
    btnBg.setInteractive(
      new Phaser.Geom.Rectangle(-INPUT.BUTTON_HIT_PX / 4, -INPUT.BUTTON_HIT_PX / 4, INPUT.BUTTON_HIT_PX / 2, INPUT.BUTTON_HIT_PX / 2),
      Phaser.Geom.Rectangle.Contains
    );

    btnBg.on('pointerdown', () => {
      this.scene.pause('WorldScene');
      this.scene.launch('SketchbookScene');
    });

    // Parent Dashboard button for adult oversight & printable guides
    const parentDashboard = new ParentDashboard(this.campaign);
    const parentBtn = this.add.container(62, 24);
    const parentBg = this.add.rectangle(0, 0, INPUT.BUTTON_ART_PX * 0.6, INPUT.BUTTON_ART_PX * 0.6, 0x8C5832);
    parentBg.setStrokeStyle(2, 0x5C4033);
    const parentLabel = this.add.text(0, 0, 'ADULT', {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#FAF6E8',
    }).setOrigin(0.5);

    parentBtn.add([parentBg, parentLabel]);
    parentBg.setInteractive(
      new Phaser.Geom.Rectangle(-INPUT.BUTTON_HIT_PX / 4, -INPUT.BUTTON_HIT_PX / 4, INPUT.BUTTON_HIT_PX / 2, INPUT.BUTTON_HIT_PX / 2),
      Phaser.Geom.Rectangle.Contains
    );

    parentBg.on('pointerdown', () => {
      parentDashboard.open();
    });

    if (typeof window !== 'undefined') {
      (window as unknown as { __OPEN_PARENT_DASHBOARD__?: () => void }).__OPEN_PARENT_DASHBOARD__ = () => parentDashboard.open();
    }

    // Session clock text in top-center

    this.sessionTimerText = this.add.text(BASE_WIDTH / 2, 14, '15:00', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#4B6B4E',
    }).setOrigin(0.5);

    // Refresh slots initially
    this.refreshSlots();

    // Listen to campaign events
    eventBus.on('item:collected', () => this.refreshSlots());
  }

  updateSessionTimer(secondsRemaining: number): void {
    const mins = Math.floor(secondsRemaining / 60);
    const secs = Math.floor(secondsRemaining % 60);
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    if (this.sessionTimerText) {
      this.sessionTimerText.setText(formatted);
      if (secondsRemaining <= 180) {
        // Warm sunset amber color in last 3 minutes
        this.sessionTimerText.setColor('#D48038');
      }
    }
  }

  refreshSlots(): void {
    const slots = this.campaign.satchel;
    for (let i = 0; i < 3; i++) {
      const container = this.slotContainers[i];
      if (!container) continue;

      // Remove previous icons/labels except bg
      while (container.length > 1) {
        container.removeAt(1, true);
      }

      const slotData = slots[i];
      if (slotData) {
        const itemText = this.add.text(0, -2, slotData.item.name.slice(0, 3).toUpperCase(), {
          fontFamily: 'monospace',
          fontSize: '7px',
          color: '#2A3E2C',
        }).setOrigin(0.5);

        const countBadge = this.add.text(8, 8, `x${slotData.count}`, {
          fontFamily: 'monospace',
          fontSize: '6px',
          color: '#1A232A',
        }).setOrigin(0.5);

        container.add([itemText, countBadge]);
      }
    }
  }
}
