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
export function buildWinterTrackSpotterPDFDefinition(): TDocumentDefinitions {
  return {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 40],
    content: [
      {
        text: 'BRAMBLE & PIP — WINTER NATURE GUIDE',
        style: 'header',
      },
      {
        text: 'Wildlife Track Spotter & Outdoor Exploration Chart',
        style: 'subheader',
      },
      {
        text: 'Put on your warm mittens, step into the quiet woods or nearby park with an adult, and look for animal footprints in the snow or damp soil!',
        margin: [0, 10, 0, 20],
      },
      {
        table: {
          widths: ['25%', '50%', '25%'],
          body: [
            [
              { text: 'ANIMAL', style: 'tableHeader' },
              { text: 'TRACK CHARACTERISTICS', style: 'tableHeader' },
              { text: 'SPOTTED [ ✓ ]', style: 'tableHeader' },
            ],
            [
              { text: 'Roe Deer', bold: true },
              { text: 'Two slender crescent-shaped cloven hoof prints. Often found near low shrubbery and berry bushes.' },
              { text: '[   ]', alignment: 'center' },
            ],
            [
              { text: 'Eurasian Hedgehog', bold: true },
              { text: 'Five small clawed toes spread like tiny stars. Look around hedgerows and leaf piles.' },
              { text: '[   ]', alignment: 'center' },
            ],
            [
              { text: 'Tawny Owl', bold: true },
              { text: 'Three forward talon impressions, one rear spur. Look under roosting pine branches.' },
              { text: '[   ]', alignment: 'center' },
            ],
            [
              { text: 'Red Fox', bold: true },
              { text: 'Neat single-file straight path. Four oval toe pads with distinct claw dots ahead.' },
              { text: '[   ]', alignment: 'center' },
            ],
          ],
        },
      },
      {
        text: 'FIELD SKETCHING FRAME',
        style: 'subheader',
        margin: [0, 25, 0, 10],
      },
      {
        table: {
          widths: ['100%'],
          heights: [180],
          body: [
            [
              {
                text: 'Draw your favorite track or nature discovery inside this box with your pencil or wax crayon.',
                color: '#7F8C8D',
                alignment: 'center',
                margin: [0, 75, 0, 0],
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
        color: '#4B6B4E',
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
