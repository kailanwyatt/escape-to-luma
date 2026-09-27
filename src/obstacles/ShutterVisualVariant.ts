/**
 * Split Shutter presentation switch.
 * Collision always uses splitShutterStateAtTime — only meshes change.
 *
 * - `cinematic` — curation pass (default)
 * - `legacy` — archived FacilityShutterArt V1
 */
export type ShutterVisualVariant = 'cinematic' | 'legacy';

/** Flip this to revert while curating. */
export const SHUTTER_VISUAL_VARIANT: ShutterVisualVariant = 'cinematic';
