/**
 * Reactive Gate / containment door presentation switch.
 * Collision always uses reactiveGateStateAtTime — only meshes change.
 *
 * - `cinematic` — curation pass (default)
 * - `legacy` — archived ContainmentGateArt V1
 */
export type GateVisualVariant = 'cinematic' | 'legacy';

/** Flip this to revert while curating. */
export const GATE_VISUAL_VARIANT: GateVisualVariant = 'cinematic';
