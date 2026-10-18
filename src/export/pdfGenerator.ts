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
 * Renders a PDF definition to a Uint8Array buffer completely offline in memory.
 */
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
