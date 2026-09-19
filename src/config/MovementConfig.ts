export type MovementType = 'none' | 'horizontal' | 'vertical';

export interface MovementConfig {
  type: MovementType;
  amplitude?: number;
  speed?: number;
  phase?: number;
}

export function sampleMovement(
  movement: MovementConfig | undefined,
  base: number,
  elapsedTime: number,
): number {
  if (!movement || movement.type === 'none') {
    return base;
  }
  const amplitude = movement.amplitude ?? 0;
  const speed = movement.speed ?? 0;
  const phase = movement.phase ?? 0;
  return base + Math.sin(elapsedTime * speed + phase) * amplitude;
}
