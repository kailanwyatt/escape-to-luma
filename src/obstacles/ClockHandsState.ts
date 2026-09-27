/** Clock Hands — one or two long rotating arms around a hub. */

import type { ClockHandsConfig } from '../config/ObstacleConfig';

export type { ClockHandsConfig };

export type ClockHandPose = {
  angle: number;
  tipX: number;
  tipY: number;
};

export type ClockHandsPhase = 'open' | 'warning' | 'slamming' | 'closed' | 'opening';

export type ClockHandsState = {
  hubX: number;
  hubY: number;
  hubRadius: number;
  hands: ClockHandPose[];
  /** Present for snapClose motion; continuous leaves undefined. */
  phase?: ClockHandsPhase;
  warning?: boolean;
};

type SnapTimeline = {
  phase: ClockHandsPhase;
  gap: number;
};

function snapGapAtTime(config: ClockHandsConfig, time: number): SnapTimeline {
  const openHold = Math.max(0.35, config.snapOpenHold ?? 1.35);
  const warning = Math.max(0.12, config.snapWarningHold ?? 0.28);
  const slam = Math.max(0.08, config.snapSlamDuration ?? 0.16);
  const closed = Math.max(0.15, config.snapClosedHold ?? 0.4);
  const opening = Math.max(0.12, config.snapOpenDuration ?? 0.32);
  const cycle = openHold + warning + slam + closed + opening;
  const local = ((time * config.speed + (config.phase ?? 0)) % cycle + cycle) % cycle;
  const openGap = config.snapOpenGap ?? Math.PI * 0.58;
  const closedGap = Math.max(0.12, config.snapClosedGap ?? 0.2);

  if (local < openHold) return { phase: 'open', gap: openGap };
  if (local < openHold + warning) return { phase: 'warning', gap: openGap };
  if (local < openHold + warning + slam) {
    const p = (local - openHold - warning) / slam;
    const e = p ** 3;
    return { phase: 'slamming', gap: openGap + (closedGap - openGap) * e };
  }
  if (local < openHold + warning + slam + closed) return { phase: 'closed', gap: closedGap };
  const p = (local - openHold - warning - slam - closed) / opening;
  const e = 1 - (1 - p) ** 3;
  return { phase: 'opening', gap: closedGap + (openGap - closedGap) * e };
}

export function clockHandsStateAtTime(config: ClockHandsConfig, time: number): ClockHandsState {
  const hubRadius = config.hubRadius ?? Math.max(0.2, config.thickness * 1.2);

  if (config.motionMode === 'snapClose' && config.handCount === 2) {
    const drift = time * (config.driftSpeed ?? 0.22) + (config.phase ?? 0) * 0.15;
    const snap = snapGapAtTime(config, time);
    const angles = [drift, drift + snap.gap];
    return {
      hubX: config.hubX,
      hubY: config.hubY,
      hubRadius,
      phase: snap.phase,
      warning: snap.phase === 'warning' || snap.phase === 'slamming',
      hands: angles.map((angle) => ({
        angle,
        tipX: config.hubX + Math.cos(angle) * config.length,
        tipY: config.hubY + Math.sin(angle) * config.length,
      })),
    };
  }

  const base = time * config.speed + (config.phase ?? 0);
  const angles =
    config.handCount === 1
      ? [base]
      : [base, base * (config.secondSpeedScale ?? 1.35) + Math.PI / 2];
  return {
    hubX: config.hubX,
    hubY: config.hubY,
    hubRadius,
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
