import type { ChallengeConfig } from '../config/ChallengeConfig';
import type { ObstacleConfig } from '../config/ObstacleConfig';
import { isRotorConfig, obstacleTypeOf } from '../config/ObstacleConfig';
import { GAME_TUNING } from '../game/gameTuning';
import {
  evaluateGateCollision,
  evaluateIrisCollision,
  evaluatePendulumCollision,
  evaluateRingCollision,
  evaluateRotorCollision,
} from '../obstacles/ObstacleCollision';
import { irisRadiusAt } from '../obstacles/IrisObstacle';
import { pendulumPose } from '../obstacles/PendulumObstacle';
import { ringPosition } from '../obstacles/MovingRingObstacle';

const MIN_HUB_CLEARANCE = 0.08;
const MIN_TARGET_MARGIN = 0.05;

export function hasPlayableCorridor(challenge: ChallengeConfig): boolean {
  const start = GAME_TUNING.projectile.startPosition;
  const gravity = GAME_TUNING.gravity;
  const ball = GAME_TUNING.projectile.radius;
  const obstacles = challenge.obstacles;
  const target = challenge.target;

  for (let vz = GAME_TUNING.projectile.minForwardVelocity; vz <= GAME_TUNING.projectile.maxForwardVelocity; vz += 0.5) {
    for (let vx = -GAME_TUNING.projectile.maxHorizontalVelocity; vx <= GAME_TUNING.projectile.maxHorizontalVelocity; vx += 0.35) {
      for (
        let vy = GAME_TUNING.projectile.baseVerticalVelocity - 1.2;
        vy <= GAME_TUNING.projectile.baseVerticalVelocity + GAME_TUNING.projectile.maxVerticalVelocity;
        vy += 0.4
      ) {
        if (shotClearsCourse(start, { vx, vy, vz }, gravity, ball, obstacles, target)) {
          return true;
        }
      }
    }
  }
  return false;
}

function shotClearsCourse(
  start: { x: number; y: number; z: number },
  velocity: { vx: number; vy: number; vz: number },
  gravity: number,
  ball: number,
  obstacles: ObstacleConfig[],
  target: ChallengeConfig['target'],
): boolean {
  for (const obstacle of obstacles) {
    const t = (obstacle.z - start.z) / velocity.vz;
    if (t <= 0) {
      return false;
    }
    const x = start.x + velocity.vx * t;
    const y = start.y + velocity.vy * t - 0.5 * gravity * t * t;
    if (!clearsObstacle(obstacle, x, y, ball, t)) {
      return false;
    }
  }

  const targetZ = target.z ?? GAME_TUNING.target.z;
  const t = (targetZ - start.z) / velocity.vz;
  const x = start.x + velocity.vx * t;
  const y = start.y + velocity.vy * t - 0.5 * gravity * t * t;
  const distance = Math.hypot(x - target.x, y - target.y);
  return distance <= target.radius - MIN_TARGET_MARGIN;
}

function clearsObstacle(
  obstacle: ObstacleConfig,
  x: number,
  y: number,
  ball: number,
  arrivalTime: number,
): boolean {
  const type = obstacleTypeOf(obstacle);
  if (type === 'slidingGate' && obstacle.type === 'slidingGate') {
    const openingX =
      obstacle.baseX +
      Math.sin(arrivalTime * obstacle.speed + (obstacle.phase ?? 0)) * obstacle.amplitude;
    const result = evaluateGateCollision(
      x,
      y,
      ball,
      openingX,
      obstacle.baseY ?? GAME_TUNING.gate.baseY,
      obstacle.openingWidth,
      obstacle.openingHeight,
    );
    return !result.hit && result.clearance >= 0.05;
  }
  if (type === 'iris' && obstacle.type === 'iris') {
    const radius = irisRadiusAt(obstacle, arrivalTime);
    const result = evaluateIrisCollision(
      x,
      y,
      ball,
      obstacle.centerX ?? GAME_TUNING.iris.center.x,
      obstacle.centerY ?? GAME_TUNING.iris.center.y,
      radius,
    );
    return !result.hit && result.clearance >= 0.05;
  }
  if (type === 'pendulum' && obstacle.type === 'pendulum') {
    const pose = pendulumPose(obstacle, arrivalTime);
    const result = evaluatePendulumCollision(
      x,
      y,
      ball,
      obstacle.pivotX,
      obstacle.pivotY,
      pose.blockerX,
      pose.blockerY,
      obstacle.blockerRadius,
      GAME_TUNING.pendulum.armRadius,
    );
    return !result.hit && result.clearance >= 0.04;
  }
  if (type === 'movingRing' && obstacle.type === 'movingRing') {
    const pos = ringPosition(obstacle, arrivalTime);
    const result = evaluateRingCollision(x, y, ball, pos.x, pos.y, obstacle.radius);
    return !result.hit && result.clearance >= 0.05;
  }
  if (type === 'laserGrid' && obstacle.type === 'laserGrid') {
    const cx = obstacle.centerX ?? 0;
    const cy = obstacle.centerY ?? 3;
    const half = obstacle.openingSize / 2;
    if (obstacle.mode === 'pulse') {
      // Pulsing grids are fair if a clear center throw exists while on, or any throw while off.
      return Math.abs(x - cx) <= half - ball - 0.05 && Math.abs(y - cy) <= half - ball - 0.05;
    }
    if (obstacle.orientation === 'vertical') {
      return Math.abs(x - cx) <= half - ball - 0.05;
    }
    if (obstacle.orientation === 'horizontal') {
      return Math.abs(y - cy) <= half - ball - 0.05;
    }
    return Math.abs(x - cx) <= half - ball - 0.05 && Math.abs(y - cy) <= half - ball - 0.05;
  }
  if (!isRotorConfig(obstacle)) {
    return true;
  }
  const cx = GAME_TUNING.rotor.center.x;
  const cy = GAME_TUNING.rotor.center.y;
  const dist = Math.hypot(x - cx, y - cy);
  if (dist < GAME_TUNING.rotor.hubRadius + ball + MIN_HUB_CLEARANCE) {
    return false;
  }
  const inner = GAME_TUNING.rotor.radius - GAME_TUNING.rotor.ringThickness - ball;
  if (dist > inner - 0.04) {
    return false;
  }
  return clearsSomeBladePhase(x, y, obstacle.bladeCount, cx, cy, ball);
}

function clearsSomeBladePhase(
  x: number,
  y: number,
  bladeCount: number,
  cx: number,
  cy: number,
  ball: number,
): boolean {
  const steps = bladeCount * 8;
  for (let i = 0; i < steps; i += 1) {
    const angle = (i / steps) * Math.PI * 2;
    const result = evaluateRotorCollision(x, y, ball, angle, bladeCount, cx, cy);
    if (!result.hit && result.clearance >= 0.06) {
      return true;
    }
  }
  return false;
}
