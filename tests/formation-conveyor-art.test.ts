import { describe, expect, it } from 'vitest';
import { FormationConveyorArt } from '../src/obstacles/FormationConveyorArt';
import { FormationObstacle } from '../src/obstacles/FormationObstacle';
import { isLegalCombination } from '../src/challenge/legalCombinations';
import { validateChallenge } from '../src/challenge/ChallengeValidator';
import { getCampaignLevel } from '../src/campaign/levels';
import type { FormationConfig } from '../src/config/ObstacleConfig';

const conveyor = (overrides: Partial<FormationConfig> = {}): FormationConfig => ({
  type: 'formation',
  variant: 'conveyor',
  z: 5.8,
  speed: 0.85,
  phase: 0,
  direction: 1,
  centerY: 3,
  ...overrides,
});

describe('FormationConveyorArt', () => {
  it('builds sculpted rocks with lane rails and a gap guide', () => {
    const art = new FormationConveyorArt(conveyor());
    expect(art.group.getObjectByName('conveyor-gap-guide')).toBeTruthy();
    expect(art.group.getObjectByName('conveyor-rail-0')).toBeTruthy();
    expect(art.group.getObjectByName('conveyor-rail-1')).toBeTruthy();
    expect(art.group.getObjectByName('conveyor-rock-0')).toBeTruthy();
    expect(art.group.getObjectByName('conveyor-wake-0')).toBeTruthy();
    art.update(1.25);
    expect(art.group.userData.blockCount).toBe(10);
    art.dispose();
  });

  it('wires through FormationObstacle for conveyor variants', () => {
    const obstacle = new FormationObstacle('test-conveyor');
    obstacle.applyConfig(conveyor({ direction: -1 }), 'space');
    expect(obstacle.group.getObjectByName('formation-conveyor-art')).toBeTruthy();
    obstacle.update(0.016, 0.5);
    obstacle.hide();
  });
});

const phaseGate = (z: number, speed: number, phase: number) => ({
  type: 'phaseGate' as const,
  z,
  centerX: 0,
  centerY: 3,
  fieldRadius: 1.1,
  speed,
  phase,
  openRatio: 0.45,
  warningRatio: 0.12,
});

describe('phaseGate legal combinations', () => {
  it('allows dual and triple phaseGate stacks', () => {
    const dual = [phaseGate(5.8, 0.55, 0), phaseGate(8.2, 0.48, 0.7)];
    const triple = [...dual, phaseGate(10.4, 0.42, 1.2)];
    expect(isLegalCombination(dual)).toBe(true);
    expect(isLegalCombination(triple)).toBe(true);
  });

  it('clears validator illegal-combo on authored phaseGate levels', () => {
    for (const n of [116, 129, 131, 134, 137, 142]) {
      const level = getCampaignLevel(n)!;
      expect(validateChallenge(level.challenge, n)).toBeNull();
    }
  });
});

describe('upper atmosphere iris floor', () => {
  it('keeps every UA iris above the validator floor while still able to seal', () => {
    for (const n of [46, 49, 51, 54, 57, 59, 60]) {
      const level = getCampaignLevel(n)!;
      expect(validateChallenge(level.challenge, n, {
        windX: level.windX,
        gravityScale: level.gravityScale,
        wells: level.gravityWells,
      })).toBeNull();
      for (const o of level.challenge.obstacles) {
        if (o.type !== 'iris') continue;
        expect(o.minRadius).toBeGreaterThanOrEqual(0.2);
        expect(o.minRadius).toBeLessThan(0.22);
      }
    }
  });
});
