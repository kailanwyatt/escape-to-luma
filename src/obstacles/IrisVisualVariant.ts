/**
 * Iris / airlock presentation switch.
 * Collision always uses irisRadiusAt — only meshes change.
 */
export type IrisVisualVariant = 'cinematic' | 'legacy';

/** Flip this to revert while curating. */
export const IRIS_VISUAL_VARIANT: IrisVisualVariant = 'cinematic';
