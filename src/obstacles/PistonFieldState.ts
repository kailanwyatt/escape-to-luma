/** Piston Field — repeating blocks extend/retract on phase offsets. */

import type { PistonFieldConfig } from '../config/ObstacleConfig';

export type { PistonFieldConfig };

export type PistonLaneState = {
  x: number;
  y: number;
  width: number;
  height: number;
  extension: number;
  open: boolean;
};

export function pistonFieldStateAtTime(config: PistonFieldConfig, time: number): PistonLaneState[] {
  const cy = config.centerY ?? 3;
  const lanes = Math.max(1, Math.floor(config.laneCount));
  const half = config.halfWidth ?? 0.42;
  const bodyH = config.pistonHeight ?? 0.55;
  const mid = (lanes - 1) / 2;
  return Array.from({ length: lanes }, (_, i) => {
    const wave = Math.sin(time * config.speed + (config.phase ?? 0) + i * 0.9);
    const t = 0.5 + 0.5 * wave;
    const extension = config.minExtension + (config.maxExtension - config.minExtension) * t;
    const x = (i - mid) * config.spacing;
    const height = bodyH + extension;
    const y = cy - config.maxExtension / 2 + height / 2;
    return {
      x,
      y,
      width: half * 2,
      height,
      extension,
      open: extension <= config.minExtension + (config.maxExtension - config.minExtension) * 0.22,
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
