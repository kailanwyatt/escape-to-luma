import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { getCampaignLevel } from '../src/campaign/levels';
import { hasPlayableCorridor } from '../src/challenge/playableCorridor';
import {
  evaluateRotatingGateCollision,
  rotatingGateStateAtTime,
} from '../src/obstacles/RotatingGateState';
import { RotatingGateArt } from '../src/obstacles/RotatingGateArt';
import {
  energyFieldStateAtTime,
  evaluateEnergyFieldCollision,
} from '../src/obstacles/EnergyFieldState';
import { EnergyFieldArt } from '../src/obstacles/EnergyFieldArt';
import {
  evaluatePhaseGateCollision,
  phaseGateStateAtTime,
} from '../src/obstacles/PhaseGateState';
import { PhaseGateArt } from '../src/obstacles/PhaseGateArt';
import {
  evaluateRepulsorCollision,
  repulsorAsWell,
  repulsorStateAtTime,
} from '../src/obstacles/RepulsorState';
import { RepulsorArt } from '../src/obstacles/RepulsorArt';
import {
  evaluateNullTendrilCollision,
  nullTendrilStateAtTime,
} from '../src/obstacles/NullTendrilState';
import { NullTendrilArt } from '../src/obstacles/NullTendrilArt';
import {
  evaluateNullLashCollision,
  nullLashStateAtTime,
} from '../src/obstacles/NullLashState';
import { NullLashArt } from '../src/obstacles/NullLashArt';
import { evaluateScissorGateCollision } from '../src/obstacles/ScissorGateState';

const BALL = 0.22;

describe('rotatingGate', () => {
  const config = {
    type: 'rotatingGate' as const,
    z: 6,
    centerX: 0,
    centerY: 3,
    outerRadius: 1.9,
    innerRadius: 0.28,
    gapWidth: 0.78,
    speed: 0.85,
  };

  it('hits the hub and solid plate; clears only the timed sector', () => {
    const state = rotatingGateStateAtTime(config, 0);
    // Center hub is solid — no free pass through the middle.
    expect(evaluateRotatingGateCollision(config, 0, 0, 3, BALL).hit).toBe(true);
    const gapX = Math.cos(state.gapAngle) * 1.2;
    const gapY = 3 + Math.sin(state.gapAngle) * 1.2;
    expect(evaluateRotatingGateCollision(config, 0, gapX, gapY, BALL).hit).toBe(false);
    const solidAng = state.gapAngle + Math.PI;
    const solidX = Math.cos(solidAng) * 1.2;
    const solidY = 3 + Math.sin(solidAng) * 1.2;
    expect(evaluateRotatingGateCollision(config, 0, solidX, solidY, BALL).hit).toBe(true);
  });

  it('ships on Ascent L33', () => {
    const level = getCampaignLevel(33)!;
    expect(level.challenge.obstacles[0]?.type).toBe('rotatingGate');
  });

  it('disposes cinematic art', () => {
    const art = new RotatingGateArt(config);
    art.update(0.5);
    art.dispose();
    expect(art.group.children).toHaveLength(0);
  });
});

describe('energyField', () => {
  const config = {
    type: 'energyField' as const,
    z: 6,
    centerX: 0,
    centerY: 3,
    halfWidth: 2.55,
    halfHeight: 2.05,
    holeRadius: 0.88,
    driftAmplitudeX: 1.2,
    driftSpeed: 0.52,
    speed: 0.52,
  };

  it('hits the curtain outside the drifting opening', () => {
    // Peak right drift: opening far from center — center throw hits the field.
    const peak = Math.PI / (2 * config.driftSpeed);
    const state = energyFieldStateAtTime(config, peak);
    expect(state.openingX).toBeGreaterThan(0.9);
    expect(evaluateEnergyFieldCollision(config, peak, 0, 3, BALL).hit).toBe(true);
    expect(
      evaluateEnergyFieldCollision(config, peak, state.openingX, state.openingY, BALL).hit,
    ).toBe(false);
    // Opening sweeps L↔R over time.
    const later = energyFieldStateAtTime(config, peak + Math.PI / config.driftSpeed);
    expect(later.openingX).toBeLessThan(-0.9);
    expect(later.driftDir).not.toBe(state.driftDir);
  });

  it('ships a drifting full-width field on Orbital Graveyard L70', () => {
    const level = getCampaignLevel(70)!;
    const o = level.challenge.obstacles[0];
    expect(o?.type).toBe('energyField');
    if (o?.type === 'energyField') {
      expect(o.halfWidth).toBeGreaterThan(2);
      expect(o.driftAmplitudeX).toBeGreaterThan(0.5);
      expect(
        hasPlayableCorridor(level.challenge, {
          gravityScale: level.gravityScale ?? 1,
          windX: level.windX ?? 0,
        }),
      ).toBe(true);
    }
  });

  it('disposes cinematic art', () => {
    const art = new EnergyFieldArt(config);
    art.update(1);
    art.dispose();
    expect(art.group.children).toHaveLength(0);
  });
});

