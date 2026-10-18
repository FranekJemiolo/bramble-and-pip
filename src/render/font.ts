import { IndexedImage, TRANSPARENT } from './indexed';

/**
 * 5x7 Pixel Font Definitions for uppercase ASCII letters, digits, and basic punctuation.
 * Encoded as 7 rows of 5-bit numbers.
 */
const GLYPHS: Record<string, number[]> = {
  ' ': [0, 0, 0, 0, 0, 0, 0],
  '!': [0b00100, 0b00100, 0b00100, 0b00100, 0b00000, 0b00100, 0],
  '"': [0b01010, 0b01010, 0, 0, 0, 0, 0],
  '#': [0b01010, 0b11111, 0b01010, 0b01010, 0b11111, 0b01010, 0],
  '$': [0b00100, 0b01111, 0b10100, 0b01110, 0b00101, 0b11110, 0b00100],
  '%': [0b11001, 0b11010, 0b00100, 0b01000, 0b01011, 0b10011, 0],
  '&': [0b01100, 0b10010, 0b10100, 0b01000, 0b10101, 0b10010, 0b01101],
  "'": [0b00100, 0b00100, 0, 0, 0, 0, 0],
  '(': [0b00010, 0b00100, 0b01000, 0b01000, 0b01000, 0b00100, 0b00010],
  ')': [0b01000, 0b00100, 0b00010, 0b00010, 0b00010, 0b00100, 0b01000],
  '*': [0, 0b00100, 0b10101, 0b01110, 0b10101, 0b00100, 0],
  '+': [0, 0b00100, 0b00100, 0b11111, 0b00100, 0b00100, 0],
  ',': [0, 0, 0, 0, 0b00110, 0b00100, 0b01000],
  '-': [0, 0, 0, 0b11111, 0, 0, 0],
  '.': [0, 0, 0, 0, 0, 0b00110, 0b00110],
  '/': [0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0, 0],
  '0': [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
  '1': [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  '2': [0b01110, 0b10001, 0b00001, 0b00010, 0b00100, 0b01000, 0b11111],
  '3': [0b11111, 0b00010, 0b00100, 0b00010, 0b00001, 0b10001, 0b01110],
  '4': [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  '5': [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
  '6': [0b00110, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  '7': [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  '8': [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  '9': [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100],
  ':': [0, 0b00110, 0b00110, 0, 0b00110, 0b00110, 0],
  ';': [0, 0b00110, 0b00110, 0, 0b00110, 0b00100, 0b01000],
  '<': [0b00010, 0b00100, 0b01000, 0b10000, 0b01000, 0b00100, 0b00010],
  '=': [0, 0b11111, 0, 0b11111, 0, 0, 0],
  '>': [0b01000, 0b00100, 0b00010, 0b00001, 0b00010, 0b00100, 0b01000],
  '?': [0b01110, 0b10001, 0b00001, 0b00010, 0b00100, 0, 0b00100],
  '@': [0b01110, 0b10001, 0b00001, 0b01101, 0b10101, 0b10001, 0b01110],
  'A': [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  'B': [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  'C': [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
  'D': [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
  'E': [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  'F': [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  'G': [0b01110, 0b10001, 0b10000, 0b10011, 0b10001, 0b10001, 0b01110],
  'H': [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  'I': [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  'J': [0b00001, 0b00001, 0b00001, 0b00001, 0b10001, 0b10001, 0b01110],
  'K': [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  'L': [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  'M': [0b10001, 0b11011, 0b10101, 0b10001, 0b10001, 0b10001, 0b10001],
  'N': [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
  'O': [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  'P': [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  'Q': [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  'R': [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  'S': [0b01110, 0b10001, 0b10000, 0b01110, 0b00001, 0b10001, 0b01110],
  'T': [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  'U': [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  'V': [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  'W': [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b11011, 0b10001],
  'X': [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  'Y': [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  'Z': [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
};

export class PixelFont {
  static readonly GLYPH_WIDTH = 5;
  static readonly GLYPH_HEIGHT = 7;
  static readonly CHAR_SPACING = 1;

  /**
   * Measures pixel width of a string.
   */
  static measureWidth(text: string, letterSpacing = PixelFont.CHAR_SPACING): number {
    if (!text.length) return 0;
    return text.length * PixelFont.GLYPH_WIDTH + (text.length - 1) * letterSpacing;
  }

  /**
   * Draws text onto an IndexedImage at (x, y) with a given palette color index.
   */
  static drawText(
    img: IndexedImage,
    x: number,
    y: number,
    text: string,
    colorIndex: number,
    letterSpacing = PixelFont.CHAR_SPACING
  ): void {
    const upper = text.toUpperCase();
    let cx = x;
    for (let i = 0; i < upper.length; i++) {
      const ch = upper[i] ?? ' ';
      const glyph = GLYPHS[ch] ?? GLYPHS['?'] ?? GLYPHS[' '];
      for (let row = 0; row < PixelFont.GLYPH_HEIGHT; row++) {
        const rowBits = glyph[row] ?? 0;
        for (let col = 0; col < PixelFont.GLYPH_WIDTH; col++) {
          if ((rowBits & (1 << (4 - col))) !== 0) {
            img.set(cx + col, y + row, colorIndex);
          }
        }
      }
      cx += PixelFont.GLYPH_WIDTH + letterSpacing;
    }
  }

  /**
   * Creates a standalone IndexedImage containing the rendered text.
   */
  static renderText(
    text: string,
    colorIndex: number,
    bgColor: number = TRANSPARENT,
    padding = 2,
    letterSpacing = PixelFont.CHAR_SPACING
  ): IndexedImage {
    const textWidth = this.measureWidth(text, letterSpacing);
    const w = textWidth + padding * 2;
    const h = PixelFont.GLYPH_HEIGHT + padding * 2;
    const img = IndexedImage.create(w, h, bgColor);
    this.drawText(img, padding, padding, text, colorIndex, letterSpacing);
    return img;
  }
}
