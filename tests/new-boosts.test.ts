import { describe, expect, it } from 'vitest';

import { ECONOMY } from '../src/config/economy';
import {
  obstacleDeltaSeconds,
  obstacleTimeFromShot,
  remainingTimeLock,
} from '../src/game/obstacleClock';
import {
  classifyNonObstacleFailure,
  createPhaseShieldState,
  tryAbsorbObstacleHit,
} from '../src/game/phaseShield';
import { consumeBoosts } from '../src/campaign/CampaignPlay';
import { emptySave } from '../src/persistence/GameSave';

describe('obstacle clock (Time Lock + Slow Field)', () => {
  it('freezes obstacle time for the lock window then resumes', () => {
    expect(obstacleTimeFromShot({ shotTime: 0.5, slowFieldActive: false, timeLockDuration: 1.25 })).toBe(0);
    expect(obstacleTimeFromShot({ shotTime: 1.25, slowFieldActive: false, timeLockDuration: 1.25 })).toBe(0);
    expect(obstacleTimeFromShot({ shotTime: 2.25, slowFieldActive: false, timeLockDuration: 1.25 })).toBeCloseTo(1);
  });

  it('composes Slow Field after Time Lock in one policy', () => {
    const t = obstacleTimeFromShot({
      shotTime: 2.25,
      slowFieldActive: true,
      timeLockDuration: 1.25,
    });
    expect(t).toBeCloseTo(1 * ECONOMY.boostSlowFieldMultiplier);
  });

  it('returns zero obstacle dt while locked', () => {
    expect(
      obstacleDeltaSeconds({
        projectileDt: 0.1,
        shotTimeBefore: 0.2,
        timeLockDuration: 1.25,
        slowFieldActive: false,
      }),
    ).toBe(0);
    expect(
      obstacleDeltaSeconds({
        projectileDt: 0.2,
        shotTimeBefore: 1.2,
        timeLockDuration: 1.25,
        slowFieldActive: false,
      }),
    ).toBeCloseTo(0.15);
  });

  it('reports remaining lock time', () => {
    expect(remainingTimeLock(0.4, 1.25)).toBeCloseTo(0.85);
    expect(remainingTimeLock(2, 1.25)).toBe(0);
  });
});

describe('Phase Shield', () => {
  it('absorbs the first eligible obstacle hit then resumes normal rules', () => {
    let state = createPhaseShieldState(true);
    const first = tryAbsorbObstacleHit(state, 0.4);
    expect(first.absorbed).toBe(true);
    state = first.next;
    const second = tryAbsorbObstacleHit(state, 0.8);
    expect(second.absorbed).toBe(false);
  });

  it('does not forgive target miss or out-of-bounds', () => {
    const armed = createPhaseShieldState(true);
    const missed = classifyNonObstacleFailure(armed, 'target_miss');
    expect(missed.armed).toBe(true);
    expect(missed.consumed).toBe(false);
    expect(missed.lastClassifiedFailure).toBe('target_miss');
  });
});

describe('new boost inventory', () => {
  it('consumes Phase Shield and Time Lock once at launch', () => {
    const campaign = emptySave().campaign;
    campaign.boostInventory.phaseShield = 2;
    campaign.boostInventory.timeLock = 1;
    const next = consumeBoosts(campaign, { phaseShield: true, timeLock: true });
    expect(next.boostInventory.phaseShield).toBe(1);
    expect(next.boostInventory.timeLock).toBe(0);
    expect(campaign.boostInventory.phaseShield).toBe(2);
  });
});
