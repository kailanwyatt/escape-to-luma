/** Endless rewards are banked on each clear, never paid again by the result screen. */
export const VOYAGE_LEG_LENGTH = 8;
export function voyageReward(cleared: number): number {
  if (!Number.isInteger(cleared) || cleared <= 0) return 0;
  return 2 + (cleared % VOYAGE_LEG_LENGTH === 0 ? 8 : 0);
}
export function nextVoyageMilestone(cleared: number): number {
  return (Math.floor(Math.max(0, cleared) / VOYAGE_LEG_LENGTH) + 1) * VOYAGE_LEG_LENGTH;
}
