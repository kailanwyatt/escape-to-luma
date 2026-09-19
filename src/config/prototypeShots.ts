import type { ShotConfig } from './ShotConfig';

export const PROTOTYPE_SHOTS: ShotConfig[] = [
  {
    id: 1,
    rotor: {
      bladeCount: 2,
      rotationSpeed: 0.55,
      direction: 1,
    },
    target: {
      x: 0,
      y: 3,
      radius: 1.2,
    },
  },
  {
    id: 2,
    rotor: {
      bladeCount: 3,
      rotationSpeed: 0.65,
      direction: 1,
    },
    target: {
      x: 0,
      y: 3,
      radius: 1.1,
    },
  },
  {
    id: 3,
    rotor: {
      bladeCount: 3,
      rotationSpeed: 0.9,
      direction: 1,
    },
    target: {
      x: 0,
      y: 3,
      radius: 1.05,
    },
  },
  {
    id: 4,
    rotor: {
      bladeCount: 3,
      rotationSpeed: 0.8,
      direction: 1,
    },
    target: {
      x: -0.8,
      y: 3.15,
      radius: 1.0,
    },
  },
  {
    id: 5,
    rotor: {
      bladeCount: 3,
      rotationSpeed: 0.9,
      direction: -1,
    },
    target: {
      x: 0.9,
      y: 2.8,
      radius: 0.95,
    },
  },
  {
    id: 6,
    rotor: {
      bladeCount: 4,
      rotationSpeed: 0.8,
      direction: 1,
    },
    target: {
      x: -0.4,
      y: 3.25,
      radius: 0.9,
    },
  },
  {
    id: 7,
    rotor: {
      bladeCount: 3,
      rotationSpeed: 0.65,
      direction: 1,
      speedPulse: {
        amplitude: 0.35,
        frequency: 0.7,
      },
    },
    target: {
      x: 0.5,
      y: 3.1,
      radius: 0.9,
    },
  },
  {
    id: 8,
    rotor: {
      bladeCount: 3,
      rotationSpeed: 0.9,
      direction: 1,
      reverseInterval: 2.5,
    },
    target: {
      x: -0.6,
      y: 2.9,
      radius: 0.85,
    },
  },
];
