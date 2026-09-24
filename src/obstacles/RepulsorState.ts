/** Repulsor — solid core plus outward push field (preview/flight via negative wells). */

import type { RepulsorConfig } from '../config/ObstacleConfig';
import type { GravityWell } from '../projectile/physics';

export type { RepulsorConfig };

export type RepulsorState = {
  centerX: number;
  centerY: number;
  coreRadius: number;
  fieldRadius: number;
  strength: number;
  pulse: number;
};

export function repulsorStateAtTime(config: RepulsorConfig, time: number): RepulsorState {
  const pulse =
    config.pulseSpeed && config.pulseSpeed > 0
      ? 0.5 + 0.5 * Math.sin(time * config.pulseSpeed + (config.phase ?? 0))
      : 1;
  return {
    centerX: config.centerX,
    centerY: config.centerY,
    coreRadius: config.coreRadius,
    fieldRadius: config.fieldRadius,
    strength: Math.abs(config.strength),
    pulse,
  };
}

/** Maps to GravityWell with negative strength so integrateMotion pushes outward. */
export function repulsorAsWell(config: RepulsorConfig): GravityWell {
  return {
    x: config.centerX,
    y: config.centerY,
    z: config.z,
    strength: -Math.abs(config.strength),
    radius: config.fieldRadius,
  };
}

export function evaluateRepulsorCollision(
  config: RepulsorConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): { hit: boolean; clearance: number; nearMiss: boolean } {
  const state = repulsorStateAtTime(config, time);
  const clearance =
    Math.hypot(x - state.centerX, y - state.centerY) - state.coreRadius - radius;
  return {
    hit: clearance < 0,
    clearance,
    nearMiss: clearance >= 0 && clearance <= 0.16,
  };
}
