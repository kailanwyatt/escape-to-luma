import type { ObstacleConfig } from '../../config/ObstacleConfig';
import type { CampaignLevelDefinition } from '../types';
import {
  aperture,
  center,
  drift,
  FAIR,
  gate,
  iris,
  lerp,
  makeLevel,
  offset,
  orbiter,
  pendulum,
  phase,
  ring,
  rotor,
  soft,
  tight,
  well,
  worldT,
  Z_A,
  Z_B,
} from './helpers';
import { WORLD2_SAMPLE_LEVELS } from './world2';

/**
 * Fair campaign packs (Worlds 2 finish + 3–10).
 * Rules: one new demand at a time; rotor ≤ FAIR.rotorMax; wind ≤ FAIR.windMax;
 * openings stay readable; no boosts required.
 */

/** City levels 21–30. */
export const WORLD2_LEVELS_21_30: CampaignLevelDefinition[] = [
  makeLevel('city', 21, 'w2-06', 'MOVING_GATE', 'rooftop', [gate(1.7, 0.52, 0.55)], center, {
    windX: 0.22,
  }),
  makeLevel('city', 22, 'w2-07', 'GATE_OFFSET_TARGET', 'rooftop', [gate(1.65, 0.55, 0.58)], offset, {
    windX: 0.24,
  }),
  makeLevel(
    'city',
    23,
    'w2-08',
    'ROTOR_GATE',
    'rooftop',
    [rotor(0.58), gate(1.75, 0.42, 0.42, { z: Z_B })],
    center,
    { windX: 0.2 },
  ),
  makeLevel('city', 24, 'w2-09', 'MOVING_GATE', 'rooftop', [gate(1.6, 0.58, 0.62, { height: 2.6 })], center, {
    windX: 0.26,
  }),
  makeLevel(
    'city',
    25,
    'w2-10',
    'GATE_OFFSET_TARGET',
    'rooftop',
    [gate(1.55, 0.55, 0.6)],
    offset,
    { windX: 0.28 },
  ),
  makeLevel(
    'city',
    26,
    'w2-11',
    'ROTOR_GATE',
    'rooftop',
    [rotor(0.62, { reverse: true }), gate(1.7, 0.48, 0.48, { z: Z_B })],
    center,
    { windX: 0.24 },
  ),
  makeLevel('city', 27, 'w2-12', 'MOVING_GATE', 'rooftop', [gate(1.52, 0.62, 0.68)], offset, {
    windX: 0.3,
  }),
  makeLevel(
    'city',
    28,
    'w2-13',
    'ROTOR_GATE',
    'rooftop',
    [gate(1.65, 0.5, 0.5), rotor(0.58, { z: Z_B, blades: 3 })],
    center,
    { windX: 0.26 },
  ),
  makeLevel('city', 29, 'w2-14', 'GATE_OFFSET_TARGET', 'rooftop', [gate(1.5, 0.65, 0.7)], offset, {
    windX: 0.32,
  }),
  makeLevel(
    'city',
    30,
    'w2-15',
    'ROTOR_GATE',
    'rooftop',
    [rotor(0.66, { blades: 3 }), gate(1.55, 0.55, 0.52, { z: Z_B, height: 2.55 })],
    tight,
    { windX: Math.min(0.34, FAIR.windMax), isWorldFinale: true, storyBeat: 'CITY LIMITS' },
  ),
];

export const WORLD2_LEVELS: CampaignLevelDefinition[] = [
  ...WORLD2_SAMPLE_LEVELS,
  ...WORLD2_LEVELS_21_30,
];

