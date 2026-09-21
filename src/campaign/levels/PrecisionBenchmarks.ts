import type {CampaignLevelDefinition} from '../types';

/** Three playtest benchmarks. Keep identity/rewards and shared physics unchanged. */
export function applyPrecisionBenchmark(source: CampaignLevelDefinition): CampaignLevelDefinition {
  if (![44, 68, 86].includes(source.levelNumber)) return source;
  const level: CampaignLevelDefinition = JSON.parse(JSON.stringify(source));
  const {target, obstacles} = level.challenge;
  target.radius = .78;
  if (level.levelNumber === 44) {
    Object.assign(target, {x: 1.3, y: 3.8});
    const ring = obstacles[0];
    if (ring.type === 'movingRing') {
      Object.assign(ring, {z: 5.4, radius: .78, baseX: .65, baseY: 2.7});
      Object.assign(ring.movement, {amplitudeX: .55, amplitudeY: .6, speed: .66});
    }
    obstacles[1].z = 8.7;
  } else if (level.levelNumber === 68) {
    Object.assign(target, {x: -1.3, y: 2.5});
    const near = obstacles[0], far = obstacles[1];
    if (near.type === 'pendulum' && far.type === 'pendulum') {
      Object.assign(near, {z: 4.8, pivotX: -.52, pivotY: 3.7, length: 1.6, blockerRadius: .61, maxAngle: .56, speed: .88, phase: 1});
      Object.assign(far, {z: 9.1, pivotX: -.98, pivotY: 4.05, length: 1.6, blockerRadius: .61, maxAngle: .5, speed: 1.07, phase: 1});
    }
  } else {
    Object.assign(target, {x: -1.28, y: 3.7});
    const orbiter = obstacles[0];
    if (orbiter.type === 'orbiter') {
      Object.assign(orbiter, {z: 5.3, centerX: .15, centerY: 2.7, orbitRadius: .98, blockerRadius: .6, speed: -.8});
    }
    obstacles[1].z = 8.8;
  }
  return level;
}
