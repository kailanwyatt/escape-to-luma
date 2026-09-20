import { GAME_TUNING } from '../game/gameTuning';
import type { ShotResultKind } from '../game/GameState';
import type { ObstacleHitPart } from '../obstacles/ObstacleCollision';
import type { ObstacleSlot } from '../obstacles/ObstacleSlot';
import { scoreTarget } from '../target/TargetScoring';
import { distanceToTarget } from '../target/TargetCollision';
import type { Target } from '../target/Target';
import { integrateMotion, type PhysicsForces } from '../projectile/physics';

export type Vec3 = { x: number; y: number; z: number };
export type Velocity = { vx: number; vy: number; vz: number };

export type RotorArrivalPrediction = {
  id: 'A' | 'B';
  active: boolean;
  time: number;
  z: number;
  type: string;
  analytic: { x: number; y: number };
  simulated: { x: number; y: number };
  current: { x: number; y: number; angle: number };
  predicted: { x: number; y: number; angle: number; openingRadius: number; extra: string };
  verdict: 'HIT' | 'CLEAR' | '-';
  hitPart: ObstacleHitPart | null;
  clearance: number;
};

export type TargetArrivalPrediction = {
  time: number;
  analytic: { x: number; y: number };
  simulated: { x: number; y: number };
  target: { x: number; y: number };
  distance: number;
  radius: number;
  projectileRadius: number;
  verdict: ShotResultKind;
  edgeWouldHit: boolean;
};

export type ShotPrediction = {
  vz: number;
  rotors: [RotorArrivalPrediction, RotorArrivalPrediction];
  target: TargetArrivalPrediction;
  path: Vec3[];
  analyticVsSimMaxY: number;
};

export type TargetMissReport = {
  predictedX: number;
  predictedY: number;
  actualX: number;
  actualY: number;
  targetX: number;
  targetY: number;
  distance: number;
  targetRadius: number;
  projectileRadius: number;
  edgeOverlap: number;
  centerRuleMiss: boolean;
  edgeWouldHit: boolean;
};

export function analyticPosition(start: Vec3, velocity: Velocity, t: number): Vec3 {
  const g = GAME_TUNING.gravity;
  return {
    x: start.x + velocity.vx * t,
    y: start.y + velocity.vy * t - 0.5 * g * t * t,
    z: start.z + velocity.vz * t,
  };
}

export function simulateToZ(
  start: Vec3,
  velocity: Velocity,
  planeZ: number,
  dt = 1 / 60,
  forces: PhysicsForces = {},
): { x: number; y: number; z: number; time: number } | null {
  if (velocity.vz <= 0.001 || start.z >= planeZ) {
    return null;
  }
  const state = { ...start, ...velocity };
  let prevX = state.x;
  let prevY = state.y;
  let prevZ = state.z;
  let time = 0;
  while (state.z < planeZ && time < GAME_TUNING.projectile.maxFlightTime) {
    prevX = state.x;
    prevY = state.y;
    prevZ = state.z;
    integrateMotion(state, dt, forces);
    time += dt;
  }
  const span = state.z - prevZ;
  const u = span === 0 ? 1 : (planeZ - prevZ) / span;
  return {
    x: prevX + (state.x - prevX) * u,
    y: prevY + (state.y - prevY) * u,
    z: planeZ,
    time: time - dt + u * dt,
  };
}

