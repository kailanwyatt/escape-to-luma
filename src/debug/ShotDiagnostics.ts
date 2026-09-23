import { GAME_TUNING } from '../game/gameTuning';
import type { ObstacleHitPart } from '../obstacles/ObstacleCollision';
import type { ObstacleSlot } from '../obstacles/ObstacleSlot';
import { scoreTarget } from '../target/TargetScoring';
import { distanceToTarget } from '../target/TargetCollision';
import type { Target } from '../target/Target';
import { applyPortalWarps, integrateMotion, type PhysicsForces } from '../projectile/physics';
import type {RicochetConfig} from '../reflectors/ReflectorConfig';
import type {Bounce} from '../reflectors/Reflection';
import {traceRicochet} from '../reflectors/RicochetTrace';
import type { ShotResultKind } from '../game/GameState';

export type Vec3 = { x: number; y: number; z: number };
export type Velocity = { vx: number; vy: number; vz: number };

export type RotorArrivalPrediction = {
  id: 'A' | 'B' | 'C';
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
  bounces?: Bounce[];
  ricochetBlocked?: boolean;
  vz: number;
  rotors: RotorArrivalPrediction[];
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
): { x: number; y: number; z: number; time: number; vx: number; vy: number; vz: number } | null {
  if (velocity.vz <= 0.001 || start.z >= planeZ) {
    return null;
  }
  // Strip portal warps so plane samples stay at the entry crossing for collision.
  const { portalWarps: _portalWarps, ...flightForces } = forces;
  const state = { ...start, ...velocity };
  let prevX = state.x;
  let prevY = state.y;
  let prevZ = state.z;
  let time = 0;
  while (state.z < planeZ && time < GAME_TUNING.projectile.maxFlightTime) {
    prevX = state.x;
    prevY = state.y;
    prevZ = state.z;
    integrateMotion(state, dt, flightForces);
    time += dt;
  }
  const span = state.z - prevZ;
  const u = span === 0 ? 1 : (planeZ - prevZ) / span;
  return {
    x: prevX + (state.x - prevX) * u,
    y: prevY + (state.y - prevY) * u,
    z: planeZ,
    time: time - dt + u * dt,
    vx: state.vx,
    vy: state.vy,
    vz: state.vz,
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
  targetTime = simTime,
  ricochet?: RicochetConfig,
): ShotPrediction {
  if (ricochet) return predictRicochetShot(start,velocity,obstacles,target,simTime,obstacleTimeScale,forces,targetTime,ricochet);
  const projectileRadius = GAME_TUNING.projectile.radius;
  const ordered = obstacles
    .map((obstacle, index) => ({ obstacle, index }))
    .filter((item) => item.obstacle.active)
    .sort((a, b) => a.obstacle.z - b.obstacle.z || a.index - b.index);

  const rotors: RotorArrivalPrediction[] = [
    emptyRotor('A'),
    emptyRotor('B'),
    emptyRotor('C'),
  ];

  let cursor: Vec3 = { x: start.x, y: start.y, z: start.z };
  let cursorVelocity: Velocity = { ...velocity };
  let elapsed = 0;
  for (const item of ordered) {
    const id: 'A' | 'B' | 'C' = item.index === 0 ? 'A' : item.index === 1 ? 'B' : 'C';
    const obstacle = item.obstacle;
    const analyticT = (obstacle.z - start.z) / Math.max(0.001, velocity.vz);
    const analytic = analyticPosition(start, velocity, analyticT);
    const simulated = simulateToZ(cursor, cursorVelocity, obstacle.z, 1 / 120, forces);
    const segmentTime =
      simulated?.time ?? Math.max(0, (obstacle.z - cursor.z) / Math.max(0.001, cursorVelocity.vz));
    const time = elapsed + segmentTime;
    const predicted = obstacle.predictState(time * obstacleTimeScale, simTime);
    const at = simulated ?? {
      x: cursor.x,
      y: cursor.y,
      z: obstacle.z,
      time: segmentTime,
      ...cursorVelocity,
    };
    const collision = obstacle.evaluateAt(at.x, at.y, projectileRadius, predicted);
    const debug = obstacle.getDebugInfo();
    rotors[item.index] = {
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
    };
    elapsed = time;
    cursorVelocity = { vx: at.vx, vy: at.vy, vz: at.vz };
    if (collision.hit) {
      cursor = { x: at.x, y: at.y, z: obstacle.z };
      break;
    }
    // Match runtime: warp only after a clear Entry/Exit crossing.
    if (obstacle.type === 'entryExitPortal') {
      const warp = obstacle.warpTarget();
      cursor = warp
        ? { x: warp.x, y: warp.y, z: obstacle.z }
        : { x: at.x, y: at.y, z: obstacle.z };
    } else {
      cursor = { x: at.x, y: at.y, z: obstacle.z };
    }
  }

  const analyticT = (target.z - start.z) / Math.max(0.001, velocity.vz);
  const analytic = analyticPosition(start, velocity, analyticT);
  const simulated = simulateToZ(cursor, cursorVelocity, target.z, 1 / 120, forces);
  const segmentTime =
    simulated?.time ?? Math.max(0, (target.z - cursor.z) / Math.max(0.001, cursorVelocity.vz));
  const time = elapsed + segmentTime;
  const at = simulated ?? { x: cursor.x, y: cursor.y, z: target.z, time: segmentTime, ...cursorVelocity };
  const futureTarget = target.predictPosition(targetTime + time);
  const distance = distanceToTarget(at.x, at.y, futureTarget.x, futureTarget.y);
  const scored = scoreTarget(distance, target.radius);

  const path: Vec3[] = [];
  const samples = 32;
  const pathState = { ...start, ...velocity };
  const pathDt = analyticT / samples;
  for (let i = 1; i <= samples; i += 1) {
    const prevZ = pathState.z;
    integrateMotion(pathState, pathDt, forces);
    applyPortalWarps(prevZ, pathState, forces.portalWarps);
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

function emptyRotor(id: 'A' | 'B' | 'C'): RotorArrivalPrediction {
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

function predictRicochetShot(start:Vec3,velocity:Velocity,obstacles:ObstacleSlot[],target:Target,simTime:number,scale:number,forces:PhysicsForces,targetTime:number,config:RicochetConfig):ShotPrediction {
 const rotors=[emptyRotor('A'),emptyRotor('B'),emptyRotor('C')] as ShotPrediction['rotors'];
 const trace=traceRicochet({...start,...velocity},config,target.z,targetTime,forces,(a,b,clock,dt)=>{
  for(let i=0;i<obstacles.length;i++){
   const o=obstacles[i];if(!o.active||(a.z-o.z)*(b.z-o.z)>0||a.z===b.z)continue;
   const u=(o.z-a.z)/(b.z-a.z);if(u<0||u>1)continue;
   const time=clock-targetTime+dt*u,x=a.x+(b.x-a.x)*u,y=a.y+(b.y-a.y)*u;
   const pose=o.predictState(time*scale,simTime),hit=o.evaluateAt(x,y,GAME_TUNING.projectile.radius,pose),debug=o.getDebugInfo();
   rotors[i]={...emptyRotor(i===0?'A':i===1?'B':'C'),active:true,time,z:o.z,type:o.type,analytic:{x,y},simulated:{x,y},current:{x:debug.x,y:debug.y,angle:debug.angle},predicted:{x:pose.x,y:pose.y,angle:pose.angle,openingRadius:pose.openingRadius,extra:debug.extra},verdict:hit.hit?'HIT':'CLEAR',hitPart:hit.hit,clearance:hit.clearance};
   if(hit.hit)return false;
  }return true;
 });
 const at=trace.arrival??{...trace.state,time:0};const future=target.predictPosition(targetTime+at.time);
 const distance=distanceToTarget(at.x,at.y,future.x,future.y);
 const valid=Boolean(trace.arrival)&&trace.bounces.length>=config.requiredBounces;
 return {vz:velocity.vz,rotors,path:trace.path,bounces:trace.bounces,ricochetBlocked:!valid,analyticVsSimMaxY:0,target:{time:at.time,analytic:{x:at.x,y:at.y},simulated:{x:at.x,y:at.y},target:future,distance,radius:target.radius,projectileRadius:GAME_TUNING.projectile.radius,verdict:valid?scoreTarget(distance,target.radius).kind:'MISS',edgeWouldHit:valid&&distance<=target.radius+GAME_TUNING.projectile.radius}};
}
