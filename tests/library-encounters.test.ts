import { describe, expect, it } from 'vitest';

import { getCampaignLevel } from '../src/campaign/levels';
import { LIBRARY_LESSONS } from '../src/campaign/levels/LibraryEncounters';
import { worldForLevel } from '../src/campaign/worlds';
import { validateChallenge } from '../src/challenge/ChallengeValidator';
import { estimateDifficulty } from '../src/challenge/difficulty';
import { teleportTargetPoseAtTime } from '../src/config/MovementConfig';
import { evaluateClockHandsCollision } from '../src/obstacles/ClockHandsState';
import { evaluateCometCrossingCollision } from '../src/obstacles/ExtendedLibraryState';
import {
  evaluateConveyorGateCollision,
  evaluateCorkscrewCollision,
  evaluateReactiveGateCollision,
  evaluateRollingApertureCollision,
  evaluateSplitShutterCollision,
} from '../src/obstacles/ExtendedLibraryState';
import { evaluateElevatorBlocksCollision } from '../src/obstacles/ElevatorBlocksState';
import { evaluatePistonFieldCollision } from '../src/obstacles/PistonFieldState';
import { evaluatePulseRingCollision } from '../src/obstacles/PulseRingState';
import { evaluateScissorGateCollision } from '../src/obstacles/ScissorGateState';
import { evaluateGroundCutLasersCollision } from '../src/obstacles/GroundCutLasersState';
import { evaluateSpeedFieldCollision } from '../src/obstacles/SpeedFieldState';
import { evaluateBillboardFlipCollision } from '../src/obstacles/BillboardFlipState';
import { evaluateDockingCollarCollision } from '../src/obstacles/DockingCollarState';
import { evaluateShearLaneCollision } from '../src/obstacles/ShearLaneState';
import {
  evaluateAccretionCollision,
  evaluateEntryExitCollision,
  evaluateLagrangeNullCollision,
  evaluateMagnetopauseCollision,
  evaluateMovingSafeZoneCollision,
  evaluateOrbitingMoonsCollision,
  evaluatePulsarBeamCollision,
  evaluateSequentialTunnelCollision,
  evaluateTheNullCollision,
} from '../src/obstacles/StoryLibraryState';
import { evaluateNullTendrilCollision } from '../src/obstacles/NullTendrilState';
import { evaluateNullLashCollision } from '../src/obstacles/NullLashState';
import { evaluateRotatingGateCollision } from '../src/obstacles/RotatingGateState';
import { evaluateEnergyFieldCollision } from '../src/obstacles/EnergyFieldState';
import { evaluateRepulsorCollision } from '../src/obstacles/RepulsorState';
import { evaluateIrisCollision, evaluateRingCollision, evaluateBlockerCollision, evaluateLaserCollision, evaluatePendulumCollision } from '../src/obstacles/ObstacleCollision';
import { irisRadiusAt } from '../src/obstacles/IrisObstacle';
import { ringPosition } from '../src/obstacles/MovingRingObstacle';
import { driftPosition } from '../src/obstacles/DriftingBlockerObstacle';
import { orbiterPosition } from '../src/obstacles/OrbiterObstacle';
import { pendulumPose } from '../src/obstacles/PendulumObstacle';
import { laserBeamsAtTime } from '../src/obstacles/LaserGridAnimation';
import { GAME_TUNING } from '../src/game/gameTuning';
import type { ObstacleConfig } from '../src/config/ObstacleConfig';
import { Target } from '../src/target/Target';

const BALL = 0.22;

