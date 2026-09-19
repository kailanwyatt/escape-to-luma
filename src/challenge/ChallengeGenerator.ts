import type { ChallengeConfig, ChallengeTemplateId, EnvironmentId } from '../config/ChallengeConfig';
import type { MovementConfig } from '../config/MovementConfig';
import type { ObstacleConfig } from '../config/ObstacleConfig';
import type { RotorConfig } from '../config/RotorConfig';
import { GAME_TUNING } from '../game/gameTuning';
import { SeededRng } from '../utils/SeededRng';
import { estimateDifficulty, requestedDifficulty, templatesForRun } from './difficulty';
import { validateChallenge } from './ChallengeValidator';
import {
  applyVariety,
  primaryTypeForChallenge,
  rememberTypes,
} from './VarietyDirector';
import type { ObstacleType } from '../config/ObstacleConfig';
import { pickWeightedTemplate, precisionTargetScale, type RunThemeId } from './RunTheme';

const ENVIRONMENTS: EnvironmentId[] = ['workshop', 'rooftop', 'space'];

export function environmentForChallenge(index: number): EnvironmentId {
  const per = GAME_TUNING.run.shotsPerEnvironment;
  return ENVIRONMENTS[Math.floor(index / per) % ENVIRONMENTS.length];
}

export function loopNumberForChallenge(index: number): number {
  const per = GAME_TUNING.run.shotsPerEnvironment;
  return Math.floor(index / (per * ENVIRONMENTS.length)) + 1;
}

export function generateChallenge(
  rng: SeededRng,
  challengeIndex: number,
  recentTypes: ObstacleType[] = [],
  theme: RunThemeId = 'classic',
): ChallengeConfig {
  const environment = environmentForChallenge(challengeIndex);
  const loop = loopNumberForChallenge(challengeIndex);
  const challengeNumber = challengeIndex + 1;
  const requested = requestedDifficulty(challengeNumber, Math.max(0, loop - 1));
  const avoidRepeat = challengeNumber >= 21;

  const intro: Partial<Record<number, ChallengeTemplateId>> = {
    6: 'BASIC_GATE',
    11: 'BASIC_IRIS',
    16: 'BASIC_PENDULUM',
    21: 'BASIC_RING',
  };

  for (let attempt = 0; attempt < GAME_TUNING.generation.maxAttempts; attempt += 1) {
    const introTemplate = attempt === 0 ? intro[challengeNumber] : undefined;
    const pool = applyVariety(
      rng,
      templatesForRun(challengeNumber, requested),
      recentTypes,
      avoidRepeat,
    );
    const template = introTemplate ?? pickWeightedTemplate(rng, pool, theme, environment);
    const challenge = buildTemplate(rng, template, environment, requested, challengeIndex, attempt, theme);
    if (!validateChallenge(challenge, requested)) {
      challenge.difficulty = estimateDifficulty(challenge);
      return challenge;
    }
  }

  return buildTemplate(rng, 'BASIC_ROTOR', environment, 1, challengeIndex, 99, theme);
}

let activeTheme: RunThemeId = 'classic';

export function generateSequence(
  seed: number,
  count: number,
  theme: RunThemeId = 'classic',
): ChallengeConfig[] {
  const rng = new SeededRng(seed);
  const list: ChallengeConfig[] = [];
  let recent: ObstacleType[] = [];
  for (let i = 0; i < count; i += 1) {
    const challenge = generateChallenge(rng, i, recent, theme);
    list.push(challenge);
    recent = rememberTypes(recent, primaryTypeForChallenge(challenge));
  }
  return list;
}

