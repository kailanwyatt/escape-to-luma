import {gateStateAtTime} from '../obstacles/RapidShutterState';
import {traceRicochet} from '../reflectors/RicochetTrace';
import {AimSystem} from '../projectile/AimSystem';
import {evaluateFormation} from '../obstacles/FormationState';
import type { ChallengeConfig } from '../config/ChallengeConfig';
import { sampleMovement } from '../config/MovementConfig';
import type { ObstacleConfig } from '../config/ObstacleConfig';
import { isRotorConfig, obstacleTypeOf } from '../config/ObstacleConfig';
import { GAME_TUNING } from '../game/gameTuning';
import {
  evaluateBlockerCollision,
  evaluateGateCollision,
  evaluateBreachCollision,
  evaluateIrisCollision,
  evaluateLaserCollision,
  evaluatePendulumCollision,
  evaluatePhaseCollision,
  evaluateRingCollision,
  evaluateRotorCollision,
  lasersOnAt,
} from '../obstacles/ObstacleCollision';
import { laserBeamsAtTime } from '../obstacles/LaserGridAnimation';
import { driftPosition } from '../obstacles/DriftingBlockerObstacle';
import { irisRadiusAt } from '../obstacles/IrisObstacle';
import { pendulumPose } from '../obstacles/PendulumObstacle';
import { ringPosition } from '../obstacles/MovingRingObstacle';
import { orbiterPosition } from '../obstacles/OrbiterObstacle';
import { phaseOpen } from '../obstacles/PhaseFieldObstacle';
import { apertureState } from '../obstacles/ShiftingApertureObstacle';
import { evaluateClockHandsCollision } from '../obstacles/ClockHandsState';
import { evaluateElevatorBlocksCollision } from '../obstacles/ElevatorBlocksState';
import { evaluatePistonFieldCollision } from '../obstacles/PistonFieldState';
import { evaluatePulseRingCollision } from '../obstacles/PulseRingState';
import { evaluateScissorGateCollision } from '../obstacles/ScissorGateState';
import { evaluateSpeedFieldCollision } from '../obstacles/SpeedFieldState';
import {
  evaluateCometCrossingCollision,
  evaluateConveyorGateCollision,
  evaluateCorkscrewCollision,
  evaluateReactiveGateCollision,
  evaluateRollingApertureCollision,
  evaluateSplitShutterCollision,
} from '../obstacles/ExtendedLibraryState';
import {
  evaluateAccretionCollision,
  evaluateEntryExitCollision,
  evaluateLagrangeNullCollision,
  evaluateMagnetopauseCollision,
  evaluateMovingSafeZoneCollision,
  evaluateOrbitingMoonsCollision,
  evaluatePulsarBeamCollision,
  evaluateSequentialTunnelCollision,
  evaluateSolarSailCollision,
  evaluateTeleportPortalCollision,
  evaluateTheNullCollision,
} from '../obstacles/StoryLibraryState';
import { integrateMotion, type PhysicsForces } from '../projectile/physics';

const MIN_HUB_CLEARANCE = 0.08;
const MIN_TARGET_MARGIN = 0.05;