export function buildWorld3(): CampaignLevelDefinition[] {
  const levels: CampaignLevelDefinition[] = [];
  for (let i = 0; i < 15; i += 1) {
    const n = 31 + i;
    const t = worldT(n);
    const wind = lerp(0.18, 0.34, t);
    const rad = lerp(1.4, 1.18, t);
    const speed = lerp(0.4, 0.68, t);
    const amp = lerp(0.35, 0.7, t);
    const move = i % 3 === 1 ? 'vertical' : i % 3 === 2 ? 'ellipse' : 'horizontal';
    const obstacles =
      i >= 11
        ? [ring(rad, speed, amp, move), rotor(lerp(0.5, 0.62, t), { z: Z_B })]
        : i >= 7
          ? [ring(rad, speed * 0.9, amp * 0.85, move, Z_A), ring(lerp(1.35, 1.22, t), speed * 0.75, amp * 0.55, 'vertical', Z_B)]
          : [ring(rad, speed, amp, move)];
    const target = i < 4 ? soft : i % 3 === 0 ? offset : center;
    levels.push(
      makeLevel('sky', n, `w3-${String(i + 1).padStart(2, '0')}`, 'BASIC_RING', 'rooftop', obstacles, target, {
        windX: wind,
        storyBeat: i === 0 ? 'THE SKY' : i === 14 ? 'THE STORM' : undefined,
        isWorldFinale: i === 14,
      }),
    );
  }
  return levels;
}

export function buildWorld4(): CampaignLevelDefinition[] {
  const levels: CampaignLevelDefinition[] = [];
  for (let i = 0; i < 15; i += 1) {
    const n = 46 + i;
    const t = worldT(n);
    const g = lerp(0.88, 0.58, t);
    const minR = lerp(0.58, 0.44, t);
    const maxR = lerp(1.85, 1.55, t);
    const speed = lerp(0.6, 0.95, t);
    const obstacles =
      i >= 11
        ? [iris(minR, maxR, speed), gate(lerp(1.8, 1.55, t), 0.45, 0.4, { z: Z_B })]
        : i >= 7
          ? [iris(minR, maxR, speed), iris(minR + 0.08, maxR - 0.08, speed * 0.85, Z_B)]
          : [iris(minR, maxR, speed)];
    const target = i < 5 ? soft : i % 2 ? offset : center;
    levels.push(
      makeLevel(
        'atmosphere',
        n,
        `w4-${String(i + 1).padStart(2, '0')}`,
        'BASIC_IRIS',
        'space',
        obstacles,
        target,
        {
          gravityScale: Math.max(g, FAIR.gravityMin),
          storyBeat: i === 0 ? 'UPPER ATMOSPHERE' : i === 14 ? 'ESCAPE VELOCITY' : undefined,
          isWorldFinale: i === 14,
        },
      ),
    );
  }
  return levels;
}

export function buildWorld5(): CampaignLevelDefinition[] {
  const levels: CampaignLevelDefinition[] = [];
  for (let i = 0; i < 15; i += 1) {
    const n = 61 + i;
    const t = worldT(n);
    const g = lerp(0.62, 0.48, t);
    const speed = lerp(0.55, 0.85, t);
    const angle = lerp(0.5, 0.78, t);
    const obstacles =
      i >= 11
        ? [pendulum(speed, angle), ring(1.28, 0.45, 0.32, 'horizontal', Z_B)]
        : i >= 7
          ? [pendulum(speed, angle), pendulum(speed * 0.85, angle * 0.8, Z_B)]
          : [pendulum(speed, angle)];
    levels.push(
      makeLevel(
        'orbit',
        n,
        `w5-${String(i + 1).padStart(2, '0')}`,
        'BASIC_PENDULUM',
        'space',
        obstacles,
        i < 6 ? soft : i % 2 ? center : offset,
        {
          gravityScale: Math.max(g, FAIR.gravityMin),
          storyBeat: i === 0 ? 'ORBIT' : i === 14 ? 'ORBITAL GRAVEYARD' : undefined,
          isWorldFinale: i === 14,
        },
      ),
    );
  }
  return levels;
}

export function buildWorld6(): CampaignLevelDefinition[] {
  const levels: CampaignLevelDefinition[] = [];
  for (let i = 0; i < 15; i += 1) {
    const n = 76 + i;
    const t = worldT(n);
    const speed = lerp(0.55, 0.9, t);
    const orbitR = lerp(1.15, 1.4, t);
    const br = lerp(0.26, 0.34, t);
    const wells =
      i >= 5
        ? [well(lerp(0.9, FAIR.wellStrengthMax, t), lerp(2.4, 2.9, t), i % 2 ? -0.5 : 0.5)]
        : undefined;
    const obstacles =
      i >= 11
        ? [orbiter(speed, orbitR, br), orbiter(speed * 0.8, orbitR * 0.8, br * 0.9, Z_B)]
        : i >= 7
          ? [orbiter(speed, orbitR, br), rotor(0.55, { z: Z_B })]
          : [orbiter(speed, orbitR, br)];
    levels.push(
      makeLevel(
        'moon',
        n,
        `w6-${String(i + 1).padStart(2, '0')}`,
        'BASIC_ORBITER',
        'space',
        obstacles,
        i < 5 ? soft : i % 2 ? offset : center,
        {
          gravityScale: lerp(0.65, 0.5, t),
          gravityWells: wells,
          storyBeat: i === 0 ? 'THE MOON' : i === 14 ? 'FAR SIDE' : undefined,
          isWorldFinale: i === 14,
        },
      ),
    );
  }
  return levels;
}

