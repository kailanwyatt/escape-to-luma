import { describe, expect, it } from 'vitest';

import { ObstacleSlot } from '../src/obstacles/ObstacleSlot';
import { simulateToZ } from '../src/debug/ShotDiagnostics';
import { Projectile } from '../src/projectile/Projectile';
import { ProjectileSystem } from '../src/projectile/ProjectileSystem';

describe('runtime prediction parity', () => {
  it('predicts a moving gate from the same scaled clock used at runtime', () => {
    const slot = new ObstacleSlot('test');
    slot.applyConfig(
      {
        type: 'slidingGate',
        z: 4,
        openingWidth: 2,
        openingHeight: 3,
        baseX: 0,
        amplitude: 0.6,
        speed: 0.7,
        phase: 0.2,
      },
      'workshop',
    );
    slot.update(1, 1);
    const predicted = slot.predictState(0.5, 1);
    slot.update(0.5, 1.5);
    expect(slot.getDebugInfo().x).toBeCloseTo(predicted.x, 6);
  });
});

describe('projectile forces', () => {
  it('keeps diagnostic prediction aligned under wind and gravity wells', () => {
    const start = { x: 0, y: 3, z: 0 };
    const velocity = { vx: 0.15, vy: 2.5, vz: 6 };
    const forces = {
      windX: 0.28,
      gravityScale: 0.72,
      wells: [{ x: 0.8, y: 3.1, z: 2.5, strength: 1.1, radius: 3 }],
    };
    const predicted = simulateToZ(start, velocity, 5, 1 / 120, forces)!;

    const projectile = new Projectile();
    projectile.position.set(start.x, start.y, start.z);
    projectile.velocity.set(velocity.vx, velocity.vy, velocity.vz);
    const system = new ProjectileSystem();
    system.windX = forces.windX;
    system.gravityScale = forces.gravityScale;
    system.wells = forces.wells;
    while (!system.crossedPlane(projectile, 5)) {
      system.integrate(projectile, 1 / 120);
    }
    const actual = system.interpolateAtZ(projectile, 5);
    expect(actual.x).toBeCloseTo(predicted.x, 6);
    expect(actual.y).toBeCloseTo(predicted.y, 6);
    projectile.dispose();
  });

  it('applies wind consistently over fixed steps', () => {
    const projectile = new Projectile();
    const system = new ProjectileSystem();
    projectile.position.set(0, 3, 0);
    projectile.velocity.set(0, 0, 5);
    system.windX = 0.3;
    for (let step = 0; step < 60; step += 1) {
      system.integrate(projectile, 1 / 60);
    }
    expect(projectile.velocity.x).toBeCloseTo(0.3, 5);
    expect(projectile.position.x).toBeGreaterThan(0.14);
    projectile.dispose();
  });

  it('bends toward an in-range gravity well', () => {
    const projectile = new Projectile();
    const system = new ProjectileSystem();
    projectile.position.set(0, 3, 0);
    projectile.velocity.set(0, 0, 4);
    system.wells = [{ x: 1, y: 3, z: 1, strength: 1.2, radius: 4 }];
    for (let step = 0; step < 30; step += 1) {
      system.integrate(projectile, 1 / 60);
    }
    expect(projectile.position.x).toBeGreaterThan(0);
    projectile.dispose();
  });
});
