/**
 * Capture-pincer / scissor presentation switch.
 * Collision always uses ScissorGateState — only meshes change.
 */
export type ScissorVisualVariant = 'cinematic' | 'legacy';

/** Flip this to revert while curating. */
export const SCISSOR_VISUAL_VARIANT: ScissorVisualVariant = 'cinematic';
