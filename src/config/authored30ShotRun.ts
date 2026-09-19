import type { ChallengeConfig, EnvironmentId } from './ChallengeConfig';
import type { RotorConfig } from './RotorConfig';
import { GAME_TUNING } from '../game/gameTuning';

type TargetSpec = ChallengeConfig['target'];

const ROTOR_Z = GAME_TUNING.rotor.z;
const ROTOR_B_Z = 9;
const TARGET_Z = GAME_TUNING.target.z;

function envFor(shot: number): EnvironmentId {
  if (shot <= 10) {
    return 'workshop';
  }
  if (shot <= 20) {
    return 'rooftop';
  }
  return 'space';
}

function shot(
  number: number,
  id: string,
  obstacles: RotorConfig[],
  target: TargetSpec,
): ChallengeConfig {
  return {
    id,
    environment: envFor(number),
    difficulty: 0,
    template: 'BASIC_ROTOR',
    obstacles,
    target: {
      x: target.x,
      y: target.y,
      radius: target.radius,
      z: target.z ?? TARGET_Z,
      movement: target.movement,
    },
    tags: [id],
  };
}

export const AUTHORED_30_SHOTS: ChallengeConfig[] = [
  shot(1, 'A01', [{ z: ROTOR_Z, bladeCount: 2, rotationSpeed: 0.5, direction: 1 }], {
    x: 0,
    y: 3,
    radius: 1.2,
  }),
  shot(2, 'A02', [{ z: ROTOR_Z, bladeCount: 3, rotationSpeed: 0.6, direction: 1 }], {
    x: 0,
    y: 3,
    radius: 1.1,
  }),
  shot(3, 'A03', [{ z: ROTOR_Z, bladeCount: 3, rotationSpeed: 0.65, direction: 1 }], {
    x: -0.75,
    y: 3.2,
    radius: 1.05,
  }),
  shot(4, 'A04', [{ z: ROTOR_Z, bladeCount: 3, rotationSpeed: 0.7, direction: -1 }], {
    x: 0.75,
    y: 3.55,
    radius: 1.05,
  }),
  shot(5, 'A05', [{ z: ROTOR_Z, bladeCount: 4, rotationSpeed: 0.65, direction: 1 }], {
    x: -0.3,
    y: 3.1,
    radius: 1.0,
  }),
  shot(
    6,
    'B06',
    [{ z: ROTOR_Z, bladeCount: 2, rotationSpeed: 0.5, direction: 1 }],
    { x: 0, y: 3, radius: 1.15, movement: { type: 'horizontal', amplitude: 0.45, speed: 0.4 } },
  ),
  shot(
    7,
    'B07',
    [{ z: ROTOR_Z, bladeCount: 2, rotationSpeed: 0.55, direction: -1 }],
    { x: 0, y: 3, radius: 1.1, movement: { type: 'horizontal', amplitude: 0.75, speed: 0.45 } },
  ),
  shot(
    8,
    'B08',
    [{ z: ROTOR_Z, bladeCount: 3, rotationSpeed: 0.6, direction: 1 }],
    { x: 0, y: 3, radius: 1.05, movement: { type: 'horizontal', amplitude: 0.65, speed: 0.5 } },
  ),
  shot(
    9,
    'B09',
    [{ z: ROTOR_Z, bladeCount: 3, rotationSpeed: 0.6, direction: -1 }],
    { x: 0.25, y: 3, radius: 1.05, movement: { type: 'vertical', amplitude: 0.4, speed: 0.45 } },
  ),
  shot(
    10,
    'B10',
    [{ z: ROTOR_Z, bladeCount: 3, rotationSpeed: 0.7, direction: 1 }],
    { x: 0, y: 3, radius: 1.0, movement: { type: 'horizontal', amplitude: 0.9, speed: 0.55 } },
  ),
  shot(
    11,
    'C11',
    [
      {
        z: ROTOR_Z,
        bladeCount: 2,
        rotationSpeed: 0.5,
        direction: 1,
        movement: { type: 'horizontal', amplitude: 0.35, speed: 0.35 },
      },
    ],
    { x: 0, y: 3, radius: 1.15 },
  ),
  shot(
    12,
    'C12',
    [
      {
        z: ROTOR_Z,
        bladeCount: 3,
        rotationSpeed: 0.55,
        direction: 1,
        movement: { type: 'horizontal', amplitude: 0.6, speed: 0.4 },
      },
    ],
    { x: 0, y: 3, radius: 1.1 },
  ),
  shot(
    13,
    'C13',
    [
      {
        z: ROTOR_Z,
        bladeCount: 3,
        rotationSpeed: 0.6,
        direction: -1,
        movement: { type: 'horizontal', amplitude: 0.55, speed: 0.45 },
      },
    ],
    { x: 0.65, y: 3.15, radius: 1.05 },
  ),
  shot(
    14,
    'C14',
    [
      {
        z: ROTOR_Z,
        bladeCount: 3,
        rotationSpeed: 0.65,
        direction: 1,
        movement: { type: 'horizontal', amplitude: 0.65, speed: 0.5 },
      },
    ],
    { x: -0.45, y: 3.25, radius: 0.9 },
  ),
  shot(
    15,
    'C15',
    [
      {
        z: ROTOR_Z,
        bladeCount: 3,
        rotationSpeed: 0.6,
        direction: 1,
        movement: { type: 'horizontal', amplitude: 0.5, speed: 0.4 },
      },
    ],
    {
      x: 0,
      y: 3,
      radius: 1.0,
      movement: { type: 'horizontal', amplitude: 0.6, speed: 0.4, phase: 3.14159 },
    },
  ),
  shot(
    16,
    'D16',
    [{ z: ROTOR_Z, bladeCount: 3, rotationSpeed: 0.7, direction: 1, reverseInterval: 3.0 }],
    { x: 0, y: 3, radius: 1.05 },
  ),
  shot(
    17,
    'D17',
    [
      {
        z: ROTOR_Z,
        bladeCount: 3,
        rotationSpeed: 0.6,
        direction: 1,
        speedPulse: { amplitude: 0.22, frequency: 0.55 },
      },
    ],
    { x: -0.35, y: 3.1, radius: 1.0 },
  ),
  shot(
    18,
    'D18',
    [{ z: ROTOR_Z, bladeCount: 3, rotationSpeed: 0.75, direction: -1, reverseInterval: 2.8 }],
    { x: 0.75, y: 3.3, radius: 0.95 },
  ),
  shot(
    19,
    'D19',
    [
      {
        z: ROTOR_Z,
        bladeCount: 3,
        rotationSpeed: 0.6,
        direction: 1,
        speedPulse: { amplitude: 0.2, frequency: 0.5 },
      },
    ],
    { x: 0, y: 3, radius: 1.0, movement: { type: 'horizontal', amplitude: 0.55, speed: 0.4 } },
  ),
  shot(
    20,
    'D20',
    [
      {
        z: ROTOR_Z,
        bladeCount: 3,
        rotationSpeed: 0.65,
        direction: 1,
        reverseInterval: 3.0,
        movement: { type: 'horizontal', amplitude: 0.45, speed: 0.35 },
      },
    ],
    { x: -0.4, y: 3.15, radius: 0.95 },
  ),
  shot(
    21,
    'E21',
    [
      { z: ROTOR_Z, bladeCount: 2, rotationSpeed: 0.45, direction: 1, phase: 0 },
      { z: ROTOR_B_Z, bladeCount: 2, rotationSpeed: 0.4, direction: 1, phase: 0.75 },
    ],
    { x: 0, y: 3, radius: 1.15 },
  ),
  shot(
    22,
    'E22',
    [
      { z: ROTOR_Z, bladeCount: 2, rotationSpeed: 0.5, direction: 1 },
      { z: ROTOR_B_Z, bladeCount: 2, rotationSpeed: 0.45, direction: -1, phase: 1.2 },
    ],
    { x: 0, y: 3, radius: 1.1 },
  ),
  shot(
    23,
    'E23',
    [
      { z: ROTOR_Z, bladeCount: 3, rotationSpeed: 0.5, direction: 1 },
      { z: ROTOR_B_Z, bladeCount: 2, rotationSpeed: 0.55, direction: -1, phase: 0.8 },
    ],
    { x: -0.35, y: 3.1, radius: 1.05 },
  ),
  shot(
    24,
    'E24',
    [
      { z: ROTOR_Z, bladeCount: 3, rotationSpeed: 0.55, direction: -1 },
      { z: ROTOR_B_Z, bladeCount: 3, rotationSpeed: 0.45, direction: 1, phase: 1.4 },
    ],
    { x: 0.6, y: 3.3, radius: 1.0 },
  ),
  shot(
    25,
    'E25',
    [
      { z: ROTOR_Z, bladeCount: 3, rotationSpeed: 0.6, direction: 1 },
      { z: ROTOR_B_Z, bladeCount: 2, rotationSpeed: 0.55, direction: -1, phase: 1.0 },
    ],
    { x: -0.55, y: 3.25, radius: 0.9 },
  ),
  shot(
    26,
    'F26',
    [
      { z: ROTOR_Z, bladeCount: 2, rotationSpeed: 0.55, direction: 1 },
      { z: ROTOR_B_Z, bladeCount: 2, rotationSpeed: 0.5, direction: -1, phase: 1.0 },
    ],
    { x: 0, y: 3, radius: 1.0, movement: { type: 'horizontal', amplitude: 0.45, speed: 0.35 } },
  ),
  shot(
    27,
    'F27',
    [
      {
        z: ROTOR_Z,
        bladeCount: 2,
        rotationSpeed: 0.55,
        direction: 1,
        movement: { type: 'horizontal', amplitude: 0.35, speed: 0.35 },
      },
      { z: ROTOR_B_Z, bladeCount: 2, rotationSpeed: 0.5, direction: -1, phase: 0.9 },
    ],
    { x: 0.4, y: 3.15, radius: 1.0 },
  ),
  shot(
    28,
    'F28',
    [
      { z: ROTOR_Z, bladeCount: 3, rotationSpeed: 0.55, direction: -1 },
      {
        z: ROTOR_B_Z,
        bladeCount: 2,
        rotationSpeed: 0.5,
        direction: 1,
        phase: 1.2,
        movement: { type: 'horizontal', amplitude: 0.4, speed: 0.35 },
      },
    ],
    { x: -0.45, y: 3.2, radius: 0.95 },
  ),
  shot(
    29,
    'F29',
    [
      { z: ROTOR_Z, bladeCount: 3, rotationSpeed: 0.55, direction: 1 },
      { z: ROTOR_B_Z, bladeCount: 2, rotationSpeed: 0.6, direction: -1, phase: 1.3 },
    ],
    { x: 0, y: 3, radius: 0.9, movement: { type: 'horizontal', amplitude: 0.5, speed: 0.4 } },
  ),
  shot(
    30,
    'F30',
    [
      {
        z: ROTOR_Z,
        bladeCount: 3,
        rotationSpeed: 0.6,
        direction: 1,
        movement: { type: 'horizontal', amplitude: 0.3, speed: 0.3 },
      },
      { z: ROTOR_B_Z, bladeCount: 2, rotationSpeed: 0.55, direction: -1, phase: 1.1 },
    ],
    {
      x: 0,
      y: 3.15,
      radius: 0.9,
      movement: { type: 'horizontal', amplitude: 0.4, speed: 0.35, phase: 2.0 },
    },
  ),
];

export const AUTHORED_SHOT_COUNT = AUTHORED_30_SHOTS.length;
