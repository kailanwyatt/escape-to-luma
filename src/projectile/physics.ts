import { GAME_TUNING } from '../game/gameTuning';

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
};

export type MotionState = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
};

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
  state.x += state.vx * dt;
  state.y += state.vy * dt;
  state.z += state.vz * dt;
}
