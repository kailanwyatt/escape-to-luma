import type { MovementConfig } from './MovementConfig';

export interface RotorConfig {
  z: number;
  bladeCount: number;
  rotationSpeed: number;
  direction: 1 | -1;
  initialRotation?: number;
  phase?: number;
  speedPulse?: {
    amplitude: number;
    frequency: number;
  };
  reverseInterval?: number;
  movement?: MovementConfig;
}
