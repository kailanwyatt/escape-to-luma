import {Platform} from 'react-native';

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
};

const IOS: GraphicsQuality = {
  msaaSamples: 4,
  aimPredictHz: 60,
  ambientUpdateEveryN: 1,
  hudMinIntervalMs: 0,
};

const ANDROID: GraphicsQuality = {
  msaaSamples: 0,
  aimPredictHz: 30,
  ambientUpdateEveryN: 2,
  hudMinIntervalMs: 50,
};

export const GRAPHICS_QUALITY: GraphicsQuality =
  Platform.OS === 'android' ? ANDROID : IOS;

export function isAndroidGraphics(): boolean {
  return Platform.OS === 'android';
}
