import { describe, expect, it } from 'vitest';
import { WHISPERING_WOODS, PaletteGrader } from '../../src/render/palette';
import { PixelFont } from '../../src/render/font';
import { SpriteGenerator } from '../../src/render/sprites';
import { TileGenerator } from '../../src/render/tiles';
import { FlashlightMask } from '../../src/render/flashlight';
import { TextureBank } from '../../src/render/TextureBank';
import { TRANSPARENT } from '../../src/render/indexed';
import {
  AcousticSynthesizer,
  measureAttackSeconds,
  measureEnergyRatioAboveFreq,
  measurePeakDbfs,
} from '../../src/core/audio/synth';
import { AudioFormat } from '../../src/core/audio/AudioFormat';
import { PipCompanion } from '../../src/core/companion/PipCompanion';

describe('16-color Whispering Woods Palette & Shaders', () => {
  it('defines exactly 16 master palette entries with positive luminance', () => {
    expect(WHISPERING_WOODS).toHaveLength(16);
    for (let i = 0; i < 16; i++) {
      const entry = WHISPERING_WOODS[i]!;
      expect(entry.index).toBe(i);
      expect(entry.rgb).toHaveLength(3);
      expect(entry.luminance).toBeGreaterThan(0);
      expect(entry.luminance).toBeLessThanOrEqual(1);
    }
  });

  it('PaletteGrader reduces blue light and warms colors over 180s sunset window', () => {
    const daylight = WHISPERING_WOODS[15]!.rgb; // Canvas cream
    const sunset = PaletteGrader.gradeColor(daylight, 1.0);

    // Blue channel must be reduced relative to red channel
    const daylightRedToBlue = daylight[0] / daylight[2];
    const sunsetRedToBlue = sunset[0] / sunset[2];
    expect(sunsetRedToBlue).toBeGreaterThan(daylightRedToBlue);

    // Pre-calculated steps check
    const steps = PaletteGrader.generateGradedSteps(18);
    expect(steps).toHaveLength(19);
    expect(steps[0]).toHaveLength(16);
  });

  it('PixelFont renders clean, indexed bitmap text without anti-aliasing', () => {
    const text = 'LOOK A FRIEND';
    const width = PixelFont.measureWidth(text);
    expect(width).toBeGreaterThan(50);

    const img = PixelFont.renderText(text, 7);
    expect(img.isOnPalette(16)).toBe(true);
    expect(img.get(2, 2)).not.toBe(TRANSPARENT);
  });

  it('FlashlightMask applies 3-tier concentric falloff with Bayer ordered dither', () => {
    const fl = new FlashlightMask(320, 192);
    // Source in center, pointing right (0 deg)
    const mask = fl.update(160, 96, { facingAngleDeg: 0, rangePx: 96, ambientDarkness: 0.85 });

    expect(mask.isOnPalette(16)).toBe(true);

    // Point in core beam (within 48px, angle ~0 deg) must be transparent (illuminated)
    expect(mask.get(180, 96)).toBe(TRANSPARENT);

    // Point outside beam range (far away) should have high dither density (0 = Night Pine Shadow)
    let darkPixels = 0;
    for (let y = 10; y < 30; y++) {
      for (let x = 10; x < 30; x++) {
        if (mask.get(x, y) === 0) darkPixels++;
      }
    }
    expect(darkPixels).toBeGreaterThan(300); // mostly dark shadow
  });

  it('TextureBank enforces strict 16-color palette clamping across all procedural assets', () => {
    const bank = new TextureBank();

    // Register Ranger sprites (4 directions)
    bank.register('ranger_down_0', SpriteGenerator.generateRangerFrame('down', 0));
    bank.register('ranger_up_0', SpriteGenerator.generateRangerFrame('up', 0));
    bank.register('ranger_left_0', SpriteGenerator.generateRangerFrame('left', 0));
    bank.register('ranger_right_0', SpriteGenerator.generateRangerFrame('right', 0));

    // Register Pip states
    bank.register('pip_follow', SpriteGenerator.generatePipFrame('FOLLOWING', 0));
    bank.register('pip_curious', SpriteGenerator.generatePipFrame('IDLE_CURIOUS', 0));
    bank.register('pip_inspect', SpriteGenerator.generatePipFrame('INSPECTING', 0));
    bank.register('pip_yawn', SpriteGenerator.generatePipFrame('YAWNING', 0));
    bank.register('pip_sleep', SpriteGenerator.generatePipFrame('SLEEPING', 0));

    // Register Animals
    bank.register('animal_hedgehog', SpriteGenerator.generateAnimal('hedgehog'));
    bank.register('animal_badger', SpriteGenerator.generateAnimal('badger'));
    bank.register('animal_duckling', SpriteGenerator.generateAnimal('duckling'));
    bank.register('animal_rabbit', SpriteGenerator.generateAnimal('rabbit'));

    // Register Items & Satchel buttons
    bank.register('item_lantern', SpriteGenerator.generateItemIcon('lantern'));
    bank.register('item_gear_m', SpriteGenerator.generateItemIcon('gear_m'));
    bank.register('btn_look', SpriteGenerator.generateSatchelButton('look'));
    bank.register('btn_pip', SpriteGenerator.generateSatchelButton('pip_face'));

    // Register Tiles
    bank.register('tile_autotile_15', TileGenerator.generateAutotile(15, 5, 4));
    bank.register('tile_water_0', TileGenerator.generateWaterTile(0));
    bank.register('tile_lilypad_4', TileGenerator.generateLilyPad(4));
    bank.register('prop_tree', TileGenerator.generatePineTree());
    bank.register('prop_hearth', TileGenerator.generateCabinProp('hearth'));

    const audit = bank.auditAllOnPalette();
    expect(audit.valid).toBe(true);
    expect(audit.violations).toHaveLength(0);
  });
});

