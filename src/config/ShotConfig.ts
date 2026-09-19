export interface ShotConfig {
  id: number;

  rotor: {
    bladeCount: number;
    rotationSpeed: number;
    direction: 1 | -1;

    speedPulse?: {
      amplitude: number;
      frequency: number;
    };

    reverseInterval?: number;
  };

  target: {
    x: number;
    y: number;
    radius: number;
  };
}
