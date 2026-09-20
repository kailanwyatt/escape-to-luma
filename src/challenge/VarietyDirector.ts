import type { ChallengeConfig, ChallengeTemplateId } from '../config/ChallengeConfig';
import type { ObstacleType } from '../config/ObstacleConfig';
import { obstacleTypeOf } from '../config/ObstacleConfig';
import type { SeededRng } from '../utils/SeededRng';

const TEMPLATE_PRIMARY: Record<ChallengeTemplateId, ObstacleType> = {
  BASIC_ROTOR: 'rotor',
  FAST_ROTOR: 'rotor',
  REVERSE_ROTOR: 'rotor',
  PULSE_ROTOR: 'rotor',
  OFFSET_TARGET: 'rotor',
  MOVING_TARGET: 'rotor',
  MOVING_ROTOR: 'rotor',
  MOVING_ROTOR_OFFSET_TARGET: 'rotor',
  DUAL_ROTOR: 'rotor',
  DUAL_COUNTER_ROTATION: 'rotor',
  DUAL_DIFFERENT_SPEED: 'rotor',
  DUAL_ROTOR_MOVING_TARGET: 'rotor',
  BASIC_GATE: 'slidingGate',
  MOVING_GATE: 'slidingGate',
  GATE_OFFSET_TARGET: 'slidingGate',
  BASIC_IRIS: 'iris',
  FAST_IRIS: 'iris',
  IRIS_OFFSET_TARGET: 'iris',
  BASIC_PENDULUM: 'pendulum',
  WIDE_PENDULUM: 'pendulum',
  PENDULUM_OFFSET_TARGET: 'pendulum',
  BASIC_RING: 'movingRing',
  VERTICAL_RING: 'movingRing',
  ELLIPTICAL_RING: 'movingRing',
  RING_OFFSET_TARGET: 'movingRing',
  ROTOR_GATE: 'rotor',
  GATE_ROTOR: 'slidingGate',
  ROTOR_IRIS: 'rotor',
  IRIS_ROTOR: 'iris',
  ROTOR_RING: 'rotor',
  RING_ROTOR: 'movingRing',
  PENDULUM_ROTOR: 'pendulum',
  BASIC_ORBITER: 'orbiter',
  DRIFT_BLOCKER: 'driftingBlocker',
  PHASE_FIELD: 'phaseField',
  SHIFTING_APERTURE: 'shiftingAperture',
  LASER_VERTICAL: 'laserGrid',
  LASER_HORIZONTAL: 'laserGrid',
  LASER_PULSE: 'laserGrid',
  LASER_CROSS: 'laserGrid',
  GRAVITY_WELL: 'orbiter',
  COMBINED_HAZARD: 'rotor',
  HOME_APPROACH: 'iris',
  HOME_FINALE: 'iris',
};

export function primaryTypeForTemplate(template: ChallengeTemplateId): ObstacleType {
  return TEMPLATE_PRIMARY[template];
}

export function primaryTypeForChallenge(challenge: ChallengeConfig): ObstacleType {
  if (challenge.obstacles.length === 0) {
    return primaryTypeForTemplate(challenge.template);
  }
  return obstacleTypeOf(challenge.obstacles[0]);
}

export function rememberTypes(recent: ObstacleType[], next: ObstacleType, limit = 5): ObstacleType[] {
  return [...recent, next].slice(-limit);
}

export function applyVariety(
  rng: SeededRng,
  templates: ChallengeTemplateId[],
  recent: ObstacleType[],
  avoidRepeat: boolean,
): ChallengeTemplateId[] {
  if (templates.length === 0) {
    return templates;
  }
  const last = recent[recent.length - 1];
  const lastTwoSame = recent.length >= 2 && recent[recent.length - 1] === recent[recent.length - 2];
  let filtered = templates;
  if (avoidRepeat && lastTwoSame && last) {
    const without = templates.filter((template) => primaryTypeForTemplate(template) !== last);
    if (without.length > 0) {
      filtered = without;
    }
  } else if (avoidRepeat && last && rng.chance(0.55)) {
    const without = templates.filter((template) => primaryTypeForTemplate(template) !== last);
    if (without.length > 0) {
      filtered = without;
    }
  }
  return filtered;
}
