/** Render-only budgets. No platform imports: usable by native, web and verification tools. */
export type OpeningQuality = {
  stars: number;
  motes: number;
  dust: number;
  shards: number;
  bays: number;
  sphereSegments: number;
  curveSegments: number;
  nebulaOctaves: number;
  maxPixels: number;
  minPixels: number;
};

export const DESKTOP_OPENING_QUALITY: Readonly<OpeningQuality> = {
  stars: 2600, motes: 440, dust: 500, shards: 80, bays: 9,
  sphereSegments: 64, curveSegments: 130, nebulaOctaves: 5,
  maxPixels: 2_400_000, minPixels: 960_000,
};

// Keep the approved art identical. Mobile adapts fill resolution, never scene content.
export const MOBILE_OPENING_QUALITY: Readonly<OpeningQuality> = {
  ...DESKTOP_OPENING_QUALITY,
  maxPixels: 960_000, minPixels: 540_000,
};

export function openingRenderSize(width: number, height: number, pixelBudget: number) {
  const w = Math.max(1, Math.floor(width)), h = Math.max(1, Math.floor(height));
  const scale = Math.min(1, Math.sqrt(Math.max(1, pixelBudget) / (w * h)));
  return { width: Math.max(1, Math.floor(w * scale)), height: Math.max(1, Math.floor(h * scale)) };
}
