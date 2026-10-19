import { describe, expect, it } from 'vitest';
import { CampaignManager } from '../../src/core/campaign/CampaignManager';
import { CAMPAIGN_CHAPTERS } from '../../src/core/campaign/types';
import { MossyGearboxPuzzle } from '../../src/minigames/MossyGearboxPuzzle';
import { SteppingStonePuzzle } from '../../src/minigames/SteppingStonePuzzle';
import { AutumnSeedSortingPuzzle } from '../../src/minigames/AutumnSeedSortingPuzzle';
import { WinterTrackSpottingPuzzle } from '../../src/minigames/WinterTrackSpottingPuzzle';
import { NonReaderDialogueBox } from '../../src/ui/NonReaderDialogueBox';

describe('20-Chapter Nature Campaign & Satchel State', () => {
  it('defines exactly 20 pedagogical chapters across 4 seasons ending at the Lodge', () => {
    expect(CAMPAIGN_CHAPTERS).toHaveLength(20);

    const spring = CAMPAIGN_CHAPTERS.filter((c) => c.season === 'spring');
    const summer = CAMPAIGN_CHAPTERS.filter((c) => c.season === 'summer');
    const autumn = CAMPAIGN_CHAPTERS.filter((c) => c.season === 'autumn');
    const winter = CAMPAIGN_CHAPTERS.filter((c) => c.season === 'winter');

    expect(spring).toHaveLength(5);
    expect(summer).toHaveLength(5);
    expect(autumn).toHaveLength(5);
    expect(winter).toHaveLength(5);

    const finalChapter = CAMPAIGN_CHAPTERS[19]!;
    expect(finalChapter.id).toBe(20);
    expect(finalChapter.title).toContain("The Ranger's Lodge");
    expect(finalChapter.sightWords.length).toBeLessThanOrEqual(3);

    // Verify all 20 chapters have complete metadata
    for (const ch of CAMPAIGN_CHAPTERS) {
      expect(ch.region).toBeDefined();
      expect(ch.pedagogicalInteraction).toBeDefined();
      expect(ch.bridgeSheet).toBeDefined();
      expect(ch.sightWords.length).toBeGreaterThan(0);
      expect(ch.sightWords.length).toBeLessThanOrEqual(3);
    }
  });


  it('enforces satchel limits: maximum 3 slots and maximum 3 quantity per item', () => {
    const campaign = new CampaignManager();

    // Add item 1 three times (reaches max quantity)
    const item1 = { id: 'acorn', name: 'Oak Acorn', description: 'Acorn', pictogramKey: 'acorn' };
    expect(campaign.addItem(item1)).toBe(true);
    expect(campaign.addItem(item1)).toBe(true);
    expect(campaign.addItem(item1)).toBe(true);
    expect(campaign.addItem(item1)).toBe(false); // Max 3 quantity reached
    expect(campaign.getItemCount('acorn')).toBe(3);

    // Add item 2 and item 3 (fills all 3 slots)
    const item2 = { id: 'leaf', name: 'Birch Leaf', description: 'Leaf', pictogramKey: 'leaf' };
    const item3 = { id: 'gear', name: 'Wooden Cog', description: 'Cog', pictogramKey: 'gear' };
    expect(campaign.addItem(item2)).toBe(true);
    expect(campaign.addItem(item3)).toBe(true);
    expect(campaign.satchel).toHaveLength(3);

    // Add item 4: rejected because satchel is full (3 slots max)
    const item4 = { id: 'pebble', name: 'Pebble', description: 'Stone', pictogramKey: 'lilypad' };
    expect(campaign.addItem(item4)).toBe(false);
    expect(campaign.satchel).toHaveLength(3);
  });

  it('serializes and deserializes campaign progress deterministically', () => {
    const campaign = new CampaignManager();
    campaign.completeCurrentChapter(); // Completes 1, moves to 2
    campaign.completeCurrentChapter(); // Completes 2, moves to 3

    expect(campaign.currentChapter.id).toBe(3);
    expect(campaign.completedCount).toBe(2);

    const dto = campaign.serialize();
    const restored = new CampaignManager(dto);

    expect(restored.currentChapter.id).toBe(3);
    expect(restored.completedCount).toBe(2);
    expect(restored.isChapterCompleted(1)).toBe(true);
    expect(restored.isChapterCompleted(2)).toBe(true);
  });
});

