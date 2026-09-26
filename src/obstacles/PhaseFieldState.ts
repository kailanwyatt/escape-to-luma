import type { PhaseFieldConfig } from '../config/ObstacleConfig';

/** Shared phase-field timing — used by collision and cinematic teach. */
export function phaseCycleT(config: PhaseFieldConfig, elapsedTime: number): number {
  const cycle =
    ((elapsedTime * config.speed + (config.phase ?? 0)) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  return cycle / (Math.PI * 2);
}

export function phaseOpen(config: PhaseFieldConfig, elapsedTime: number): boolean {
  const ratio = config.openRatio ?? 0.45;
  return phaseCycleT(config, elapsedTime) < ratio;
}
