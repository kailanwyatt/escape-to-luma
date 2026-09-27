/** Ground-cut lasers — diagonal beams from floor pads that fan open and cross. */

import type { GroundCutLasersConfig } from '../config/ObstacleConfig';

export type { GroundCutLasersConfig };

export type GroundCutLaserBeam = {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  angle: number;
};

export type GroundCutLasersState = {
  beams: GroundCutLaserBeam[];
  /** 0 = fully fanned open, 1 = fully crossed. */
  crossAmount: number;
};

function wrap01(value: number): number {
  return ((value % 1) + 1) % 1;
}

/** Smooth 0→1→0 pulse spanning `duty` of each cycle. */
function crossPulse(cycle01: number, duty: number): number {
  const d = Math.max(0.12, Math.min(0.7, duty));
  if (cycle01 >= d) {
    return 0;
  }
  return Math.sin((cycle01 / d) * Math.PI);
}

export function groundCutLasersStateAtTime(
  config: GroundCutLasersConfig,
  time: number,
): GroundCutLasersState {
  const count = Math.max(2, Math.min(6, Math.round(config.beamCount)));
  const tempo = Math.max(0.2, config.speed);
  const cycle01 = wrap01(time * tempo + (config.phase ?? 0));
  const crossAmount = crossPulse(cycle01, config.crossDuty ?? 0.34);
  const length = Math.max(1.2, config.ceilingY - config.floorY);
  const beams: GroundCutLaserBeam[] = [];

  for (let i = 0; i < count; i += 1) {
    const u = count === 1 ? 0.5 : i / (count - 1);
    const side = u - 0.5;
    const ax = config.centerX + side * config.spanX;
    const ay = config.floorY;
    // Open: outer beams lean outward so a corridor opens toward the portal.
    const openAngle = side * 2 * config.fanAngle;
    // Cross: every beam aims toward aimX so lines cut across and intersect.
    const crossAngle = Math.atan2(config.aimX - ax, length);
    // Soft flutter so the open window never feels frozen.
    const flutter = 0.045 * Math.sin(time * tempo * 2.4 + i * 1.7) * (1 - crossAmount);
    const angle = openAngle * (1 - crossAmount) + crossAngle * crossAmount + flutter;
    const bx = ax + Math.sin(angle) * length;
    const by = ay + Math.cos(angle) * length;
    beams.push({ ax, ay, bx, by, angle });
  }

  return { beams, crossAmount };
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
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
}

export function evaluateGroundCutLasersCollision(
  config: GroundCutLasersConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): { hit: boolean; clearance: number; nearMiss: boolean } {
  const state = groundCutLasersStateAtTime(config, time);
  let clearance = Infinity;
  for (const beam of state.beams) {
    const d = distToSegment(x, y, beam.ax, beam.ay, beam.bx, beam.by) - config.thickness - radius;
    clearance = Math.min(clearance, d);
  }
  return {
    hit: clearance < 0,
    clearance,
    nearMiss: clearance >= 0 && clearance <= 0.16,
  };
}
