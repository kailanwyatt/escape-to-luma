import {t} from '../../i18n';
import type { ChallengeConfig } from '../../config/ChallengeConfig';
import type { ObstacleConfig } from '../../config/ObstacleConfig';
import { GAME_TUNING } from '../../game/gameTuning';
import type { CampaignLevelDefinition } from '../types';

const Z_A = GAME_TUNING.rotor.planeA.min + 0.2;
const Z_B = GAME_TUNING.rotor.planeB.min + 0.2;
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
    worldId: 'city',
    levelNumber,
    challenge: {
      id,
      environment: 'rooftop',
      difficulty: Math.ceil((levelNumber - 15) / 5),
      template,
      obstacles,
      target: { ...target, z: target.z ?? TZ },
    },
    ...extras,
  };
}

const soft = { x: 0, y: 3, radius: 1.22 };
const center = { x: 0, y: 3, radius: 1.14 };
const offset = { x: 0.3, y: 3.08, radius: 1.1 };

/** World 2 — sliding gate + light wind. Wind and offset introduced gently. */
export const WORLD2_SAMPLE_LEVELS: CampaignLevelDefinition[] = [
  level(
    16,
    'w2-01',
    'BASIC_GATE',
    [
      {
        type: 'slidingGate',
        z: Z_A,
        openingWidth: 2.05,
        openingHeight: 3.0,
        baseX: 0,
        amplitude: 0.35,
        speed: 0.35,
      },
    ],
    soft,
    { storyBeat: t("world2.the_city_follow_the_signal"), windX: 0.1 },
  ),
  level(
    17,
    'w2-02',
    'MOVING_GATE',
    [
      {
        type: 'slidingGate',
        movementMode: 'rapidShutter',
        shutter: {pattern:'standard',closedHold:.45,openingDuration:.35,openHold:.7,warningDuration:.2,slamDuration:.2,visualVariant:'citySecurity'},
        z: Z_A,
        openingWidth: 1.85,
        openingHeight: 2.9,
        baseX: 0,
        amplitude: 0.5,
        speed: 0.42,
      },
    ],
    center,
    { windX: 0.14, tutorialHint: t("world2.cyan_open_amber_warning_red_slam_aim_for_your_arrival_time") },
  ),
  // Offset with gentle wind — still wide opening
  level(
    18,
    'w2-03',
    'GATE_OFFSET_TARGET',
    [
      {
        type: 'slidingGate',
        z: Z_A,
        openingWidth: 1.8,
        openingHeight: 2.85,
        baseX: 0,
        amplitude: 0.55,
        speed: 0.45,
      },
    ],
    offset,
    { windX: 0.16 },
  ),
  // Rotor + gate — both moderate
  level(
    19,
    'w2-04',
    'ROTOR_GATE',
    [
      {
        type: 'rotor',
        z: Z_A,
        bladeCount: 2,
        rotationSpeed: 0.55,
        direction: 1,
        initialRotation: 0.15,
      },
      {
        type: 'slidingGate',
        z: Z_B,
        openingWidth: 1.8,
        openingHeight: 2.75,
        baseX: 0,
        amplitude: 0.4,
        speed: 0.4,
      },
    ],
    center,
    { windX: 0.14 },
  ),
  level(
    20,
    'w2-05',
    'MOVING_GATE',
    [
      {
        type: 'slidingGate',
        z: Z_A,
        openingWidth: 1.7,
        openingHeight: 2.7,
        baseX: 0,
        baseY: 3,
        amplitude: 0.55,
        speed: 0.5,
      },
    ],
    center,
    { windX: 0.2, storyBeat: t("world2.wind_rises") },
  ),
];
