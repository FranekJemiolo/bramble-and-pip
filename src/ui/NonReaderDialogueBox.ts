import { DIALOGUE } from '../core/constants';
import { eventBus } from '../core/EventBus';

export interface DialoguePayload {
  speaker: string;
  pictogramKey: string;
  text: string;
  words: string[];
}

export class NonReaderDialogueBox {
  private active = false;
  private currentSpeaker = '';
  private currentPictogram = '';
  private currentWords: string[] = [];
  private fullText = '';
  private openedAtMs = 0;
  private audioCompletedAtMs = 0;
  private minDwellMs = DIALOGUE.MIN_POST_AUDIO_DWELL_MS; // >= 1500ms

  get isOpen(): boolean {
    return this.active;
  }

  get openedAt(): number {
    return this.openedAtMs;
  }

  get speaker(): string {
    return this.currentSpeaker;
  }

  get pictogram(): string {
    return this.currentPictogram;
  }

  get words(): readonly string[] {
    return this.currentWords;
  }

  get text(): string {
    return this.fullText;
  }

  /**
   * Opens the dialogue box with maximum 3 sight words and a 32x32 pictogram.
   */
  open(payload: DialoguePayload, currentTimeMs: number = Date.now()): void {
    this.active = true;
    this.currentSpeaker = payload.speaker;
    this.currentPictogram = payload.pictogramKey;
    this.fullText = payload.text;
    // Strictly cap sight words to <= 3
    this.currentWords = payload.words.slice(0, DIALOGUE.MAX_SIGHT_WORDS);
    this.openedAtMs = currentTimeMs;
    // In headless or immediate mode, audio finishes around 500ms
    this.audioCompletedAtMs = currentTimeMs + 500;

    eventBus.emit('dialogue:open', {
      speaker: this.currentSpeaker,
      pictogramKey: this.currentPictogram,
      text: this.fullText,
      words: this.currentWords,
    });
  }

  /**
   * Sets the timestamp when acoustic narration finished playing.
   */
  notifyAudioFinished(currentTimeMs: number = Date.now()): void {
    this.audioCompletedAtMs = currentTimeMs;
  }

  /**
   * Returns true if post-audio dwell time (>= 1.5s) has elapsed.
   */
  canAdvance(currentTimeMs: number = Date.now()): boolean {
    if (!this.active) return false;
    return (currentTimeMs - this.audioCompletedAtMs) >= this.minDwellMs;
  }

  /**
   * Attempts to dismiss the dialogue. Rejected if within 1.5s post-audio dwell window.
   */
  advance(currentTimeMs: number = Date.now()): boolean {
    if (!this.canAdvance(currentTimeMs)) {
      return false; // Still dwelling
    }
    this.close();
    return true;
  }

  close(): void {
    if (!this.active) return;
    this.active = false;
    eventBus.emit('dialogue:close');
  }
}
