import { GAME_TUNING } from '../game/gameTuning';
import type { SpeedFieldConfig } from '../config/ObstacleConfig';
import { speedMultiplierAt } from '../obstacles/SpeedFieldState';

export type GravityWell = {
  x: number;
  y: number;
  z: number;
  strength: number;
  radius: number;
};

export type PhysicsForces = {
  windX?: number;
  gravityScale?: number;
  wells?: GravityWell[];
  /** Active Speed Field volumes; sampled each step for flight/prediction parity. */
  speedFields?: SpeedFieldConfig[];
  /** Obstacle clock used when sampling field state (pulse is visual-only). */
  speedFieldTime?: number;
  /** Half-depth of the Z slab around each field plane. */
  speedFieldSlab?: number;
};

export type MotionState = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
};

/** Combined speed multiplier at a point (1 outside all fields). */
export function speedFieldMultiplierAt(
  x: number,
  y: number,
  z: number,
  fields: SpeedFieldConfig[] | undefined,
  time = 0,
  slab = 0.45,
): number {
  if (!fields?.length) return 1;
  let mult = 1;
  for (const field of fields) {
    if (Math.abs(z - field.z) > slab) continue;
    const local = speedMultiplierAt(field, time, x, y);
    if (local !== 1) mult *= local;
  }
  return mult;
}

export function integrateMotion(
  state: MotionState,
  dt: number,
  forces: PhysicsForces = {},
): void {
  state.vy -= GAME_TUNING.gravity * (forces.gravityScale ?? 1) * dt;
  state.vx += (forces.windX ?? 0) * dt;
  for (const well of forces.wells ?? []) {
    const dx = well.x - state.x;
    const dy = well.y - state.y;
    const dz = well.z - state.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.15;
    if (dist > well.radius) {
      continue;
    }
    const falloff = 1 - dist / well.radius;
    const accel = well.strength * falloff * falloff;
    state.vx += (dx / dist) * accel * dt;
    state.vy += (dy / dist) * accel * dt;
  }
  const speedMult = speedFieldMultiplierAt(
    state.x,
    state.y,
    state.z,
    forces.speedFields,
    forces.speedFieldTime ?? 0,
    forces.speedFieldSlab,
  );
  state.x += state.vx * dt * speedMult;
  state.y += state.vy * dt * speedMult;
  state.z += state.vz * dt * speedMult;
}