describe('Calming Acoustic Audio & Synthesizer', () => {
  const synth = new AcousticSynthesizer(22050);

  it('all synthesized instruments strictly respect the <= 4.5 kHz spectral ceiling (< -40 dB)', () => {
    const kalimba = synth.synthesizeKalimba(523.25, 0.5);
    const woodblock = synth.synthesizeWoodblock(750, 0.25);
    const guitar = synth.synthesizeGuitar(330, 0.5);
    const bubble = synth.synthesizeWaterBubble(0.3);
    const chirrup = synth.synthesizePipChirrup();

    for (const [name, buf] of [
      ['kalimba', kalimba],
      ['woodblock', woodblock],
      ['guitar', guitar],
      ['bubble', bubble],
      ['chirrup', chirrup],
    ] as const) {
      const highEnergyRatio = measureEnergyRatioAboveFreq(buf, 4500, synth.sampleRate);
      expect(highEnergyRatio, `High frequency leakage in ${name}`).toBeLessThan(-40);
    }
  });

  it('attacks are gentle (>= 40 ms) and peak amplitude <= -12 dBFS', () => {
    const kalimba = synth.synthesizeKalimba(440, 0.6);
    const woodblock = synth.synthesizeWoodblock(800, 0.3);

    const kalimbaAttack = measureAttackSeconds(kalimba, synth.sampleRate);
    expect(kalimbaAttack).toBeGreaterThanOrEqual(0.038); // ~40ms

    const kalimbaPeak = measurePeakDbfs(kalimba);
    expect(kalimbaPeak).toBeLessThanOrEqual(-12.0);

    const woodblockPeak = measurePeakDbfs(woodblock);
    expect(woodblockPeak).toBeLessThanOrEqual(-12.0);
  });

  it('AudioFormat provides dual-codec fallback selection', () => {
    AudioFormat.reset();
    const source = AudioFormat.pickSource('audio/sfx/wood_chime');
    expect(source).toMatch(/^audio\/sfx\/wood_chime\.(ogg|m4a)$/);
  });
});

describe('Pip Companion FSM & Breadcrumb Trail', () => {
  it('lags the player by exactly 16 breadcrumbs during movement', () => {
    const pip = new PipCompanion(100, 100, 16);

    // Player steps forward 30 steps along X axis
    for (let step = 1; step <= 30; step++) {
      const playerX = 100 + step * 4;
      pip.recordPlayerStep(playerX, 100, 'right');
      pip.update(true, 60, false, 0.05);

      if (step <= 16) {
        // Still reading from initial buffer pre-fill
        expect(pip.x).toBe(100);
      } else {
        // Must match player step from 16 positions ago
        const expectedX = 100 + (step - 16) * 4;
        expect(pip.x).toBe(expectedX);
        expect(pip.facing).toBe('right');
      }
    }
    expect(pip.currentState).toBe('FOLLOWING');
  });

  it('transitions to IDLE_CURIOUS when player stops for >= 2 seconds', () => {
    const pip = new PipCompanion(50, 50);
    pip.update(false, 100, false, 1.0);
    expect(pip.currentState).toBe('FOLLOWING'); // not yet 2s

    pip.update(false, 101, false, 1.1);
    expect(pip.currentState).toBe('IDLE_CURIOUS');
  });

  it('transitions to INSPECTING when inspect target is triggered', () => {
    const pip = new PipCompanion(50, 50);
    pip.inspectTarget(2.0);
    expect(pip.currentState).toBe('INSPECTING');

    // Resumes following if player moves
    pip.update(true, 100, false, 0.1);
    expect(pip.currentState).toBe('FOLLOWING');
  });

  it('transitions to YAWNING during sunset (>= 12 minutes / 720s)', () => {
    const pip = new PipCompanion(50, 50);
    pip.update(false, 730, false, 0.1);
    expect(pip.currentState).toBe('YAWNING');
  });

  it('locks to SLEEPING at bedtime (15 minutes / 900s or curfew)', () => {
    const pip = new PipCompanion(50, 50);
    pip.update(true, 905, true, 0.1); // Even if player moves, bedtime locks
    expect(pip.currentState).toBe('SLEEPING');
  });
});
