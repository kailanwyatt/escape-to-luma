export type MovementType = 'none' | 'horizontal' | 'vertical' | 'teleport';

export interface MovementConfig {
  type: MovementType;
  amplitude?: number;
  speed?: number;
  phase?: number;
  /** Teleport target: fixed anchors the portal cycles through by vanishing. */
  anchors?: { x: number; y: number }[];
  /** Seconds the portal stays present at an anchor. */
  dwell?: number;
  /** Seconds the portal is gone before reappearing at the next anchor. */
  vanish?: number;
}

export function sampleMovement(
  movement: MovementConfig | undefined,
  base: number,
  elapsedTime: number,
): number {
  if (!movement || movement.type === 'none' || movement.type === 'teleport') {
    return base;
  }
  const amplitude = movement.amplitude ?? 0;
  const speed = movement.speed ?? 0;
  const phase = movement.phase ?? 0;
  return base + Math.sin(elapsedTime * speed + phase) * amplitude;
}

/** Destination portal that vanishes, then reappears at the next fixed anchor. */
export function teleportTargetPoseAtTime(
  movement: MovementConfig,
  elapsedTime: number,
): { x: number; y: number; present: boolean } {
  const anchors = movement.anchors?.length ? movement.anchors : [{ x: 0, y: 3 }];
  const dwell = Math.max(0.35, movement.dwell ?? 1.1);
  const vanish = Math.max(0.15, movement.vanish ?? 0.55);
  const cycle = dwell + vanish;
  const speed = movement.speed ?? 1;
  const raw = elapsedTime * speed + (movement.phase ?? 0);
  const step = Math.floor(raw / cycle);
  const local = ((raw % cycle) + cycle) % cycle;
  const n = anchors.length;
  const idx = ((step % n) + n) % n;
  const cur = anchors[idx];
  return { x: cur.x, y: cur.y, present: local < dwell };
}
