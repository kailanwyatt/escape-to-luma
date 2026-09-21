import type { MovementConfig } from './MovementConfig';

export type RotorVisualVariant =
  | 'containmentSecurity' | 'cityVentilation' | 'skyTurbine'
  | 'atmosphereAntenna' | 'orbitSolarArray' | 'moonMiningDrill'
  | 'asteroidWreckage' | 'nebulaEnergy' | 'ancientMechanism' | 'lumaEnergy';

export interface RotorConfig {
  visualVariant?: RotorVisualVariant;
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
