import type { ChallengeConfig } from '../config/ChallengeConfig';
import { isRotorConfig, obstacleTypeOf } from '../config/ObstacleConfig';
import { GAME_TUNING } from '../game/gameTuning';
import { estimateDifficulty } from './difficulty';
import { isLegalCombination } from './legalCombinations';
import { hasPlayableCorridor } from './playableCorridor';
import type { PhysicsForces } from '../projectile/physics';

export function validateChallenge(
  challenge: ChallengeConfig,
  requested: number,
  forces: PhysicsForces = {},
): string | null {
  const obstacles = challenge.obstacles;
  const allowsOpenFinale = challenge.template === 'HOME_FINALE' || Boolean(challenge.ricochet);
  if ((obstacles.length < 1 && !allowsOpenFinale) || obstacles.length > 2) {
    return 'obstacle-count';
  }

  for (let i = 1; i < obstacles.length; i += 1) {
    if (obstacles[i].z - obstacles[i - 1].z < GAME_TUNING.rotor.minZSpacing) {
      return 'z-spacing';
    }
  }

  if (!isLegalCombination(obstacles)) {
    return 'illegal-combo';
  }

  const ricochet=challenge.ricochet;
  if(ricochet){
    if(![1,2].includes(ricochet.maxBounces)||ricochet.requiredBounces<1||ricochet.requiredBounces>ricochet.maxBounces||ricochet.reflectors.length<1||ricochet.reflectors.length>2)return 'reflector-count';
    if(new Set(ricochet.reflectors.map(r=>r.id)).size!==ricochet.reflectors.length)return 'reflector-id';
    for(const r of ricochet.reflectors){
      const values=[r.width,r.height,r.position.x,r.position.y,r.position.z,r.normal.x,r.normal.y,r.normal.z];
      if(!values.every(Number.isFinite)||r.width<=GAME_TUNING.projectile.radius*2||r.height<=GAME_TUNING.projectile.radius*2||Math.hypot(r.normal.x,r.normal.y,r.normal.z)<.001)return 'reflector-shape';
    }
  }
  const target = challenge.target;
  if (target.radius < GAME_TUNING.target.minRadius) {
    return 'target-radius';
  }
  if (Math.abs(target.x) > GAME_TUNING.target.playableX) {
    return 'target-x';
  }
  if (target.y < GAME_TUNING.target.playableY.min || target.y > GAME_TUNING.target.playableY.max) {
    return 'target-y';
  }

  const targetAmp = target.movement?.amplitude ?? 0;
  if (target.movement?.type === 'horizontal' && Math.abs(target.x) + targetAmp > GAME_TUNING.target.playableX) {
    return 'target-move-x';
  }
  if (target.movement?.type === 'vertical') {
    if (target.y - targetAmp < GAME_TUNING.target.playableY.min) {
      return 'target-move-y';
    }
    if (target.y + targetAmp > GAME_TUNING.target.playableY.max) {
      return 'target-move-y';
    }
  }

  for (const obstacle of obstacles) {
    const type = obstacleTypeOf(obstacle);
    if (type === 'slidingGate' && obstacle.type === 'slidingGate') {
      if (
        obstacle.openingWidth < GAME_TUNING.gate.openingWidth.min - 0.05 ||
        obstacle.openingHeight < GAME_TUNING.gate.openingHeight.min - 0.05
      ) {
        return 'gate-opening';
      }
      if (Math.abs(obstacle.baseX) + obstacle.amplitude + obstacle.openingWidth / 2 > 3.6) {
        return 'gate-travel';
      }
      continue;
    }
    if (type === 'iris' && obstacle.type === 'iris') {
      if (obstacle.maxRadius < GAME_TUNING.projectile.radius + 0.35) {
        return 'iris-max';
      }
      if (obstacle.minRadius >= obstacle.maxRadius || obstacle.minRadius < 0.2) {
        return 'iris-range';
      }
      continue;
    }
    if (type === 'pendulum' && obstacle.type === 'pendulum') {
      if (obstacle.maxAngle < 0.45 || obstacle.blockerRadius > 0.62) {
        return 'pendulum-shape';
      }
      continue;
    }
    if (type === 'movingRing' && obstacle.type === 'movingRing') {
      if (obstacle.radius < GAME_TUNING.projectile.radius + 0.45) {
        return 'ring-opening';
      }
      if (Math.abs(obstacle.baseX) + obstacle.movement.amplitudeX > 1.7) {
        return 'ring-bounds';
      }
      continue;
    }
    if (type === 'orbiter' && obstacle.type === 'orbiter') {
      if (
        obstacle.blockerRadius <= 0 ||
        obstacle.orbitRadius <= obstacle.blockerRadius + GAME_TUNING.projectile.radius
      ) {
        return 'orbiter-shape';
      }
      continue;
    }
    if (type === 'driftingBlocker' && obstacle.type === 'driftingBlocker') {
      if (
        obstacle.blockerRadius <= 0 ||
        obstacle.blockerRadius > 0.8 ||
        Math.abs(obstacle.baseX) + Math.abs(obstacle.amplitudeX) > 2.4 ||
        Math.abs(obstacle.baseY - 3) + Math.abs(obstacle.amplitudeY) > 2.4
      ) {
        return 'drift-bounds';
      }
      continue;
    }
    if (type === 'phaseField' && obstacle.type === 'phaseField') {
      const openRatio = obstacle.openRatio ?? 0.45;
      if (
        obstacle.fieldRadius < GAME_TUNING.projectile.radius + 0.35 ||
        obstacle.speed <= 0 ||
        openRatio <= 0.15 ||
        openRatio >= 0.85
      ) {
        return 'phase-field';
      }
      continue;
    }
    if (type === 'shiftingAperture' && obstacle.type === 'shiftingAperture') {
      if (
        obstacle.minRadius < GAME_TUNING.projectile.radius + 0.05 ||
        obstacle.maxRadius <= obstacle.minRadius ||
        obstacle.shiftAmplitude > 1.25
      ) {
        return 'aperture-range';
      }
      continue;
    }
    if (type === 'laserGrid' && obstacle.type === 'laserGrid') {
      const beamCount = obstacle.beamCount ?? 4;
      const amplitude = obstacle.amplitude ?? 0.2;
      const minimumGap =
        obstacle.spacing - amplitude * 2 - obstacle.thickness * 2;
      if (
        beamCount < 2 ||
        beamCount > 12 ||
        (obstacle.speed ?? 0) <= 0 ||
        amplitude < 0 ||
        minimumGap < GAME_TUNING.projectile.radius * 2 + 0.06 ||
        obstacle.span < 2 ||
        (obstacle.mode === 'pulse' && (obstacle.pulseSpeed ?? 0) <= 0)
      ) {
        return 'laser-layout';
      }
      const onRatio = obstacle.onRatio ?? 0.55;
      if (onRatio <= 0.15 || onRatio >= 0.85) {
        return 'laser-pulse';
      }
      continue;
    }
    if (!isRotorConfig(obstacle)) {
      return 'unknown-obstacle';
    }
    if (obstacle.bladeCount < 1 || obstacle.bladeCount > 4) {
      return 'blade-count';
    }
    if (obstacle.rotationSpeed > GAME_TUNING.difficulty.maxRotorSpeed) {
      return 'rotor-speed';
    }
    const amp = obstacle.movement?.amplitude ?? 0;
    if (amp > GAME_TUNING.movement.rotor.maxHorizontalAmplitude + 0.01) {
      return 'rotor-amplitude';
    }
  }

  const rotors = obstacles.filter(isRotorConfig);
  const hasFour = rotors.some((rotor) => rotor.bladeCount >= 4);
  const hasMaxSpeed = rotors.some(
    (rotor) => rotor.rotationSpeed >= GAME_TUNING.difficulty.maxRotorSpeed - 0.05,
  );
  const hasBigMove = rotors.some((rotor) => (rotor.movement?.amplitude ?? 0) > 0.85);
  const tinyMoving =
    target.radius < 0.85 && !!target.movement && target.movement.type !== 'none';
  if (hasFour && hasMaxSpeed && hasBigMove && tinyMoving && obstacles.length > 1) {
    return 'combo-unfair';
  }

  if (!hasPlayableCorridor(challenge, forces)) {
    return 'no-corridor';
  }

  const estimated = estimateDifficulty(challenge);
  if (estimated > requested + GAME_TUNING.difficulty.tolerance) {
    return 'over-budget';
  }

  return null;
}
