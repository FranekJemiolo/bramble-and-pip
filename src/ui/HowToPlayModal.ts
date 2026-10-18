import { eventBus } from '../core/EventBus';

export class HowToPlayModal {
  private isOpen = false;

  open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.render();
    eventBus.emit('audio:sfx', { sound: 'click' });
  }

  close(): void {
    this.isOpen = false;
    const root = document.getElementById('overlay-root');
    if (root) {
      root.innerHTML = '';
    }
    eventBus.emit('audio:sfx', { sound: 'click' });
  }

  private render(): void {
    const root = document.getElementById('overlay-root');
    if (!root) return;

    root.innerHTML = `
      <div class="guide-modal-backdrop" style="position:fixed;inset:0;background:rgba(26,26,36,0.88);display:flex;align-items:center;justify-content:center;z-index:9998;font-family:sans-serif;padding:16px;box-sizing:border-box;">
        <div class="guide-modal-card" style="background:#FAF6E8;color:#2C3E50;padding:24px;border-radius:12px;border:3px solid #5C4033;max-width:520px;width:100%;max-height:88vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.6);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-bottom:2px solid #EAE6DF;padding-bottom:8px;">
            <h2 style="margin:0;font-size:18px;color:#2C3E50;">📖 Ranger's Field Manual — How to Play</h2>
            <button id="guide-close" style="background:none;border:none;font-size:20px;cursor:pointer;color:#5C4033;">✕</button>
          </div>

          <div style="font-size:13px;line-height:1.5;color:#5C4033;">
            <section style="margin-bottom:14px;">
              <h3 style="margin:0 0 4px;font-size:14px;color:#4A7032;">🌲 Welcome to Whispering Woods</h3>
              <p style="margin:0;">
                You are a <strong>Junior Ranger</strong> exploring four peaceful seasons alongside <strong>Pip</strong>, your curious pinecone companion.
              </p>
            </section>

            <section style="margin-bottom:14px;">
              <h3 style="margin:0 0 4px;font-size:14px;color:#4A7032;">🐾 Moving & Exploring</h3>
              <ul style="margin:0;padding-left:18px;">
                <li><strong>Tap or Click:</strong> Tap anywhere on the trail or forest floor to walk there. Pip will hop right behind you!</li>
                <li><strong>Arrow Keys / WASD:</strong> On computer keyboards, use arrow keys or W/A/S/D to wander smoothly.</li>
                <li><strong>Forest Friends:</strong> Walk up to hedgehogs, badgers, ducklings, and sparrows to listen and observe.</li>
                <li><strong>Nature Treasures:</strong> Walk over fallen acorns, pinecones, and oak leaves to collect them into your Satchel.</li>
              </ul>
            </section>

            <section style="margin-bottom:14px;">
              <h3 style="margin:0 0 4px;font-size:14px;color:#4A7032;">🎒 Satchel, Sketchpad & Printables</h3>
              <ul style="margin:0;padding-left:18px;">
                <li><strong>DRAW Button:</strong> Opens your wax crayon sketchbook to draw bark rubbings and track sketches.</li>
                <li><strong>Printable Field Guides:</strong> Download 100% offline 300 DPI vector PDF guides (*Winter Footprint Detective*, *Leaf-Press Journal*, *Honor Certificate*) to take on real-world nature walks!</li>
              </ul>
            </section>

            <section style="margin-bottom:14px;">
              <h3 style="margin:0 0 4px;font-size:14px;color:#4A7032;">🧩 Peaceful Puzzles</h3>
              <ul style="margin:0;padding-left:18px;">
                <li><strong>The Mossy Gearbox:</strong> Drag wooden gears onto axles with 80px magnetic snapping to spin the waterwheel.</li>
                <li><strong>Stepping Stones:</strong> Count and match dot patterns on river stones to help baby ducklings cross.</li>
                <li><strong>No Rush, No Stress:</strong> Zero failure states, zero timers, and zero point scores.</li>
              </ul>
            </section>

            <section style="margin-bottom:14px;">
              <h3 style="margin:0 0 4px;font-size:14px;color:#4A7032;">🌙 Calming Sunset & Bedtime</h3>
              <p style="margin:0;">
                Play is limited to <strong>15 minutes each day</strong>. At minute 12, a gentle sunset softens the colors and filters the sound down to cozy low tones. At minute 15, Pip curls up by the warm fireplace for restful sleep.
              </p>
            </section>

            <section style="margin-bottom:14px;background:#EAE6DF;padding:10px;border-radius:6px;">
              <h3 style="margin:0 0 4px;font-size:13px;color:#2C3E50;">🌿 Grown-Ups Area (ADULT Button)</h3>
              <p style="margin:0;font-size:12px;">
                Protected by a word-math multiplication gate. Parents can view today's nature conversation starters, check curfew schedules, and export printable field kits without any child accidental access.
              </p>
            </section>
          </div>

          <div style="margin-top:16px;text-align:center;">
            <button id="guide-done" style="padding:10px 24px;background:#4A7032;border:2px solid #2E5328;color:#FAF6E8;border-radius:6px;font-weight:bold;cursor:pointer;font-size:14px;">
              Ready to Explore! 🌿
            </button>
          </div>
        </div>
      </div>
    `;

    root.querySelector('#guide-close')?.addEventListener('click', () => this.close());
    root.querySelector('#guide-done')?.addEventListener('click', () => this.close());
  }
}
