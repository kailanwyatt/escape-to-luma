import { describe, expect, it } from 'vitest';

import { getCampaignLevel } from '../src/campaign/levels';
import { LIBRARY_LESSONS } from '../src/campaign/levels/LibraryEncounters';
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
} from '../src/obstacles/StoryLibraryState';
import type { ObstacleConfig } from '../src/config/ObstacleConfig';

const BALL = 0.22;

function centerClearSometime(obstacle: ObstacleConfig): boolean {
  for (let t = 0; t < 8; t += 0.05) {
    const sample = sampleCenter(obstacle, t);
    if (sample && !sample.hit) return true;
  }
  return false;
}

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

describe('library isolation encounters', () => {
  const expected: Record<number, string> = {
    13: 'pistonField',
    14: 'splitShutter',
    17: 'orbitingMoons',
    18: 'sequentialTunnel',
    19: 'elevatorBlocks',
    20: 'reactiveGate',
    21: 'corkscrewTunnel',
    23: 'movingSafeZone',
    25: 'cometCrossing',
    26: 'scissorGate',
    27: 'accretionShredder',
    28: 'speedField',
    29: 'pulsarBeam',
    31: 'solarSail',
    32: 'magnetopause',
    33: 'lagrangeNull',
    34: 'conveyorGate',
    35: 'clockHands',
    36: 'pulseRing',
    37: 'rollingAperture',
    38: 'teleportPortal',
    39: 'entryExitPortal',
    40: 'theNull',
  };

  it('remaps teaching slots to every library family', () => {
    expect(Object.keys(LIBRARY_LESSONS).map(Number).sort((a, b) => a - b)).toEqual(
      Object.keys(expected).map(Number).sort((a, b) => a - b),
    );
    for (const [levelNumber, type] of Object.entries(expected)) {
      const n = Number(levelNumber);
      const level = getCampaignLevel(n)!;
      expect(LIBRARY_LESSONS[n]).toBeTruthy();
      expect(level.challenge.obstacles).toHaveLength(1);
      expect(level.challenge.obstacles[0].type).toBe(type);
      expect(level.tutorialHint).toBeTruthy();
      expect(
        validateChallenge(
          level.challenge,
          Math.max(level.challenge.difficulty, estimateDifficulty(level.challenge)),
          { windX: level.windX, gravityScale: level.gravityScale, wells: level.gravityWells },
        ),
      ).toBeNull();
    }
  });

  it('keeps a clear center path for Original Spark on every library remap', () => {
    for (const levelNumber of Object.keys(expected).map(Number)) {
      const obstacle = getCampaignLevel(levelNumber)!.challenge.obstacles[0];
      expect(centerClearSometime(obstacle), `L${levelNumber} ${obstacle.type}`).toBe(true);
    }
  });

  it('keeps the pulse-ring hub clear for the whole cycle', () => {
    const obstacle = getCampaignLevel(36)!.challenge.obstacles[0];
    expect(obstacle.type).toBe('pulseRing');
    for (let t = 0; t < 4; t += 0.1) {
      expect(evaluatePulseRingCollision(obstacle as Extract<ObstacleConfig, { type: 'pulseRing' }>, t, 0, 3, BALL).hit).toBe(
        false,
      );
    }
  });
});
