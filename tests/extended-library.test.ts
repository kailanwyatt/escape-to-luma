import { describe, expect, it } from 'vitest';

import {
  cometCrossingStateAtTime,
  conveyorGateBlocksAtTime,
  corkscrewStateAtTime,
  evaluateCometCrossingCollision,
  evaluateConveyorGateCollision,
  evaluateCorkscrewCollision,
  evaluateReactiveGateCollision,
  evaluateRollingApertureCollision,
  evaluateSplitShutterCollision,
  reactiveGateStateAtTime,
  rollingApertureStateAtTime,
  splitShutterStateAtTime,
} from '../src/obstacles/ExtendedLibraryState';

describe('extended library obstacle state', () => {
  it('split shutter seals, opens a short window, warns, then slams', () => {
    const config = {
      type: 'splitShutter' as const,
      z: 6,
      centerX: 0,
      centerY: 3,
      panelWidth: 1.5,
      panelHeight: 2.4,
      minGap: 0.1,
      maxGap: 2.2,
      speed: 1,
      closedHold: 0.5,
      openingDuration: 0.25,
      openHold: 0.4,
      warningHold: 0.2,
      slamDuration: 0.15,
    };
    expect(splitShutterStateAtTime(config, 0.1).phase).toBe('closed');
    expect(splitShutterStateAtTime(config, 0.1).gap).toBeCloseTo(0.1, 5);
    expect(evaluateSplitShutterCollision(config, 0.1, 0, 3, 0.22).hit).toBe(true);

    expect(splitShutterStateAtTime(config, 0.6).phase).toBe('opening');
    expect(splitShutterStateAtTime(config, 0.9).phase).toBe('open');
    expect(splitShutterStateAtTime(config, 0.9).gap).toBeCloseTo(2.2, 5);
    expect(evaluateSplitShutterCollision(config, 0.9, 0, 3, 0.22).hit).toBe(false);

    expect(splitShutterStateAtTime(config, 1.2).phase).toBe('warning');
    expect(splitShutterStateAtTime(config, 1.2).warning).toBe(true);
    expect(splitShutterStateAtTime(config, 1.4).phase).toBe('slamming');
    expect(splitShutterStateAtTime(config, 1.4).gap).toBeLessThan(2.2);
    expect(splitShutterStateAtTime(config, 0.1)).toEqual(splitShutterStateAtTime(config, 0.1));
  });

  it('reactive gate cycles closed → warning → open', () => {
    const config = {
      type: 'reactiveGate' as const,
      z: 6,
      centerX: 0,
      centerY: 3,
      closedWidth: 0.08,
      openWidth: 2.2,
      openHeight: 2.4,
      speed: 1,
      closedHold: 1,
      warningHold: 0.4,
      openHold: 1,
    };
    expect(reactiveGateStateAtTime(config, 0.2).phase).toBe('closed');
    expect(reactiveGateStateAtTime(config, 1.1).phase).toBe('warning');
    expect(reactiveGateStateAtTime(config, 1.6).phase).toBe('open');
    expect(evaluateReactiveGateCollision(config, 0.2, 0, 3, 0.18).hit).toBe(true);
    expect(evaluateReactiveGateCollision(config, 1.6, 0, 3, 0.18).hit).toBe(false);
  });

  it('conveyor gate wraps blockers and collides on contact', () => {
    const config = {
      type: 'conveyorGate' as const,
      z: 6,
      centerX: 0,
      centerY: 3,
      blockCount: 3,
      blockRadius: 0.34,
      wrapWidth: 5.6,
      speed: 1,
      phase: 0,
    };
    const blocks = conveyorGateBlocksAtTime(config, 0);
    expect(blocks).toHaveLength(3);
    const hit = evaluateConveyorGateCollision(config, 0, blocks[0].x, blocks[0].y, 0.22);
    expect(hit.hit).toBe(true);
    // Mid-gap between first two blockers should clear with ball radius 0.22.
    const midX = (blocks[0].x + blocks[1].x) / 2;
    const clear = evaluateConveyorGateCollision(config, 0, midX, 3, 0.22);
    expect(clear.hit).toBe(false);
  });

  it('rolling aperture drifts while radius pulses', () => {
    const config = {
      type: 'rollingAperture' as const,
      z: 6,
      baseX: 0,
      baseY: 3,
      minRadius: 0.95,
      maxRadius: 1.55,
      pulseSpeed: 1,
      driftSpeed: 0.35,
      driftAmplitudeX: 0.4,
      driftAmplitudeY: 0.22,
      phase: 0,
    };
    const a = rollingApertureStateAtTime(config, 1);
    const b = rollingApertureStateAtTime(config, 1);
    expect(a).toEqual(b);
    expect(a.radius).toBeGreaterThanOrEqual(0.95);
    expect(evaluateRollingApertureCollision(config, 1, a.x, a.y, 0.22).hit).toBe(false);
    expect(evaluateRollingApertureCollision(config, 1, a.x + 3, a.y, 0.22).hit).toBe(true);
  });

  it('corkscrew hits the hub and solid plate; clears only the timed sector', () => {
    const config = {
      type: 'corkscrewTunnel' as const,
      z: 6,
      centerX: 0,
      centerY: 3,
      radius: 1.85,
      gapWidth: 0.82,
      innerRadius: 0.28,
      speed: 0,
      phase: 0,
    };
    const state = corkscrewStateAtTime(config, 0);
    // Hub is solid — no free pass through the middle.
    expect(evaluateCorkscrewCollision(config, 0, 0, 3, 0.22).hit).toBe(true);
    // Through the gap sector.
    const gx = state.centerX + Math.cos(state.gapAngle) * 1.2;
    const gy = state.centerY + Math.sin(state.gapAngle) * 1.2;
    expect(evaluateCorkscrewCollision(config, 0, gx, gy, 0.22).hit).toBe(false);
    // Opposite side of the disk is solid.
    const bx = state.centerX + Math.cos(state.gapAngle + Math.PI) * 1.2;
    const by = state.centerY + Math.sin(state.gapAngle + Math.PI) * 1.2;
    expect(evaluateCorkscrewCollision(config, 0, bx, by, 0.22).hit).toBe(true);
  });

  it('comet crossing loops along the authored diagonal', () => {
    const config = {
      type: 'cometCrossing' as const,
      z: 6,
      startX: -2,
      startY: 2,
      endX: 2,
      endY: 4,
      blockerRadius: 0.45,
      speed: 0.5,
      phase: 0,
    };
    const start = cometCrossingStateAtTime(config, 0);
    expect(start.x).toBeCloseTo(-2, 5);
    expect(start.y).toBeCloseTo(2, 5);
    const mid = cometCrossingStateAtTime(config, 1);
    expect(mid.x).toBeCloseTo(0, 5);
    expect(evaluateCometCrossingCollision(config, 0, start.x, start.y, 0.18).hit).toBe(true);
    expect(evaluateCometCrossingCollision(config, 0, 0, 3, 0.18).hit).toBe(false);
  });
});
