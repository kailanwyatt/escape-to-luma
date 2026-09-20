import type { ChallengeConfig, ChallengeTemplateId } from '../config/ChallengeConfig';
import { isRotorConfig, obstacleTypeOf } from '../config/ObstacleConfig';
import { GAME_TUNING } from '../game/gameTuning';

const costs = GAME_TUNING.difficulty.costs;

export function requestedDifficulty(challengeNumber: number, loopBonus = 0): number {
  let base = 2;
  if (challengeNumber <= 5) {
    base = 1 + (challengeNumber > 3 ? 1 : 0);
  } else if (challengeNumber <= 10) {
    base = 2 + (challengeNumber > 8 ? 1 : 0);
  } else if (challengeNumber <= 20) {
    base = 3 + Math.floor((challengeNumber - 11) / 5);
  } else if (challengeNumber <= 30) {
    base = 4 + Math.floor((challengeNumber - 21) / 5);
  } else if (challengeNumber <= 50) {
    base = 5 + Math.floor((challengeNumber - 31) / 7);
  } else {
    base = 6 + Math.min(4, Math.floor((challengeNumber - 51) / 10));
  }
  return Math.min(10, base + loopBonus);
}

export function estimateDifficulty(challenge: ChallengeConfig): number {
  let total = 0;
  const obstacles = challenge.obstacles;
  for (const obstacle of obstacles) {
    const type = obstacleTypeOf(obstacle);
    if (type === 'slidingGate') {
      total += costs.slidingGate;
      if (obstacle.type === 'slidingGate') {
        if (obstacle.speed >= 0.65) {
          total += costs.fastMovement;
        }
        if (obstacle.openingWidth <= 1.45) {
          total += costs.smallOpening;
        }
      }
      continue;
    }
    if (type === 'iris') {
      total += costs.iris;
      if (obstacle.type === 'iris') {
        if (obstacle.speed >= 1.15) {
          total += costs.fastMovement;
        }
        if (obstacle.minRadius <= 0.35) {
          total += costs.smallOpening;
        }
      }
      continue;
    }
    if (type === 'pendulum') {
      total += costs.pendulum;
      if (obstacle.type === 'pendulum') {
        if (obstacle.speed >= 1.0) {
          total += costs.fastMovement;
        }
        if (obstacle.blockerRadius >= 0.45) {
          total += costs.smallOpening;
        }
      }
      continue;
    }
    if (type === 'movingRing') {
      total += costs.movingRing;
      if (obstacle.type === 'movingRing') {
        if (obstacle.movement.speed >= 0.65) {
          total += costs.fastMovement;
        }
        if (obstacle.radius <= 1.15) {
          total += costs.smallOpening;
        }
      }
      continue;
    }
    if (type === 'orbiter') {
      total += costs.orbiter;
      if (obstacle.type === 'orbiter' && obstacle.speed >= 0.8) {
        total += costs.fastMovement;
      }
      continue;
    }
    if (type === 'driftingBlocker') {
      total += costs.driftingBlocker;
      if (obstacle.type === 'driftingBlocker' && obstacle.speed >= 0.7) {
        total += costs.fastMovement;
      }
      continue;
    }
    if (type === 'phaseField') {
      total += costs.phaseField;
      if (obstacle.type === 'phaseField' && (obstacle.openRatio ?? 0.45) < 0.4) {
        total += costs.smallOpening;
      }
      continue;
    }
    if (type === 'shiftingAperture') {
      total += costs.shiftingAperture;
      if (obstacle.type === 'shiftingAperture' && obstacle.maxRadius <= 1.15) {
        total += costs.smallOpening;
      }
      continue;
    }
    if (type === 'laserGrid') {
      total += costs.laserGrid;
      if (obstacle.type === 'laserGrid') {
        if (obstacle.mode === 'pulse') {
          total += costs.fastMovement;
        }
        if (obstacle.orientation === 'both' || obstacle.openingSize <= 1.25) {
          total += costs.smallOpening;
        }
      }
      continue;
    }

    if (!isRotorConfig(obstacle)) {
      continue;
    }
    if (obstacle.bladeCount >= 4) {
      total += costs.blades4;
    } else if (obstacle.bladeCount === 3) {
      total += costs.blades3;
    } else {
      total += costs.blades2;
    }

    if (obstacle.rotationSpeed >= GAME_TUNING.difficulty.highSpeed) {
      total += costs.highSpeed;
    } else if (obstacle.rotationSpeed >= GAME_TUNING.difficulty.moderateSpeed) {
      total += costs.moderateSpeed;
    }

    if (obstacle.reverseInterval) {
      total += costs.reverse;
    }
    if (obstacle.speedPulse) {
      total += costs.pulse;
    }
    if (obstacle.movement && obstacle.movement.type !== 'none') {
      total += costs.movingRotor;
    }
  }

  if (obstacles.length >= 2) {
    total += costs.secondRotor;
    if (
      isRotorConfig(obstacles[0]) &&
      isRotorConfig(obstacles[1]) &&
      obstacles[0].direction !== obstacles[1].direction
    ) {
      total += costs.counterRotation;
    }
  }

  const target = challenge.target;
  if (Math.abs(target.x) > 0.35 || Math.abs(target.y - 3) > 0.2) {
    total += costs.offsetTarget;
  }
  if (target.radius < 0.95) {
    total += costs.smallTarget;
  }
  if (target.movement && target.movement.type !== 'none') {
    total += costs.movingTarget;
  }

  return total;
}

