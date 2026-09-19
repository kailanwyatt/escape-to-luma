import type { MovementConfig } from './MovementConfig';
import type { ObstacleConfig } from './ObstacleConfig';

export type EnvironmentId = 'workshop' | 'rooftop' | 'space';

export type ChallengeTemplateId =
  | 'BASIC_ROTOR'
  | 'FAST_ROTOR'
  | 'REVERSE_ROTOR'
  | 'PULSE_ROTOR'
  | 'OFFSET_TARGET'
  | 'MOVING_TARGET'
  | 'MOVING_ROTOR'
  | 'MOVING_ROTOR_OFFSET_TARGET'
  | 'DUAL_ROTOR'
  | 'DUAL_COUNTER_ROTATION'
  | 'DUAL_DIFFERENT_SPEED'
  | 'DUAL_ROTOR_MOVING_TARGET'
  | 'BASIC_GATE'
  | 'MOVING_GATE'
  | 'GATE_OFFSET_TARGET'
  | 'BASIC_IRIS'
  | 'FAST_IRIS'
  | 'IRIS_OFFSET_TARGET'
  | 'BASIC_PENDULUM'
  | 'WIDE_PENDULUM'
  | 'PENDULUM_OFFSET_TARGET'
  | 'BASIC_RING'
  | 'VERTICAL_RING'
  | 'ELLIPTICAL_RING'
  | 'RING_OFFSET_TARGET'
  | 'ROTOR_GATE'
  | 'GATE_ROTOR'
  | 'ROTOR_IRIS'
  | 'IRIS_ROTOR'
  | 'ROTOR_RING'
  | 'RING_ROTOR'
  | 'PENDULUM_ROTOR';

export interface ChallengeConfig {
  id: string;
  environment: EnvironmentId;
  difficulty: number;
  template: ChallengeTemplateId;
  obstacles: ObstacleConfig[];
  target: {
    x: number;
    y: number;
    radius: number;
    z?: number;
    movement?: MovementConfig;
  };
  tags?: string[];
}
