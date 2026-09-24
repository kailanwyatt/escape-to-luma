/**
 * Elevator Blocks presentation switch.
 * Collision always uses elevatorBlocksStateAtTime — only meshes change.
 *
 * - `cinematic` — curation pass (default)
 * - `legacy` — archived FacilityElevatorArt V1
 */
export type ElevatorVisualVariant = 'cinematic' | 'legacy';

/** Flip this to revert while curating. */
export const ELEVATOR_VISUAL_VARIANT: ElevatorVisualVariant = 'cinematic';
