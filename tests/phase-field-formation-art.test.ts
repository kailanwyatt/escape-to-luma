import { describe, expect, it } from 'vitest';
import { PhaseFieldArt } from '../src/obstacles/PhaseFieldArt';
import { PhaseFieldObstacle } from '../src/obstacles/PhaseFieldObstacle';
import { FormationObstacle } from '../src/obstacles/FormationObstacle';
import { ShiftingApertureObstacle } from '../src/obstacles/ShiftingApertureObstacle';
import { getCampaignLevel } from '../src/campaign/levels';
import type { FormationConfig } from '../src/config/ObstacleConfig';

describe('PhaseFieldArt', () => {
  it('keeps solid/ghost names and adds frame pods', () => {
    const art = new PhaseFieldArt({
      type: 'phaseField',
      z: 6,
      centerX: 0,
      centerY: 3,
      fieldRadius: 1.6,
      speed: 1,
      openRatio: 0.5,
    });
    expect(art.group.getObjectByName('phase-solid')).toBeTruthy();
    expect(art.group.getObjectByName('phase-ghost')).toBeTruthy();
    expect(art.group.getObjectByName('phase-pod-0')).toBeTruthy();
    expect(art.group.getObjectByName('phase-field-accent')).toBeTruthy();
    art.update(0);
    expect(art.open).toBe(true);
    art.update(Math.PI * 1.5);
    expect(art.open).toBe(false);
    art.dispose();
  });

  it('wires through PhaseFieldObstacle', () => {
    const o = new PhaseFieldObstacle('field');
    o.applyConfig(
      { type: 'phaseField', z: 6, centerX: 0, centerY: 3, fieldRadius: 1.8, speed: 1, openRatio: 0.5 },
      'space',
    );
    expect(o.group.getObjectByName('phase-field-art')).toBeTruthy();
    o.update(0, 0);
    expect(o.open).toBe(true);
    o.hide();
  });
});

describe('formation expandingDebris and phaseColumns art', () => {
  const base = (variant: FormationConfig['variant']): FormationConfig => ({
    type: 'formation',
    variant,
    z: 6,
    speed: 0.8,
    phase: 0,
    direction: 1,
    centerY: 3,
  });

  it('builds expanding debris kit', () => {
    const o = new FormationObstacle('expand');
    o.applyConfig(base('expandingDebris'), 'space');
    expect(o.group.getObjectByName('formation-expanding-debris-art')).toBeTruthy();
    expect(o.group.getObjectByName('expand-halo')).toBeTruthy();
    o.update(0.016, 0.7);
    o.hide();
  });

  it('builds phase columns kit', () => {
    const o = new FormationObstacle('columns');
    o.applyConfig(base('phaseColumns'), 'space');
    expect(o.group.getObjectByName('formation-phase-columns-art')).toBeTruthy();
    expect(o.group.getObjectByName('phase-column-0')).toBeTruthy();
    o.update(0.016, 0.5);
    o.hide();
  });
});

describe('shifting aperture rail teach', () => {
  it('adds shift rail and hub beside the aperture wash', () => {
    const config = getCampaignLevel(121)!.challenge.obstacles.find((o) => o.type === 'shiftingAperture')!;
    if (config.type !== 'shiftingAperture') throw new Error('Expected aperture');
    const o = new ShiftingApertureObstacle('rail');
    o.applyConfig(config, 'space');
    expect(o.group.getObjectByName('aperture-wash')).toBeTruthy();
    expect(o.group.getObjectByName('shift-rail')).toBeTruthy();
    expect(o.group.getObjectByName('shift-hub')).toBeTruthy();
    o.update(0.016, 1.2);
  });
});
