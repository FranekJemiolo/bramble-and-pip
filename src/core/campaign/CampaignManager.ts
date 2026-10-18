import { MAX_ITEM_QUANTITY, SATCHEL_SLOTS, type Season } from '../constants';
import { CAMPAIGN_CHAPTERS, type CampaignItem, type Chapter } from './types';
import { eventBus } from '../EventBus';

export interface SatchelSlot {
  item: CampaignItem;
  count: number;
}

export interface CampaignStateDTO {
  currentChapterId: number;
  completedChapterIds: number[];
  satchel: Array<{ id: string; name: string; description: string; pictogramKey: string; count: number }>;
}

export class CampaignManager {
  private currentChapterId = 1;
  private readonly completedChapters = new Set<number>();
  private readonly satchelSlots: SatchelSlot[] = [];

  constructor(initialState?: CampaignStateDTO) {
    if (initialState) {
      this.deserialize(initialState);
    }
  }

  get currentChapter(): Chapter {
    const chapter = CAMPAIGN_CHAPTERS.find((c) => c.id === this.currentChapterId);
    return chapter ?? CAMPAIGN_CHAPTERS[0]!;
  }

  get currentSeason(): Season {
    return this.currentChapter.season;
  }

  get completedCount(): number {
    return this.completedChapters.size;
  }

  get totalChapters(): number {
    return CAMPAIGN_CHAPTERS.length;
  }

  get satchel(): readonly SatchelSlot[] {
    return this.satchelSlots;
  }

  isChapterCompleted(chapterId: number): boolean {
    return this.completedChapters.has(chapterId);
  }

  startChapter(chapterId: number): void {
    const chapter = CAMPAIGN_CHAPTERS.find((c) => c.id === chapterId);
    if (!chapter) return;
    this.currentChapterId = chapterId;
    eventBus.emit('chapter:start', {
      chapterId: chapter.id,
      season: chapter.season,
      title: chapter.title,
    });
  }

  completeCurrentChapter(): void {
    const chapter = this.currentChapter;
    this.completedChapters.add(chapter.id);
    eventBus.emit('chapter:complete', { chapterId: chapter.id });

    // Grant reward item if present
    if (chapter.rewardItem) {
      this.addItem(chapter.rewardItem);
    }

    // Advance to next chapter if available
    if (this.currentChapterId < this.totalChapters) {
      this.startChapter(this.currentChapterId + 1);
    }
  }

  addItem(item: CampaignItem): boolean {
    // Check if item already exists in a satchel slot
    const existing = this.satchelSlots.find((s) => s.item.id === item.id);
    if (existing) {
      if (existing.count < MAX_ITEM_QUANTITY) {
        existing.count += 1;
        eventBus.emit('item:collected', { id: item.id, name: item.name, count: existing.count });
        return true;
      }
      return false; // Slot full
    }

    // Check if free slot available
    if (this.satchelSlots.length < SATCHEL_SLOTS) {
      this.satchelSlots.push({ item, count: 1 });
      eventBus.emit('item:collected', { id: item.id, name: item.name, count: 1 });
      return true;
    }

    return false; // Satchel full
  }

  removeItem(itemId: string): boolean {
    const idx = this.satchelSlots.findIndex((s) => s.item.id === itemId);
    if (idx === -1) return false;

    const slot = this.satchelSlots[idx]!;
    slot.count -= 1;
    if (slot.count <= 0) {
      this.satchelSlots.splice(idx, 1);
    }
    return true;
  }

  hasItem(itemId: string): boolean {
    return this.satchelSlots.some((s) => s.item.id === itemId && s.count > 0);
  }

  getItemCount(itemId: string): number {
    const slot = this.satchelSlots.find((s) => s.item.id === itemId);
    return slot ? slot.count : 0;
  }

  isAllCompleted(): boolean {
    return this.completedChapters.size >= this.totalChapters;
  }

  serialize(): CampaignStateDTO {
    return {
      currentChapterId: this.currentChapterId,
      completedChapterIds: Array.from(this.completedChapters),
      satchel: this.satchelSlots.map((s) => ({
        id: s.item.id,
        name: s.item.name,
        description: s.item.description,
        pictogramKey: s.item.pictogramKey,
        count: s.count,
      })),
    };
  }

  deserialize(dto: CampaignStateDTO): void {
    this.currentChapterId = dto.currentChapterId;
    this.completedChapters.clear();
    for (const id of dto.completedChapterIds) {
      this.completedChapters.add(id);
    }
    this.satchelSlots.length = 0;
    for (const s of dto.satchel) {
      if (this.satchelSlots.length < SATCHEL_SLOTS) {
        this.satchelSlots.push({
          item: {
            id: s.id,
            name: s.name,
            description: s.description,
            pictogramKey: s.pictogramKey,
          },
          count: Math.min(s.count, MAX_ITEM_QUANTITY),
        });
      }
    }
  }
}