export function predictShot(
  start: Vec3,
  velocity: Velocity,
  obstacles: ObstacleSlot[],
  target: Target,
  simTime: number,
  obstacleTimeScale = 1,
  forces: PhysicsForces = {},
): ShotPrediction {
  const projectileRadius = GAME_TUNING.projectile.radius;
  const rotors = [0, 1].map((index) => {
    const id: 'A' | 'B' = index === 0 ? 'A' : 'B';
    const obstacle = obstacles[index];
    if (!obstacle?.active) {
      return emptyRotor(id);
    }
    const analyticT = (obstacle.z - start.z) / Math.max(0.001, velocity.vz);
    const analytic = analyticPosition(start, velocity, analyticT);
    const simulated = simulateToZ(start, velocity, obstacle.z, 1 / 120, forces);
    const time = simulated?.time ?? analyticT;
    const predicted = obstacle.predictState(time * obstacleTimeScale, simTime);
    const at = simulated ?? analytic;
    const collision = obstacle.evaluateAt(at.x, at.y, projectileRadius, predicted);
    const debug = obstacle.getDebugInfo();
    return {
      id,
      active: true,
      time,
      z: obstacle.z,
      type: obstacle.type,
      analytic: { x: analytic.x, y: analytic.y },
      simulated: { x: at.x, y: at.y },
      current: {
        x: debug.x,
        y: debug.y,
        angle: debug.angle,
      },
      predicted: {
        x: predicted.x,
        y: predicted.y,
        angle: predicted.angle,
        openingRadius: predicted.openingRadius,
        extra: debug.extra,
      },
      verdict: collision.hit ? 'HIT' : 'CLEAR',
      hitPart: collision.hit,
      clearance: collision.clearance,
    } satisfies RotorArrivalPrediction;
  }) as [RotorArrivalPrediction, RotorArrivalPrediction];

  const analyticT = (target.z - start.z) / Math.max(0.001, velocity.vz);
  const analytic = analyticPosition(start, velocity, analyticT);
  const simulated = simulateToZ(start, velocity, target.z, 1 / 120, forces);
  const time = simulated?.time ?? analyticT;
  const at = simulated ?? analytic;
  const futureTarget = target.predictPosition(simTime + time);
  const distance = distanceToTarget(at.x, at.y, futureTarget.x, futureTarget.y);
  const scored = scoreTarget(distance, target.radius);

  const path: Vec3[] = [];
  const samples = 32;
  const pathState = { ...start, ...velocity };
  const pathDt = analyticT / samples;
  for (let i = 1; i <= samples; i += 1) {
    integrateMotion(pathState, pathDt, forces);
    path.push({ x: pathState.x, y: pathState.y, z: pathState.z });
  }

  let analyticVsSimMaxY = 0;
  for (const rotor of rotors) {
    if (rotor.active) {
      analyticVsSimMaxY = Math.max(
        analyticVsSimMaxY,
        Math.abs(rotor.analytic.y - rotor.simulated.y),
      );
    }
  }
  analyticVsSimMaxY = Math.max(analyticVsSimMaxY, Math.abs(analytic.y - at.y));

  return {
    vz: velocity.vz,
    rotors,
    target: {
      time,
      analytic: { x: analytic.x, y: analytic.y },
      simulated: { x: at.x, y: at.y },
      target: futureTarget,
      distance,
      radius: target.radius,
      projectileRadius,
      verdict: scored.kind,
      edgeWouldHit: distance <= target.radius + projectileRadius,
    },
    path,
    analyticVsSimMaxY,
  };
}

export function makeTargetMissReport(
  prediction: ShotPrediction | null,
  actual: { x: number; y: number },
  target: { x: number; y: number },
  targetRadius: number,
): TargetMissReport {
  const projectileRadius = GAME_TUNING.projectile.radius;
  const predicted = prediction?.target.simulated ?? actual;
  const distance = distanceToTarget(actual.x, actual.y, target.x, target.y);
  return {
    predictedX: predicted.x,
    predictedY: predicted.y,
    actualX: actual.x,
    actualY: actual.y,
    targetX: target.x,
    targetY: target.y,
    distance,
    targetRadius,
    projectileRadius,
    edgeOverlap: targetRadius + projectileRadius - distance,
    centerRuleMiss: distance > targetRadius,
    edgeWouldHit: distance <= targetRadius + projectileRadius,
  };
}

function emptyRotor(id: 'A' | 'B'): RotorArrivalPrediction {
  return {
    id,
    active: false,
    time: 0,
    z: 0,
    type: '-',
    analytic: { x: 0, y: 0 },
    simulated: { x: 0, y: 0 },
    current: { x: 0, y: 0, angle: 0 },
    predicted: { x: 0, y: 0, angle: 0, openingRadius: 0, extra: '-' },
    verdict: '-',
    hitPart: null,
    clearance: 0,
  };
}
