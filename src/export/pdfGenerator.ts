import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import pdfMake from 'pdfmake/build/pdfmake';
import vfsFonts from 'pdfmake/build/vfs_fonts';

// Initialize virtual file system once
let isVfsInitialized = false;

export function ensureVfsInitialized(): void {
  if (isVfsInitialized) return;
  const fontsModule = vfsFonts as unknown as { default?: unknown; pdfMake?: { vfs?: unknown } };
  const vfs = fontsModule.default || fontsModule.pdfMake?.vfs || fontsModule;
  if (vfs) {
    (pdfMake as unknown as { addVirtualFileSystem: (v: unknown) => void }).addVirtualFileSystem(vfs);
    isVfsInitialized = true;
  }
}

/**
 * Builds the Winter Track Spotter Nature Observation Guide definition.
 */
export function buildWinterTrackSpotterPDFDefinition(rangerName = 'Young Explorer'): TDocumentDefinitions {
  return {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [32, 32, 32, 32],
    defaultStyle: {
      color: '#3B3B3B',
      fontSize: 10,
    },
    content: [
      { text: 'BRAMBLE & PIP: JUNIOR RANGER FIELD COMPANION', style: 'header' },
      { text: `Ranger: ${rangerName} | Guide: Winter Footprint Detective`, style: 'meta' },
      {
        text: 'Fold along the dotted line to take this pocket guide on your walk!',
        style: 'instruction',
      },
      {
        table: {
          widths: ['50%', '50%'],
          heights: [240, 240],
          body: [
            // Row 1: Rabbit & Songbird
            [
              {
                stack: [
                  { text: 'CARD A: THE HOPPING RABBIT', style: 'cardTitle' },
                  { text: 'Pattern: Large back feet leap ahead of front paws.', style: 'cardSub' },
                  {
                    canvas: [
                      // Back paws (large ovals)
                      { type: 'ellipse', x: 45, y: 35, r1: 10, r2: 20, color: '#2B2B2B' },
                      { type: 'ellipse', x: 80, y: 35, r1: 10, r2: 20, color: '#2B2B2B' },
                      // Front paws (small dots)
                      { type: 'ellipse', x: 110, y: 65, r1: 6, r2: 8, color: '#555555' },
                      { type: 'ellipse', x: 128, y: 65, r1: 6, r2: 8, color: '#555555' },
                      // Leap path indicator
                      {
                        type: 'line',
                        x1: 15,
                        y1: 85,
                        x2: 140,
                        y2: 85,
                        dash: { length: 4, space: 4 },
                        lineWidth: 1.5,
                        lineColor: '#888888',
                      },
                    ],
                  },
                  { text: 'Task: Trace the leap-frog pattern with a crayon.', style: 'taskText' },
                ],
                margin: [8, 8, 8, 8],
              },
              {
                stack: [
                  { text: 'CARD B: THE TINY SONGBIRD', style: 'cardTitle' },
                  { text: 'Pattern: Delicate Y-shaped hops near bushes.', style: 'cardSub' },
                  {
                    canvas: [
                      // Bird print 1
                      { type: 'line', x1: 50, y1: 25, x2: 50, y2: 60, lineWidth: 2.5, lineColor: '#2B2B2B' },
                      { type: 'line', x1: 50, y1: 45, x2: 32, y2: 20, lineWidth: 2.5, lineColor: '#2B2B2B' },
                      { type: 'line', x1: 50, y1: 45, x2: 68, y2: 20, lineWidth: 2.5, lineColor: '#2B2B2B' },
                      // Bird print 2 (offset)
                      { type: 'line', x1: 100, y1: 40, x2: 100, y2: 75, lineWidth: 2.5, lineColor: '#2B2B2B' },
                      { type: 'line', x1: 100, y1: 60, x2: 82, y2: 35, lineWidth: 2.5, lineColor: '#2B2B2B' },
                      { type: 'line', x1: 100, y1: 60, x2: 118, y2: 35, lineWidth: 2.5, lineColor: '#2B2B2B' },
                    ],
                  },
                  { text: 'Task: Look under low pine branches for tiny hops.', style: 'taskText' },
                ],
                margin: [8, 8, 8, 8],
              },
            ],
            // Row 2: Badger & DIY Stamping
            [
              {
                stack: [
                  { text: 'CARD C: THE DIGGING BADGER', style: 'cardTitle' },
                  { text: 'Pattern: Five toes with sharp claw pricks.', style: 'cardSub' },
                  {
                    canvas: [
                      // Main palm pad
                      { type: 'ellipse', x: 75, y: 55, r1: 24, r2: 16, color: '#2B2B2B' },
                      // 5 Claw toes
                      { type: 'ellipse', x: 45, y: 28, r1: 4.5, r2: 4.5, color: '#2B2B2B' },
                      { type: 'ellipse', x: 60, y: 20, r1: 5, r2: 5, color: '#2B2B2B' },
                      { type: 'ellipse', x: 75, y: 18, r1: 5, r2: 5, color: '#2B2B2B' },
                      { type: 'ellipse', x: 90, y: 20, r1: 5, r2: 5, color: '#2B2B2B' },
                      { type: 'ellipse', x: 105, y: 28, r1: 4.5, r2: 4.5, color: '#2B2B2B' },
                    ],
                  },
                  { text: 'Task: Find digging claw marks near damp soil banks.', style: 'taskText' },
                ],
                margin: [8, 8, 8, 8],
              },
              {
                stack: [
                  { text: 'CARD D: DIY TRACK-MAKING', style: 'cardTitle' },
                  { text: 'Make your own tracks in soft snow or sand!', style: 'cardSub' },
                  {
                    canvas: [
                      // Hand stamp diagram
                      { type: 'rect', x: 30, y: 20, w: 45, h: 40, r: 8, color: '#666666' },
                      { type: 'ellipse', x: 95, y: 30, r1: 5, r2: 5, color: '#444444' },
                      { type: 'ellipse', x: 110, y: 30, r1: 5, r2: 5, color: '#444444' },
                      { type: 'ellipse', x: 125, y: 30, r1: 5, r2: 5, color: '#444444' },
                    ],
                  },
                  {
                    text: 'Step 1: Press your fist into the snow for the heavy pad.\nStep 2: Dab finger-tips to stamp toes!',
                    style: 'taskText',
                  },
                ],
                margin: [8, 8, 8, 8],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 1.5,
          vLineWidth: () => 1.5,
          hLineColor: () => '#9E9E9E',
          vLineColor: () => '#9E9E9E',
          hLineStyle: () => ({ dash: { length: 5, space: 4 } }),
          vLineStyle: () => ({ dash: { length: 5, space: 4 } }),
        },
      },
      {
        text: 'Offline vector printable — Zero network egress — Bramble & Pip pedagogical adventure',
        style: 'footer',
        margin: [0, 20, 0, 0],
      },
    ],
    styles: {
      header: { fontSize: 13, bold: true, alignment: 'center', margin: [0, 0, 0, 4] },
      meta: { fontSize: 9, alignment: 'center', margin: [0, 0, 0, 4] },
      instruction: { fontSize: 8, italics: true, alignment: 'center', margin: [0, 0, 0, 10] },
      cardTitle: { fontSize: 9.5, bold: true, color: '#1A1A1A', margin: [0, 0, 0, 2] },
      cardSub: { fontSize: 7.5, italics: true, color: '#4A4A4A', margin: [0, 0, 0, 6] },
      taskText: { fontSize: 7.5, color: '#333333', margin: [0, 6, 0, 0] },
      footer: { fontSize: 8, color: '#95A5A6', alignment: 'center' },
    },
  };
}


/**
 * Builds the Autumn Leaf-Press Guide definition.
 */
export function buildAutumnLeafPressPDFDefinition(): TDocumentDefinitions {
  return {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 40],
    content: [
      {
        text: 'BRAMBLE & PIP — AUTUMN LEAF-PRESS JOURNAL',
        style: 'header',
      },
      {
        text: 'Preserving Autumn Leaves: Step-by-Step Nature Craft',
        style: 'subheader',
      },
      {
        text: 'Follow these gentle steps to preserve real woodland leaves collected with Bramble & Pip:',
        margin: [0, 10, 0, 15],
      },
      {
        ol: [
          'Collect flat, dry fallen leaves from the ground (oak, birch, or maple).',
          'Lay your leaves between two clean paper towels inside a folded newspaper.',
          'Place two heavy books on top and let rest for three quiet days.',
          'Once dry and crisp, tape your specimen inside the collection frame below!',
        ],
      },
      {
        text: 'LEAF SPECIMEN ATTACHMENT BOX',
        style: 'subheader',
        margin: [0, 20, 0, 10],
      },
      {
        table: {
          widths: ['100%'],
          heights: [220],
          body: [
            [
              {
                text: 'Tape or glue your pressed Autumn leaf specimen here.\nRecord where you found it:\nDate: ______________   Location: ______________   Tree: ______________',
                color: '#7F8C8D',
                alignment: 'center',
                margin: [0, 85, 0, 0],
              },
            ],
          ],
        },
      },
      {
        text: 'Offline vector printable — Zero network egress — Bramble & Pip pedagogical adventure',
        style: 'footer',
        margin: [0, 30, 0, 0],
      },
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        color: '#2C3E50',
        alignment: 'center',
      },
      subheader: {
        fontSize: 13,
        bold: true,
        color: '#B85D19',
        alignment: 'center',
        margin: [0, 4, 0, 6],
      },
      footer: {
        fontSize: 8,
        color: '#95A5A6',
        alignment: 'center',
      },
    },
    defaultStyle: {
      fontSize: 10,
      color: '#2C3E50',
    },
  };
}

/**
 * Builds the Junior Ranger Honor Certificate definition for campaign completion.
 */
export function buildJuniorRangerCertificatePDFDefinition(rangerName = 'Young Explorer'): TDocumentDefinitions {
  return {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [40, 40, 40, 40],
    content: [
      {
        text: 'BRAMBLE & PIP — WHISPERING WOODS',
        style: 'header',
        color: '#2C3E50',
      },
      {
        text: 'JUNIOR RANGER HONOR CERTIFICATE',
        style: 'certificateTitle',
      },
      {
        text: 'This certifies that',
        margin: [0, 20, 0, 5],
        alignment: 'center',
        fontSize: 14,
      },
      {
        text: rangerName.toUpperCase(),
        style: 'recipientName',
      },
      {
        text: 'has explored all four seasons with Pip, observed nature with patient kindness,\nand protected the wildlife of the Whispering Woods.',
        alignment: 'center',
        margin: [0, 15, 0, 30],
        fontSize: 12,
        lineHeight: 1.4,
      },
      {
        columns: [
          {
            text: '_________________________\nRanger Bramble\nForest Warden',
            alignment: 'center',
          },
          {
            text: '🐾 🐾 🐾\nPip the Companion\nForest Scout',
            alignment: 'center',
          },
          {
            text: '_________________________\nDate of Honor',
            alignment: 'center',
          },
        ],
      },
    ],
    styles: {
      header: {
        fontSize: 14,
        bold: true,
        alignment: 'center',
      },
      certificateTitle: {
        fontSize: 24,
        bold: true,
        color: '#789E3E',
        alignment: 'center',
        margin: [0, 8, 0, 10],
      },
      recipientName: {
        fontSize: 22,
        bold: true,
        color: '#C96E2E',
        alignment: 'center',
        margin: [0, 10, 0, 10],
      },
    },
    defaultStyle: {
      color: '#2C3E50',
    },
  };
}

/**
 * Builds the 4-Badge Scavenger Hunt expedition guide definition.
 */
export function buildScavengerHuntGuidePDFDefinition(): TDocumentDefinitions {
  return {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 40],
    content: [
      {
        text: 'BRAMBLE & PIP — 4-BADGE OUTDOOR EXPEDITION',
        style: 'header',
      },
      {
        text: 'Nature Detective Scavenger Hunt & Sensory Journal',
        style: 'subheader',
      },
      {
        text: 'Take this gentle checklist outside to earn your four Junior Ranger badges!',
        margin: [0, 8, 0, 16],
      },
      {
        table: {
          widths: ['30%', '55%', '15%'],
          body: [
            [
              { text: 'BADGE', style: 'tableHeader' },
              { text: 'NATURE OBSERVATION MISSION', style: 'tableHeader' },
              { text: 'EARNED', style: 'tableHeader' },
            ],
            [
              { text: '1. The Leaf Detective', bold: true },
              { text: 'Find three different leaf shapes: jagged (oak/birch), wavy, and smooth.' },
              { text: '[   ]', alignment: 'center' },
            ],
            [
              { text: '2. The Natural Tracker', bold: true },
              { text: 'Spot animal tracks in mud or snow, or make your own fist-stamp track.' },
              { text: '[   ]', alignment: 'center' },
            ],
            [
              { text: '3. The Whispering Ear', bold: true },
              { text: 'Sit quietly for 60 seconds. Count 3 distinct natural sounds (wind, bird, rustle).' },
              { text: '[   ]', alignment: 'center' },
            ],
            [
              { text: '4. The Path Maker', bold: true },
              { text: 'Gather 5 fallen twigs and build a tiny, cozy nest on the ground for a woodland beetle.' },
              { text: '[   ]', alignment: 'center' },
            ],
          ],
        },
      },
      {
        text: 'Offline vector printable — Zero network egress — Bramble & Pip pedagogical adventure',
        style: 'footer',
        margin: [0, 30, 0, 0],
      },
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        color: '#2C3E50',
        alignment: 'center',
      },
      subheader: {
        fontSize: 13,
        bold: true,
        color: '#4A7032',
        alignment: 'center',
        margin: [0, 4, 0, 6],
      },
      tableHeader: {
        bold: true,
        fillColor: '#EAE6DF',
        color: '#2C3E50',
      },
      footer: {
        fontSize: 8,
        color: '#95A5A6',
        alignment: 'center',
      },
    },
    defaultStyle: {
      fontSize: 10,
      color: '#2C3E50',
    },
  };
}


export async function exportPDFToBuffer(docDefinition: TDocumentDefinitions): Promise<Uint8Array> {
  ensureVfsInitialized();
  return new Promise<Uint8Array>((resolve, reject) => {
    try {
      const pdf = pdfMake.createPdf(docDefinition);
      pdf.getBuffer((buffer: Uint8Array) => {
        resolve(buffer);
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Renders a PDF definition to a browser Blob.
 */
export async function exportPDFToBlob(docDefinition: TDocumentDefinitions): Promise<Blob> {
  const buffer = await exportPDFToBuffer(docDefinition);
  return new Blob([buffer.buffer as ArrayBuffer], { type: 'application/pdf' });
}

/**
 * Triggers an offline browser download without network egress.
 */
export async function downloadPDF(docDefinition: TDocumentDefinitions, filename: string): Promise<void> {
  const blob = await exportPDFToBlob(docDefinition);
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}
