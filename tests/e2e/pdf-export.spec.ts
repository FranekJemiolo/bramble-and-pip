import { test, expect } from '@playwright/test';

test.describe('Client-Side Offline Vector PDF Generation', () => {
  test('generates valid %PDF- binary buffer in browser with %%EOF trailer', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('#game-container canvas')).toBeVisible();

    // Dynamically trigger client-side export in browser page context
    const pdfBytes = await page.evaluate(async () => {
      const exportHelpers = (window as unknown as { __EXPORT_PDF__: {
        buildWinterTrackSpotterPDFDefinition: () => unknown;
        exportPDFToBuffer: (def: unknown) => Promise<Uint8Array>;
      } }).__EXPORT_PDF__;

      const def = exportHelpers.buildWinterTrackSpotterPDFDefinition();
      const buf = await exportHelpers.exportPDFToBuffer(def);
      return Array.from(buf);
    });

    expect(pdfBytes.length).toBeGreaterThan(1000);

    // Verify %PDF- magic header
    const header = String.fromCharCode(...pdfBytes.slice(0, 5));
    expect(header).toBe('%PDF-');

    // Verify %%EOF trailer in last 64 bytes
    const trailer = String.fromCharCode(...pdfBytes.slice(-64));
    expect(trailer).toContain('%%EOF');
  });
});
