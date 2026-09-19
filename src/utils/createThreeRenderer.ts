import type { ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';

export function createThreeRenderer(gl: ExpoWebGLRenderingContext): THREE.WebGLRenderer {
  const width = Math.max(1, gl.drawingBufferWidth);
  const height = Math.max(1, gl.drawingBufferHeight);
  const canvas = createCanvasShim(gl, width, height);

  // Do not pass `context: gl`. Three.js r163+ throws if the given object is
  // instanceof WebGLRenderingContext, and Expo GL contexts are typed that way
  // even when they implement WebGL2. Let Three request 'webgl2' from the shim.
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas as unknown as HTMLCanvasElement,
    antialias: false,
    alpha: false,
  });

  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.autoClear = true;

  return renderer;
}

export function resizeThreeRenderer(
  renderer: THREE.WebGLRenderer,
  gl: ExpoWebGLRenderingContext,
): void {
  const width = Math.max(1, gl.drawingBufferWidth);
  const height = Math.max(1, gl.drawingBufferHeight);
  const canvas = renderer.domElement as unknown as ReturnType<typeof createCanvasShim>;
  canvas.width = width;
  canvas.height = height;
  canvas.clientWidth = width;
  canvas.clientHeight = height;
  renderer.setSize(width, height, false);
}

function createCanvasShim(gl: ExpoWebGLRenderingContext, width: number, height: number) {
  return {
    width,
    height,
    style: {} as Record<string, string>,
    clientWidth: width,
    clientHeight: height,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
    setAttribute: () => {},
    getContext: (type?: string) => {
      if (type && type !== 'webgl2') {
        return null;
      }
      return gl;
    },
    ownerDocument: {
      addEventListener: () => {},
      removeEventListener: () => {},
    },
  };
}
