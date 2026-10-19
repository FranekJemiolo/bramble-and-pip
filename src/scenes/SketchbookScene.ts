import Phaser from 'phaser';
import { BASE_HEIGHT, BASE_WIDTH } from '../core/constants';
import {
  buildWinterTrackSpotterPDFDefinition,
  buildAutumnLeafPressPDFDefinition,
  downloadPDF,
} from '../export/pdfGenerator';
import { eventBus } from '../core/EventBus';

export class SketchbookScene extends Phaser.Scene {
  private canvasTexture!: Phaser.Textures.CanvasTexture;
  private canvasCtx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private currentColor = '#4B6B4E'; // Pine green default

  constructor() {
    super('SketchbookScene');
  }

  create(): void {
    eventBus.emit('pdf:export', { documentType: 'view_sketchbook' });

    // Sketchbook background - canonical nature journal top (320x192) and satchel bottom (320x96)
    if (this.textures.exists('sketchbook_bg')) {
      const deskBg = this.add.image(0, 0, 'sketchbook_bg').setOrigin(0, 0);
      deskBg.setDisplaySize(BASE_WIDTH, 192);
      if (this.textures.exists('satchel_bg')) {
        const satchel = this.add.image(0, 192, 'satchel_bg').setOrigin(0, 0);
        satchel.setDisplaySize(BASE_WIDTH, 96);
      }
    } else {
      this.add.rectangle(0, 0, BASE_WIDTH, BASE_HEIGHT, 0xF4EFEA).setOrigin(0, 0);
    }

    // Header bar
    this.add.rectangle(BASE_WIDTH / 2, 16, BASE_WIDTH, 32, 0xEAE6DF);
    this.add.text(BASE_WIDTH / 2, 16, 'NATURE SKETCHPAD & GUIDES', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#2A3E2C',
    }).setOrigin(0.5);

    // Back button
    const backBtn = this.add.rectangle(24, 16, 32, 20, 0xC49A6C);
    backBtn.setStrokeStyle(1, 0x6E4A2F);
    this.add.text(24, 16, '< BACK', {
      fontFamily: 'monospace',
      fontSize: '6px',
      color: '#1A232A',
    }).setOrigin(0.5);
    backBtn.setInteractive().on('pointerdown', () => {
      this.scene.resume('WorldScene');
      this.scene.stop();
    });

    // Clear button
    const clearBtn = this.add.rectangle(BASE_WIDTH - 24, 16, 32, 20, 0xC49A6C);
    clearBtn.setStrokeStyle(1, 0x6E4A2F);
    this.add.text(BASE_WIDTH - 24, 16, 'CLEAR', {
      fontFamily: 'monospace',
      fontSize: '6px',
      color: '#1A232A',
    }).setOrigin(0.5);
    clearBtn.setInteractive().on('pointerdown', () => this.clearCanvas());

    // Printable Guide Buttons (Top area)
    const winterBtn = this.add.rectangle(80, 42, 120, 20, 0x4B6B4E);
    winterBtn.setStrokeStyle(1, 0x2A3E2C);
    this.add.text(80, 42, 'PRINT: WINTER TRACKS', {
      fontFamily: 'monospace',
      fontSize: '6px',
      color: '#FFFFFF',
    }).setOrigin(0.5);
    winterBtn.setInteractive().on('pointerdown', () => {
      downloadPDF(buildWinterTrackSpotterPDFDefinition(), 'bramble-winter-tracks.pdf').catch(() => {});
    });

    const autumnBtn = this.add.rectangle(220, 42, 120, 20, 0x9B4E28);
    autumnBtn.setStrokeStyle(1, 0x6E4A2F);
    this.add.text(220, 42, 'PRINT: LEAF PRESS', {
      fontFamily: 'monospace',
      fontSize: '6px',
      color: '#FFFFFF',
    }).setOrigin(0.5);
    autumnBtn.setInteractive().on('pointerdown', () => {
      downloadPDF(buildAutumnLeafPressPDFDefinition(), 'bramble-autumn-leaf-press.pdf').catch(() => {});
    });

