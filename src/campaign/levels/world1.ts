import type { ChallengeConfig } from '../../config/ChallengeConfig';
import type { ObstacleConfig } from '../../config/ObstacleConfig';
import { GAME_TUNING } from '../../game/gameTuning';
import type { CampaignLevelDefinition } from '../types';

const Z_A = GAME_TUNING.rotor.planeA.min + 0.25;
const Z_B = GAME_TUNING.rotor.planeB.min + 0.25;
const TZ = GAME_TUNING.target.z;

function level(
  levelNumber: number,
  id: string,
  template: ChallengeConfig['template'],
  obstacles: ObstacleConfig[],
  target: ChallengeConfig['target'],
  extras?: Partial<CampaignLevelDefinition>,
): CampaignLevelDefinition {
  return {
    id,
    worldId: 'containment',
    levelNumber,
    challenge: {
      id,
      environment: 'workshop',
      difficulty: Math.ceil(levelNumber / 5),
      template,
      obstacles,
      target: { ...target, z: target.z ?? TZ },
    },
    ...extras,
  };
}

const soft = { x: 0, y: 3, radius: 1.28 };
const center = { x: 0, y: 3, radius: 1.18 };
const offset = { x: 0.3, y: 3.08, radius: 1.12 };
const late = { x: 0, y: 3, radius: 1.06 };

function rotor(
  speed: number,
  opts?: { blades?: number; reverse?: boolean; z?: number },
): ObstacleConfig {
  return {
    type: 'rotor',
    z: opts?.z ?? Z_A,
    bladeCount: opts?.blades ?? 2,
    rotationSpeed: speed,
    direction: opts?.reverse ? -1 : 1,
    initialRotation: 0.2,
  };
}

function gate(
  openingWidth: number,
  opts?: {
    amplitude?: number;
    speed?: number;
    z?: number;
    openingHeight?: number;
    appearance?: 'standard' | 'containmentGlass';
  },
): ObstacleConfig {
  return {
    type: 'slidingGate',
    z: opts?.z ?? Z_A,
    appearance: opts?.appearance,
    openingWidth,
    openingHeight: opts?.openingHeight ?? 3.1,
    baseX: 0,
    amplitude: opts?.amplitude ?? 0,
    speed: opts?.speed ?? 0,
  };
}

function lasers(
  orientation: 'vertical' | 'horizontal' | 'both',
  opts?: {
    openingSize?: number;
    mode?: 'static' | 'pulse';
    speed?: number;
    onRatio?: number;
    z?: number;
    movement?: {
      axis: 'horizontal' | 'vertical' | 'both';
      amplitude: number;
      speed: number;
      phase?: number;
    };
  },
): ObstacleConfig {
  return {
    type: 'laserGrid',
    z: opts?.z ?? Z_A,
    orientation,
    openingSize: opts?.openingSize ?? 1.3,
    spacing: 0.55,
    span: 4.2,
    thickness: 0.06,
    mode: opts?.mode ?? 'static',
    speed: opts?.speed,
    onRatio: opts?.onRatio,
    centerX: 0,
    centerY: 3,
    movement: opts?.movement ?? {
      axis:
        orientation === 'vertical'
          ? 'horizontal'
          : orientation === 'horizontal'
            ? 'vertical'
            : 'both',
      amplitude: orientation === 'both' ? 0.5 : 0.72,
      speed: orientation === 'both' ? 0.62 : 0.58,
    },
  };
}

/**
 * World 1 — Containment escape.
 * Canonical teaching arc: breach, aim/power, moving gate, one-arm rotor,
 * readable security patterns, combinations, then the Jump Gate escape.
 */
