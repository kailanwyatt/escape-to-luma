import type {RapidShutterConfig} from '../obstacles/RapidShutterState';
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
  | 'laserGrid'
  | 'formation';

export type RingMovementType = 'horizontal' | 'vertical' | 'ellipse';

export interface SlidingGateConfig {
  movementMode?: 'oscillating' | 'rapidShutter';
  shutter?: RapidShutterConfig;
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

export type LaserGridPattern =
  | 'HORIZONTAL_WAVE'
  | 'VERTICAL_WAVE'
  | 'OPEN_CLOSE'
  | 'ALTERNATING'
  | 'CROSSING'
  | 'SEQUENTIAL';

/** Fixed security frame containing independently animated laser beams. */
export interface LaserGridConfig {
  type: 'laserGrid';
  z: number;
  /** Primary beam direction; CROSSING uses both directions. */
  orientation: 'vertical' | 'horizontal' | 'both';
  pattern?: LaserGridPattern;
  /** Number of independently animated beams. */
  beamCount?: number;
  /** Base distance between adjacent beams. */
  spacing: number;
  /** Beam movement amplitude in world units. */
  amplitude?: number;
  /** Beam movement speed. */
  speed?: number;
  /** Phase difference between adjacent beams. */
  phaseOffset?: number;
  /** How far beams extend inside the fixed frame. */
  span: number;
  /** Beam half-thickness for collision and visuals. */
  thickness: number;
  centerX?: number;
  centerY?: number;
  /**
   * `static` — always on (aim through gap).
   * `pulse` — lasers cycle on/off; throw while off or through gap while on.
   */
  mode?: 'static' | 'pulse';
  /** Pulse frequency, independent from beam movement speed. */
  pulseSpeed?: number;
  phase?: number;
  /** Fraction of cycle lasers are ON / dangerous (0–1). Default 0.55. */
  onRatio?: number;
}

export interface FormationConfig {
  type: 'formation';
  variant: 'alternatingDoors' | 'conveyor' | 'expandingDebris' | 'phaseColumns' | 'rotatingMaze';
  z: number;
  centerY?: number;
  speed: number;
  phase?: number;
  direction?: 1 | -1;
  /** Radius of the passable hole in a rotating plate. */
  openingRadius?: number;
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
  | LaserGridConfig
  | FormationConfig;

export function obstacleTypeOf(config: ObstacleConfig): ObstacleType {
  return config.type ?? 'rotor';
}

export function isRotorConfig(config: ObstacleConfig): config is RotorObstacleConfig {
  return obstacleTypeOf(config) === 'rotor';
}
