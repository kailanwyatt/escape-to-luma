import {Platform} from 'react-native';
import {isWebArcadeBuild} from './webArcade';

/**
 * Mobile GPU / JS budget knobs.
 * Android fill-rate and bridge cost are typically worse than iOS; keep defaults conservative.
 */
export type GraphicsQuality = {
  /** Expo GLView MSAA samples (0 = off). */
  msaaSamples: 0 | 2 | 4;
  /** Max aim-path predictShot refreshes per second while dragging. */
  aimPredictHz: number;
  /** Skip ambient floater/asteroid motion every N frames (1 = every frame). */
  ambientUpdateEveryN: number;
  /** Min ms between React HUD pushes from the game loop. */
  hudMinIntervalMs: number;
  /** Reusable burst meshes reserved for the active game scene. */
  particlePoolSize: number;
  /** Reusable meshes in Spark's flight trail. */
  trailNodeCount: number;
  /** Web Arcade only: maximum physical pixels per CSS pixel for its canvas. */
  webRenderPixelRatioCap: number;
  /** Web Arcade only: maximum canvas backing-store pixels. */
  webRenderPixelBudget: number;
};

const IOS: GraphicsQuality = {
  // Expo GLView supports this built-in multisampling on iOS. Two samples keep
  // the portal edge smooth without spending the full 4x resolve every frame.
  msaaSamples: 2,
  aimPredictHz: 36,
  ambientUpdateEveryN: 2,
  hudMinIntervalMs: 50,
  particlePoolSize: 48,
  trailNodeCount: 18,
  webRenderPixelRatioCap: Number.POSITIVE_INFINITY,
  webRenderPixelBudget: Number.POSITIVE_INFINITY,
};

const ANDROID: GraphicsQuality = {
  msaaSamples: 0,
  aimPredictHz: 30,
  ambientUpdateEveryN: 2,
  hudMinIntervalMs: 50,
  particlePoolSize: 48,
  trailNodeCount: 18,
  webRenderPixelRatioCap: Number.POSITIVE_INFINITY,
  webRenderPixelBudget: Number.POSITIVE_INFINITY,
};

/**
 * The public Arcade is a WebGL game in a mobile browser, not a native GL
 * surface. Phone browsers otherwise render it at a 3x+ backing resolution.
 * The cap and pixel budget keep the play field crisp while lowering fill-rate.
 */
const WEB_ARCADE: GraphicsQuality = {
  msaaSamples: 0,
  aimPredictHz: 24,
  ambientUpdateEveryN: 3,
  hudMinIntervalMs: 100,
  particlePoolSize: 36,
  trailNodeCount: 14,
  webRenderPixelRatioCap: 1.5,
  webRenderPixelBudget: 1_600_000,
};

export const GRAPHICS_QUALITY: GraphicsQuality =
  isWebArcadeBuild ? WEB_ARCADE : Platform.OS === 'android' ? ANDROID : IOS;

/** Backing-store scale for the web Arcade canvas. Never exceeds the device pixel ratio cap. */
export function webArcadeBackingRatio(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
): number {
  const cap = Math.min(Math.max(devicePixelRatio || 1, 0), GRAPHICS_QUALITY.webRenderPixelRatioCap);
  const cssPixels = cssWidth * cssHeight;
  const budget = GRAPHICS_QUALITY.webRenderPixelBudget;
  if (!(cssPixels > 0) || !(budget > 0) || !Number.isFinite(budget)) {
    return cap;
  }
  const budgetRatio = Math.sqrt(budget / cssPixels);
  return Math.min(cap, Math.max(1, budgetRatio));
}

export function isAndroidGraphics(): boolean {
  return Platform.OS === 'android';
}