export function templatesForDifficulty(difficulty: number): ChallengeTemplateId[] {
  return templatesForRun(20, difficulty);
}

export function templatesForRun(challengeNumber: number, difficulty: number): ChallengeTemplateId[] {
  const families = unlockedFamilies(challengeNumber);
  const mixed = challengeNumber >= 36;
  const templates: ChallengeTemplateId[] = [];

  if (families.includes('rotor')) {
    templates.push('BASIC_ROTOR', 'OFFSET_TARGET');
    if (difficulty >= 2) {
      templates.push('FAST_ROTOR', 'REVERSE_ROTOR', 'PULSE_ROTOR');
    }
    if (difficulty >= 3) {
      templates.push('MOVING_TARGET', 'MOVING_ROTOR');
    }
    if (difficulty >= 4) {
      templates.push('MOVING_ROTOR_OFFSET_TARGET');
    }
  }
  if (families.includes('slidingGate')) {
    templates.push('BASIC_GATE', 'MOVING_GATE');
    if (difficulty >= 3) {
      templates.push('GATE_OFFSET_TARGET');
    }
  }
  if (families.includes('iris')) {
    templates.push('BASIC_IRIS');
    if (difficulty >= 3) {
      templates.push('FAST_IRIS', 'IRIS_OFFSET_TARGET');
    }
  }
  if (families.includes('pendulum')) {
    templates.push('BASIC_PENDULUM');
    if (difficulty >= 3) {
      templates.push('WIDE_PENDULUM', 'PENDULUM_OFFSET_TARGET');
    }
  }
  if (families.includes('movingRing')) {
    templates.push('BASIC_RING');
    if (challengeNumber >= 23) {
      templates.push('VERTICAL_RING');
    }
    if (challengeNumber >= 26) {
      templates.push('ELLIPTICAL_RING', 'RING_OFFSET_TARGET');
    }
  }

  if (mixed && difficulty >= 5) {
    templates.push(
      'DUAL_ROTOR',
      'ROTOR_GATE',
      'GATE_ROTOR',
      'ROTOR_IRIS',
      'IRIS_ROTOR',
      'ROTOR_RING',
      'RING_ROTOR',
      'PENDULUM_ROTOR',
    );
  }
  if (mixed && difficulty >= 6) {
    templates.push('DUAL_COUNTER_ROTATION', 'DUAL_DIFFERENT_SPEED', 'DUAL_ROTOR_MOVING_TARGET');
  }

  return templates.length > 0 ? templates : ['BASIC_ROTOR'];
}

export function unlockedFamilies(challengeNumber: number): Array<
  'rotor' | 'slidingGate' | 'iris' | 'pendulum' | 'movingRing'
> {
  const families: Array<'rotor' | 'slidingGate' | 'iris' | 'pendulum' | 'movingRing'> = ['rotor'];
  if (challengeNumber >= 6) {
    families.push('slidingGate');
  }
  if (challengeNumber >= 11) {
    families.push('iris');
  }
  if (challengeNumber >= 16) {
    families.push('pendulum');
  }
  if (challengeNumber >= 21) {
    families.push('movingRing');
  }
  return families;
}
