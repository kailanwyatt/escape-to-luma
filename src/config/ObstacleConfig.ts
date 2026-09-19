import type { RotorConfig } from './RotorConfig';

export type ObstacleType = 'rotor' | 'slidingGate' | 'iris' | 'pendulum' | 'movingRing';

export type RingMovementType = 'horizontal' | 'vertical' | 'ellipse';

export interface SlidingGateConfig {
  type: 'slidingGate';
  z: number;
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

export type RotorObstacleConfig = RotorConfig & { type?: 'rotor' };

export type ObstacleConfig =
  | RotorObstacleConfig
  | SlidingGateConfig
  | IrisConfig
  | PendulumConfig
  | MovingRingConfig;

export function obstacleTypeOf(config: ObstacleConfig): ObstacleType {
  return config.type ?? 'rotor';
}

export function isRotorConfig(config: ObstacleConfig): config is RotorObstacleConfig {
  return obstacleTypeOf(config) === 'rotor';
}