export function buildWorld7(): CampaignLevelDefinition[] {
  const levels: CampaignLevelDefinition[] = [];
  for (let i = 0; i < 15; i += 1) {
    const n = 91 + i;
    const t = worldT(n);
    const speed = lerp(0.45, 0.78, t);
    const r = lerp(0.28, 0.38, t);
    const ampX = lerp(0.55, 0.85, t);
    // Keep a readable center corridor between the two drifts.
    const obstacles =
      i >= 11
        ? [drift(speed, r, ampX * 0.85, 0.28, -0.55, Z_A), ring(1.28, 0.48, 0.3, 'horizontal', Z_B)]
        : [
            drift(speed, r, ampX, 0.3, -0.55),
            drift(speed * 0.92, r, ampX, 0.3, 0.55),
          ];
    levels.push(
      makeLevel(
        'asteroid',
        n,
        `w7-${String(i + 1).padStart(2, '0')}`,
        'DRIFT_BLOCKER',
        'space',
        obstacles,
        soft,
        {
          gravityScale: 0.75,
          storyBeat: i === 0 ? 'ASTEROID BELT' : i === 14 ? 'COLLISION COURSE' : undefined,
          isWorldFinale: i === 14,
        },
      ),
    );
  }
  return levels;
}

export function buildWorld8(): CampaignLevelDefinition[] {
  const levels: CampaignLevelDefinition[] = [];
  for (let i = 0; i < 15; i += 1) {
    const n = 106 + i;
    const t = worldT(n);
    const speed = lerp(0.5, 0.88, t);
    const open = lerp(0.58, 0.42, t);
    const field = lerp(2.15, 2.45, t);
    const obstacles =
      i >= 11
        ? [phase(speed, field, open), phase(speed * 0.85, field * 0.92, Math.min(0.55, open + 0.06), Z_B)]
        : i >= 7
          ? [phase(speed, field, open), iris(0.52, 1.65, 0.75, Z_B)]
          : [phase(speed, field, open)];
    levels.push(
      makeLevel(
        'nebula',
        n,
        `w8-${String(i + 1).padStart(2, '0')}`,
        'PHASE_FIELD',
        'space',
        obstacles,
        i < 5 ? soft : i % 2 ? offset : center,
        {
          storyBeat: i === 0 ? 'THE NEBULA' : i === 14 ? 'FALSE HOME' : undefined,
          isWorldFinale: i === 14,
        },
      ),
    );
  }
  return levels;
}

export function buildWorld9(): CampaignLevelDefinition[] {
  const levels: CampaignLevelDefinition[] = [];
  for (let i = 0; i < 15; i += 1) {
    const n = 121 + i;
    const t = worldT(n);
    const minR = lerp(0.52, 0.42, t);
    const maxR = lerp(1.75, 1.4, t);
    const shift = lerp(0.28, 0.55, t);
    const pulse = lerp(0.55, 0.9, t);
    const shiftSp = lerp(0.4, 0.7, t);
    const obstacles =
      i >= 11
        ? [
            aperture(minR, maxR, shift, { pulse, shift: shiftSp }),
            aperture(minR + 0.06, maxR - 0.06, shift * 0.7, { pulse: pulse * 0.85, shift: shiftSp * 0.8 }, Z_B),
          ]
        : i >= 7
          ? [aperture(minR, maxR, shift, { pulse, shift: shiftSp }), phase(0.65, 2.2, 0.48, Z_B)]
          : [aperture(minR, maxR, shift, { pulse, shift: shiftSp })];
    levels.push(
      makeLevel(
        'network',
        n,
        `w9-${String(i + 1).padStart(2, '0')}`,
        'SHIFTING_APERTURE',
        'space',
        obstacles,
        i < 6 ? soft : i % 2 ? center : offset,
        {
          storyBeat: i === 0 ? 'THE ANCIENT NETWORK' : i === 14 ? 'THE KEY' : undefined,
          isWorldFinale: i === 14,
        },
      ),
    );
  }
  return levels;
}

