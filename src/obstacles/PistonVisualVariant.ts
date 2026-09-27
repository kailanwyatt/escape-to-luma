/**
 * Piston presentation switch for curation.
 * Collision / prediction always use PistonFieldState — only meshes change.
 *
 * - `cinematic` — current showcase-quality art (default)
 * - `legacy-cinematic` — archived CinematicPistonArt V1
 * - `basic` — original MeshBasic lane boxes
 */
export type PistonVisualVariant = 'cinematic' | 'legacy-cinematic' | 'basic';

/** Flip this to revert while curating. */
export const PISTON_VISUAL_VARIANT: PistonVisualVariant = 'cinematic';
