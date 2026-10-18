import { ParentalGateService } from '../core/parent/ParentalGateService';
import { ParentInsightService } from '../core/parent/ParentInsightService';
import {
  buildWinterTrackSpotterPDFDefinition,
  buildAutumnLeafPressPDFDefinition,
  buildJuniorRangerCertificatePDFDefinition,
  buildScavengerHuntGuidePDFDefinition,
  downloadPDF,
} from '../export/pdfGenerator';
import type { CampaignManager } from '../core/campaign/CampaignManager';

export class ParentDashboard {
  private gate = new ParentalGateService(Date.now() % 100000);
  private isOpen = false;
  private isUnlocked = false;

  constructor(private campaign?: CampaignManager) {}

  public open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.render();
  }

  public close(): void {
    this.isOpen = false;
    this.isUnlocked = false;
    const root = document.getElementById('overlay-root');
    if (root) root.innerHTML = '';
  }

  private render(): void {
    const root = document.getElementById('overlay-root');
    if (!root) return;

    if (!this.isUnlocked) {
      this.renderGate(root);
    } else {
      this.renderDashboard(root);
    }
  }

  private renderGate(root: HTMLElement): void {
    const challenge = this.gate.generateChallenge();

    root.innerHTML = `
      <div class="parent-modal-backdrop" style="position:fixed;inset:0;background:rgba(26,26,36,0.85);display:flex;align-items:center;justify-content:center;z-index:9999;font-family:sans-serif;">
        <div class="parent-modal-card" style="background:#FAF6E8;color:#2C3E50;padding:24px;border-radius:12px;border:3px solid #5C4033;max-width:340px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.5);text-align:center;">
          <h2 style="margin:0 0 8px;font-size:18px;color:#2C3E50;">Grown-Ups Area</h2>
          <p style="margin:0 0 16px;font-size:13px;color:#5C4033;">Please solve this math question to enter:</p>
          <div id="gate-prompt" style="background:#EAE6DF;padding:12px;border-radius:8px;font-size:16px;font-weight:bold;margin-bottom:16px;letter-spacing:1px;">
            ${challenge.prompt} = ?
          </div>
          <form id="gate-form" style="display:flex;flex-direction:column;gap:12px;">
            <input type="number" id="gate-answer" placeholder="Your Answer" style="padding:10px;font-size:16px;border:2px solid #5C4033;border-radius:6px;text-align:center;" autofocus required />
            <div id="gate-error" style="color:#B84432;font-size:12px;min-height:16px;"></div>
            <div style="display:flex;gap:8px;">
              <button type="button" id="gate-cancel" style="flex:1;padding:10px;background:#DCE38A;border:2px solid #789E3E;color:#2C3E50;border-radius:6px;font-weight:bold;cursor:pointer;">Back</button>
              <button type="submit" style="flex:1;padding:10px;background:#4A7032;border:2px solid #2E5328;color:#FAF6E8;border-radius:6px;font-weight:bold;cursor:pointer;">Unlock</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const form = root.querySelector('#gate-form') as HTMLFormElement;
    const input = root.querySelector('#gate-answer') as HTMLInputElement;
    const error = root.querySelector('#gate-error') as HTMLDivElement;
    const promptEl = root.querySelector('#gate-prompt') as HTMLDivElement;
    const cancel = root.querySelector('#gate-cancel') as HTMLButtonElement;

    cancel.addEventListener('click', () => this.close());

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = parseInt(input.value, 10);
      if (this.gate.verifyAnswer(val)) {
        this.isUnlocked = true;
        this.render();
      } else {
        if (this.gate.isLocked) {
          error.textContent = `Too many attempts. Locked for ${this.gate.lockRemainingSeconds}s.`;
        } else {
          error.textContent = 'That answer was not quite right. Try again!';
          if (promptEl && this.gate.activeChallenge) {
            promptEl.textContent = `${this.gate.activeChallenge.prompt} = ?`;
          }
        }
        input.value = '';
        input.focus();
      }
    });
  }

  private renderDashboard(root: HTMLElement): void {
    const completedIds = this.campaign?.completedChapterIds ?? [1];
    const satchelItems = this.campaign?.satchel.map((s) => s.item.id) ?? [];
    const starters = ParentInsightService.generateConversationStarters(completedIds, satchelItems);

    root.innerHTML = `
      <div class="parent-modal-backdrop" style="position:fixed;inset:0;background:rgba(26,26,36,0.9);display:flex;align-items:center;justify-content:center;z-index:9999;font-family:sans-serif;padding:16px;box-sizing:border-box;">
        <div class="parent-modal-card" style="background:#FAF6E8;color:#2C3E50;padding:24px;border-radius:12px;border:3px solid #5C4033;max-width:440px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.5);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:2px solid #EAE6DF;padding-bottom:8px;">
            <h2 style="margin:0;font-size:18px;color:#2C3E50;">🌿 Junior Ranger Parent Dashboard</h2>
            <button id="dash-close" style="background:none;border:none;font-size:20px;cursor:pointer;color:#5C4033;">✕</button>
          </div>

          <section style="margin-bottom:18px;">
            <h3 style="margin:0 0 6px;font-size:14px;color:#4A7032;">Session Regulation & Safeguards</h3>
            <p style="margin:0 0 8px;font-size:12px;color:#5C4033;line-height:1.4;">
              Bramble & Pip strictly limits screen exploration to <strong>15 minutes per day</strong>, with a calming sunset audio sweep during the final 3 minutes.
            </p>
            <div style="background:#EAE6DF;padding:10px;border-radius:6px;font-size:12px;">
              <div>🌙 <strong>Bedtime Curfew:</strong> Active between 19:30 and 08:00.</div>
              <div>🔒 <strong>Privacy:</strong> 100% offline, zero data collection or tracking.</div>
            </div>
          </section>

          <section style="margin-bottom:18px;">
            <h3 style="margin:0 0 6px;font-size:14px;color:#4A7032;">Nature Conversation Starters</h3>
            <div style="background:#FAF6E8;border-left:4px solid #789E3E;padding:8px 12px;font-size:12px;font-style:italic;line-height:1.4;">
              ${starters.map((s) => `<p style="margin:4px 0;">${s}</p>`).join('')}
            </div>
          </section>

          <section style="margin-bottom:18px;">
            <h3 style="margin:0 0 8px;font-size:14px;color:#4A7032;">Printable Vector Field Guides (Offline)</h3>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <button id="btn-pdf-winter" style="padding:8px;font-size:11px;background:#A8C4D0;border:1px solid #6B8E9E;border-radius:6px;cursor:pointer;font-weight:bold;color:#2C3E50;">
                🐾 Winter Track Card
              </button>
              <button id="btn-pdf-autumn" style="padding:8px;font-size:11px;background:#DCE38A;border:1px solid #789E3E;border-radius:6px;cursor:pointer;font-weight:bold;color:#2C3E50;">
                🍂 Leaf Press Guide
              </button>
              <button id="btn-pdf-hunt" style="padding:8px;font-size:11px;background:#C96E2E;border:1px solid #8C5832;border-radius:6px;cursor:pointer;font-weight:bold;color:#FAF6E8;">
                🔍 4-Badge Scavenger
              </button>
              <button id="btn-pdf-cert" style="padding:8px;font-size:11px;background:#789E3E;border:1px solid #2E5328;border-radius:6px;cursor:pointer;font-weight:bold;color:#FAF6E8;">
                🎖️ Honor Certificate
              </button>
            </div>
          </section>

          <button id="dash-done" style="width:100%;padding:10px;background:#4A7032;border:none;border-radius:6px;color:#FAF6E8;font-weight:bold;cursor:pointer;font-size:13px;">
            Return to Exploration
          </button>
        </div>
      </div>
    `;

    root.querySelector('#dash-close')?.addEventListener('click', () => this.close());
    root.querySelector('#dash-done')?.addEventListener('click', () => this.close());

    root.querySelector('#btn-pdf-winter')?.addEventListener('click', () => {
      downloadPDF(buildWinterTrackSpotterPDFDefinition(), 'Winter_Track_Spotter_Guide.pdf');
    });

    root.querySelector('#btn-pdf-autumn')?.addEventListener('click', () => {
      downloadPDF(buildAutumnLeafPressPDFDefinition(), 'Autumn_Leaf_Press_Journal.pdf');
    });

    root.querySelector('#btn-pdf-hunt')?.addEventListener('click', () => {
      downloadPDF(buildScavengerHuntGuidePDFDefinition(), 'Junior_Ranger_Scavenger_Hunt.pdf');
    });

    root.querySelector('#btn-pdf-cert')?.addEventListener('click', () => {
      downloadPDF(buildJuniorRangerCertificatePDFDefinition('Young Ranger'), 'Junior_Ranger_Certificate.pdf');
    });
  }
}
