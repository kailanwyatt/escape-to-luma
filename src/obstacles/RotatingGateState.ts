/** Rotating Gate — solid security disk with one timed sector gap (pie slice). */

import type { RotatingGateConfig } from '../config/ObstacleConfig';

export type { RotatingGateConfig };

export type RotatingGateState = {
  centerX: number;
  centerY: number;
  outerRadius: number;
  /** Decorative hub collar radius (art); plate is solid through the center. */
  innerRadius: number;
  gapAngle: number;
  gapWidth: number;
};

function wrapPi(delta: number): number {
  let d = delta;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function rotatingGateStateAtTime(
  config: RotatingGateConfig,
  time: number,
): RotatingGateState {
  return {
    centerX: config.centerX,
    centerY: config.centerY,
    outerRadius: config.outerRadius,
    innerRadius: Math.max(0.12, Math.min(config.innerRadius, config.outerRadius - 0.35)),
    gapAngle: time * config.speed + (config.phase ?? 0),
    gapWidth: Math.max(0.35, config.gapWidth),
  };
}

export function evaluateRotatingGateCollision(
  config: RotatingGateConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): { hit: boolean; clearance: number; nearMiss: boolean } {
  const state = rotatingGateStateAtTime(config, time);
  const dx = x - state.centerX;
  const dy = y - state.centerY;
  const dist = Math.hypot(dx, dy);

  // Outside the disk: clear.
  if (dist - radius > state.outerRadius) {
    return { hit: false, clearance: dist - state.outerRadius - radius, nearMiss: false };
  }

  const ang = Math.atan2(dy, dx);
  const half = state.gapWidth / 2;
  const delta = Math.abs(wrapPi(ang - state.gapAngle));
  if (delta <= half) {
    // Inside the safe sector — clearance to the nearest sector edge or outer rim.
    const edge = (half - delta) * Math.max(dist, 0.01);
    const radialOut = state.outerRadius - dist;
    const clearance = Math.min(edge, radialOut) - radius;
    return {
      hit: clearance < 0,
      clearance,
      nearMiss: clearance >= 0 && clearance <= 0.16,
    };
  }

  // Solid plate (including the hub): depth into the disk.
  const clearance = -(state.outerRadius - (dist - radius));
  return {
    hit: true,
    clearance,
    nearMiss: false,
  };
}
