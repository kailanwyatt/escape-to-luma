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
  length: number;
  thickness: number;
  phase: NullLashPhase;
  warning: boolean;
};

function lashTimeline(config: NullLashConfig, time: number): {
  phase: NullLashPhase;
  /** 0 = coiled at rest, 1 = fully extended across lashSpan. */
  amount: number;
} {
  const coiled = Math.max(0.45, config.coiledHold ?? 1.1);
  const warning = Math.max(0.15, config.warningHold ?? 0.32);
  const lash = Math.max(0.1, config.lashDuration ?? 0.22);
  const extended = Math.max(0.2, config.extendedHold ?? 0.45);
  const retract = Math.max(0.15, config.retractDuration ?? 0.4);
  const cycle = coiled + warning + lash + extended + retract;
  const local = ((time * config.speed + (config.phase ?? 0)) % cycle + cycle) % cycle;

  if (local < coiled) return { phase: 'coiled', amount: 0 };
  if (local < coiled + warning) return { phase: 'warning', amount: 0 };
  if (local < coiled + warning + lash) {
    const p = (local - coiled - warning) / lash;
    return { phase: 'lashing', amount: p ** 2 };
  }
  if (local < coiled + warning + lash + extended) return { phase: 'extended', amount: 1 };
  const p = (local - coiled - warning - lash - extended) / retract;
  return { phase: 'retracting', amount: 1 - (1 - p) ** 2 };
}

export function nullLashStateAtTime(config: NullLashConfig, time: number): NullLashState {
  const { phase, amount } = lashTimeline(config, time);
  const rest = config.restAngle;
  const angle = rest + config.lashSpan * amount;
  const length = config.length;
  return {
    pivotX: config.pivotX,
    pivotY: config.pivotY,
    tipX: config.pivotX + Math.cos(angle) * length,
    tipY: config.pivotY + Math.sin(angle) * length,
    angle,
    length,
    thickness: config.thickness,
    phase,
    warning: phase === 'warning' || phase === 'lashing',
  };
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

  const d = distToSegment(x, y, state.pivotX, state.pivotY, state.tipX, state.tipY);
  const clearance = d - state.thickness - radius;
  return {
    hit: clearance < 0,
    clearance,
    nearMiss: clearance >= 0 && clearance <= 0.16,
  };
}