/** docs/CURSOR-OBSTACLE-STORY-PLACEMENT.md destinations. */
const expected: Record<number, { type: string; world: string }> = {
  6: { type: 'pistonField', world: 'containment' },
  9: { type: 'elevatorBlocks', world: 'lockdown' },
  10: { type: 'reactiveGate', world: 'lockdown' },
  13: { type: 'splitShutter', world: 'lockdown' },
  14: { type: 'clockHands', world: 'lockdown' },
  17: { type: 'conveyorGate', world: 'city' },
  19: { type: 'billboardFlip', world: 'city' },
  21: { type: 'scissorGate', world: 'city' },
  32: { type: 'groundCutLasers', world: 'ascent' },
  33: { type: 'rotatingGate', world: 'ascent' },
  40: { type: 'pulseRing', world: 'storm' },
  47: { type: 'rollingAperture', world: 'upper_atmosphere' },
  48: { type: 'dockingCollar', world: 'upper_atmosphere' },
  64: { type: 'driftingBlocker', world: 'orbit' },
  70: { type: 'energyField', world: 'orbital_graveyard' },
  71: { type: 'movingSafeZone', world: 'orbital_graveyard' },
  76: { type: 'pendulum', world: 'moon' },
  77: { type: 'orbitingMoons', world: 'moon' },
  85: { type: 'driftingBlocker', world: 'far_side' },
  86: { type: 'corkscrewTunnel', world: 'far_side' },
  92: { type: 'orbiter', world: 'asteroid_belt' },
  93: { type: 'accretionShredder', world: 'asteroid_belt' },
  94: { type: 'shearLane', world: 'asteroid_belt' },
  100: { type: 'repulsor', world: 'drift' },
  101: { type: 'laserGrid', world: 'drift' },
  111: { type: 'nullTendril', world: 'the_null' },
  112: { type: 'nullLash', world: 'the_null' },
  113: { type: 'theNull', world: 'the_null' },
  117: { type: 'teleportTarget', world: 'false_home' },
  118: { type: 'entryExitPortal', world: 'false_home' },
};

function sampleCenter(obstacle: ObstacleConfig, t: number, x = 0, y = 3) {
  switch (obstacle.type) {
    case 'pistonField':
      return evaluatePistonFieldCollision(obstacle, t, x, y, BALL);
    case 'elevatorBlocks':
      return evaluateElevatorBlocksCollision(obstacle, t, x, y, BALL);
    case 'clockHands':
      return evaluateClockHandsCollision(obstacle, t, x, y, BALL);
    case 'pulseRing':
      return evaluatePulseRingCollision(obstacle, t, x, y, BALL);
    case 'scissorGate':
      return evaluateScissorGateCollision(obstacle, t, x, y, BALL);
    case 'groundCutLasers':
      return evaluateGroundCutLasersCollision(obstacle, t, x, y, BALL);
    case 'speedField':
      return evaluateSpeedFieldCollision(obstacle, t, x, y, BALL);
    case 'splitShutter':
      return evaluateSplitShutterCollision(obstacle, t, x, y, BALL);
    case 'reactiveGate':
      return evaluateReactiveGateCollision(obstacle, t, x, y, BALL);
    case 'conveyorGate':
      return evaluateConveyorGateCollision(obstacle, t, x, y, BALL);
    case 'rollingAperture':
      return evaluateRollingApertureCollision(obstacle, t, x, y, BALL);
    case 'corkscrewTunnel':
      return evaluateCorkscrewCollision(obstacle, t, x, y, BALL);
    case 'cometCrossing':
      return evaluateCometCrossingCollision(obstacle, t, x, y, BALL);
    case 'billboardFlip':
      return evaluateBillboardFlipCollision(obstacle, t, x, y, BALL);
    case 'dockingCollar':
      return evaluateDockingCollarCollision(obstacle, t, x, y, BALL);
    case 'shearLane':
      return evaluateShearLaneCollision(obstacle, t, x, y, BALL);
    case 'pendulum': {
      const pose = pendulumPose(obstacle, t);
      const sample = evaluatePendulumCollision(
        x,
        y,
        BALL,
        obstacle.pivotX,
        obstacle.pivotY,
        pose.blockerX,
        pose.blockerY,
        obstacle.blockerRadius,
        GAME_TUNING.pendulum.armRadius,
      );
      return { hit: !!sample.hit, clearance: sample.clearance, nearMiss: sample.nearMiss };
    }
    case 'orbiter': {
      const pos = orbiterPosition(obstacle, t);
      const sample = evaluateBlockerCollision(x, y, BALL, pos.x, pos.y, obstacle.blockerRadius);
      return { hit: !!sample.hit, clearance: sample.clearance, nearMiss: sample.nearMiss };
    }
    case 'orbitingMoons':
      return evaluateOrbitingMoonsCollision(obstacle, t, x, y, BALL);
    case 'driftingBlocker': {
      const pos = driftPosition(obstacle, t);
      const sample = evaluateBlockerCollision(x, y, BALL, pos.x, pos.y, obstacle.blockerRadius);
      return { hit: !!sample.hit, clearance: sample.clearance, nearMiss: sample.nearMiss };
    }
    case 'laserGrid': {
      const beams = laserBeamsAtTime(obstacle, t);
      const sample = evaluateLaserCollision(x, y, BALL, beams, true);
      // Pulse off-phases are handled by playableSometime probing multiple times; treat geometry gaps here.
      return { hit: !!sample.hit, clearance: sample.clearance, nearMiss: sample.nearMiss };
    }
    case 'sequentialTunnel':
      return evaluateSequentialTunnelCollision(obstacle, t, x, y, BALL);
    case 'iris': {
      const cx = obstacle.centerX ?? 0;
      const cy = obstacle.centerY ?? 3;
      const radius = irisRadiusAt(obstacle, t);
      const sample = evaluateIrisCollision(x, y, BALL, cx, cy, radius);
      return { hit: !!sample.hit, clearance: sample.clearance, nearMiss: sample.nearMiss };
    }
    case 'movingSafeZone':
      return evaluateMovingSafeZoneCollision(obstacle, t, x, y, BALL);
    case 'accretionShredder':
      return evaluateAccretionCollision(obstacle, t, x, y, BALL);
    case 'pulsarBeam':
      return evaluatePulsarBeamCollision(obstacle, t, x, y, BALL);
    case 'movingRing': {
      const pos = ringPosition(obstacle, t);
      const sample = evaluateRingCollision(x, y, BALL, pos.x, pos.y, obstacle.radius);
      return { hit: !!sample.hit, clearance: sample.clearance, nearMiss: sample.nearMiss };
    }
    case 'magnetopause':
      return evaluateMagnetopauseCollision(obstacle, t, x, y, BALL);
    case 'lagrangeNull':
      return evaluateLagrangeNullCollision(obstacle, t, x, y, BALL);
    case 'entryExitPortal':
      return evaluateEntryExitCollision(obstacle, t, x, y, BALL);
    case 'theNull':
      return evaluateTheNullCollision(obstacle, t, x, y, BALL);
    case 'nullTendril':
      return evaluateNullTendrilCollision(obstacle, t, x, y, BALL);
    case 'nullLash':
      return evaluateNullLashCollision(obstacle, t, x, y, BALL);
    case 'rotatingGate':
      return evaluateRotatingGateCollision(obstacle, t, x, y, BALL);
    case 'energyField':
      return evaluateEnergyFieldCollision(obstacle, t, x, y, BALL);
    case 'repulsor':
      return evaluateRepulsorCollision(obstacle, t, x, y, BALL);
    default:
      return null;
  }
}

