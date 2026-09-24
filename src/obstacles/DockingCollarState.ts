/** Docking Collar — two circular jaws clamp shut with shutter slam timing. */

import type { DockingCollarConfig } from '../config/ObstacleConfig';

export type { DockingCollarConfig };

export type DockingCollarPhase = 'closed' | 'opening' | 'open' | 'warning' | 'slamming';

export type DockingCollarState = {
  centerX: number;
  centerY: number;
  /** Current safe-hole radius. */
  openingRadius: number;
  outerRadius: number;
  /** 0 = clamped shut, 1 = fully open. */
  fraction: number;
  phase: DockingCollarPhase;
  warning: boolean;
};

function openFraction(config: DockingCollarConfig, time: number): {
  fraction: number;
  phase: DockingCollarPhase;
} {
  const closed = Math.max(0.15, config.closedHold ?? 0.55);
  const opening = Math.max(0.08, config.openingDuration ?? 0.32);
  const open = Math.max(0.2, config.openHold ?? 0.7);
  const warning = Math.max(0.12, config.warningHold ?? 0.28);
  const slam = Math.max(0.08, config.slamDuration ?? 0.2);
  const cycle = closed + opening + open + warning + slam;
  const local = ((time * config.speed + (config.phase ?? 0)) % cycle + cycle) % cycle;

  if (local < closed) return { fraction: 0, phase: 'closed' };
  if (local < closed + opening) {
    const p = (local - closed) / opening;
    return { fraction: 1 - (1 - p) ** 3, phase: 'opening' };
  }
  if (local < closed + opening + open) return { fraction: 1, phase: 'open' };
  if (local < closed + opening + open + warning) return { fraction: 1, phase: 'warning' };
  const p = (local - closed - opening - open - warning) / slam;
  return { fraction: 1 - p ** 3, phase: 'slamming' };
}

export function dockingCollarStateAtTime(config: DockingCollarConfig, time: number): DockingCollarState {
  const { fraction, phase } = openFraction(config, time);
  const openingRadius =
    config.closedRadius + (config.openRadius - config.closedRadius) * fraction;
  return {
    centerX: config.centerX,
    centerY: config.centerY,
    openingRadius,
    outerRadius: config.outerRadius,
    fraction,
    phase,
    warning: phase === 'warning',
  };
}

export function evaluateDockingCollarCollision(
  config: DockingCollarConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): { hit: boolean; clearance: number; nearMiss: boolean } {
  const state = dockingCollarStateAtTime(config, time);
  const dist = Math.hypot(x - state.centerX, y - state.centerY);
  // Annular plate: solid between openingRadius and outerRadius.
  const toHole = state.openingRadius - dist - radius;
  const pastRim = dist - state.outerRadius - radius;
  const clearance = Math.max(toHole, pastRim);
  return {
    hit: clearance < 0,
    clearance,
    nearMiss: clearance >= 0 && clearance <= 0.16,
  };
}
