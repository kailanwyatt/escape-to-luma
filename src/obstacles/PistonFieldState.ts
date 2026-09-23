/** Piston Field — floor-mounted rams extend upward into the flight corridor. */

import type { PistonFieldConfig } from '../config/ObstacleConfig';

export type { PistonFieldConfig };

export type PistonLaneState = {
  x: number;
  /** Center of the ram body (collision / mesh). */
  y: number;
  width: number;
  height: number;
  extension: number;
  /** World Y of the ram tip. */
  top: number;
  floorY: number;
  /** True when the tip stays below the flight clear line. */
  open: boolean;
};

/** Default floor pad — just above the played floor plane. */
export const PISTON_DEFAULT_FLOOR_Y = 0.12;
/** Retracted tips must stay under this to leave the flight band clear. */
export const PISTON_DEFAULT_CLEAR_Y = 2.15;

export function pistonFloorY(config: PistonFieldConfig): number {
  return config.floorY ?? PISTON_DEFAULT_FLOOR_Y;
}

export function pistonClearY(config: PistonFieldConfig): number {
  if (config.clearY != null) return config.clearY;
  // Legacy centerY near mid-corridor meant “float here”; use the floor-clear default.
  if (config.centerY != null && config.centerY < 2.5) return config.centerY;
  return PISTON_DEFAULT_CLEAR_Y;
}

export function pistonFieldStateAtTime(config: PistonFieldConfig, time: number): PistonLaneState[] {
  const floorY = pistonFloorY(config);
  const clearY = pistonClearY(config);
  const lanes = Math.max(1, Math.floor(config.laneCount));
  const half = config.halfWidth ?? 0.42;
  const bodyH = config.pistonHeight ?? 0.5;
  const mid = (lanes - 1) / 2;
  return Array.from({ length: lanes }, (_, i) => {
    const wave = Math.sin(time * config.speed + (config.phase ?? 0) + i * 0.9);
    const t = 0.5 + 0.5 * wave;
    const extension = config.minExtension + (config.maxExtension - config.minExtension) * t;
    const x = (i - mid) * config.spacing;
    const height = bodyH + extension;
    // Bottom stays on the floor; the ram thrusts upward as extension grows.
    const y = floorY + height / 2;
    const top = floorY + height;
    return {
      x,
      y,
      width: half * 2,
      height,
      extension,
      top,
      floorY,
      open: top <= clearY,
    };
  });
}

export function evaluatePistonFieldCollision(
  config: PistonFieldConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): { hit: boolean; clearance: number; nearMiss: boolean } {
  let clearance = Infinity;
  for (const lane of pistonFieldStateAtTime(config, time)) {
    const dx = Math.abs(x - lane.x) - lane.width / 2;
    const dy = Math.abs(y - lane.y) - lane.height / 2;
    const d = Math.hypot(Math.max(0, dx), Math.max(0, dy)) + Math.min(Math.max(dx, dy), 0) - radius;
    clearance = Math.min(clearance, d);
  }
  return {
    hit: clearance < 0,
    clearance,
    nearMiss: clearance >= 0 && clearance <= 0.16,
  };
}