describe('phaseGate', () => {
  const config = {
    type: 'phaseGate' as const,
    z: 6,
    centerX: 0,
    centerY: 3,
    fieldRadius: 1.15,
    speed: 1,
    openRatio: 0.4,
    warningRatio: 0.14,
  };

  it('cycles solid → warning → open', () => {
    const phases = new Set(
      [0, 0.2, 0.4, 0.55, 0.7, 0.9].map((t) => phaseGateStateAtTime(config, t).phase),
    );
    expect(phases.has('solid')).toBe(true);
    expect(phases.has('open')).toBe(true);
    expect(evaluatePhaseGateCollision(config, 0.8, 0, 3, BALL).hit).toBe(false);
  });

  it('depth-cascades so L129/L142 stacks and their progressions are playable', () => {
    // L146 is a world finale — progression does not remount the L142 stack there.
    for (const n of [129, 131, 134, 142]) {
      const level = getCampaignLevel(n)!;
      expect(level.challenge.obstacles.every((o) => o.type === 'phaseGate')).toBe(true);
      expect(level.challenge.obstacles).toHaveLength(3);
      expect(
        hasPlayableCorridor(level.challenge, {
          gravityScale: level.gravityScale ?? 1,
          windX: level.windX ?? 0,
        }),
      ).toBe(true);
    }
  });

  it('disposes cinematic art', () => {
    const art = new PhaseGateArt(config);
    art.update(0.2);
    art.dispose();
    expect(art.group.children).toHaveLength(0);
  });
});

describe('repulsor', () => {
  const config = {
    type: 'repulsor' as const,
    z: 6,
    centerX: 0,
    centerY: 3,
    coreRadius: 0.48,
    fieldRadius: 2.65,
    strength: 14,
    pulseSpeed: 1.15,
  };

  it('hits only the solid core and maps to a push well', () => {
    expect(evaluateRepulsorCollision(config, 0, 0, 3, BALL).hit).toBe(true);
    expect(evaluateRepulsorCollision(config, 0, 1.5, 3, BALL).hit).toBe(false);
    const well = repulsorAsWell(config);
    expect(well.strength).toBeLessThan(0);
    expect(well.radius).toBe(config.fieldRadius);
    expect(repulsorStateAtTime(config, 0.5).pulse).toBeGreaterThan(0);
  });

  it('ships on Drift L100', () => {
    expect(getCampaignLevel(100)!.challenge.obstacles[0]?.type).toBe('repulsor');
  });

  it('disposes cinematic art', () => {
    const art = new RepulsorArt(config);
    art.update(0.8);
    art.dispose();
    expect(art.group.children).toHaveLength(0);
  });
});

describe('nullTendril', () => {
  const config = {
    type: 'nullTendril' as const,
    z: 6,
    centerX: 0,
    centerY: 3,
    outerRadius: 2.15,
    innerRadius: 0.45,
    tendrilCount: 5,
    gapWidth: 0.95,
    speed: 0.55,
  };

  it('keeps a rotating corridor through the tendrils', () => {
    const state = nullTendrilStateAtTime(config, 0.4);
    expect(evaluateNullTendrilCollision(config, 0.4, 0, 3, BALL).hit).toBe(false);
    const gapX = Math.cos(state.gapAngle) * 1.3;
    const gapY = 3 + Math.sin(state.gapAngle) * 1.3;
    expect(evaluateNullTendrilCollision(config, 0.4, gapX, gapY, BALL).hit).toBe(false);
    const solidAng = state.gapAngle + Math.PI;
    expect(
      evaluateNullTendrilCollision(
        config,
        0.4,
        Math.cos(solidAng) * 1.3,
        3 + Math.sin(solidAng) * 1.3,
        BALL,
      ).hit,
    ).toBe(true);
  });

  it('ships as the_null pre-boss on L111', () => {
    const level = getCampaignLevel(111)!;
    expect(level.worldId).toBe('the_null');
    expect(level.challenge.obstacles[0]?.type).toBe('nullTendril');
  });

  it('disposes cinematic art', () => {
    const art = new NullTendrilArt(config);
    art.update(1.1);
    art.dispose();
    expect(art.group.children).toHaveLength(0);
  });
});