describe('Mossy Gearbox Puzzle & Magnetic Snapping', () => {
  it('magnetically snaps idler gear into mesh basin within 80px', () => {
    const puzzle = new MossyGearboxPuzzle();
    let solvedFired = false;
    puzzle.onSolve(() => {
      solvedFired = true;
    });

    // Outside 80px basin (target is at 160, 136)
    puzzle.dragIdler(160, 230); // d = 94px > 80px
    puzzle.update(0.1);
    expect(puzzle.isSolved).toBe(false);

    // Drag within 80px basin: e.g. at (160, 180) -> d = 44px < 80px
    puzzle.dragIdler(160, 180);
    expect(puzzle.isSolved).toBe(false); // Snapping in progress

    // Advance time past 200ms ease-out duration
    puzzle.update(0.25);
    expect(puzzle.isSolved).toBe(true);
    expect(solvedFired).toBe(true);
    expect(puzzle.idlerGear.x).toBe(160);
    expect(puzzle.idlerGear.y).toBe(136);
  });

  it('transfers rotational torque through 3-gear train when meshed', () => {
    const puzzle = new MossyGearboxPuzzle();
    // Initially not meshed
    puzzle.update(1.0);
    expect(puzzle.driveGear.angleRad).toBeGreaterThan(0);
    expect(puzzle.drivenGear.angleRad).toBe(0);

    // Snap to mesh
    puzzle.dragIdler(160, 140);
    puzzle.update(0.25); // Completes snap
    expect(puzzle.isMeshed).toBe(true);

    const initialDrivenAngle = puzzle.drivenGear.angleRad;
    puzzle.update(1.0);
    // Driven gear must now rotate
    expect(puzzle.drivenGear.angleRad).toBeGreaterThan(initialDrivenAngle);
  });
});

describe('Stepping Stone Subitizing Puzzle', () => {
  it('requires tapping stones matching target dot counts with 80px magnetic tolerance', () => {
    const puzzle = new SteppingStonePuzzle();
    let solvedFired = false;
    puzzle.onSolve(() => {
      solvedFired = true;
    });

    expect(puzzle.targetCount).toBe(1);

    // Tap near stone 1 (at 60, 160) with 1 dot within 80px (e.g. at 75, 170 -> d ~ 18px)
    const stepped1 = puzzle.tap(75, 170);
    expect(stepped1).not.toBeNull();
    expect(stepped1?.dotCount).toBe(1);
    expect(puzzle.targetCount).toBe(2);

    // Stepping on wrong stone (e.g. stone 4 with 4 dots) is gently ignored without failure penalty
    const wrong = puzzle.tap(210, 115);
    expect(wrong).toBeNull();
    expect(puzzle.targetCount).toBe(2);

    // Step through remaining stones 2, 3, 4, 5
    expect(puzzle.tap(110, 110)).not.toBeNull(); // 2 dots
    expect(puzzle.tap(160, 170)).not.toBeNull(); // 3 dots
    expect(puzzle.tap(210, 115)).not.toBeNull(); // 4 dots
    expect(puzzle.tap(260, 160)).not.toBeNull(); // 5 dots

    expect(puzzle.isSolved).toBe(true);
    expect(solvedFired).toBe(true);
  });
});

describe('NonReaderDialogueBox Dwell & Sight Words', () => {
  it('strictly caps sight words to maximum 3 words', () => {
    const dialogue = new NonReaderDialogueBox();
    dialogue.open({
      speaker: 'Pip',
      pictogramKey: 'pip',
      text: 'Look at that beautiful shiny river stone!',
      words: ['LOOK', 'AT', 'RIVER', 'STONE', 'NOW'],
    });

    expect(dialogue.isOpen).toBe(true);
    expect(dialogue.words.length).toBeLessThanOrEqual(3);
    expect(dialogue.words).toEqual(['LOOK', 'AT', 'RIVER']);
  });

  it('enforces >= 1.5s post-audio dwell time before permitting touch progression', () => {
    const dialogue = new NonReaderDialogueBox();
    const t0 = 10000;
    dialogue.open({
      speaker: 'Bramble',
      pictogramKey: 'bramble',
      text: 'Time to rest under the oak tree.',
      words: ['TIME', 'TO', 'REST'],
    }, t0);

    // Audio finishes at t0 + 500 = 10500ms
    dialogue.notifyAudioFinished(10500);

    // Attempt advance at 10500 + 1000ms (1000ms < 1500ms dwell): must be rejected
    expect(dialogue.canAdvance(11500)).toBe(false);
    expect(dialogue.advance(11500)).toBe(false);
    expect(dialogue.isOpen).toBe(true);

    // Attempt advance at 10500 + 1550ms (>= 1500ms dwell): accepted
    expect(dialogue.canAdvance(12050)).toBe(true);
    expect(dialogue.advance(12050)).toBe(true);
    expect(dialogue.isOpen).toBe(false);
  });
});

