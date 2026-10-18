import { describe, expect, it } from 'vitest';
import {
  buildWinterTrackSpotterPDFDefinition,
  buildAutumnLeafPressPDFDefinition,
  buildJuniorRangerCertificatePDFDefinition,
  buildScavengerHuntGuidePDFDefinition,
  exportPDFToBuffer,
} from '../../src/export/pdfGenerator';

describe('Offline Vector PDF Generator', () => {
  it('generates valid Winter Track Spotter PDF with %PDF- header in memory', async () => {
    const docDef = buildWinterTrackSpotterPDFDefinition();
    expect(docDef.content).toBeDefined();

    const buffer = await exportPDFToBuffer(docDef);
    expect(buffer).toBeInstanceOf(Uint8Array);
    expect(buffer.length).toBeGreaterThan(1000);

    // Verify standard PDF magic header (%PDF-)
    const header = String.fromCharCode(...buffer.subarray(0, 5));
    expect(header).toBe('%PDF-');
  });

  it('generates valid Autumn Leaf Press PDF with %PDF- header in memory', async () => {
    const docDef = buildAutumnLeafPressPDFDefinition();
    expect(docDef.content).toBeDefined();

    const buffer = await exportPDFToBuffer(docDef);
    expect(buffer).toBeInstanceOf(Uint8Array);
    expect(buffer.length).toBeGreaterThan(1000);

    const header = String.fromCharCode(...buffer.subarray(0, 5));
    expect(header).toBe('%PDF-');
  });

  it('generates valid Junior Ranger Certificate PDF with %PDF- header in memory', async () => {
    const docDef = buildJuniorRangerCertificatePDFDefinition('Pip');
    expect(docDef.content).toBeDefined();

    const buffer = await exportPDFToBuffer(docDef);
    expect(buffer).toBeInstanceOf(Uint8Array);
    expect(buffer.length).toBeGreaterThan(1000);

    const header = String.fromCharCode(...buffer.subarray(0, 5));
    expect(header).toBe('%PDF-');
  });

  it('generates valid 4-Badge Scavenger Hunt PDF with %PDF- header in memory', async () => {
    const docDef = buildScavengerHuntGuidePDFDefinition();
    expect(docDef.content).toBeDefined();

    const buffer = await exportPDFToBuffer(docDef);
    expect(buffer).toBeInstanceOf(Uint8Array);
    expect(buffer.length).toBeGreaterThan(1000);

    const header = String.fromCharCode(...buffer.subarray(0, 5));
    expect(header).toBe('%PDF-');
  });
});

