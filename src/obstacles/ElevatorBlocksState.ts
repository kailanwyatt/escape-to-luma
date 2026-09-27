/** Elevator Blocks — platforms move vertically in timed columns. */

import type { ElevatorBlocksConfig } from '../config/ObstacleConfig';

export type { ElevatorBlocksConfig };

export type ElevatorBlockPose = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function elevatorBlocksStateAtTime(
  config: ElevatorBlocksConfig,
  time: number,
): ElevatorBlockPose[] {
  const lanes = Math.max(1, Math.floor(config.laneCount));
  const mid = (lanes - 1) / 2;
  const w = config.blockWidth ?? 0.95;
  const h = config.blockHeight ?? 0.55;
  return Array.from({ length: lanes }, (_, i) => {
    const x = (i - mid) * config.spacing;
    const y =
      config.baseY +
      Math.sin(time * config.speed + (config.phase ?? 0) + i * 1.1) * config.amplitude;
    return { x, y, width: w, height: h };
  });
}

export function evaluateElevatorBlocksCollision(
  config: ElevatorBlocksConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): { hit: boolean; clearance: number; nearMiss: boolean } {
  let clearance = Infinity;
  for (const block of elevatorBlocksStateAtTime(config, time)) {
    const dx = Math.abs(x - block.x) - block.width / 2;
    const dy = Math.abs(y - block.y) - block.height / 2;
    const d = Math.hypot(Math.max(0, dx), Math.max(0, dy)) + Math.min(Math.max(dx, dy), 0) - radius;
    clearance = Math.min(clearance, d);
  }
  return {
    hit: clearance < 0,
    clearance,
    nearMiss: clearance >= 0 && clearance <= 0.16,
  };
}
