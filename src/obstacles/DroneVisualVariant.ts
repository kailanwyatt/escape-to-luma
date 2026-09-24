/**
 * Patrol-drone (conveyorGate) presentation switch.
 * Collision always uses conveyorGateBlocksAtTime — only meshes change.
 */
export type DroneVisualVariant = 'cinematic' | 'legacy';

/** Flip this to revert while curating. */
export const DRONE_VISUAL_VARIANT: DroneVisualVariant = 'cinematic';
