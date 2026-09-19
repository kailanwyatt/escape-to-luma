export function distanceToTarget(
  projectileX: number,
  projectileY: number,
  targetX: number,
  targetY: number,
): number {
  const dx = projectileX - targetX;
  const dy = projectileY - targetY;
  return Math.sqrt(dx * dx + dy * dy);
}