export function buildWorld10(): CampaignLevelDefinition[] {
  const levels: CampaignLevelDefinition[] = [];
  const recipes: Array<() => {
    obstacles: ObstacleConfig[];
    extras?: Partial<CampaignLevelDefinition>;
  }> = [
    () => ({ obstacles: [rotor(0.58), ring(1.3, 0.48, 0.35, 'horizontal', Z_B)] }),
    () => ({
      obstacles: [iris(0.52, 1.65, 0.75), pendulum(0.7, 0.6, Z_B)],
      extras: { gravityScale: 0.72 },
    }),
    () => ({ obstacles: [gate(1.65, 0.5, 0.45), orbiter(0.7, 1.2, 0.28, Z_B)] }),
    () => ({
      obstacles: [phase(0.7, 2.25, 0.48), aperture(0.48, 1.55, 0.4, { pulse: 0.7, shift: 0.55 }, Z_B)],
    }),
    () => ({
      obstacles: [drift(0.6, 0.32, 0.7, 0.25, -0.5), drift(0.62, 0.32, 0.7, 0.25, 0.5)],
    }),
    () => ({
      obstacles: [orbiter(0.75, 1.25, 0.3), iris(0.48, 1.55, 0.8, Z_B)],
      extras: { gravityWells: [well(1.2, 2.7, 0.45)] },
    }),
    () => ({ obstacles: [ring(1.25, 0.55, 0.5, 'ellipse'), phase(0.75, 2.3, 0.45, Z_B)] }),
    () => ({
      obstacles: [aperture(0.46, 1.5, 0.48, { pulse: 0.8, shift: 0.6 }), pendulum(0.72, 0.65, Z_B)],
    }),
    () => ({
      obstacles: [rotor(0.66, { blades: 3 }), gate(1.55, 0.55, 0.5, { z: Z_B })],
      extras: { windX: 0.22, gravityScale: 0.7 },
    }),
    () => ({
      obstacles: [orbiter(0.8, 1.3, 0.32), drift(0.65, 0.32, 0.55, 0.22, 0.0, Z_B)],
      extras: { gravityScale: 0.62 },
    }),
    // 146–149 ease toward home
    () => ({
      obstacles: [aperture(0.5, 1.6, 0.32, { pulse: 0.65, shift: 0.45 })],
      extras: { storyBeat: 'HOME SIGNAL STRONG' },
    }),
    () => ({
      obstacles: [phase(0.6, 2.2, 0.55), ring(1.3, 0.42, 0.28, 'horizontal', Z_B)],
      extras: { storyBeat: 'ALMOST THERE' },
    }),
    () => ({
      obstacles: [orbiter(0.65, 1.15, 0.28)],
      extras: { gravityScale: 0.78, storyBeat: 'THE THRESHOLD' },
    }),
    () => ({
      obstacles: [iris(0.55, 1.75, 0.6)],
      extras: { storyBeat: 'ONE MORE GATE' },
    }),
    () => ({
      obstacles: [],
      extras: { isWorldFinale: true, storyBeat: 'HOME' },
    }),
  ];

  for (let i = 0; i < 15; i += 1) {
    const n = 136 + i;
    const recipe = recipes[i]();
    levels.push(
      makeLevel(
        'homeward',
        n,
        `w10-${String(i + 1).padStart(2, '0')}`,
        i === 14 ? 'HOME_FINALE' : 'COMBINED_HAZARD',
        'space',
        recipe.obstacles,
        i >= 10 ? soft : i % 2 ? offset : center,
        recipe.extras,
      ),
    );
  }
  return levels;
}

export function buildWorlds3to10(): CampaignLevelDefinition[] {
  return [
    ...buildWorld3(),
    ...buildWorld4(),
    ...buildWorld5(),
    ...buildWorld6(),
    ...buildWorld7(),
    ...buildWorld8(),
    ...buildWorld9(),
    ...buildWorld10(),
  ];
}
