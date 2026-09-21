import type { ChallengeConfig } from '../../config/ChallengeConfig';
import type {
  LaserGridPattern,
  ObstacleConfig,
} from '../../config/ObstacleConfig';
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
    pattern?: LaserGridPattern;
    beamCount?: number;
    spacing?: number;
    amplitude?: number;
    speed?: number;
    phaseOffset?: number;
    mode?: 'static' | 'pulse';
    pulseSpeed?: number;
    onRatio?: number;
    z?: number;
  },
): ObstacleConfig {
  return {
    type: 'laserGrid',
    z: opts?.z ?? Z_A,
    orientation,
    pattern:
      opts?.pattern ??
      (orientation === 'vertical'
        ? 'VERTICAL_WAVE'
        : orientation === 'horizontal'
          ? 'HORIZONTAL_WAVE'
          : 'CROSSING'),
    beamCount: opts?.beamCount ?? (orientation === 'both' ? 6 : 4),
    spacing: opts?.spacing ?? 1.08,
    amplitude: opts?.amplitude ?? 0.2,
    speed: opts?.speed ?? 0.58,
    phaseOffset: opts?.phaseOffset ?? 0.78,
    span: 4.2,
    thickness: 0.06,
    mode: opts?.mode ?? 'static',
    pulseSpeed: opts?.pulseSpeed,
    onRatio: opts?.onRatio,
    centerX: 0,
    centerY: 3,
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
  level(3, 'w1-03', 'MOVING_GATE', [gate(2.45, { amplitude: 0.5, speed: 0.65 })], soft, {
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
    'LASER_HORIZONTAL',
    [
      lasers('horizontal', {
        pattern: 'HORIZONTAL_WAVE',
        beamCount: 3,
        spacing: 1.22,
        amplitude: 0.28,
        speed: 0.72,
        phaseOffset: 1.5,
      }),
    ],
    soft,
    {
      tutorialHint: 'WATCH THE BEAMS MOVE UP AND DOWN',
      storyBeat: 'SECURITY BARS',
    },
  ),
  level(
    9,
    'w1-09',
    'LASER_VERTICAL',
    [
      lasers('vertical', {
        pattern: 'VERTICAL_WAVE',
        beamCount: 3,
        spacing: 1.22,
        amplitude: 0.28,
        speed: 0.74,
        phaseOffset: 1.5,
      }),
    ],
    { ...soft, radius: 1.04 },
    {
      tutorialHint: 'WATCH THE BEAMS MOVE LEFT AND RIGHT',
    },
  ),
  level(
    10,
    'w1-10',
    'LASER_PULSE',
    [
      lasers('vertical', {
        pattern: 'OPEN_CLOSE',
        spacing: 1.12,
        amplitude: 0.19,
        speed: 0.62,
        mode: 'pulse',
        pulseSpeed: 0.42,
        onRatio: 0.46,
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
        pattern: 'CROSSING',
        beamCount: 6,
        spacing: 1.18,
        amplitude: 0.22,
        speed: 0.68,
        phaseOffset: 1.5,
        mode: 'pulse',
        pulseSpeed: 0.38,
        onRatio: 0.44,
      }),
    ],
    { ...center, radius: 1.0 },
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
    [
      lasers('vertical', {
        pattern: 'SEQUENTIAL',
        spacing: 1.12,
        amplitude: 0.18,
        speed: 0.64,
        z: Z_A,
      }),
      rotor(0.4, { blades: 2, z: Z_B }),
    ],
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
