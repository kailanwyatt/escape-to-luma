import { describe, expect, it } from 'vitest';
import { FormationObstacle } from '../src/obstacles/FormationObstacle';
import { LibraryWorldArt } from '../src/obstacles/LibraryWorldArt';
import { LaserGridObstacle } from '../src/obstacles/LaserGridObstacle';
import { getCampaignLevel } from '../src/campaign/levels';

describe('finishing graphics kits', () => {
  it('builds alternating doors formation art', () => {
    const o = new FormationObstacle('doors');
    o.applyConfig(
      { type: 'formation', variant: 'alternatingDoors', z: 6.1, speed: 0.35, phase: 0, direction: 1, centerY: 3 },
      'workshop',
    );
    expect(o.group.getObjectByName('formation-alternating-doors-art')).toBeTruthy();
    expect(o.group.getObjectByName('door-gap-guide')).toBeTruthy();
    o.update(0.016, 0.4);
    o.hide();
  });

  it('wires orbiting moons, moving safe zone, and accretion shredder cinematic art', () => {
    for (const n of [71, 77, 93]) {
      const level = getCampaignLevel(n)!;
      const config = level.challenge.obstacles[0];
      const art = new LibraryWorldArt(config as never);
      if (n === 71) expect(art.group.getObjectByName('moving-safe-zone-art')).toBeTruthy();
      if (n === 77) expect(art.group.getObjectByName('orbiting-moons-art')).toBeTruthy();
      if (n === 93) expect(art.group.getObjectByName('accretion-shredder-art')).toBeTruthy();
      art.update(0.5);
      art.dispose();
    }
  });

  it('keeps laser grid accent teach', () => {
    const o = new LaserGridObstacle('grid');
    const config = getCampaignLevel(8)!.challenge.obstacles.find((x) => x.type === 'laserGrid')!;
    if (config.type !== 'laserGrid') throw new Error('expected laser');
    o.applyConfig(config, 'workshop');
    expect(o.group.getObjectByName('laser-grid-accent')).toBeTruthy();
    o.update(0.016, 0.3);
    o.hide();
  });
});
