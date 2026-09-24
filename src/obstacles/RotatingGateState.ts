/** Rotating Gate — solid security disk with one timed sector gap (pie slice). */

import type { RotatingGateConfig } from '../config/ObstacleConfig';

export type { RotatingGateConfig };

export type RotatingGateState = {
  centerX: number;
  centerY: number;
  outerRadius: number;
  /** Solid hub radius — matches art; the cyan sector only opens outside this. */
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

/**
 * Smallest radius where a ball centered in the sector can clear the wedge apex.
 * Visual hub should cover this so the open pie only shows a flyable path.
 */
export function rotatingGateHubRadius(config: RotatingGateConfig, ballRadius = 0.22): number {
  const gap = Math.max(0.35, config.gapWidth);
  const half = gap / 2;
  const apexClear = ballRadius / Math.max(0.2, Math.sin(half));
  const authored = Math.max(0.12, Math.min(config.innerRadius, config.outerRadius - 0.35));
  return Math.min(config.outerRadius - 0.45, Math.max(authored, apexClear * 0.92));
}

export function rotatingGateStateAtTime(
  config: RotatingGateConfig,
  time: number,
): RotatingGateState {
  return {
    centerX: config.centerX,
    centerY: config.centerY,
    outerRadius: config.outerRadius,
    innerRadius: rotatingGateHubRadius(config),
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

  // Solid hub — no free pass through the middle of the pie.
  const hubClearance = dist - state.innerRadius - radius;
  if (hubClearance < 0) {
    return { hit: true, clearance: hubClearance, nearMiss: false };
  }

  const ang = Math.atan2(dy, dx);
  const half = state.gapWidth / 2;
  const delta = Math.abs(wrapPi(ang - state.gapAngle));
  if (delta <= half) {
    // Inside the safe sector — clearance to the nearer sector edge ray (or rim).
    const edge = dist * Math.sin(Math.max(0, half - delta));
    const radialOut = state.outerRadius - dist;
    const clearance = Math.min(edge, radialOut) - radius;
    return {
      hit: clearance < 0,
      clearance,
      nearMiss: clearance >= 0 && clearance <= 0.16,
    };
  }

  // Solid plate: depth into the disk.
  const clearance = -(state.outerRadius - (dist - radius));
  return {
    hit: true,
    clearance,
    nearMiss: false,
  };
}
