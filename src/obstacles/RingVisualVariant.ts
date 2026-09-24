/**
 * Climb ring / movingRing presentation switch.
 * Collision always uses evaluateRingCollision — only meshes change.
 */
export type RingVisualVariant = 'cinematic' | 'legacy';

/** Flip this to revert while curating. */
export const RING_VISUAL_VARIANT: RingVisualVariant = 'cinematic';