function buildTemplate(
  rng: SeededRng,
  template: ChallengeTemplateId,
  environment: EnvironmentId,
  _requested: number,
  challengeIndex: number,
  attempt: number,
  theme: RunThemeId = 'classic',
): ChallengeConfig {
  activeTheme = theme;
  const id = `${template.toLowerCase()}-${challengeIndex}-${attempt}`;
  const zA = rng.float(GAME_TUNING.rotor.planeA.min, GAME_TUNING.rotor.planeA.max);
  const zB = rng.float(GAME_TUNING.rotor.planeB.min, GAME_TUNING.rotor.planeB.max);
  const targetZ = rng.float(GAME_TUNING.target.zRange.min, GAME_TUNING.target.zRange.max);

  const rotorA = (overrides: Partial<RotorConfig> = {}): RotorConfig => ({
    z: zA,
    bladeCount: rng.pick([2, 3]),
    rotationSpeed: rng.float(0.42, 0.58),
    direction: 1,
    ...overrides,
  });

  const offsetTarget = () => ({
    x: rng.float(-0.55, 0.55),
    y: rng.float(2.75, 3.25),
    radius: rng.float(0.95, 1.15),
    z: targetZ,
  });

  const centeredTarget = () => ({
    x: rng.float(-0.18, 0.18),
    y: rng.float(2.92, 3.08),
    radius: rng.float(1.08, 1.2),
    z: targetZ,
  });

  switch (template) {
    case 'BASIC_ROTOR':
      return wrap(id, environment, template, [rotorA({ bladeCount: 2, rotationSpeed: rng.float(0.4, 0.52) })], centeredTarget());
    case 'FAST_ROTOR':
      return wrap(id, environment, template, [rotorA({ rotationSpeed: rng.float(0.58, 0.72) })], centeredTarget());
    case 'REVERSE_ROTOR':
      return wrap(
        id,
        environment,
        template,
        [rotorA({ reverseInterval: rng.float(2.2, 3.2), rotationSpeed: rng.float(0.48, 0.62) })],
        centeredTarget(),
      );
    case 'PULSE_ROTOR':
      return wrap(
        id,
        environment,
        template,
        [
          rotorA({
            speedPulse: { amplitude: rng.float(0.1, 0.18), frequency: rng.float(0.45, 0.65) },
          }),
        ],
        centeredTarget(),
      );
    case 'OFFSET_TARGET':
      return wrap(id, environment, template, [rotorA()], offsetTarget());
    case 'MOVING_TARGET':
      return wrap(id, environment, template, [rotorA()], {
        ...offsetTarget(),
        radius: rng.float(0.9, 1.1),
        movement: movingTarget(rng),
      });
    case 'MOVING_ROTOR':
      return wrap(
        id,
        environment,
        template,
        [rotorA({ movement: movingRotor(rng) })],
        centeredTarget(),
      );
    case 'MOVING_ROTOR_OFFSET_TARGET':
      return wrap(
        id,
        environment,
        template,
        [rotorA({ bladeCount: rng.pick([2, 3]), movement: movingRotor(rng) })],
        offsetTarget(),
      );
    case 'DUAL_ROTOR':
      return wrap(
        id,
        environment,
        template,
        [
          rotorA({ bladeCount: 3, rotationSpeed: rng.float(0.46, 0.6) }),
          {
            z: zB,
            bladeCount: 2,
            rotationSpeed: rng.float(0.4, 0.52),
            direction: 1,
            initialRotation: rng.float(0.2, 1.2),
          },
        ],
        centeredTarget(),
      );
    case 'DUAL_COUNTER_ROTATION':
      return wrap(
        id,
        environment,
        template,
        [
          rotorA({ bladeCount: 3, rotationSpeed: rng.float(0.48, 0.62) }),
          {
            z: zB,
            bladeCount: 2,
            rotationSpeed: rng.float(0.42, 0.55),
            direction: -1,
            phase: Math.PI / 2,
            initialRotation: Math.PI / 2,
          },
        ],
        offsetTarget(),
      );
    case 'DUAL_DIFFERENT_SPEED':
      return wrap(
        id,
        environment,
        template,
        [
          rotorA({ rotationSpeed: rng.float(0.62, 0.74), bladeCount: 3 }),
          {
            z: zB,
            bladeCount: 3,
            rotationSpeed: rng.float(0.4, 0.52),
            direction: 1,
            initialRotation: rng.float(0.4, 2.0),
          },
        ],
        offsetTarget(),
      );
    case 'DUAL_ROTOR_MOVING_TARGET':
      return wrap(
        id,
        environment,
        template,
        [
          rotorA({ bladeCount: 3, rotationSpeed: rng.float(0.48, 0.62) }),
          {
            z: zB,
            bladeCount: 2,
            rotationSpeed: rng.float(0.42, 0.56),
            direction: rng.pick([1, -1]) as 1 | -1,
            initialRotation: Math.PI / 3,
          },
        ],
        {
          ...offsetTarget(),
          radius: rng.float(1.0, 1.15),
          movement: movingTarget(rng),
        },
      );
    case 'BASIC_GATE':
      return wrap(id, environment, template, [gate(rng, zA, { openingWidth: rng.float(1.8, 2.15), speed: rng.float(0.32, 0.45), amplitude: rng.float(0.4, 0.65) })], centeredTarget());
    case 'MOVING_GATE':
      return wrap(id, environment, template, [gate(rng, zA, { speed: rng.float(0.45, 0.7), amplitude: rng.float(0.7, 1.15) })], centeredTarget());
    case 'GATE_OFFSET_TARGET':
      return wrap(id, environment, template, [gate(rng, zA)], offsetTarget());
    case 'BASIC_IRIS':
      return wrap(id, environment, template, [iris(rng, zA, { minRadius: rng.float(0.45, 0.58), maxRadius: rng.float(1.7, 1.95), speed: rng.float(0.7, 0.9) })], centeredTarget());
    case 'FAST_IRIS':
      return wrap(id, environment, template, [iris(rng, zA, { speed: rng.float(1.05, 1.35), minRadius: rng.float(0.32, 0.48) })], centeredTarget());
    case 'IRIS_OFFSET_TARGET':
      return wrap(id, environment, template, [iris(rng, zA)], offsetTarget());
    case 'BASIC_PENDULUM':
      return wrap(id, environment, template, [pendulum(rng, zA, { blockerRadius: rng.float(0.28, 0.34), maxAngle: rng.float(0.55, 0.75), speed: rng.float(0.65, 0.8) })], centeredTarget());
    case 'WIDE_PENDULUM':
      return wrap(id, environment, template, [pendulum(rng, zA, { maxAngle: rng.float(0.85, 1.05), blockerRadius: rng.float(0.36, 0.48) })], centeredTarget());
    case 'PENDULUM_OFFSET_TARGET':
      return wrap(id, environment, template, [pendulum(rng, zA)], offsetTarget());
    case 'BASIC_RING':
      return wrap(id, environment, template, [ring(rng, zA, 'horizontal', { radius: rng.float(1.4, 1.65) })], centeredTarget());
    case 'VERTICAL_RING':
      return wrap(id, environment, template, [ring(rng, zA, 'vertical', { radius: rng.float(1.25, 1.55) })], centeredTarget());
    case 'ELLIPTICAL_RING':
      return wrap(id, environment, template, [ring(rng, zA, 'ellipse', { radius: rng.float(1.2, 1.5) })], centeredTarget());
    case 'RING_OFFSET_TARGET':
      return wrap(id, environment, template, [ring(rng, zA, rng.chance(0.5) ? 'horizontal' : 'vertical')], offsetTarget());
    case 'ROTOR_GATE':
      return wrap(id, environment, template, [rotorA({ bladeCount: 2, rotationSpeed: rng.float(0.42, 0.55) }), gate(rng, zB)], centeredTarget());
    case 'GATE_ROTOR':
      return wrap(id, environment, template, [gate(rng, zA), { z: zB, bladeCount: 2, rotationSpeed: rng.float(0.4, 0.52), direction: 1 }], centeredTarget());
    case 'ROTOR_IRIS':
      return wrap(id, environment, template, [rotorA({ bladeCount: 2 }), iris(rng, zB)], centeredTarget());
    case 'IRIS_ROTOR':
      return wrap(id, environment, template, [iris(rng, zA), { z: zB, bladeCount: 2, rotationSpeed: rng.float(0.4, 0.52), direction: -1 }], centeredTarget());
    case 'ROTOR_RING':
      return wrap(id, environment, template, [rotorA({ bladeCount: 2 }), ring(rng, zB, 'horizontal')], centeredTarget());
    case 'RING_ROTOR':
      return wrap(id, environment, template, [ring(rng, zA, 'horizontal'), { z: zB, bladeCount: 2, rotationSpeed: rng.float(0.4, 0.5), direction: 1 }], centeredTarget());
    case 'PENDULUM_ROTOR':
      return wrap(id, environment, template, [pendulum(rng, zA), { z: zB, bladeCount: 2, rotationSpeed: rng.float(0.4, 0.52), direction: 1 }], centeredTarget());
  }
}

