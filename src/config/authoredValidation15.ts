import type { ChallengeConfig, EnvironmentId } from './ChallengeConfig';
import type { ObstacleConfig } from './ObstacleConfig';
import { GAME_TUNING } from '../game/gameTuning';

type TargetSpec = ChallengeConfig['target'];

const Z_A = GAME_TUNING.rotor.planeA.min + 0.2;
const Z_B = GAME_TUNING.rotor.planeB.min + 0.3;
const TARGET_Z = GAME_TUNING.target.z;

function envFor(shot: number): EnvironmentId {
  if (shot <= 5) {
    return 'workshop';
  }
  if (shot <= 10) {
    return 'rooftop';
  }
  return 'space';
}

function shot(
  number: number,
  id: string,
  template: ChallengeConfig['template'],
  obstacles: ObstacleConfig[],
  target: TargetSpec,
): ChallengeConfig {
  return {
    id,
    environment: envFor(number),
    difficulty: 0,
    template,
    obstacles,
    target: { ...target, z: target.z ?? TARGET_Z },
    tags: [id],
  };
}

const center = { x: 0, y: 3, radius: 1.18 };
const offset = { x: 0.42, y: 3.12, radius: 1.08 };

export const VALIDATION_15_SHOTS: ChallengeConfig[] = [
  shot(1, 'V01', 'BASIC_GATE', [
    {
      type: 'slidingGate',
      z: Z_A,
      openingWidth: 2.1,
      openingHeight: 3.2,
      baseX: 0,
      amplitude: 0.45,
      speed: 0.35,
    },
  ], center),
  shot(2, 'V02', 'GATE_OFFSET_TARGET', [
    {
      type: 'slidingGate',
      z: Z_A,
      openingWidth: 1.7,
      openingHeight: 2.8,
      baseX: 0,
      amplitude: 0.7,
      speed: 0.45,
    },
  ], offset),
  shot(3, 'V03', 'BASIC_IRIS', [
    { type: 'iris', z: Z_A, minRadius: 0.55, maxRadius: 1.9, speed: 0.75 },
  ], center),
  shot(4, 'V04', 'IRIS_OFFSET_TARGET', [
    { type: 'iris', z: Z_A, minRadius: 0.4, maxRadius: 1.7, speed: 1.0 },
  ], offset),
  shot(5, 'V05', 'BASIC_PENDULUM', [
    {
      type: 'pendulum',
      z: Z_A,
      pivotX: 0,
      pivotY: 5.15,
      length: 2.05,
      blockerRadius: 0.3,
      maxAngle: 0.7,
      speed: 0.7,
    },
  ], center),
  shot(6, 'V06', 'PENDULUM_OFFSET_TARGET', [
    {
      type: 'pendulum',
      z: Z_A,
      pivotX: 0,
      pivotY: 5.2,
      length: 2.2,
      blockerRadius: 0.38,
      maxAngle: 0.9,
      speed: 0.85,
    },
  ], offset),
  shot(7, 'V07', 'BASIC_RING', [
    {
      type: 'movingRing',
      z: Z_A,
      radius: 1.55,
      baseX: 0,
      baseY: 3,
      movement: { type: 'horizontal', amplitudeX: 0.45, amplitudeY: 0, speed: 0.35 },
    },
  ], center),
  shot(8, 'V08', 'VERTICAL_RING', [
    {
      type: 'movingRing',
      z: Z_A,
      radius: 1.4,
      baseX: 0,
      baseY: 3,
      movement: { type: 'vertical', amplitudeX: 0, amplitudeY: 0.4, speed: 0.42 },
    },
  ], center),
  shot(9, 'V09', 'ROTOR_GATE', [
    { z: Z_A, bladeCount: 2, rotationSpeed: 0.45, direction: 1 },
    {
      type: 'slidingGate',
      z: Z_B,
      openingWidth: 1.9,
      openingHeight: 3.0,
      baseX: 0,
      amplitude: 0.5,
      speed: 0.4,
    },
  ], center),
  shot(10, 'V10', 'GATE_ROTOR', [
    {
      type: 'slidingGate',
      z: Z_A,
      openingWidth: 1.85,
      openingHeight: 3.0,
      baseX: 0,
      amplitude: 0.55,
      speed: 0.4,
    },
    { z: Z_B, bladeCount: 2, rotationSpeed: 0.42, direction: 1 },
  ], center),
  shot(11, 'V11', 'ROTOR_IRIS', [
    { z: Z_A, bladeCount: 2, rotationSpeed: 0.46, direction: 1 },
    { type: 'iris', z: Z_B, minRadius: 0.5, maxRadius: 1.85, speed: 0.8 },
  ], center),
  shot(12, 'V12', 'IRIS_ROTOR', [
    { type: 'iris', z: Z_A, minRadius: 0.5, maxRadius: 1.8, speed: 0.82 },
    { z: Z_B, bladeCount: 2, rotationSpeed: 0.44, direction: -1 },
  ], center),
  shot(13, 'V13', 'ROTOR_RING', [
    { z: Z_A, bladeCount: 2, rotationSpeed: 0.45, direction: 1 },
    {
      type: 'movingRing',
      z: Z_B,
      radius: 1.45,
      baseX: 0,
      baseY: 3,
      movement: { type: 'horizontal', amplitudeX: 0.5, amplitudeY: 0, speed: 0.38 },
    },
  ], center),
  shot(14, 'V14', 'RING_ROTOR', [
    {
      type: 'movingRing',
      z: Z_A,
      radius: 1.45,
      baseX: 0,
      baseY: 3,
      movement: { type: 'horizontal', amplitudeX: 0.48, amplitudeY: 0, speed: 0.4 },
    },
    { z: Z_B, bladeCount: 2, rotationSpeed: 0.44, direction: 1 },
  ], center),
  shot(15, 'V15', 'PENDULUM_ROTOR', [
    {
      type: 'pendulum',
      z: Z_A,
      pivotX: 0,
      pivotY: 5.15,
      length: 2.1,
      blockerRadius: 0.32,
      maxAngle: 0.75,
      speed: 0.72,
    },
    { z: Z_B, bladeCount: 2, rotationSpeed: 0.42, direction: 1 },
  ], center),
];

export const VALIDATION_SHOT_COUNT = VALIDATION_15_SHOTS.length;

export const OBSTACLE_TEST_SHOTS: ChallengeConfig[] = [
  VALIDATION_15_SHOTS[0],
  VALIDATION_15_SHOTS[2],
  VALIDATION_15_SHOTS[4],
  VALIDATION_15_SHOTS[6],
  shot(5, 'T05', 'BASIC_ROTOR', [{ z: Z_A, bladeCount: 2, rotationSpeed: 0.48, direction: 1 }], center),
  VALIDATION_15_SHOTS[8],
  VALIDATION_15_SHOTS[10],
  VALIDATION_15_SHOTS[12],
  VALIDATION_15_SHOTS[14],
  shot(10, 'T10', 'ELLIPTICAL_RING', [
    {
      type: 'movingRing',
      z: Z_A,
      radius: 1.35,
      baseX: 0,
      baseY: 3,
      movement: { type: 'ellipse', amplitudeX: 0.55, amplitudeY: 0.35, speed: 0.4 },
    },
  ], center),
];
