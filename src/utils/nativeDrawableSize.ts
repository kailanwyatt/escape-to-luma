import type { ExpoWebGLRenderingContext } from 'expo-gl';

/** Expo 57 resizes the native framebuffer without refreshing its JS dimensions. */
export function syncNativeDrawableSize(
  gl: ExpoWebGLRenderingContext,
  width: number,
  height: number,
  pixelRatio: number,
): void {
  if (!(width > 0 && height > 0 && pixelRatio > 0)) return;
  Object.assign(gl, {
    drawingBufferWidth: Math.max(1, Math.round(width * pixelRatio)),
    drawingBufferHeight: Math.max(1, Math.round(height * pixelRatio)),
  });
}