function wrap(
  id: string,
  environment: EnvironmentId,
  template: ChallengeTemplateId,
  obstacles: ObstacleConfig[],
  target: ChallengeConfig['target'],
): ChallengeConfig {
  const scale = precisionTargetScale(activeTheme);
  const nextTarget =
    scale === 1
      ? target
      : {
          ...target,
          radius: Math.max(GAME_TUNING.target.minRadius, target.radius * scale),
        };
  const challenge: ChallengeConfig = {
    id,
    environment,
    template,
    difficulty: 0,
    obstacles,
    target: nextTarget,
    tags: [template.toLowerCase()],
  };
  challenge.difficulty = estimateDifficulty(challenge);
  return challenge;
}

function movingTarget(rng: SeededRng): MovementConfig {
  const vertical = rng.chance(0.35);
  if (vertical) {
    return {
      type: 'vertical',
      amplitude: rng.float(
        GAME_TUNING.movement.target.minVerticalAmplitude,
        GAME_TUNING.movement.target.maxVerticalAmplitude,
      ),
      speed: rng.float(GAME_TUNING.movement.target.minSpeed, GAME_TUNING.movement.target.maxSpeed),
      phase: rng.float(0, Math.PI * 2),
    };
  }
  return {
    type: 'horizontal',
    amplitude: rng.float(
      GAME_TUNING.movement.target.minHorizontalAmplitude,
      GAME_TUNING.movement.target.maxHorizontalAmplitude * 0.85,
    ),
    speed: rng.float(GAME_TUNING.movement.target.minSpeed, GAME_TUNING.movement.target.maxSpeed),
    phase: rng.float(0, Math.PI * 2),
  };
}

