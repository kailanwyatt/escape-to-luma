/** Energy Field — full-width flowing curtain with a drifting circular opening. */

import type { EnergyFieldConfig } from '../config/ObstacleConfig';

export type { EnergyFieldConfig };

export type EnergyFieldState = {
  centerX: number;
  centerY: number;
  halfWidth: number;
  halfHeight: number;
  openingX: number;
  openingY: number;
  holeRadius: number;
  /** +1 drifting right, -1 drifting left (for chevron cues). */
  driftDir: 1 | -1;
};

export function energyFieldStateAtTime(config: EnergyFieldConfig, time: number): EnergyFieldState {
  const phase = config.phase ?? 0;
  const driftSpeed = config.driftSpeed ?? config.speed;
  const sway = time * driftSpeed + phase;
  const sin = Math.sin(sway);
  const cos = Math.cos(sway);
  const pulse =
    config.pulseAmplitude && config.pulseAmplitude > 0
      ? config.pulseAmplitude * Math.sin(time * config.speed + phase * 1.3)
      : 0;
  return {
    centerX: config.centerX,
    centerY: config.centerY,
    halfWidth: config.halfWidth,
    halfHeight: config.halfHeight,
    openingX: config.centerX + config.driftAmplitudeX * sin,
    openingY: config.centerY + (config.driftAmplitudeY ?? 0) * Math.cos(sway * 0.85),
    holeRadius: Math.max(0.35, config.holeRadius + pulse),
    driftDir: cos >= 0 ? 1 : -1,
  };
}

export function evaluateEnergyFieldCollision(
  config: EnergyFieldConfig,
  time: number,
  x: number,
  y: number,
  radius: number,
): { hit: boolean; clearance: number; nearMiss: boolean } {
  const state = energyFieldStateAtTime(config, time);
  const inFieldX = Math.abs(x - state.centerX) <= state.halfWidth + radius;
  const inFieldY = Math.abs(y - state.centerY) <= state.halfHeight + radius;
  if (!inFieldX || !inFieldY) {
    // Outside the curtain band — clear (field is authored full-width so this is rare in-play).
    const dx = Math.abs(x - state.centerX) - state.halfWidth;
    const dy = Math.abs(y - state.centerY) - state.halfHeight;
    const clearance = Math.max(dx, dy) - radius;
    return { hit: false, clearance, nearMiss: clearance >= 0 && clearance <= 0.16 };
  }
  const dist = Math.hypot(x - state.openingX, y - state.openingY);
  const clearance = state.holeRadius - dist - radius;
  return {
    hit: clearance < 0,
    clearance,
    nearMiss: clearance >= 0 && clearance <= 0.16,
  };
}
