/** Shockwave / Pulse Ring — expanding luminous ring cycles outward then resets. */

import type { PulseRingConfig } from '../config/ObstacleConfig';

export type { PulseRingConfig };

export type PulseRingState = {
  centerX: number;
  centerY: number;
  radius: number;
  thickness: number;
  cycleT: number;
};

export function pulseRingStateAtTime(config: PulseRingConfig, time: number): PulseRingState {
  const span = Math.max(0.01, config.maxRadius - config.minRadius);
  const phase = config.phase ?? 0;
  const raw = time * config.speed + phase;
  const cycleT = ((raw % 1) + 1) % 1;
  const drift = config.driftAmplitude ?? 0;
  const driftSpeed = config.driftSpeed ?? config.speed;
  const sway = time * driftSpeed + phase;
  return {
    centerX: config.centerX + drift * Math.sin(sway),
    centerY: config.centerY + drift * 0.28 * Math.cos(sway * 0.9),
    radius: config.minRadius + span * cycleT,
    thickness: config.thickness,
    cycleT,
  };
}

export function evaluatePulseRingCollision(
  config: PulseRingConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): { hit: boolean; clearance: number; nearMiss: boolean } {
  const state = pulseRingStateAtTime(config, time);
  const dist = Math.hypot(x - state.centerX, y - state.centerY);
  // Always-clear hub so "throw through the eye" works — but the eye can drift off the throw line.
  const hubClear = Math.max(0.42, config.minRadius - state.thickness * 0.55);
  if (dist + radius <= hubClear) {
    const clearance = hubClear - dist - radius;
    return { hit: false, clearance, nearMiss: clearance >= 0 && clearance <= 0.16 };
  }
  const clearance = Math.abs(dist - state.radius) - state.thickness - radius;
  return {
    hit: clearance < 0,
    clearance,
    nearMiss: clearance >= 0 && clearance <= 0.16,
  };
}