function movingRotor(rng: SeededRng): MovementConfig {
  return {
    type: rng.chance(0.18) ? 'vertical' : 'horizontal',
    amplitude: rng.float(
      GAME_TUNING.movement.rotor.minHorizontalAmplitude,
      GAME_TUNING.movement.rotor.maxHorizontalAmplitude * 0.85,
    ),
    speed: rng.float(GAME_TUNING.movement.rotor.minSpeed, GAME_TUNING.movement.rotor.maxSpeed),
    phase: rng.float(0, Math.PI * 2),
  };
}

function gate(
  rng: SeededRng,
  z: number,
  overrides: Partial<Extract<ObstacleConfig, { type: 'slidingGate' }>> = {},
): ObstacleConfig {
  return {
    type: 'slidingGate',
    z,
    openingWidth: rng.float(1.35, 2.05),
    openingHeight: rng.float(2.2, 3.2),
    baseX: rng.float(-0.2, 0.2),
    amplitude: rng.float(GAME_TUNING.gate.amplitude.min, GAME_TUNING.gate.amplitude.max * 0.85),
    speed: rng.float(GAME_TUNING.gate.speed.min, GAME_TUNING.gate.speed.max * 0.9),
    phase: rng.float(0, Math.PI * 2),
    ...overrides,
  };
}

function iris(
  rng: SeededRng,
  z: number,
  overrides: Partial<Extract<ObstacleConfig, { type: 'iris' }>> = {},
): ObstacleConfig {
  return {
    type: 'iris',
    z,
    minRadius: rng.float(0.3, 0.5),
    maxRadius: rng.float(1.5, 1.9),
    speed: rng.float(GAME_TUNING.iris.speed.min, GAME_TUNING.iris.speed.max * 0.9),
    phase: rng.float(0, Math.PI * 2),
    ...overrides,
  };
}

function pendulum(
  rng: SeededRng,
  z: number,
  overrides: Partial<Extract<ObstacleConfig, { type: 'pendulum' }>> = {},
): ObstacleConfig {
  return {
    type: 'pendulum',
    z,
    pivotX: GAME_TUNING.pendulum.pivot.x,
    pivotY: GAME_TUNING.pendulum.pivot.y,
    length: rng.float(GAME_TUNING.pendulum.length.min, GAME_TUNING.pendulum.length.max),
    blockerRadius: rng.float(GAME_TUNING.pendulum.blockerRadius.min, GAME_TUNING.pendulum.blockerRadius.max * 0.9),
    maxAngle: rng.float(GAME_TUNING.pendulum.maxAngle.min, GAME_TUNING.pendulum.maxAngle.max * 0.9),
    speed: rng.float(GAME_TUNING.pendulum.speed.min, GAME_TUNING.pendulum.speed.max * 0.9),
    phase: rng.float(0, Math.PI * 2),
    ...overrides,
  };
}

function ring(
  rng: SeededRng,
  z: number,
  movement: 'horizontal' | 'vertical' | 'ellipse',
  overrides: Partial<Extract<ObstacleConfig, { type: 'movingRing' }>> = {},
): ObstacleConfig {
  return {
    type: 'movingRing',
    z,
    radius: rng.float(1.15, 1.6),
    baseX: GAME_TUNING.ring.base.x,
    baseY: GAME_TUNING.ring.base.y,
    movement: {
      type: movement,
      amplitudeX: rng.float(GAME_TUNING.ring.amplitudeX.min, GAME_TUNING.ring.amplitudeX.max * 0.8),
      amplitudeY: rng.float(GAME_TUNING.ring.amplitudeY.min, GAME_TUNING.ring.amplitudeY.max),
      speed: rng.float(GAME_TUNING.ring.speed.min, GAME_TUNING.ring.speed.max * 0.9),
      phase: rng.float(0, Math.PI * 2),
    },
    ...overrides,
  };
}
