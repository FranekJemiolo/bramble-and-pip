import { CAMPAIGN_CHAPTERS, type Chapter } from '../core/campaign/types';
import type { CampaignManager } from '../core/campaign/CampaignManager';
import { eventBus } from '../core/EventBus';

/**
 * ChapterMapModal: Semantic HTML overlay displaying the 20-chapter 4-season progression matrix.
 * Allows young explorers and parents to inspect objectives, sight words, completed badges,
 * and travel directly to any chapter along the forest trail.
 */
export class ChapterMapModal {
  private overlayEl: HTMLElement | null = null;
  private campaign: CampaignManager;
  private onSelectChapter?: (chapterId: number) => void;

  constructor(campaign: CampaignManager, onSelectChapter?: (chapterId: number) => void) {
    this.campaign = campaign;
    this.onSelectChapter = onSelectChapter;
  }

  open(): void {
    if (this.overlayEl) return;

    const root = document.getElementById('overlay-root');
    if (!root) return;

    const overlay = document.createElement('div');
    overlay.id = 'chapter-map-modal';
    overlay.className = 'overlay-modal-backdrop';
    overlay.style.cssText = `
      position: absolute;
      inset: 0;
      background: rgba(26, 35, 42, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    const container = document.createElement('div');
    container.style.cssText = `
      background: #FAF6E8;
      border: 4px solid #5C4033;
      border-radius: 12px;
      max-width: 480px;
      width: 100%;
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      overflow: hidden;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      background: #8C5832;
      color: #FAF6E8;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #5C4033;
    `;
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 20px;">🗺️</span>
        <h2 style="margin: 0; font-size: 15px; font-weight: bold; letter-spacing: 0.5px;">Whispering Woods Trail Map</h2>
      </div>
      <button id="map-close-btn" style="
        background: #5C4033;
        color: #FAF6E8;
        border: none;
        border-radius: 6px;
        padding: 4px 10px;
        font-size: 13px;
        font-weight: bold;
        cursor: pointer;
      ">✕ Close</button>
    `;

    // Scrollable Content
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 12px;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;

    const seasons = [
      { key: 'spring', title: '🌸 Spring: Pebble Creek Awakening', color: '#4A7032' },
      { key: 'summer', title: '☀️ Summer: The Waterwheel & Hollow', color: '#C96E2E' },
      { key: 'autumn', title: '🍂 Autumn: Amber Woods & Harvest', color: '#8C5832' },
      { key: 'winter', title: '❄️ Winter & Celebration: Pine Ridge', color: '#2C3E50' },
    ];

    for (const season of seasons) {
      const seasonChapters = CAMPAIGN_CHAPTERS.filter((c) => c.season === season.key);

      const section = document.createElement('div');
      section.style.cssText = `
        background: #FFFFFF;
        border: 2px solid #B88A58;
        border-radius: 8px;
        overflow: hidden;
      `;

      const secHeader = document.createElement('div');
      secHeader.style.cssText = `
        background: ${season.color};
        color: #FAF6E8;
        padding: 6px 10px;
        font-size: 12px;
        font-weight: bold;
      `;
      secHeader.textContent = season.title;
      section.appendChild(secHeader);

      const list = document.createElement('div');
      list.style.cssText = `
        display: flex;
        flex-direction: column;
        divide-y: 1px solid #E4EDF0;
      `;

      for (const ch of seasonChapters) {
        const isCurrent = this.campaign.currentChapter.id === ch.id;
        const isCompleted = this.campaign.isChapterCompleted(ch.id);

        const row = document.createElement('div');
        row.style.cssText = `
          padding: 8px 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #EAE0D0;
          background: ${isCurrent ? '#F2E8D5' : 'transparent'};
          cursor: pointer;
          transition: background 0.15s ease;
        `;
        row.onmouseenter = () => { if (!isCurrent) row.style.background = '#FAF2E4'; };
        row.onmouseleave = () => { if (!isCurrent) row.style.background = 'transparent'; };

        const left = document.createElement('div');
        left.style.cssText = 'display: flex; align-items: center; gap: 8px;';
        left.innerHTML = `
          <span style="font-size: 14px;">${isCompleted ? '⭐' : isCurrent ? '🐾' : '⚪'}</span>
          <div>
            <div style="font-size: 12px; font-weight: bold; color: #2C3E50;">
              Ch ${ch.id}: ${ch.title}
            </div>
            <div style="font-size: 10px; color: #5C4033;">
              📍 ${ch.region} · <em>"${ch.sightWords.join(' ')}"</em>
            </div>
          </div>
        `;

        const journeyBtn = document.createElement('button');
        journeyBtn.style.cssText = `
          background: ${isCurrent ? '#4A7032' : '#8C5832'};
          color: #FAF6E8;
          border: none;
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: bold;
          cursor: pointer;
        `;
        journeyBtn.textContent = isCurrent ? 'Playing' : 'Go';
        journeyBtn.onclick = (e) => {
          e.stopPropagation();
          this.selectChapter(ch);
        };

        row.onclick = () => this.selectChapter(ch);

        row.appendChild(left);
        row.appendChild(journeyBtn);
        list.appendChild(row);
      }

      section.appendChild(list);
      content.appendChild(section);
    }

    container.appendChild(header);
    container.appendChild(content);
    overlay.appendChild(container);
    root.appendChild(overlay);
    this.overlayEl = overlay;

    document.getElementById('map-close-btn')?.addEventListener('click', () => this.close());
  }

  private selectChapter(ch: Chapter): void {
    this.campaign.startChapter(ch.id);
    if (this.onSelectChapter) {
      this.onSelectChapter(ch.id);
    }
    eventBus.emit('chapter:selected', { chapterId: ch.id });
    this.close();
  }

  close(): void {
    if (this.overlayEl) {
      this.overlayEl.remove();
      this.overlayEl = null;
    }
  }
}
