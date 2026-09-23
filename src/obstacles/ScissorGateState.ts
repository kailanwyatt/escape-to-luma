/** Scissor Gate — two bars pivot together/apart around shared hinges. */

import type { ScissorGateConfig } from '../config/ObstacleConfig';

export type { ScissorGateConfig };

export type ScissorBarPose = {
  angle: number;
  ax: number;
  ay: number;
  bx: number;
  by: number;
};

export type ScissorGateState = {
  centerX: number;
  centerY: number;
  angle: number;
  apertureWidth: number;
  bars: [ScissorBarPose, ScissorBarPose];
};

export function scissorGateStateAtTime(config: ScissorGateConfig, time: number): ScissorGateState {
  const wave = 0.5 + 0.5 * Math.sin(time * config.speed + (config.phase ?? 0));
  const minAngle = Math.max(0.28, config.minAngle ?? 0.35);
  const maxAngle = Math.max(minAngle + 0.05, config.maxAngle);
  const angle = minAngle + (maxAngle - minAngle) * wave;
  const L = config.barLength;
  const cx = config.centerX;
  const cy = config.centerY;
  const top: ScissorBarPose = {
    angle,
    ax: cx - Math.cos(angle) * L,
    ay: cy - Math.sin(angle) * L,
    bx: cx + Math.cos(angle) * L,
    by: cy + Math.sin(angle) * L,
  };
  const bottom: ScissorBarPose = {
    angle: -angle,
    ax: cx - Math.cos(angle) * L,
    ay: cy + Math.sin(angle) * L,
    bx: cx + Math.cos(angle) * L,
    by: cy - Math.sin(angle) * L,
  };
  return {
    centerX: cx,
    centerY: cy,
    angle,
    apertureWidth: 2 * L * Math.sin(angle),
    bars: [top, bottom],
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
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
}

export function evaluateScissorGateCollision(
  config: ScissorGateConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): { hit: boolean; clearance: number; nearMiss: boolean } {
  const state = scissorGateStateAtTime(config, time);
  let clearance = Infinity;
  for (const bar of state.bars) {
    const d =
      distToSegment(x, y, bar.ax, bar.ay, bar.bx, bar.by) - config.barThickness - radius;
    clearance = Math.min(clearance, d);
  }
  return {
    hit: clearance < 0,
    clearance,
    nearMiss: clearance >= 0 && clearance <= 0.16,
  };
}
