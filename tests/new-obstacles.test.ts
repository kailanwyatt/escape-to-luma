import { describe, expect, it } from 'vitest';

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
