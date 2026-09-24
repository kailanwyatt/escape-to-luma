/** Billboard Flip — flat panel turns from face-on wall to edge-on clear lane. */

import type { BillboardFlipConfig } from '../config/ObstacleConfig';

export type { BillboardFlipConfig };

export type BillboardFlipState = {
  centerX: number;
  centerY: number;
  /** Radians from face-on (0) toward edge-on (±maxAngle). */
  angle: number;
  open: boolean;
  warning: boolean;
};

export function billboardFlipStateAtTime(config: BillboardFlipConfig, time: number): BillboardFlipState {
  const maxAngle = config.maxAngle ?? Math.PI * 0.5;
  const openAngle = config.openAngle ?? maxAngle * 0.72;
  const angle = Math.sin(time * config.speed + (config.phase ?? 0)) * maxAngle;
  const abs = Math.abs(angle);
  return {
    centerX: config.centerX,
    centerY: config.centerY,
    angle,
    open: abs >= openAngle,
    warning: !!(abs >= openAngle * 0.55 && abs < openAngle),
  };
}

export function evaluateBillboardFlipCollision(
  config: BillboardFlipConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): { hit: boolean; clearance: number; nearMiss: boolean } {
  const state = billboardFlipStateAtTime(config, time);
  if (state.open) {
    const clearance = 0.42;
    return { hit: false, clearance, nearMiss: clearance <= 0.16 };
  }
  // Authoritative face AABB — Y-flip thins the board visually but the solid
  // wall stays until openAngle clears the corridor (solarSail-style gate).
  const ox = Math.abs(x - config.centerX) - config.halfWidth;
  const oy = Math.abs(y - config.centerY) - config.halfHeight;
  const outside =
    Math.hypot(Math.max(ox, 0), Math.max(oy, 0)) + Math.min(Math.max(ox, oy), 0);
  const clearance = outside - radius;
  return {
    hit: clearance < 0,
    clearance,
    nearMiss: clearance >= 0 && clearance <= 0.16,
  };
}