function sampleAt(obstacle: ObstacleConfig, t: number, x: number, y: number) {
  // Reuse sampleCenter switch by temporarily sampling arbitrary points via local helpers.
  if (obstacle.type === 'orbitingMoons') return evaluateOrbitingMoonsCollision(obstacle, t, x, y, BALL);
  if (obstacle.type === 'magnetopause') return evaluateMagnetopauseCollision(obstacle, t, x, y, BALL);
  if (obstacle.type === 'driftingBlocker') {
    const pos = driftPosition(obstacle, t);
    const sample = evaluateBlockerCollision(x, y, BALL, pos.x, pos.y, obstacle.blockerRadius);
    return { hit: !!sample.hit, clearance: sample.clearance, nearMiss: sample.nearMiss };
  }
  if (obstacle.type === 'laserGrid') {
    const beams = laserBeamsAtTime(obstacle, t);
    const sample = evaluateLaserCollision(x, y, BALL, beams, true);
    return { hit: !!sample.hit, clearance: sample.clearance, nearMiss: sample.nearMiss };
  }
  if (obstacle.type === 'orbiter') {
    const pos = orbiterPosition(obstacle, t);
    const sample = evaluateBlockerCollision(x, y, BALL, pos.x, pos.y, obstacle.blockerRadius);
    return { hit: !!sample.hit, clearance: sample.clearance, nearMiss: sample.nearMiss };
  }
  if (obstacle.type === 'pendulum') {
    const pose = pendulumPose(obstacle, t);
    const sample = evaluatePendulumCollision(
      x,
      y,
      BALL,
      obstacle.pivotX,
      obstacle.pivotY,
      pose.blockerX,
      pose.blockerY,
      obstacle.blockerRadius,
      GAME_TUNING.pendulum.armRadius,
    );
    return { hit: !!sample.hit, clearance: sample.clearance, nearMiss: sample.nearMiss };
  }
  if (obstacle.type === 'groundCutLasers') {
    return evaluateGroundCutLasersCollision(obstacle, t, x, y, BALL);
  }
  return sampleCenter(obstacle, t, x, y);
}

