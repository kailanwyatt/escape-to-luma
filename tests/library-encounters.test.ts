import { describe, expect, it } from 'vitest';

import { getCampaignLevel } from '../src/campaign/levels';
import { LIBRARY_LESSONS } from '../src/campaign/levels/LibraryEncounters';
import { worldForLevel } from '../src/campaign/worlds';
import { validateChallenge } from '../src/challenge/ChallengeValidator';
import { estimateDifficulty } from '../src/challenge/difficulty';
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
import { evaluateSpeedFieldCollision } from '../src/obstacles/SpeedFieldState';
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
  teleportPortalPoseAtTime,
} from '../src/obstacles/StoryLibraryState';
import type { ObstacleConfig } from '../src/config/ObstacleConfig';

const BALL = 0.22;

/** docs/CURSOR-OBSTACLE-STORY-PLACEMENT.md destinations. */
const expected: Record<number, { type: string; world: string }> = {
  6: { type: 'pistonField', world: 'containment' },
  9: { type: 'elevatorBlocks', world: 'lockdown' },
  10: { type: 'reactiveGate', world: 'lockdown' },
  13: { type: 'splitShutter', world: 'lockdown' },
  14: { type: 'clockHands', world: 'lockdown' },
  17: { type: 'conveyorGate', world: 'city' },
  32: { type: 'scissorGate', world: 'ascent' },
  33: { type: 'solarSail', world: 'ascent' },
  40: { type: 'pulseRing', world: 'storm' },
  47: { type: 'rollingAperture', world: 'upper_atmosphere' },
  70: { type: 'sequentialTunnel', world: 'orbital_graveyard' },
  71: { type: 'movingSafeZone', world: 'orbital_graveyard' },
  77: { type: 'orbitingMoons', world: 'moon' },
  78: { type: 'magnetopause', world: 'moon' },
  85: { type: 'lagrangeNull', world: 'far_side' },
  86: { type: 'corkscrewTunnel', world: 'far_side' },
  92: { type: 'cometCrossing', world: 'asteroid_belt' },
  93: { type: 'accretionShredder', world: 'asteroid_belt' },
  100: { type: 'speedField', world: 'drift' },
  101: { type: 'pulsarBeam', world: 'drift' },
  112: { type: 'theNull', world: 'the_null' },
  117: { type: 'teleportPortal', world: 'false_home' },
  118: { type: 'entryExitPortal', world: 'false_home' },
};

function sampleCenter(obstacle: ObstacleConfig, t: number) {
  const x = 0;
  const y = 3;
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
    case 'orbitingMoons':
      return evaluateOrbitingMoonsCollision(obstacle, t, x, y, BALL);
    case 'sequentialTunnel':
      return evaluateSequentialTunnelCollision(obstacle, t, x, y, BALL);
    case 'movingSafeZone':
      return evaluateMovingSafeZoneCollision(obstacle, t, x, y, BALL);
    case 'accretionShredder':
      return evaluateAccretionCollision(obstacle, t, x, y, BALL);
    case 'pulsarBeam':
      return evaluatePulsarBeamCollision(obstacle, t, x, y, BALL);
    case 'solarSail':
      return evaluateSolarSailCollision(obstacle, t, x, y, BALL);
    case 'magnetopause':
      return evaluateMagnetopauseCollision(obstacle, t, x, y, BALL);
    case 'lagrangeNull':
      return evaluateLagrangeNullCollision(obstacle, t, x, y, BALL);
    case 'teleportPortal':
      return evaluateTeleportPortalCollision(obstacle, t, x, y, BALL);
    case 'entryExitPortal':
      return evaluateEntryExitCollision(obstacle, t, x, y, BALL);
    case 'theNull':
      return evaluateTheNullCollision(obstacle, t, x, y, BALL);
    default:
      return null;
  }
}

function centerClearSometime(obstacle: ObstacleConfig): boolean {
  for (let t = 0; t < 8; t += 0.05) {
    const sample = sampleCenter(obstacle, t);
    if (sample && !sample.hit) return true;
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
      expect(level.challenge.obstacles).toHaveLength(1);
      expect(level.challenge.obstacles[0].type).toBe(meta.type);
      expect(level.tutorialHint).toBeTruthy();
      expect(
        validateChallenge(
          level.challenge,
          Math.max(level.challenge.difficulty, estimateDifficulty(level.challenge)),
          { windX: level.windX, gravityScale: level.gravityScale, wells: level.gravityWells },
        ),
      ).toBeNull();
      if (n === 85) {
        expect(level.gravityWells?.length).toBeGreaterThan(0);
        expect(level.tutorialHint).toMatch(/cancel/i);
      }
      if (n === 118) {
        expect(level.challenge.target.x).toBeCloseTo(0.85, 5);
      }
    }
  });

  it('keeps a clear center path for Original Spark on every library remap', () => {
    for (const levelNumber of Object.keys(expected).map(Number)) {
      const obstacle = getCampaignLevel(levelNumber)!.challenge.obstacles[0];
      expect(centerClearSometime(obstacle), `L${levelNumber} ${obstacle.type}`).toBe(true);
    }
  });

  it('collides teleport portals on the current anchor while warning telegraphs the next', () => {
    const obstacle = getCampaignLevel(117)!.challenge.obstacles[0];
    expect(obstacle.type).toBe('teleportPortal');
    if (obstacle.type !== 'teleportPortal') return;
    const hold = teleportPortalPoseAtTime(obstacle, 0.2);
    expect(hold.warning).toBe(false);
    expect(hold.x).toBe(0);
    expect(evaluateTeleportPortalCollision(obstacle, 0.2, 0, 3, BALL).hit).toBe(false);
    const warn = teleportPortalPoseAtTime(obstacle, 1.2);
    expect(warn.warning).toBe(true);
    expect(warn.x).toBe(hold.x);
    expect(warn.nextX).not.toBe(warn.x);
    expect(evaluateTeleportPortalCollision(obstacle, 1.2, warn.x, warn.y, BALL).hit).toBe(false);
    expect(evaluateTeleportPortalCollision(obstacle, 1.2, warn.nextX, warn.nextY, BALL).hit).toBe(true);
  });
});