describe('Autumn Seed & Leaf Sorting Puzzle', () => {
  it('sorts acorns, pinecones, and maple seeds into matching baskets with 80px magnetic snap', () => {
    const puzzle = new AutumnSeedSortingPuzzle();
    let solvedFired = false;
    puzzle.onSolve(() => {
      solvedFired = true;
    });

    expect(puzzle.isSolved).toBe(false);

    // Release outside magnetic basin (distance > 80px): returns to initial tray
    puzzle.dragSeed('seed_acorn', 80, 230); // d = 100px > 80px to basket at (80, 130)
    expect(puzzle.releaseSeed('seed_acorn')).toBe(false);
    expect(puzzle.seeds[0]!.x).toBe(80);
    expect(puzzle.seeds[0]!.y).toBe(220);

    // Mismatched basket: drag acorn near pinecone basket (160, 130): gently returns
    puzzle.dragSeed('seed_acorn', 160, 140);
    expect(puzzle.releaseSeed('seed_acorn')).toBe(false);
    expect(puzzle.seeds[0]!.isPlaced).toBe(false);

    // Correct placement for acorn (target basket at 80, 130)
    puzzle.dragSeed('seed_acorn', 85, 135);
    expect(puzzle.releaseSeed('seed_acorn')).toBe(true);
    expect(puzzle.seeds[0]!.isPlaced).toBe(true);
    expect(puzzle.baskets[0]!.isFilled).toBe(true);
    expect(puzzle.isSolved).toBe(false);

    // Correct placement for pinecone (target basket at 160, 130)
    puzzle.dragSeed('seed_pinecone', 160, 130);
    expect(puzzle.releaseSeed('seed_pinecone')).toBe(true);
    expect(puzzle.seeds[1]!.isPlaced).toBe(true);

    // Correct placement for maple seed (target basket at 240, 130)
    puzzle.dragSeed('seed_maple', 240, 130);
    expect(puzzle.releaseSeed('seed_maple')).toBe(true);
    expect(puzzle.seeds[2]!.isPlaced).toBe(true);

    expect(puzzle.isSolved).toBe(true);
    expect(solvedFired).toBe(true);
  });
});

describe('Winter Track-Spotter Puzzle', () => {
  it('matches animal footprints in snow to woodland cards with 80px magnetic snap', () => {
    const puzzle = new WinterTrackSpottingPuzzle();
    let solvedFired = false;
    puzzle.onSolve(() => {
      solvedFired = true;
    });

    expect(puzzle.isSolved).toBe(false);

    // Drag outside magnetic basin: gently returns
    puzzle.dragTrack('track_badger', 75, 230); // d = 105px > 80px to (75, 125)
    expect(puzzle.releaseTrack('track_badger')).toBe(false);
    expect(puzzle.trackStamps[0]!.x).toBe(75);
    expect(puzzle.trackStamps[0]!.y).toBe(220);

    // Mismatched card: drag badger track near rabbit card (160, 125)
    puzzle.dragTrack('track_badger', 160, 125);
    expect(puzzle.releaseTrack('track_badger')).toBe(false);
    expect(puzzle.trackStamps[0]!.isMatched).toBe(false);

    // Match 1: Badger (target at 75, 125)
    puzzle.dragTrack('track_badger', 80, 130);
    expect(puzzle.releaseTrack('track_badger')).toBe(true);
    expect(puzzle.trackStamps[0]!.isMatched).toBe(true);
    expect(puzzle.animalCards[0]!.isMatched).toBe(true);
    expect(puzzle.isSolved).toBe(false);

    // Match 2: Rabbit (target at 160, 125)
    puzzle.dragTrack('track_rabbit', 160, 125);
    expect(puzzle.releaseTrack('track_rabbit')).toBe(true);
    expect(puzzle.trackStamps[1]!.isMatched).toBe(true);

    // Match 3: Chickadee (target at 245, 125)
    puzzle.dragTrack('track_chickadee', 245, 125);
    expect(puzzle.releaseTrack('track_chickadee')).toBe(true);
    expect(puzzle.trackStamps[2]!.isMatched).toBe(true);

    expect(puzzle.isSolved).toBe(true);
    expect(solvedFired).toBe(true);
  });
});

