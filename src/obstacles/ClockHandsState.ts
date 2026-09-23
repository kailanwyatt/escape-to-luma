/** Clock Hands — one or two long rotating arms around a hub. */

import type { ClockHandsConfig } from '../config/ObstacleConfig';

export type { ClockHandsConfig };

export type ClockHandPose = {
  angle: number;
  tipX: number;
  tipY: number;
};

export type ClockHandsState = {
  hubX: number;
  hubY: number;
  hubRadius: number;
  hands: ClockHandPose[];
};

export function clockHandsStateAtTime(config: ClockHandsConfig, time: number): ClockHandsState {
  const base = time * config.speed + (config.phase ?? 0);
  const angles =
    config.handCount === 1
      ? [base]
      : [base, base * (config.secondSpeedScale ?? 1.35) + Math.PI / 2];
  return {
    hubX: config.hubX,
    hubY: config.hubY,
    hubRadius: config.hubRadius ?? Math.max(0.2, config.thickness * 1.2),
    hands: angles.map((angle) => ({
      angle,
      tipX: config.hubX + Math.cos(angle) * config.length,
      tipY: config.hubY + Math.sin(angle) * config.length,
    })),
  };
}

function distToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const ab2 = abx * abx + aby * aby;
  const t = ab2 <= 1e-8 ? 0 : Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
  const cx = ax + abx * t;
  const cy = ay + aby * t;
  return Math.hypot(px - cx, py - cy);
}

export function evaluateClockHandsCollision(
  config: ClockHandsConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): { hit: boolean; clearance: number; nearMiss: boolean } {
  const state = clockHandsStateAtTime(config, time);
  let clearance = Math.hypot(x - state.hubX, y - state.hubY) - state.hubRadius - radius;
  for (const hand of state.hands) {
    const d =
      distToSegment(x, y, state.hubX, state.hubY, hand.tipX, hand.tipY) -
      config.thickness -
      radius;
    clearance = Math.min(clearance, d);
  }
  return {
    hit: clearance < 0,
    clearance,
    nearMiss: clearance >= 0 && clearance <= 0.16,
  };
}
