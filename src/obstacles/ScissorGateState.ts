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

/** 0 = closed (minAngle), 1 = open (maxAngle). */
function openAmount01(config: ScissorGateConfig, time: number): number {
  const phase = config.phase ?? 0;
  if (config.pattern !== 'flutter') {
    return 0.5 + 0.5 * Math.sin(time * config.speed + phase);
  }

  // Butterfly phrase: rapid flaps, then a slow open glide, then flaps again.
  const tempo = Math.max(0.35, config.speed);
  const burst = Math.max(0.35, config.flutterBurst ?? 0.85);
  const rest = Math.max(0.45, config.flutterRest ?? 1.2);
  const flaps = Math.max(2, config.flutterFlaps ?? 3.25);
  const cycle = burst + rest;
  const local = (((time * tempo + phase) % cycle) + cycle) % cycle;

  if (local < burst) {
    const u = local / burst;
    // Snappy flaps — hard seal at the troughs, brief flashes of open.
    const s = Math.sin(u * flaps * Math.PI * 2);
    return 0.5 + 0.5 * Math.sign(s) * Math.pow(Math.abs(s), 0.35);
  }

  const u = (local - burst) / rest;
  // Slow rest: readable open window, then ease shut before the next burst.
  return 0.08 + 0.9 * Math.sin(u * Math.PI);
}

export function scissorGateStateAtTime(config: ScissorGateConfig, time: number): ScissorGateState {
  const wave = openAmount01(config, time);
  // Allow near-zero so flaps can seal; tiny floor only for numerical stability.
  const minAngle = Math.max(0.02, config.minAngle ?? 0.08);
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