describe('nullLash', () => {
  const config = {
    type: 'nullLash' as const,
    z: 6,
    pivotX: 0,
    pivotY: 4.75,
    length: 2.6,
    thickness: 0.18,
    restAngle: 0.95,
    lashSpan: -Math.PI / 2 - 0.95,
    speed: 1.05,
    coiledHold: 0.48,
    warningHold: 0.26,
    lashDuration: 0.2,
    extendedHold: 0.75,
    retractDuration: 0.38,
  };

  it('is clear while coiled and blocks the flight band when extended', () => {
    expect(nullLashStateAtTime(config, 0.05).phase).toBe('coiled');
    expect(evaluateNullLashCollision(config, 0.05, -0.55, 3.05, BALL).hit).toBe(false);
    let foundExtended = false;
    for (let t = 0; t < 6; t += 0.04) {
      const state = nullLashStateAtTime(config, t);
      if (state.phase !== 'extended') continue;
      foundExtended = true;
      // Spine hangs through the playable corridor — a center throw must hit.
      expect(evaluateNullLashCollision(config, t, 0, 3.05, BALL).hit).toBe(true);
      expect(evaluateNullLashCollision(config, t, state.tipX, state.tipY, BALL).hit).toBe(true);
      // Side dodge still exists while it hangs — escape, don't fight.
      expect(evaluateNullLashCollision(config, t, -1.35, 3.05, BALL).hit).toBe(false);
      break;
    }
    expect(foundExtended).toBe(true);
  });

  it('ships as the get-away teach on L112 before theNull boss', () => {
    const lash = getCampaignLevel(112)!;
    const boss = getCampaignLevel(113)!;
    expect(lash.worldId).toBe('the_null');
    expect(lash.challenge.obstacles[0]?.type).toBe('nullLash');
    expect(boss.challenge.obstacles[0]?.type).toBe('theNull');
    expect(hasPlayableCorridor(lash.challenge)).toBe(true);
    expect(hasPlayableCorridor(boss.challenge)).toBe(true);
  });

  it('disposes cinematic art', () => {
    const art = new NullLashArt(config);
    art.update(1.4);
    art.dispose();
    expect(art.group.children).toHaveLength(0);
  });
});

describe('theNull art', () => {
  it('disposes purple scaled field art', async () => {
    const { TheNullArt } = await import('../src/obstacles/TheNullArt');
    const art = new TheNullArt({
      type: 'theNull',
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
    });
    art.update(1.2);
    art.dispose();
    expect(art.group.children).toHaveLength(0);
  });
});

describe('false_home membranes replace panel columns', () => {
  it('ships dual phaseGates on L116 instead of formation panels', () => {
    const level = getCampaignLevel(116)!;
    expect(level.worldId).toBe('false_home');
    expect(level.challenge.obstacles).toHaveLength(2);
    expect(level.challenge.obstacles.every((o) => o.type === 'phaseGate')).toBe(true);
    expect(hasPlayableCorridor(level.challenge)).toBe(true);
  });
});

describe('scissorGate city debut', () => {
  it('ships capture pincers on City L21', () => {
    const level = getCampaignLevel(21)!;
    expect(level.worldId).toBe('city');
    expect(level.challenge.obstacles[0]?.type).toBe('scissorGate');
    expect(
      evaluateScissorGateCollision(
        level.challenge.obstacles[0] as Extract<
          (typeof level.challenge.obstacles)[number],
          { type: 'scissorGate' }
        >,
        0.5,
        0,
        3.1,
        BALL,
      ).clearance,
    ).toBeDefined();
  });
});

// Keep THREE referenced for matrix-world art smoke if needed later.
void THREE;
