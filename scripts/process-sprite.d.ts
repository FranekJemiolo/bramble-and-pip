export type RGB = readonly [number, number, number];

export const WHISPERING_WOODS_RGB: readonly [number, number, number][];

export function findNearestColor(
  r: number,
  g: number,
  b: number,
  palette?: readonly [number, number, number][]
): { color: [number, number, number]; index: number };

export interface ProcessSpriteOptions {
  chromaKey?: [number, number, number];
  alphaThreshold?: number;
}

export interface ProcessSpriteResult {
  width: number;
  height: number;
  outputPath: string;
}

export function processRawSprite(
  inputPath: string,
  outputPath: string,
  options?: ProcessSpriteOptions
): Promise<ProcessSpriteResult>;