function playableSometime(obstacle: ObstacleConfig): boolean {
  // Hubbed moon/dish: center is intentionally solid — require a gap lane instead.
  const probes: Array<[number, number]> =
    obstacle.type === 'orbitingMoons' && obstacle.hubRadius
      ? [
          [obstacle.orbitRadius, 0],
          [-obstacle.orbitRadius, 0],
          [0, obstacle.orbitRadius],
          [0, -obstacle.orbitRadius],
        ].map(([dx, dy]) => [obstacle.centerX + dx, obstacle.centerY + dy] as [number, number])
      : obstacle.type === 'magnetopause' && obstacle.hubRadius
        ? Array.from({ length: 16 }, (_, i) => {
            const mid = (obstacle.innerRadius + obstacle.outerRadius) / 2;
            const a = (i / 16) * Math.PI * 2;
            return [obstacle.centerX + Math.cos(a) * mid, obstacle.centerY + Math.sin(a) * mid] as [number, number];
          })
        : obstacle.type === 'driftingBlocker' || obstacle.type === 'orbiter'
          ? [
              [0, 3],
              [1.1, 3],
              [-1.1, 3],
              [0, 3.9],
              [0, 2.2],
            ]
          : obstacle.type === 'groundCutLasers'
            ? [
                [obstacle.aimX, 3.1],
                [0.55, 3.1],
                [0.35, 2.8],
                [0.7, 3.3],
              ]
            : obstacle.type === 'repulsor'
              ? [
                  [0, 3],
                  [1.2, 3],
                  [-1.2, 3],
                  [0, 4.2],
                  [0, 1.9],
                ]
              : obstacle.type === 'entryExitPortal'
                ? (obstacle.disks ?? [{ x: obstacle.entryX, y: obstacle.entryY }]).map(
                    (d) => [d.x, d.y] as [number, number],
                  )
                : obstacle.type === 'rotatingGate' || obstacle.type === 'corkscrewTunnel'
                  ? Array.from({ length: 12 }, (_, i) => {
                      const a = (i / 12) * Math.PI * 2;
                      const outer =
                        obstacle.type === 'rotatingGate' ? obstacle.outerRadius : obstacle.radius;
                      const inner =
                        obstacle.type === 'rotatingGate'
                          ? obstacle.innerRadius
                          : (obstacle.innerRadius ?? outer * 0.18);
                      const mid = (inner + outer) / 2;
                      return [
                        obstacle.centerX + Math.cos(a) * mid,
                        obstacle.centerY + Math.sin(a) * mid,
                      ] as [number, number];
                    })
          : [[0, 3]];

  for (let t = 0; t < 8; t += 0.05) {
    for (const [x, y] of probes) {
      const sample = sampleAt(obstacle, t, x, y);
      if (sample && !sample.hit) return true;
    }
  }
  return false;
}

