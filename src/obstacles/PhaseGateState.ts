/** Phase Gate — membrane ring that flickers solid → amber → passable. */

import type { PhaseGateConfig } from '../config/ObstacleConfig';

export type { PhaseGateConfig };

export type PhaseGatePhase = 'solid' | 'warning' | 'open';

export type PhaseGateState = {
  centerX: number;
  centerY: number;
  fieldRadius: number;
  phase: PhaseGatePhase;
  open: boolean;
  warning: boolean;
};

/**
 * Cycle: solid → amber warning → open.
 * Depth stacks author `phase ≈ -z / vz * speed` so each gate shares the same
 * cycle local at its crossing time — no extra sequenceIndex stagger.
 */
export function phaseGateStateAtTime(config: PhaseGateConfig, time: number): PhaseGateState {
  const openRatio = Math.min(0.72, Math.max(0.18, config.openRatio ?? 0.42));
  const warningRatio = Math.min(0.28, Math.max(0.08, config.warningRatio ?? 0.14));
  const solidRatio = Math.max(0.12, 1 - openRatio - warningRatio);
  const local =
    (((time * config.speed + (config.phase ?? 0)) % 1) + 1) % 1;

  let phase: PhaseGatePhase = 'solid';
  if (local < solidRatio) phase = 'solid';
  else if (local < solidRatio + warningRatio) phase = 'warning';
  else phase = 'open';

  return {
    centerX: config.centerX,
    centerY: config.centerY,
    fieldRadius: config.fieldRadius,
    phase,
    open: phase === 'open',
    warning: phase === 'warning',
  };
}

export function evaluatePhaseGateCollision(
  config: PhaseGateConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): { hit: boolean; clearance: number; nearMiss: boolean } {
  const state = phaseGateStateAtTime(config, time);
  const dist = Math.hypot(x - state.centerX, y - state.centerY);
  if (state.open) {
    // Passable — treat as infinite clearance inside the plane.
    const clearance = state.fieldRadius + 2;
    return { hit: false, clearance, nearMiss: dist <= state.fieldRadius + 0.2 };
  }
  const clearance = dist - state.fieldRadius - radius;
  return {
    hit: clearance < 0,
    clearance,
    nearMiss: clearance >= 0 && clearance <= 0.16,
  };
}
