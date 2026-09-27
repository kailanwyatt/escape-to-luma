import { describe, expect, it } from 'vitest';

import { getCampaignLevel } from '../src/campaign/levels';
import {
  evaluatePistonFieldCollision,
  pistonFieldStateAtTime,
} from '../src/obstacles/PistonFieldState';
import {
  clockHandsStateAtTime,
  evaluateClockHandsCollision,
} from '../src/obstacles/ClockHandsState';
import {
  elevatorBlocksStateAtTime,
  evaluateElevatorBlocksCollision,
} from '../src/obstacles/ElevatorBlocksState';
import {
  evaluatePulseRingCollision,
  pulseRingStateAtTime,
} from '../src/obstacles/PulseRingState';
import {
  evaluateScissorGateCollision,
  scissorGateStateAtTime,
} from '../src/obstacles/ScissorGateState';
import {
  evaluateGroundCutLasersCollision,
  groundCutLasersStateAtTime,
} from '../src/obstacles/GroundCutLasersState';
import {
  speedFieldStateAtTime,
  speedMultiplierAt,
} from '../src/obstacles/SpeedFieldState';
import { LibraryObstacle } from '../src/obstacles/LibraryObstacle';
import * as THREE from 'three';

describe('new obstacle library families', () => {
  it('piston field rams thrust up from the floor into the flight band', () => {
    const config = {
      type: 'pistonField' as const,
      z: 5,
      laneCount: 4,
      spacing: 1.2,
      floorY: 0.12,
      clearY: 2.15,
      pistonHeight: 0.48,
      maxExtension: 3.35,
      minExtension: 0.12,
      speed: 1,
    };
    const a = pistonFieldStateAtTime(config, 1.25);
    const b = pistonFieldStateAtTime(config, 1.25);
    expect(a).toEqual(b);
    expect(a).toHaveLength(4);
    for (const lane of a) {
      expect(lane.floorY).toBeCloseTo(0.12, 5);
      expect(lane.y).toBeCloseTo(lane.floorY + lane.height / 2, 5);
      expect(lane.top).toBeCloseTo(lane.floorY + lane.height, 5);
    }
    // Fully extended tip crosses mid-corridor; retracted tip stays under clearY.
    let blockedAtFlight = false;
    let openAtFlight = false;
    for (let t = 0; t < 8; t += 0.05) {
      const lanes = pistonFieldStateAtTime(config, t);
      const mid = lanes[Math.floor(lanes.length / 2)];
      if (mid.open) {
        expect(mid.top).toBeLessThanOrEqual(config.clearY);
        if (!evaluatePistonFieldCollision(config, t, mid.x, 3, 0.2).hit) openAtFlight = true;
      } else if (evaluatePistonFieldCollision(config, t, mid.x, 3, 0.2).hit) {
        blockedAtFlight = true;
      }
    }
    expect(blockedAtFlight).toBe(true);
    expect(openAtFlight).toBe(true);
  });

  it('clock hands rotate with shared hub state', () => {
    const config = {
      type: 'clockHands' as const,
      z: 5,
      hubX: 0,
      hubY: 3,
      length: 2,
      thickness: 0.1,
      handCount: 2 as const,
      speed: 0.5,
    };
    const t0 = clockHandsStateAtTime(config, 0);
    const t1 = clockHandsStateAtTime(config, Math.PI);
    expect(t0.hands).toHaveLength(2);
    expect(t1.hands[0].angle).not.toBeCloseTo(t0.hands[0].angle);
    expect(evaluateClockHandsCollision(config, 0, 0, 3, 0.15).hit).toBe(true);
  });

  it('snapClose scanner holds a gap then slams one arm shut', () => {
    const config = {
      type: 'clockHands' as const,
      z: 5,
      hubX: 0,
      hubY: 4,
      length: 1.9,
      thickness: 0.09,
      handCount: 2 as const,
      speed: 1,
      motionMode: 'snapClose' as const,
      driftSpeed: 0,
      snapOpenHold: 1,
      snapWarningHold: 0.25,
      snapSlamDuration: 0.15,
      snapClosedHold: 0.4,
      snapOpenDuration: 0.3,
      snapOpenGap: Math.PI * 0.6,
      snapClosedGap: 0.2,
    };
    const open = clockHandsStateAtTime(config, 0.2);
    expect(open.phase).toBe('open');
    expect(Math.abs(open.hands[1].angle - open.hands[0].angle)).toBeCloseTo(Math.PI * 0.6, 5);

    expect(clockHandsStateAtTime(config, 1.1).phase).toBe('warning');
    expect(clockHandsStateAtTime(config, 1.35).phase).toBe('slamming');

    const closed = clockHandsStateAtTime(config, 1.5);
    expect(closed.phase).toBe('closed');
    expect(Math.abs(closed.hands[1].angle - closed.hands[0].angle)).toBeCloseTo(0.2, 5);
  });

  it('elevator blocks move lanes independently with phase offsets', () => {
    const config = {
      type: 'elevatorBlocks' as const,
      z: 5,
      laneCount: 3,
      spacing: 1.4,
      baseY: 3,
      amplitude: 1,
      speed: 1,
    };
    const blocks = elevatorBlocksStateAtTime(config, 0.7);
    expect(new Set(blocks.map((b) => b.y.toFixed(3))).size).toBeGreaterThan(1);
    expect(evaluateElevatorBlocksCollision(config, 0.7, blocks[0].x, blocks[0].y, 0.2).hit).toBe(true);
  });

  it('pulse ring expands then cycles', () => {
    const config = {
      type: 'pulseRing' as const,
      z: 5,
      centerX: 0,
      centerY: 3,
      minRadius: 0.5,
      maxRadius: 2.5,
      thickness: 0.2,
      speed: 1,
    };
    const early = pulseRingStateAtTime(config, 0.1);
    const late = pulseRingStateAtTime(config, 0.9);
    expect(late.radius).toBeGreaterThan(early.radius);
    expect(evaluatePulseRingCollision(config, 0, 0, 3, 0.15).hit).toBe(false);
  });

  it('L40 pulse eye drifts so a center throw is not always free', () => {
    const level = getCampaignLevel(40)!;
    const obstacle = level.challenge.obstacles[0];
    expect(obstacle.type).toBe('pulseRing');
    if (obstacle.type !== 'pulseRing') return;
    expect(obstacle.driftAmplitude ?? 0).toBeGreaterThan(0.5);
    expect(obstacle.speed).toBeGreaterThan(0.5);

    let blocked = false;
    let clear = false;
    for (let t = 0; t < 8; t += 0.05) {
      const hit = evaluatePulseRingCollision(obstacle, t, 0, 3.05, 0.15).hit;
      if (hit) blocked = true;
      else clear = true;
    }
    expect(blocked).toBe(true);
    expect(clear).toBe(true);

    const a = pulseRingStateAtTime(obstacle, 0.2);
    const b = pulseRingStateAtTime(obstacle, 1.4);
    expect(Math.abs(a.centerX - b.centerX) + Math.abs(a.centerY - b.centerY)).toBeGreaterThan(0.2);
  });

  it('scissor gate shares one aperture angle for both bars', () => {
    const config = {
      type: 'scissorGate' as const,
      z: 5,
      centerX: 0,
      centerY: 3,
      barLength: 1.6,
      barThickness: 0.1,
      maxAngle: 0.8,
      speed: 1,
    };
    const state = scissorGateStateAtTime(config, 0.4);
    expect(state.bars[0].angle).toBeCloseTo(-state.bars[1].angle);
    expect(evaluateScissorGateCollision(config, 0.4, 0, 3, 0.15).clearance).toBeDefined();
  });

  it('scissor flutter bursts then slows before the next flap', () => {
    const config = {
      type: 'scissorGate' as const,
      z: 5,
      centerX: -1.05,
      centerY: 3.15,
      barLength: 1.65,
      barThickness: 0.09,
      minAngle: 0.06,
      maxAngle: 0.85,
      pattern: 'flutter' as const,
      speed: 1,
      flutterFlaps: 3,
      flutterBurst: 0.8,
      flutterRest: 1.2,
    };
    const burstSamples = [0.05, 0.2, 0.35, 0.5, 0.65].map((t) => scissorGateStateAtTime(config, t).angle);
    const burstSpan = Math.max(...burstSamples) - Math.min(...burstSamples);
    expect(burstSpan).toBeGreaterThan(0.4);
    expect(Math.min(...burstSamples)).toBeLessThan(0.15);

    const restPeak = scissorGateStateAtTime(config, 0.8 + 0.6).angle;
    expect(restPeak).toBeGreaterThan(0.55);

    // First sealed trough in the burst (negative sine peak).
    const sealed = scissorGateStateAtTime(config, 0.2).angle;
    expect(sealed).toBeLessThan(0.12);
  });

  it('L32 ground cutters fan open then cross with a portal slip lane', () => {
    const level = getCampaignLevel(32)!;
    const obstacle = level.challenge.obstacles[0];
    expect(obstacle.type).toBe('groundCutLasers');
    if (obstacle.type !== 'groundCutLasers') return;
    expect(obstacle.floorY).toBeLessThan(0);
    expect(obstacle.aimX).toBeCloseTo(level.challenge.target.x, 0);
    expect(obstacle.beamCount).toBeGreaterThanOrEqual(3);

    const open = groundCutLasersStateAtTime(obstacle, 0.9);
    expect(open.crossAmount).toBeLessThan(0.2);
    const midOpen = evaluateGroundCutLasersCollision(obstacle, 0.9, obstacle.aimX, 3.1, 0.15);
    expect(midOpen.hit).toBe(false);

    // Peak cross sits at half the cross-duty window.
    const peakT = ((obstacle.crossDuty ?? 0.34) * 0.5) / Math.max(0.2, obstacle.speed);
    const crossing = groundCutLasersStateAtTime(obstacle, peakT);
    expect(crossing.crossAmount).toBeGreaterThan(0.85);
    expect(crossing.beams.length).toBe(obstacle.beamCount);
  });

  it('speed field multiplies without lethal collision', () => {
    const config = {
      type: 'speedField' as const,
      z: 5,
      centerX: 0,
      centerY: 3,
      width: 2,
      height: 2,
      speedMultiplier: 1.5,
    };
    expect(speedMultiplierAt(config, 0, 0, 3)).toBe(1.5);
    expect(speedMultiplierAt(config, 0, 5, 3)).toBe(1);
    expect(speedFieldStateAtTime(config, 0).contains(0, 3)).toBe(true);
  });

  it('LibraryObstacle crossing uses interpolated arrival time', () => {
    const obstacle = new LibraryObstacle('lib');
    obstacle.applyConfig(
      {
        type: 'elevatorBlocks',
        z: 5,
        laneCount: 1,
        spacing: 1,
        baseY: 3,
        amplitude: 0,
        speed: 1,
        blockWidth: 2,
        blockHeight: 1,
      },
      'workshop',
    );
    const prev = new THREE.Vector3(0, 3, 4);
    const curr = new THREE.Vector3(0, 3, 6);
    const hit = obstacle.testProjectileCrossing(prev, curr, 0.2, 1, 0.1);
    expect(hit?.hit).toBeTruthy();
  });
});
