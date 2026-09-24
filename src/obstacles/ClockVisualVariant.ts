/**
 * Clock / retrieval-scanner presentation switch.
 * Collision always uses ClockHandsState — only meshes change.
 */
export type ClockVisualVariant = 'cinematic' | 'legacy';

/** Flip this to revert while curating. */
export const CLOCK_VISUAL_VARIANT: ClockVisualVariant = 'cinematic';
