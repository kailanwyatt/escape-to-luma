/** Null Lash — a tendril whips across the path; escape while it is coiled. */

import type { NullLashConfig } from '../config/ObstacleConfig';

export type { NullLashConfig };

export type NullLashPhase = 'coiled' | 'warning' | 'lashing' | 'extended' | 'retracting';

export type NullLashState = {
  pivotX: number;
  pivotY: number;
  tipX: number;
  tipY: number;
  angle: number;
  extension: number;
  length: number;
  thickness: number;
  phase: NullLashPhase;
  warning: boolean;
};

function lashTimeline(config: NullLashConfig, time: number): {
  phase: NullLashPhase;
  /** 0 = coiled at rest, 1 = fully extended across lashSpan. */
  amount: number;
  extension: number;
} {
  const coiled = Math.max(0.45, config.coiledHold ?? 1.1);
  const warning = Math.max(0.15, config.warningHold ?? 0.32);
  const lash = Math.max(0.1, config.lashDuration ?? 0.22);
  const extended = Math.max(0.2, config.extendedHold ?? 0.45);
  const retract = Math.max(0.15, config.retractDuration ?? 0.4);
  const cycle = coiled + warning + lash + extended + retract;
  const local = ((time * config.speed + (config.phase ?? 0)) % cycle + cycle) % cycle;

  if (local < coiled) return { phase: 'coiled', amount: 0, extension: 0 };
  if (local < coiled + warning) return { phase: 'warning', amount: 0, extension: 0 };
  if (local < coiled + warning + lash) {
    const p = (local - coiled - warning) / lash;
    return { phase: 'lashing', amount: p ** 2, extension: p * p * (3 - 2 * p) };
  }
  if (local < coiled + warning + lash + extended) return { phase: 'extended', amount: 1, extension: 1 };
  const p = (local - coiled - warning - lash - extended) / retract;
  const extension = 1 - p * p * (3 - 2 * p);
  return { phase: 'retracting', amount: extension, extension };
}

export function nullLashStateAtTime(config: NullLashConfig, time: number): NullLashState {
  const { phase, amount, extension } = lashTimeline(config, time);
  const rest = config.restAngle;
  const angle = rest + config.lashSpan * amount;
  const length = config.length;
  const tip = nullLashCenterline(config, time, 1, extension, angle);
  return {
    pivotX: config.pivotX,
    pivotY: config.pivotY,
    tipX: tip.x,
    tipY: tip.y,
    angle,
    extension,
    length,
    thickness: config.thickness,
    phase,
    warning: phase === 'warning' || phase === 'lashing',
  };
}

/** Shared by the continuous skin and collision, including the coiling/recovery curve. */
export function nullLashCenterline(config: NullLashConfig, time: number, u: number, extension: number, angle: number, out = { x: 0, y: 0, z: 0 }) {
  const scale = config.length / 2.6, rest = config.restAngle;
  const ca = rest + u * 4.9;
  const cx = (Math.cos(ca) * (.17 + u * .55) - Math.cos(rest) * .17) * scale;
  const cy = (Math.sin(ca) * (.17 + u * .55) - Math.sin(rest) * .17 + u * .53) * scale;
  const wave = Math.sin(u * 8.2 - time * 4) * .055 * scale * Math.sin(u * Math.PI);
  out.x = config.pivotX + cx * (1 - extension) + (Math.cos(angle) * config.length * u - Math.sin(angle) * wave) * extension;
  out.y = config.pivotY + cy * (1 - extension) + (Math.sin(angle) * config.length * u + Math.cos(angle) * wave) * extension;
  out.z = Math.sin(u * 4.7 + time * .4) * .11 * scale * Math.sin(u * Math.PI);
  return out;
}
export function nullLashRadius(config: NullLashConfig, u: number) {
  return config.thickness / .18 * (.018 + Math.pow(1 - u, .72) * .24) * (1 + Math.sin(u * 89) * .045);
}

/** Distance from point to segment (pivot → tip). */
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
  const len2 = abx * abx + aby * aby;
  if (len2 < 1e-8) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * abx + (py - ay) * aby) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
}

export function evaluateNullLashCollision(
  config: NullLashConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): { hit: boolean; clearance: number; nearMiss: boolean } {
  const state = nullLashStateAtTime(config, time);
  // Coiled / early warning: tendril tucked — clear corridor.
  if (state.phase === 'coiled' || (state.phase === 'warning' && state.angle === config.restAngle)) {
    // Still sample near the coiled rest pose for near-miss telegraph.
    const restTipX = config.pivotX + Math.cos(config.restAngle) * config.length * 0.35;
    const restTipY = config.pivotY + Math.sin(config.restAngle) * config.length * 0.35;
    const d = distToSegment(x, y, config.pivotX, config.pivotY, restTipX, restTipY);
    const clearance = d - config.thickness * 0.45 - radius;
    return {
      hit: false,
      clearance: Math.max(clearance, 0.2),
      nearMiss: state.warning && clearance >= 0 && clearance <= 0.2,
    };
  }

  let clearance = Infinity;
  let a = nullLashCenterline(config, time, 0, state.extension, state.angle);
  let b = { x: 0, y: 0, z: 0 };
  for (let i = 1; i <= 48; i++) {
    const u = i / 48; nullLashCenterline(config, time, u, state.extension, state.angle, b);
    const width = nullLashRadius(config, (i - .5) / 48);
    clearance = Math.min(clearance, distToSegment(x, y, a.x, a.y, b.x, b.y) - width - radius);
    const previous = a; a = b; b = previous;
  }
  return {
    hit: clearance < 0,
    clearance,
    nearMiss: clearance >= 0 && clearance <= 0.16,
  };
}
