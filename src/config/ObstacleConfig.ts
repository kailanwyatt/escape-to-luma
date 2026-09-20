import type { RotorConfig } from './RotorConfig';

export type ObstacleType =
  | 'rotor'
  | 'slidingGate'
  | 'iris'
  | 'pendulum'
  | 'movingRing'
  | 'orbiter'
  | 'driftingBlocker'
  | 'phaseField'
  | 'shiftingAperture'
  | 'laserGrid';

export type RingMovementType = 'horizontal' | 'vertical' | 'ellipse';

export interface SlidingGateConfig {
  type: 'slidingGate';
  z: number;
  appearance?: 'standard' | 'containmentGlass';
  openingWidth: number;
  openingHeight: number;
  baseX: number;
  baseY?: number;
  amplitude: number;
  speed: number;
  phase?: number;
}

export interface IrisConfig {
  type: 'iris';
  z: number;
  minRadius: number;
  maxRadius: number;
  speed: number;
  phase?: number;
  centerX?: number;
  centerY?: number;
}

export interface PendulumConfig {
  type: 'pendulum';
  z: number;
  pivotX: number;
  pivotY: number;
  length: number;
  blockerRadius: number;
  maxAngle: number;
  speed: number;
  phase?: number;
}

export interface MovingRingConfig {
  type: 'movingRing';
  z: number;
  radius: number;
  baseX: number;
  baseY: number;
  movement: {
    type: RingMovementType;
    amplitudeX: number;
    amplitudeY: number;
    speed: number;
    phase?: number;
  };
}

export interface OrbiterConfig {
  type: 'orbiter';
  z: number;
  centerX: number;
  centerY: number;
  orbitRadius: number;
  blockerRadius: number;
  speed: number;
  phase?: number;
}

export interface DriftingBlockerConfig {
  type: 'driftingBlocker';
  z: number;
  baseX: number;
  baseY: number;
  blockerRadius: number;
  amplitudeX: number;
  amplitudeY: number;
  speed: number;
  phase?: number;
}

export interface PhaseFieldConfig {
  type: 'phaseField';
  z: number;
  centerX: number;
  centerY: number;
  fieldRadius: number;
  speed: number;
  phase?: number;
  /** Fraction of cycle that is open (0–1). */
  openRatio?: number;
}

export interface ShiftingApertureConfig {
  type: 'shiftingAperture';
  z: number;
  minRadius: number;
  maxRadius: number;
  pulseSpeed: number;
  baseX: number;
  baseY: number;
  shiftAmplitude: number;
  shiftSpeed: number;
  phase?: number;
}

/** Security laser plane — beams with a center safe gap; optional pulse. */
export interface LaserGridConfig {
  type: 'laserGrid';
  z: number;
  /** Beam layout. */
  orientation: 'vertical' | 'horizontal' | 'both';
  /** Half-width of the safe corridor through the grid (world units). */
  openingSize: number;
  /** Distance between adjacent beams. */
  spacing: number;
  /** How far beams extend from center along their length. */
  span: number;
  /** Beam half-thickness for collision + visuals. */
  thickness: number;
  centerX?: number;
  centerY?: number;
  /** Optional translation of the full beam array and its safe opening. */
  movement?: {
    axis: 'horizontal' | 'vertical' | 'both';
    amplitude: number;
    speed: number;
    phase?: number;
  };
  /**
   * `static` — always on (aim through gap).
   * `pulse` — lasers cycle on/off; throw while off or through gap while on.
   */
  mode?: 'static' | 'pulse';
  /** Pulse speed (cycles per second-ish via sin). */
  speed?: number;
  phase?: number;
  /** Fraction of cycle lasers are ON / dangerous (0–1). Default 0.55. */
  onRatio?: number;
}

export type RotorObstacleConfig = RotorConfig & { type?: 'rotor' };

export type ObstacleConfig =
  | RotorObstacleConfig
  | SlidingGateConfig
  | IrisConfig
  | PendulumConfig
  | MovingRingConfig
  | OrbiterConfig
  | DriftingBlockerConfig
  | PhaseFieldConfig
  | ShiftingApertureConfig
  | LaserGridConfig;

export function obstacleTypeOf(config: ObstacleConfig): ObstacleType {
  return config.type ?? 'rotor';
}

export function isRotorConfig(config: ObstacleConfig): config is RotorObstacleConfig {
  return obstacleTypeOf(config) === 'rotor';
}
