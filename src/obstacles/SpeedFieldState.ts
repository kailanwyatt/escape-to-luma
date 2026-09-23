/**
 * Speed Field — translucent volume with a marked speed multiplier.
 * Preview and flight must integrate the same multiplier after crossing.
 */

import type { SpeedFieldConfig } from '../config/ObstacleConfig';

export type { SpeedFieldConfig };

export type SpeedFieldState = {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  speedMultiplier: number;
  pulse: number;
  contains: (x: number, y: number) => boolean;
};

export function speedFieldStateAtTime(config: SpeedFieldConfig, time: number): SpeedFieldState {
  const pulse =
    config.pulseSpeed && config.pulseSpeed > 0
      ? 0.5 + 0.5 * Math.sin(time * config.pulseSpeed + (config.phase ?? 0))
      : 1;
  const halfW = config.width / 2;
  const halfH = config.height / 2;
  const contains = (x: number, y: number) =>
    Math.abs(x - config.centerX) <= halfW && Math.abs(y - config.centerY) <= halfH;
  return {
    centerX: config.centerX,
    centerY: config.centerY,
    width: config.width,
    height: config.height,
    speedMultiplier: config.speedMultiplier,
    pulse,
    contains,
  };
}

/** Non-lethal zone: returns multiplier (1 outside). Never reports a collision hit. */
export function speedMultiplierAt(
  config: SpeedFieldConfig,
  time: number,
  x: number,
  y: number,
): number {
  const state = speedFieldStateAtTime(config, time);
  return state.contains(x, y) ? state.speedMultiplier : 1;
}

export function evaluateSpeedFieldCollision(
  _config: SpeedFieldConfig,
  _time: number,
  _x: number,
  _y: number,
  _radius: number,
): { hit: boolean; clearance: number; nearMiss: boolean } {
  return { hit: false, clearance: Infinity, nearMiss: false };
}
