import * as THREE from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

/** The comparison film and campaign must use the same lighting finish. */
export const CINEMATIC_EXPOSURE = 1.05;
export function createCinematicBloom(hdr = true) {
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .36, .4, 1.25);
  // Older GL implementations can still play the film with byte-backed buffers.
  if (!hdr) {
    for (const target of [bloom.renderTargetBright, ...bloom.renderTargetsHorizontal, ...bloom.renderTargetsVertical]) {
      target.texture.type = THREE.UnsignedByteType;
    }
  }
  return bloom;
}

/** Three's bloom pass does not release its high-pass material in this version. */
export function disposeCinematicBloom(bloom: UnrealBloomPass | null) {
  if (!bloom) return;
  bloom.materialHighPassFilter.dispose();
  bloom.dispose();
}
