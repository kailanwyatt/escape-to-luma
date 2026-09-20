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

function lasers(
  orientation: 'vertical' | 'horizontal' | 'both',
  opts?: {
    openingSize?: number;
    mode?: 'static' | 'pulse';
    speed?: number;
    onRatio?: number;
    z?: number;
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
  };
}

/**
 * World 1 — Containment escape.
 * Teach rotors, then security lasers (V → H → pulse → cross), then dual + finale.
 */
export const WORLD1_LEVELS: CampaignLevelDefinition[] = [
  level(1, 'w1-01', 'BASIC_ROTOR', [rotor(0.42)], soft, {
    tutorialHint: 'DRAG TO AIM',
    storyBeat: 'THE BREACH',
  }),
  level(2, 'w1-02', 'BASIC_ROTOR', [rotor(0.5)], soft, {
    tutorialHint: 'RELEASE TO THROW',
    storyBeat: 'THE LAB',
  }),
  level(3, 'w1-03', 'BASIC_ROTOR', [rotor(0.56)], center, {
    tutorialHint: 'TIME THE OPENING',
    storyBeat: 'LOCKING DOWN',
  }),
  level(4, 'w1-04', 'BASIC_ROTOR', [rotor(0.62)], center, {
    storyBeat: 'FIRST ROTOR',
  }),
  level(5, 'w1-05', 'OFFSET_TARGET', [rotor(0.55)], offset, {
    tutorialHint: 'AIM OFF-CENTER',
  }),
  level(6, 'w1-06', 'FAST_ROTOR', [rotor(0.7)], center),
  level(7, 'w1-07', 'REVERSE_ROTOR', [rotor(0.58, { reverse: true })], center, {
    tutorialHint: 'IT REVERSES',
  }),
  level(8, 'w1-08', 'OFFSET_TARGET', [rotor(0.64)], offset),
  level(9, 'w1-09', 'MOVING_TARGET', [rotor(0.6)], {
    x: 0,
    y: 3,
    radius: 1.14,
    movement: { type: 'horizontal', amplitude: 0.4, speed: 0.42, phase: 0 },
  }),

  // Security lasers — one new idea at a time
  level(10, 'w1-10', 'LASER_VERTICAL', [lasers('vertical', { openingSize: 1.35 })], soft, {
    tutorialHint: 'THREAD THE GAP',
    storyBeat: 'SECURITY BARS',
  }),
  level(11, 'w1-11', 'LASER_HORIZONTAL', [lasers('horizontal', { openingSize: 1.3 })], center, {
    tutorialHint: 'HORIZONTAL SWEEP',
  }),
  level(
    12,
    'w1-12',
    'LASER_PULSE',
    [lasers('vertical', { openingSize: 1.2, mode: 'pulse', speed: 0.6, onRatio: 0.52 })],
    center,
    {
      tutorialHint: 'WAIT FOR THE DROP',
      storyBeat: 'TIMING SEQUENCE',
    },
  ),
  level(
    13,
    'w1-13',
    'LASER_CROSS',
    [lasers('both', { openingSize: 1.22, mode: 'pulse', speed: 0.55, onRatio: 0.48 })],
    center,
    {
      tutorialHint: 'CROSSFIRE',
      storyBeat: 'FULL SECURITY GRID',
    },
  ),

  // Dual planes then escape
  level(
    14,
    'w1-14',
    'DUAL_ROTOR',
    [rotor(0.52, { blades: 3, z: Z_A }), rotor(0.46, { blades: 2, z: Z_B })],
    center,
    { tutorialHint: 'TWO PLANES', storyBeat: 'FULL LOCKDOWN' },
  ),
  level(
    15,
    'w1-15',
    'ROTOR_GATE',
    [
      rotor(0.6, { blades: 3, z: Z_A }),
      {
        type: 'slidingGate',
        z: Z_B,
        openingWidth: 1.75,
        openingHeight: 2.8,
        baseX: 0,
        amplitude: 0.45,
        speed: 0.42,
      },
    ],
    late,
    {
      isWorldFinale: true,
      storyBeat: 'ESCAPE — JUMP GATE',
    },
  ),
];
