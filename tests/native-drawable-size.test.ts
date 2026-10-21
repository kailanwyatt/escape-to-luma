import { expect, it } from 'vitest';
import type { ExpoWebGLRenderingContext } from 'expo-gl';
import { syncNativeDrawableSize } from '../src/utils/nativeDrawableSize';

it('updates the native context snapshot through folds, rotations, and scaled surfaces', () => {
  const gl = {drawingBufferWidth: 1260, drawingBufferHeight: 2736} as ExpoWebGLRenderingContext;
  for (const [width, height] of [[420, 912], [912, 420], [732, 912], [912, 732], [180.5, 240.25]]) {
    syncNativeDrawableSize(gl, width, height, 3);
    expect(gl.drawingBufferWidth).toBe(Math.round(width * 3));
    expect(gl.drawingBufferHeight).toBe(Math.round(height * 3));
    expect(gl.drawingBufferWidth / gl.drawingBufferHeight).toBeCloseTo(width / height, 2);
  }
  const previous = {...gl};
  syncNativeDrawableSize(gl, 0, 0, 3);
  expect(gl).toEqual(previous);
});