describe('library isolation encounters (recapture placement)', () => {
  it('remaps each family to its story destination world and level', () => {
    expect(Object.keys(LIBRARY_LESSONS).map(Number).sort((a, b) => a - b)).toEqual(
      Object.keys(expected).map(Number).sort((a, b) => a - b),
    );
    for (const [levelNumber, meta] of Object.entries(expected)) {
      const n = Number(levelNumber);
      const level = getCampaignLevel(n)!;
      expect(LIBRARY_LESSONS[n]).toBeTruthy();
      expect(worldForLevel(n)?.id).toBe(meta.world);
      expect(level.worldId).toBe(meta.world);
      if (meta.type === 'teleportTarget') {
        expect(level.challenge.obstacles).toHaveLength(0);
        expect(level.challenge.target.movement?.type).toBe('teleport');
      } else {
        expect(level.challenge.obstacles).toHaveLength(1);
        expect(level.challenge.obstacles[0].type).toBe(meta.type);
      }
      expect(level.tutorialHint).toBeTruthy();
      expect(
        validateChallenge(
          level.challenge,
          Math.max(level.challenge.difficulty, estimateDifficulty(level.challenge)),
          { windX: level.windX, gravityScale: level.gravityScale, wells: level.gravityWells },
        ),
      ).toBeNull();
      if (n === 85) {
        expect(Math.abs(level.windX ?? 0)).toBeGreaterThan(0.1);
        expect(level.tutorialHint).toMatch(/lead|wreck/i);
      }
      if (n === 76) {
        const o = level.challenge.obstacles[0];
        expect(o.type).toBe('pendulum');
        if (o.type === 'pendulum') {
          expect(o.length).toBeGreaterThan(1.8);
          expect(o.maxAngle).toBeGreaterThan(0.5);
        }
      }
      if (n === 77) {
        const o = level.challenge.obstacles[0];
        expect(o.type).toBe('orbitingMoons');
        if (o.type === 'orbitingMoons') {
          expect(o.hubRadius ?? 0).toBe(0);
          expect(o.beaconPulse?.kind).toBe('laser');
          let clear = false;
          let pulsed = false;
          for (let t = 0; t < 8; t += 0.05) {
            const hit = evaluateOrbitingMoonsCollision(o, t, 0, 3, BALL).hit;
            if (!hit) clear = true;
            if (hit) pulsed = true;
          }
          expect(clear).toBe(true);
          expect(pulsed).toBe(true);
        }
      }
      if (n === 118) {
        expect(level.challenge.target.y).toBeCloseTo(4.9, 5);
        const o = level.challenge.obstacles[0];
        expect(o.type).toBe('entryExitPortal');
        if (o.type === 'entryExitPortal') {
          expect(o.disks?.length).toBe(3);
          expect(o.exitY).toBeCloseTo(4.9, 5);
          expect(o.disks?.[0]?.y).toBeCloseTo(o.disks?.[1]?.y ?? 0, 5);
          expect(level.challenge.target.x).toBeCloseTo(o.exitX, 5);
          expect(level.challenge.target.z).toBeCloseTo(
            o.z + (o.destinationDepth ?? 5.6),
            5,
          );
        }
      }
    }
  });

  it('keeps a playable lane for Original Spark on every library remap', () => {
    for (const levelNumber of Object.keys(expected).map(Number)) {
      if (expected[levelNumber].type === 'teleportTarget') continue;
      const obstacle = getCampaignLevel(levelNumber)!.challenge.obstacles[0];
      expect(playableSometime(obstacle), `L${levelNumber} ${obstacle.type}`).toBe(true);
    }
  });

  it('keeps Moon L77 beacons open-center with laser pulses; L78 is gravity slingshot', () => {
    const moons = getCampaignLevel(77)!.challenge.obstacles[0];
    const sling = getCampaignLevel(78)!;
    expect(moons.type).toBe('orbitingMoons');
    if (moons.type === 'orbitingMoons') {
      expect(moons.hubRadius ?? 0).toBe(0);
      expect(moons.beaconPulse?.kind).toBe('laser');
    }
    expect(sling.gravityWells?.length).toBeGreaterThan(0);
    expect(sling.challenge.obstacles[0].type).toBe('driftingBlocker');
    expect(sling.challenge.obstacles.some((o) => o.type === 'magnetopause')).toBe(false);
  });

  it('vanishes and reappears the destination portal among fixed anchors', () => {
    const level = getCampaignLevel(117)!;
    const movement = level.challenge.target.movement!;
    expect(movement.type).toBe('teleport');
    const hold = teleportTargetPoseAtTime(movement, 0.2);
    expect(hold.present).toBe(true);
    expect(hold.x).toBe(0);
    const gone = teleportTargetPoseAtTime(movement, 1.2);
    expect(gone.present).toBe(false);
    const again = teleportTargetPoseAtTime(movement, 1.1 + 0.55 + 0.05);
    expect(again.present).toBe(true);
    expect(again.x).toBe(-1.1);
    expect(again.y).toBe(3.35);

    const target = new Target();
    target.applyConfig(level.challenge.target);
    target.update(0, 0.2);
    expect(target.present).toBe(true);
    expect(target.group.visible).toBe(true);
    target.update(0, 1.2);
    expect(target.present).toBe(false);
    expect(target.group.visible).toBe(false);
    target.update(0, 1.1 + 0.55 + 0.05);
    expect(target.present).toBe(true);
    expect(target.x).toBe(-1.1);
    expect(target.group.visible).toBe(true);
  });
});
