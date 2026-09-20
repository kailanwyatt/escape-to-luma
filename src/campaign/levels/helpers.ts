import type { ChallengeConfig, EnvironmentId } from '../../config/ChallengeConfig';
import type { ObstacleConfig } from '../../config/ObstacleConfig';
import { GAME_TUNING } from '../../game/gameTuning';
import type { CampaignLevelDefinition, GravityWellConfig, WorldId } from '../types';

export const Z_A = GAME_TUNING.rotor.planeA.min + 0.22;
export const Z_B = GAME_TUNING.rotor.planeB.min + 0.22;
export const TZ = GAME_TUNING.target.z;

/** Fair target presets — prefer these over ad-hoc tight radii. */
export const soft = { x: 0, y: 3, radius: 1.26 };
export const center = { x: 0, y: 3, radius: 1.16 };
export const offset = { x: 0.32, y: 3.08, radius: 1.1 };
export const tight = { x: 0, y: 3, radius: 1.02 };

/** Campaign fair budgets (align with endless maxRotorSpeed ~0.82). */
export const FAIR = {
  rotorMax: 0.78,
  rotorDualMax: 0.62,
  windMax: 0.36,
  gateMinWidth: 1.45,
  gravityMin: 0.45,
  wellStrengthMax: 1.55,
} as const;

export function makeLevel(
  worldId: WorldId,
  levelNumber: number,
  id: string,
  template: ChallengeConfig['template'],
  environment: EnvironmentId,
  obstacles: ObstacleConfig[],
  target: ChallengeConfig['target'],
  extras?: Partial<CampaignLevelDefinition>,
): CampaignLevelDefinition {
  return {
    id,
    worldId,
    levelNumber,
    challenge: {
      id,
      environment,
      difficulty: Math.max(1, Math.ceil((levelNumber % 15 || 15) / 5)),
      template,
      obstacles,
      target: { ...target, z: target.z ?? TZ },
    },
    ...extras,
  };
}

/** Progressive 0..1 within a 15-level world block. */
export function worldT(levelNumber: number): number {
  const local = ((levelNumber - 1) % 15) + 1;
  return (local - 1) / 14;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function rotor(
  speed: number,
  opts?: { blades?: number; reverse?: boolean; z?: number },
): ObstacleConfig {
  return {
    type: 'rotor',
    z: opts?.z ?? Z_A,
    bladeCount: opts?.blades ?? 3,
    rotationSpeed: speed,
    direction: opts?.reverse ? -1 : 1,
    initialRotation: 0.15,
  };
}

export function gate(
  width: number,
  speed: number,
  amplitude: number,
  opts?: { z?: number; height?: number },
): ObstacleConfig {
  return {
    type: 'slidingGate',
    z: opts?.z ?? Z_A,
    openingWidth: width,
    openingHeight: opts?.height ?? 2.7,
    baseX: 0,
    amplitude,
    speed,
  };
}

export function iris(minR: number, maxR: number, speed: number, z = Z_A): ObstacleConfig {
  return { type: 'iris', z, minRadius: minR, maxRadius: maxR, speed };
}

export function pendulum(speed: number, maxAngle: number, z = Z_A): ObstacleConfig {
  return {
    type: 'pendulum',
    z,
    pivotX: 0,
    pivotY: 5.1,
    length: 2.0,
    blockerRadius: 0.32,
    maxAngle,
    speed,
  };
}

export function ring(
  radius: number,
  speed: number,
  amp: number,
  move: 'horizontal' | 'vertical' | 'ellipse' = 'horizontal',
  z = Z_A,
): ObstacleConfig {
  return {
    type: 'movingRing',
    z,
    radius,
    baseX: 0,
    baseY: 3,
    movement: {
      type: move,
      amplitudeX: move === 'vertical' ? 0 : amp,
      amplitudeY: move === 'horizontal' ? 0 : amp,
      speed,
    },
  };
}

export function orbiter(speed: number, orbitR: number, blockerR: number, z = Z_A): ObstacleConfig {
  return {
    type: 'orbiter',
    z,
    centerX: 0,
    centerY: 3,
    orbitRadius: orbitR,
    blockerRadius: blockerR,
    speed,
  };
}

export function drift(
  speed: number,
  radius: number,
  ampX: number,
  ampY: number,
  baseX = 0,
  z = Z_A,
): ObstacleConfig {
  return {
    type: 'driftingBlocker',
    z,
    baseX,
    baseY: 3,
    blockerRadius: radius,
    amplitudeX: ampX,
    amplitudeY: ampY,
    speed,
  };
}

export function phase(speed: number, fieldR: number, openRatio: number, z = Z_A): ObstacleConfig {
  return {
    type: 'phaseField',
    z,
    centerX: 0,
    centerY: 3,
    fieldRadius: fieldR,
    speed,
    openRatio,
  };
}

export function aperture(
  minR: number,
  maxR: number,
  shiftAmp: number,
  speeds: { pulse: number; shift: number },
  z = Z_A,
): ObstacleConfig {
  return {
    type: 'shiftingAperture',
    z,
    minRadius: minR,
    maxRadius: maxR,
    pulseSpeed: speeds.pulse,
    baseX: 0,
    baseY: 3,
    shiftAmplitude: shiftAmp,
    shiftSpeed: speeds.shift,
  };
}

export function well(strength: number, radius: number, x = 0.55, y = 3.1): GravityWellConfig {
  return { x, y, z: (Z_A + TZ) / 2, strength, radius };
}

export function lasers(
  orientation: 'vertical' | 'horizontal' | 'both',
  opts?: {
    openingSize?: number;
    spacing?: number;
    span?: number;
    thickness?: number;
    mode?: 'static' | 'pulse';
    speed?: number;
    onRatio?: number;
    phase?: number;
    z?: number;
    movement?: {
      axis: 'horizontal' | 'vertical' | 'both';
      amplitude: number;
      speed: number;
      phase?: number;
    };
  },
): ObstacleConfig {
  const defaultAxis =
    orientation === 'vertical'
      ? 'horizontal'
      : orientation === 'horizontal'
        ? 'vertical'
        : 'both';
  return {
    type: 'laserGrid',
    z: opts?.z ?? Z_A,
    orientation,
    openingSize: opts?.openingSize ?? 1.25,
    spacing: opts?.spacing ?? 0.55,
    span: opts?.span ?? 4.2,
    thickness: opts?.thickness ?? 0.06,
    mode: opts?.mode ?? 'static',
    speed: opts?.speed,
    onRatio: opts?.onRatio,
    phase: opts?.phase,
    centerX: 0,
    centerY: 3,
    movement: opts?.movement ?? {
      axis: defaultAxis,
      amplitude: orientation === 'both' ? 0.5 : 0.72,
      speed: orientation === 'both' ? 0.62 : 0.58,
    },
  };
}
