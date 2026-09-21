import { describe, expect, it } from 'vitest';
import { WORLD1_LEVELS } from '../src/campaign/levels/world1';
import { AimSystem } from '../src/projectile/AimSystem';
import { Projectile } from '../src/projectile/Projectile';
import { ProjectileSystem } from '../src/projectile/ProjectileSystem';
import { ObstacleSlot } from '../src/obstacles/ObstacleSlot';
import { GAME_TUNING } from '../src/game/gameTuning';
import { scoreTarget } from '../src/target/TargetScoring';

function throwAt(level: number, fps: number, wait: number, pull: number, lateral = 0) {
  const def = WORLD1_LEVELS[level - 1];
  const aim = new AimSystem(); aim.setScreenSize(390, 844);
  aim.begin(195, 500); aim.move(195 + lateral, 500 + pull);
  const velocity = aim.end();
  const projectile = new Projectile(); const physics = new ProjectileSystem();
  projectile.velocity.set(velocity.vx, velocity.vy, velocity.vz);
  const slots = def.challenge.obstacles.map((config, i) => {
    const slot = new ObstacleSlot(String(i)); slot.applyConfig(config, 'workshop'); return slot;
  });
  let outcome = 'MISS';
  for (let frame = 1; frame <= fps * 4; frame++) {
    const dt = 1 / fps;
    slots.forEach(slot => slot.update(dt, wait + frame * dt));
    physics.integrate(projectile, dt);
    if (slots.some(slot => slot.testProjectileCrossing(projectile.previousPosition, projectile.position, GAME_TUNING.projectile.radius, wait + frame * dt, dt)?.hit)) {
      outcome = 'BLOCKED'; break;
    }
    const target = def.challenge.target;
    if (physics.crossedPlane(projectile, target.z ?? 12)) {
      const at = physics.interpolateAtZ(projectile, target.z ?? 12);
      outcome = scoreTarget(Math.hypot(at.x - target.x, at.y - target.y), target.radius).kind;
      break;
    }
  }
  projectile.dispose(); slots.forEach(slot => slot.dispose());
  return outcome;
}

describe('opening levels through actual aim, physics and collision code', () => {
  for (const level of [1, 2, 3]) {
    it(`level ${level} has a forgiving launch window at 30, 60 and 120 fps`, () => {
      for (const fps of [30, 60, 120]) {
        for (const wait of [0, 3, 6]) {
          const outcomes = [16, 24, 32, 40, 48].map(pull => throwAt(level, fps, wait, pull));
          const clear = outcomes.filter(outcome => outcome !== 'BLOCKED' && outcome !== 'MISS');
          expect(clear.length, `L${level} ${fps}fps wait=${wait}: ${outcomes}`).toBeGreaterThanOrEqual(3);
        }
      }
    });
    it(`level ${level} rejects a visibly off-axis throw`, () => {
      expect(['BLOCKED', 'MISS']).toContain(throwAt(level, 60, 0, 30, 100));
    });
  }
  it('tap, cancellation and an interrupted aim cannot launch', () => {
    const aim = new AimSystem(); aim.begin(195, 500); expect(aim.shouldLaunch()).toBe(false);
    aim.move(195, 550); expect(aim.shouldLaunch()).toBe(true);
    aim.move(195, 500); expect(aim.shouldLaunch()).toBe(false);
    aim.move(195, 550); aim.cancel(); expect(aim.shouldLaunch()).toBe(false);
  });
  it('equivalent proportional drags produce identical velocities across phone sizes', () => {
    const velocities = [[320, 568], [390, 844], [430, 932]].map(([width, height]) => {
      const aim = new AimSystem(); aim.setScreenSize(width, height);
      aim.begin(width / 2, height / 2); aim.move(width * .48, height * .55);
      return aim.end();
    });
    for (const v of velocities) {
      expect(v.vx).toBeCloseTo(velocities[0].vx, 8);
      expect(v.vy).toBeCloseTo(velocities[0].vy, 8);
      expect(v.vz).toBeCloseTo(velocities[0].vz, 8);
    }
  });
});