export function hasPlayableCorridor(
  challenge: ChallengeConfig,
  forces: PhysicsForces = {},
): boolean {
  if(challenge.ricochet){
    const aim=new AimSystem();
    for(const x of [-.22,.22,-.24,.24,-.2,.2,-.18,.18,-.26,.26,-.19,.19,-.21,.21,-.25,.25])for(const y of [0,.025,-.025]){
      aim.begin(195,600);aim.move(195+x*390,600+y*844);
      const trace=traceRicochet({...GAME_TUNING.projectile.startPosition,...aim.end()},challenge.ricochet,challenge.target.z??12,0,forces,(a,b,clock,dt)=>{
        for(const o of challenge.obstacles){if((a.z-o.z)*(b.z-o.z)>0||a.z===b.z)continue;const u=(o.z-a.z)/(b.z-a.z);if(u<0||u>1)continue;
          if(!clearsObstacle(o,a.x+(b.x-a.x)*u,a.y+(b.y-a.y)*u,GAME_TUNING.projectile.radius,clock+u*dt))return false;
        }return true;
      });
      if(trace.arrival&&trace.bounces.length>=challenge.ricochet.requiredBounces&&Math.hypot(trace.arrival.x-challenge.target.x,trace.arrival.y-challenge.target.y)<challenge.target.radius-.05)return true;
    }return false;
  }
  const start = GAME_TUNING.projectile.startPosition;
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
        if (shotClearsCourse(start, { vx, vy, vz }, forces, ball, obstacles, target)) {
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
  forces: PhysicsForces,
  ball: number,
  obstacles: ObstacleConfig[],
  target: ChallengeConfig['target'],
): boolean {

  const targetZ = target.z ?? GAME_TUNING.target.z;
  const at = simulateToPlane(start, velocity, targetZ, forces);
  if (!at) {
    return false;
  }
  const distance = Math.hypot(at.x - target.x, at.y - target.y);
  if (distance > target.radius + (target.movement?.amplitude ?? 0) - MIN_TARGET_MARGIN) return false;
  const crossings = obstacles.map(obstacle => ({obstacle, at: simulateToPlane(start, velocity, obstacle.z, forces)}));
  // Timing courses must be tested after waiting too, not only at launch time zero.
  // Use one shared clock offset for the entire route so paired gates stay synchronized.
  for (let delay = 0; delay <= 12; delay += .2) {
    if (!crossings.every(({obstacle, at}) => at && clearsObstacle(obstacle, at.x, at.y, ball, at.time + delay))) continue;
    const tx = target.movement?.type === 'horizontal' ? sampleMovement(target.movement, target.x, at.time + delay) : target.x;
    const ty = target.movement?.type === 'vertical' ? sampleMovement(target.movement, target.y, at.time + delay) : target.y;
    if (Math.hypot(at.x-tx,at.y-ty) <= target.radius-MIN_TARGET_MARGIN) return true;
  }
  return false;
}

function simulateToPlane(
  start: { x: number; y: number; z: number },
  velocity: { vx: number; vy: number; vz: number },
  planeZ: number,
  forces: PhysicsForces,
): { x: number; y: number; time: number } | null {
  if (velocity.vz <= 0.001 || start.z >= planeZ) {
    return null;
  }
  const state = { ...start, ...velocity };
  const dt = 1 / 90;
  let previous = { x: state.x, y: state.y, z: state.z };
  let time = 0;
  while (state.z < planeZ && time < GAME_TUNING.projectile.maxFlightTime) {
    previous = { x: state.x, y: state.y, z: state.z };
    integrateMotion(state, dt, forces);
    time += dt;
  }
  const span = state.z - previous.z;
  const u = span === 0 ? 1 : (planeZ - previous.z) / span;
  return {
    x: previous.x + (state.x - previous.x) * u,
    y: previous.y + (state.y - previous.y) * u,
    time: time - dt + u * dt,
  };
}

function clearsObstacle(
  obstacle: ObstacleConfig,
  x: number,
  y: number,
  ball: number,
  arrivalTime: number,
): boolean {
  if(obstacle.type==='formation')return !evaluateFormation(obstacle,arrivalTime,x,y,ball).hit;
  const type = obstacleTypeOf(obstacle);
  if (type === 'slidingGate' && obstacle.type === 'slidingGate') {
    const gate = gateStateAtTime(obstacle, arrivalTime);
    const result = (obstacle.appearance === 'containmentGlass' ? evaluateBreachCollision : evaluateGateCollision)(
      x, y, ball, gate.x, gate.y, gate.width, gate.height,
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
    const beams = laserBeamsAtTime(obstacle, arrivalTime);
    const on =
      obstacle.mode !== 'pulse' ||
      lasersOnAt(
        arrivalTime,
        obstacle.pulseSpeed ?? 0.6,
        obstacle.phase ?? 0,
        obstacle.onRatio ?? 0.55,
      );
    const result = evaluateLaserCollision(x, y, ball, beams, on);
    return !result.hit && result.clearance >= 0.04;
  }
  if (type === 'orbiter' && obstacle.type === 'orbiter') {
    const pos = orbiterPosition(obstacle, arrivalTime);
    const result = evaluateBlockerCollision(
      x,
      y,
      ball,
      pos.x,
      pos.y,
      obstacle.blockerRadius,
      'orbiter',
    );
    return !result.hit && result.clearance >= 0.04;
  }
  if (type === 'driftingBlocker' && obstacle.type === 'driftingBlocker') {
    const pos = driftPosition(obstacle, arrivalTime);
    const result = evaluateBlockerCollision(
      x,
      y,
      ball,
      pos.x,
      pos.y,
      obstacle.blockerRadius,
      'drift',
    );
    return !result.hit && result.clearance >= 0.04;
  }
  if (type === 'phaseField' && obstacle.type === 'phaseField') {
    const result = evaluatePhaseCollision(
      x,
      y,
      ball,
      obstacle.centerX,
      obstacle.centerY,
      obstacle.fieldRadius,
      phaseOpen(obstacle, arrivalTime),
    );
    return !result.hit && result.clearance >= 0.04;
  }
  if (type === 'shiftingAperture' && obstacle.type === 'shiftingAperture') {
    const state = apertureState(obstacle, arrivalTime);
    const result = evaluateIrisCollision(x, y, ball, state.x, state.y, state.radius);
    return !result.hit && result.clearance >= 0.05;
  }
  if (type === 'pistonField' && obstacle.type === 'pistonField') {
    const result = evaluatePistonFieldCollision(obstacle, arrivalTime, x, y, ball);
    return !result.hit && result.clearance >= 0.05;
  }
  if (type === 'clockHands' && obstacle.type === 'clockHands') {
    const result = evaluateClockHandsCollision(obstacle, arrivalTime, x, y, ball);
    return !result.hit && result.clearance >= 0.04;
  }
  if (type === 'elevatorBlocks' && obstacle.type === 'elevatorBlocks') {
    const result = evaluateElevatorBlocksCollision(obstacle, arrivalTime, x, y, ball);
    return !result.hit && result.clearance >= 0.05;
  }
  if (type === 'pulseRing' && obstacle.type === 'pulseRing') {
    const result = evaluatePulseRingCollision(obstacle, arrivalTime, x, y, ball);
    return !result.hit && result.clearance >= 0.04;
  }
  if (type === 'scissorGate' && obstacle.type === 'scissorGate') {
    const result = evaluateScissorGateCollision(obstacle, arrivalTime, x, y, ball);
    return !result.hit && result.clearance >= 0.05;
  }
  if (type === 'speedField' && obstacle.type === 'speedField') {
    const result = evaluateSpeedFieldCollision(obstacle, arrivalTime, x, y, ball);
    return !result.hit;
  }
  if (type === 'splitShutter' && obstacle.type === 'splitShutter') {
    const result = evaluateSplitShutterCollision(obstacle, arrivalTime, x, y, ball);
    return !result.hit && result.clearance >= 0.05;
  }
  if (type === 'reactiveGate' && obstacle.type === 'reactiveGate') {
    const result = evaluateReactiveGateCollision(obstacle, arrivalTime, x, y, ball);
    return !result.hit && result.clearance >= 0.05;
  }
  if (type === 'conveyorGate' && obstacle.type === 'conveyorGate') {
    const result = evaluateConveyorGateCollision(obstacle, arrivalTime, x, y, ball);
    return !result.hit && result.clearance >= 0.05;
  }
  if (type === 'rollingAperture' && obstacle.type === 'rollingAperture') {
    const result = evaluateRollingApertureCollision(obstacle, arrivalTime, x, y, ball);
    return !result.hit && result.clearance >= 0.05;
  }
  if (type === 'corkscrewTunnel' && obstacle.type === 'corkscrewTunnel') {
    const result = evaluateCorkscrewCollision(obstacle, arrivalTime, x, y, ball);
    return !result.hit && result.clearance >= 0.04;
  }
  if (type === 'cometCrossing' && obstacle.type === 'cometCrossing') {
    const result = evaluateCometCrossingCollision(obstacle, arrivalTime, x, y, ball);
    return !result.hit && result.clearance >= 0.05;
  }
  if (type === 'orbitingMoons' && obstacle.type === 'orbitingMoons') {
    const result = evaluateOrbitingMoonsCollision(obstacle, arrivalTime, x, y, ball);
    return !result.hit && result.clearance >= 0.05;
  }
  if (type === 'sequentialTunnel' && obstacle.type === 'sequentialTunnel') {
    const result = evaluateSequentialTunnelCollision(obstacle, arrivalTime, x, y, ball);
    return !result.hit && result.clearance >= 0.05;
  }
  if (type === 'movingSafeZone' && obstacle.type === 'movingSafeZone') {
    const result = evaluateMovingSafeZoneCollision(obstacle, arrivalTime, x, y, ball);
    return !result.hit && result.clearance >= 0.05;
  }
  if (type === 'accretionShredder' && obstacle.type === 'accretionShredder') {
    const result = evaluateAccretionCollision(obstacle, arrivalTime, x, y, ball);
    return !result.hit && result.clearance >= 0.05;
  }
  if (type === 'pulsarBeam' && obstacle.type === 'pulsarBeam') {
    const result = evaluatePulsarBeamCollision(obstacle, arrivalTime, x, y, ball);
    return !result.hit && result.clearance >= 0.04;
  }
  if (type === 'solarSail' && obstacle.type === 'solarSail') {
    const result = evaluateSolarSailCollision(obstacle, arrivalTime, x, y, ball);
    return !result.hit && result.clearance >= 0.05;
  }
  if (type === 'magnetopause' && obstacle.type === 'magnetopause') {
    const result = evaluateMagnetopauseCollision(obstacle, arrivalTime, x, y, ball);
    return !result.hit && result.clearance >= 0.04;
  }
  if (type === 'lagrangeNull' && obstacle.type === 'lagrangeNull') {
    const result = evaluateLagrangeNullCollision(obstacle, arrivalTime, x, y, ball);
    return !result.hit;
  }
  if (type === 'teleportPortal' && obstacle.type === 'teleportPortal') {
    const result = evaluateTeleportPortalCollision(obstacle, arrivalTime, x, y, ball);
    return !result.hit && result.clearance >= 0.05;
  }
  if (type === 'entryExitPortal' && obstacle.type === 'entryExitPortal') {
    const result = evaluateEntryExitCollision(obstacle, arrivalTime, x, y, ball);
    return !result.hit && result.clearance >= 0.05;
  }
  if (type === 'theNull' && obstacle.type === 'theNull') {
    const result = evaluateTheNullCollision(obstacle, arrivalTime, x, y, ball);
    return !result.hit && result.clearance >= 0.05;
  }
  if (!isRotorConfig(obstacle)) {
    return false;
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
