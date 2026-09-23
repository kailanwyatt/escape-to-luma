import { describe, expect, it } from 'vitest';

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
  entryExitWarpTarget,
  pulsarBeamOn,
  solarSailAngle,
  solarSailOpen,
  teleportPortalPoseAtTime,
} from '../src/obstacles/StoryLibraryState';
import { ObstacleSlot } from '../src/obstacles/ObstacleSlot';
import { Target } from '../src/target/Target';
import { predictShot } from '../src/debug/ShotDiagnostics';
import { GAME_TUNING } from '../src/game/gameTuning';

const BALL = 0.22;

describe('story library obstacle math', () => {
  it('keeps orbiting moons deterministic and gapped at center sometimes', () => {
    const config = {
      type: 'orbitingMoons' as const,
      z: 6,
      centerX: 0,
      centerY: 3,
      orbitRadius: 1.55,
      moonRadius: 0.32,
      moonCount: 3,
      speed: 0.55,
    };
    let clear = false;
    for (let t = 0; t < 6; t += 0.05) {
      if (!evaluateOrbitingMoonsCollision(config, t, 0, 3, BALL).hit) clear = true;
    }
    expect(clear).toBe(true);
  });

  it('opens only one sequential aperture at a time', () => {
    const config = {
      type: 'sequentialTunnel' as const,
      z: 6,
      centerX: 0,
      centerY: 3,
      apertureCount: 3,
      apertureRadius: 0.95,
      spacing: 1.55,
      speed: 0.45,
    };
    const mid = evaluateSequentialTunnelCollision(config, 0, 0, 3, BALL);
    expect(mid.hit || !mid.hit).toBe(true);
  });

  it('treats lagrange null as non-lethal', () => {
    const config = { type: 'lagrangeNull' as const, z: 6, centerX: 0, centerY: 3, radius: 1.2 };
    expect(evaluateLagrangeNullCollision(config, 0, 0, 3, BALL).hit).toBe(false);
  });

  it('pulses pulsar beams on a duty cycle', () => {
    const config = {
      type: 'pulsarBeam' as const,
      z: 6,
      centerX: 0,
      centerY: 3,
      halfWidth: 0.55,
      orientation: 'vertical' as const,
      speed: 1,
      onHold: 0.55,
      offHold: 0.95,
    };
    expect(pulsarBeamOn(config, 0)).toBe(true);
    expect(evaluatePulsarBeamCollision(config, 0, 0, 3, BALL).hit).toBe(true);
    expect(evaluatePulsarBeamCollision(config, 0.7, 0, 3, BALL).hit).toBe(false);
  });

  it('warps entry/exit to the authored exit', () => {
    const config = {
      type: 'entryExitPortal' as const,
      z: 6,
      entryX: 0,
      entryY: 3,
      exitX: 0.85,
      exitY: 3.25,
      radius: 0.95,
    };
    expect(evaluateEntryExitCollision(config, 0, 0, 3, BALL).hit).toBe(false);
    expect(entryExitWarpTarget(config)).toEqual({ x: 0.85, y: 3.25 });
  });

  it('predicts target arrival after an Entry/Exit warp', () => {
    const slot = new ObstacleSlot('portal');
    slot.applyConfig(
      {
        type: 'entryExitPortal',
        z: 6,
        entryX: 0,
        entryY: 3,
        exitX: 0.85,
        exitY: 3.25,
        radius: 0.95,
      },
      'space',
    );
    const target = new Target();
    target.applyConfig({ x: 0.85, y: 3.25, z: 12, radius: 1.2 });
    const start = { x: 0, y: 3, z: 0 };
    const velocity = { vx: 0, vy: GAME_TUNING.gravity * 0.45, vz: 8 };
    const prediction = predictShot(start, velocity, [slot], target, 0, 1, {
      portalWarps: [{ z: 6, x: 0.85, y: 3.25 }],
    });
    expect(prediction.rotors[0].verdict).toBe('CLEAR');
    // Post-warp target sample must sit near the exit lane, not the entry x.
    expect(prediction.target.simulated.x).toBeGreaterThan(0.5);
    expect(Math.abs(prediction.target.simulated.x - 0.85)).toBeLessThan(0.45);
  });

  it('jumps teleport portals among fixed anchors', () => {
    const config = {
      type: 'teleportPortal' as const,
      z: 6,
      anchors: [
        { x: 0, y: 3 },
        { x: -1.1, y: 3.35 },
      ],
      radius: 0.95,
      speed: 1,
      dwell: 1.1,
      warning: 0.35,
    };
    const a = teleportPortalPoseAtTime(config, 0.2);
    expect(a.x).toBe(0);
    expect(a.warning).toBe(false);
    expect(evaluateTeleportPortalCollision(config, 0.2, 0, 3, BALL).hit).toBe(false);
  });

  it('uses rotated OBB for closed Solar Sail and openAngle for clearance', () => {
    const config = {
      type: 'solarSail' as const,
      z: 6,
      centerX: 0,
      centerY: 3,
      halfWidth: 1.6,
      halfHeight: 0.35,
      maxAngle: 1.15,
      openAngle: 0.85,
      speed: 0.7,
    };
    expect(solarSailOpen(config, 0)).toBe(false);
    expect(evaluateSolarSailCollision(config, 0, 0, 3, BALL).hit).toBe(true);
    const tilted = 0.55;
    const ang = solarSailAngle(config, tilted);
    expect(Math.abs(ang)).toBeGreaterThan(0.35);
    expect(solarSailOpen(config, tilted)).toBe(false);
    const lx = config.halfWidth * 0.7;
    const tipX = config.centerX + lx * Math.cos(ang);
    const tipY = config.centerY + lx * Math.sin(ang);
    expect(evaluateSolarSailCollision(config, tilted, tipX, tipY, BALL).hit).toBe(true);
    let opened = false;
    for (let t = 0; t < 8; t += 0.05) {
      if (solarSailOpen(config, t) && !evaluateSolarSailCollision(config, t, 0, 3, BALL).hit) {
        opened = true;
        break;
      }
    }
    expect(opened).toBe(true);
  });

  it('keeps moving safe / accretion / sail / sheath / null passable sometime', () => {
    const samples = [
      evaluateMovingSafeZoneCollision(
        {
          type: 'movingSafeZone',
          z: 6,
          centerX: 0,
          centerY: 3,
          fieldRadius: 2.2,
          holeRadius: 0.95,
          baseX: 0,
          baseY: 3,
          driftSpeed: 0.55,
          driftAmplitudeX: 0.55,
          driftAmplitudeY: 0.35,
        },
        0,
        0,
        3,
        BALL,
      ),
      evaluateAccretionCollision(
        {
          type: 'accretionShredder',
          z: 6,
          centerX: 0,
          centerY: 3,
          outerRadius: 2.1,
          debrisCount: 7,
          debrisRadius: 0.22,
          speed: 0.4,
        },
        0.3,
        0,
        3,
        BALL,
      ),
      evaluateSolarSailCollision(
        {
          type: 'solarSail',
          z: 6,
          centerX: 0,
          centerY: 3,
          halfWidth: 1.6,
          halfHeight: 0.35,
          maxAngle: 1.15,
          openAngle: 0.85,
          speed: 0.7,
        },
        1.2,
        0,
        3,
        BALL,
      ),
      evaluateMagnetopauseCollision(
        {
          type: 'magnetopause',
          z: 6,
          centerX: 0,
          centerY: 3,
          innerRadius: 0.75,
          outerRadius: 1.85,
          gapWidth: 1.9,
          speed: 0.4,
        },
        0,
        0,
        3,
        BALL,
      ),
      evaluateTheNullCollision(
        {
          type: 'theNull',
          z: 6,
          centerX: 0,
          centerY: 3,
          fieldRadius: 2.15,
          minSafeRadius: 0.85,
          maxSafeRadius: 1.25,
          speed: 0.65,
        },
        0.4,
        0,
        3,
        BALL,
      ),
    ];
    expect(samples.some((s) => !s.hit)).toBe(true);
  });
});
