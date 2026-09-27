/** Null Tendril — organic wedges leave one rotating corridor through the dark. */

import type { NullTendrilConfig } from '../config/ObstacleConfig';

export type { NullTendrilConfig };

export type NullTendrilState = {
  centerX: number;
  centerY: number;
  outerRadius: number;
  innerRadius: number;
  gapAngle: number;
  gapWidth: number;
  tendrilCount: number;
};

function wrapPi(delta: number): number {
  let d = delta;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function nullTendrilStateAtTime(
  config: NullTendrilConfig,
  time: number,
): NullTendrilState {
  return {
    centerX: config.centerX,
    centerY: config.centerY,
    outerRadius: config.outerRadius,
    innerRadius: Math.max(0.15, Math.min(config.innerRadius, config.outerRadius - 0.4)),
    gapAngle: time * config.speed + (config.phase ?? 0),
    gapWidth: Math.max(0.4, config.gapWidth),
    tendrilCount: Math.max(2, Math.floor(config.tendrilCount)),
  };
}

export function evaluateNullTendrilCollision(
  config: NullTendrilConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): { hit: boolean; clearance: number; nearMiss: boolean } {
  const state = nullTendrilStateAtTime(config, time);
  const dx = x - state.centerX;
  const dy = y - state.centerY;
  const dist = Math.hypot(dx, dy);

  if (dist + radius < state.innerRadius) {
    return { hit: false, clearance: state.innerRadius - dist - radius, nearMiss: false };
  }
  if (dist - radius > state.outerRadius) {
    return { hit: false, clearance: dist - state.outerRadius - radius, nearMiss: false };
  }

  const ang = Math.atan2(dy, dx);
  const half = state.gapWidth / 2;
  const delta = Math.abs(wrapPi(ang - state.gapAngle));
  if (delta <= half) {
    const edge = (half - delta) * Math.max(dist, 0.01);
    const radialIn = dist - state.innerRadius;
    const radialOut = state.outerRadius - dist;
    const clearance = Math.min(edge, radialIn, radialOut) - radius;
    return {
      hit: clearance < 0,
      clearance,
      nearMiss: clearance >= 0 && clearance <= 0.16,
    };
  }

  const intoOuter = state.outerRadius - (dist - radius);
  const intoInner = dist + radius - state.innerRadius;
  const clearance = -Math.min(intoOuter, intoInner);
  return { hit: true, clearance, nearMiss: false };
}