    // Drawing Canvas Area (from Y=60 to Y=250)
    const drawWidth = 300;
    const drawHeight = 190;
    const drawX = 10;
    const drawY = 60;

    if (!this.textures.exists('sketchbook_bg')) {
      const paperBorder = this.add.rectangle(BASE_WIDTH / 2, drawY + drawHeight / 2, drawWidth + 4, drawHeight + 4, 0x1A232A);
      paperBorder.setStrokeStyle(2, 0x6E4A2F);
    }

    if (this.textures.exists('sketch_canvas')) {
      this.textures.remove('sketch_canvas');
    }
    this.canvasTexture = this.textures.createCanvas('sketch_canvas', drawWidth, drawHeight)!;
    this.canvasCtx = this.canvasTexture.getContext();
    this.clearCanvas();

    const canvasImage = this.add.image(drawX, drawY, 'sketch_canvas').setOrigin(0, 0);
    canvasImage.setInteractive();

    // Drawing input handlers
    let lastX = 0;
    let lastY = 0;

    canvasImage.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.isDrawing = true;
      lastX = p.x - drawX;
      lastY = p.y - drawY;
      this.drawCrayonPoint(lastX, lastY);
    });

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.isDrawing) {
        const curX = p.x - drawX;
        const curY = p.y - drawY;
        if (curX >= 0 && curX <= drawWidth && curY >= 0 && curY <= drawHeight) {
          this.drawCrayonLine(lastX, lastY, curX, curY);
          lastX = curX;
          lastY = curY;
        }
      }
    });

    this.input.on('pointerup', () => {
      this.isDrawing = false;
    });

    // Palette selector row at bottom
    const colors = [
      { name: 'Pine', hex: '#4B6B4E', int: 0x4B6B4E },
      { name: 'Acorn', hex: '#9B4E28', int: 0x9B4E28 },
      { name: 'Berry', hex: '#B85D19', int: 0xB85D19 },
      { name: 'Yellow', hex: '#E5C158', int: 0xE5C158 },
    ];

    colors.forEach((c, idx) => {
      const swX = 90 + idx * 45;
      const sw = this.add.rectangle(swX, 268, 30, 16, c.int);
      sw.setStrokeStyle(1, 0x1A232A);
      this.add.text(swX, 268, c.name, {
        fontFamily: 'monospace',
        fontSize: '6px',
        color: '#FFFFFF',
      }).setOrigin(0.5);

      sw.setInteractive().on('pointerdown', () => {
        this.currentColor = c.hex;
      });
    });
  }

  private clearCanvas(): void {
    if (!this.canvasCtx) return;
    if (this.textures.exists('sketchbook_bg')) {
      this.canvasCtx.clearRect(0, 0, 300, 190);
    } else {
      this.canvasCtx.fillStyle = '#FAF7F2';
      this.canvasCtx.fillRect(0, 0, 300, 190);
    }
    this.canvasTexture.refresh();
  }

  private drawCrayonPoint(x: number, y: number): void {
    this.canvasCtx.fillStyle = this.currentColor;
    this.canvasCtx.beginPath();
    this.canvasCtx.arc(x, y, 4, 0, Math.PI * 2);
    this.canvasCtx.fill();
    this.canvasTexture.refresh();
  }

  private drawCrayonLine(x1: number, y1: number, x2: number, y2: number): void {
    this.canvasCtx.strokeStyle = this.currentColor;
    this.canvasCtx.lineWidth = 6;
    this.canvasCtx.lineCap = 'round';
    this.canvasCtx.lineJoin = 'round';
    this.canvasCtx.beginPath();
    this.canvasCtx.moveTo(x1, y1);
    this.canvasCtx.lineTo(x2, y2);
    this.canvasCtx.stroke();
    this.canvasTexture.refresh();
  }
}