export const WORLD1_LEVELS: CampaignLevelDefinition[] = [
  level(1, 'w1-01', 'BASIC_GATE', [
    gate(1.72, { openingHeight: 2.65, appearance: 'containmentGlass' }),
  ], center, {
    tutorialHint: 'PULL TO POWER UP',
    storyBeat: 'ESCAPE THE GLASS',
  }),
  level(2, 'w1-02', 'BASIC_GATE', [gate(2.55, { openingHeight: 3.3 })], offset, {
    tutorialHint: 'PULL FARTHER FOR POWER',
    storyBeat: 'BREAK CONTAINMENT',
  }),
  level(3, 'w1-03', 'MOVING_GATE', [gate(2.45, { amplitude: 0.24, speed: 0.24 })], soft, {
    tutorialHint: 'FOLLOW THE OPENING',
    storyBeat: 'LOCKING DOWN',
  }),
  level(4, 'w1-04', 'BASIC_ROTOR', [rotor(0.28, { blades: 1 })], soft, {
    tutorialHint: 'THROW AFTER THE ARM PASSES',
    storyBeat: 'FIRST ROTOR',
  }),
  level(5, 'w1-05', 'BASIC_ROTOR', [rotor(0.38, { blades: 1 })], center, {
    tutorialHint: 'TIMING BEATS SPEED',
  }),
  level(6, 'w1-06', 'BASIC_ROTOR', [rotor(0.36, { blades: 2 })], center, {
    tutorialHint: 'READ BOTH ARMS',
  }),
  level(7, 'w1-07', 'REVERSE_ROTOR', [rotor(0.4, { reverse: true })], center, {
    tutorialHint: 'WATCH THE DIRECTION',
    storyBeat: 'SECURITY ROTATION',
  }),

  // Security lasers: each layout is introduced alone before combinations.
  level(
    8,
    'w1-08',
    'LASER_VERTICAL',
    [
      lasers('vertical', {
        openingSize: 1.55,
        movement: { axis: 'horizontal', amplitude: 0.78, speed: 0.5 },
      }),
    ],
    soft,
    {
      tutorialHint: 'FOLLOW THE GAP LEFT TO RIGHT',
      storyBeat: 'SECURITY BARS',
    },
  ),
  level(
    9,
    'w1-09',
    'LASER_HORIZONTAL',
    [
      lasers('horizontal', {
        openingSize: 1.5,
        movement: { axis: 'vertical', amplitude: 0.82, speed: 0.56 },
      }),
    ],
    soft,
    {
      tutorialHint: 'FOLLOW THE GAP UP AND DOWN',
    },
  ),
  level(
    10,
    'w1-10',
    'LASER_PULSE',
    [
      lasers('vertical', {
        openingSize: 1.45,
        mode: 'pulse',
        speed: 0.42,
        onRatio: 0.46,
        movement: { axis: 'horizontal', amplitude: 0.9, speed: 0.62 },
      }),
    ],
    center,
    {
      tutorialHint: 'TRACK THE GAP · THROW WHILE OFF',
      storyBeat: 'TIMING SEQUENCE',
    },
  ),
  level(
    11,
    'w1-11',
    'LASER_CROSS',
    [
      lasers('both', {
        openingSize: 1.4,
        mode: 'pulse',
        speed: 0.38,
        onRatio: 0.44,
        movement: { axis: 'both', amplitude: 0.55, speed: 0.58 },
      }),
    ],
    center,
    {
      tutorialHint: 'FOLLOW THE MOVING CROSSING',
      storyBeat: 'FULL SECURITY GRID',
    },
  ),
  level(
    12,
    'w1-12',
    'ROTOR_GATE',
    [rotor(0.38, { blades: 2, z: Z_A }), gate(2.15, { amplitude: 0.18, speed: 0.24, z: Z_B })],
    center,
    { tutorialHint: 'READ THE NEAR PLANE FIRST', storyBeat: 'DOUBLE LOCK' },
  ),
  level(
    13,
    'w1-13',
    'COMBINED_HAZARD',
    [lasers('vertical', { openingSize: 1.5, z: Z_A }), rotor(0.4, { blades: 2, z: Z_B })],
    center,
    { tutorialHint: 'ONE OPENING AT A TIME', storyBeat: 'SECURITY OVERRIDE' },
  ),
  level(
    14,
    'w1-14',
    'DUAL_ROTOR',
    [rotor(0.42, { blades: 2, z: Z_A }), rotor(0.36, { blades: 2, reverse: true, z: Z_B })],
    center,
    { tutorialHint: 'WAIT FOR BOTH PATHS', storyBeat: 'FULL LOCKDOWN' },
  ),
  level(
    15,
    'w1-15',
    'ROTOR_GATE',
    [
      rotor(0.46, { blades: 2, z: Z_A }),
      gate(1.95, { amplitude: 0.28, speed: 0.3, z: Z_B, openingHeight: 3 }),
    ],
    late,
    {
      isWorldFinale: true,
      storyBeat: 'ESCAPE — JUMP GATE',
    },
  ),
];
