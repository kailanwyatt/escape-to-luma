import type {CampaignLevelDefinition} from '../types';
import {isRotorConfig} from '../../config/ObstacleConfig';

/** Apply the approved precision lessons after the authored courses, before benchmarks.
 * New-world introductions, established City timing and the safe reunion stay intact.
 * Routes are authored deterministically; randomness only affects the existing encounter clock.
 */
export function applyPrecisionProgression(source: CampaignLevelDefinition): CampaignLevelDefinition {
  const n = source.levelNumber, local = (n - 1) % 15;
  if (n <= 7 || local < 3 || [28,44,68,86,150].includes(n)) return source;
  const level: CampaignLevelDefinition = JSON.parse(JSON.stringify(source));
  const c = level.challenge;
  // Introduction → practice → combinations → mastery, with smaller later-world allowances.
  const world = Math.floor((n - 1) / 15);
  const mastery = local >= 10;
  const pressure = (local - 2) / 12;
  c.target.radius = Math.min(c.target.radius, Math.max(.78, .91 - pressure * .1 - world * .008));
  // Authored bank-shot courses retain their reflector/target positions and bounce solutions.
  if (c.ricochet || n <= 30) return level;
  for (const [index,o] of c.obstacles.entries()) {
    if (isRotorConfig(o)) continue;
    switch(o.type) {
      case 'movingRing':
        o.radius = Math.max(.78, o.radius - .12 - pressure * .08);
        break;
      case 'iris':
        o.maxRadius = Math.max(1.0, o.maxRadius - .12 * pressure);
        break;
      case 'pendulum':
        // Put the weight into the ballistic approach rather than high above it.
        o.pivotY -= .2 + pressure * .2;
        o.blockerRadius = Math.min(.61, o.blockerRadius + .06 + pressure * .08);
        if (mastery) o.speed *= index === 0 ? 1.1 : 1.17;
        break;
      case 'orbiter':
        // Offset the orbit so the typical route no longer passes through its quiet center.
        o.centerX += (c.target.x > 0 ? -1 : 1) * (.18 + pressure * .2);
        o.orbitRadius = Math.max(o.blockerRadius + .4, o.orbitRadius - .15 * pressure);
        o.blockerRadius = Math.min(.58, o.blockerRadius + .05 + pressure * .06);
        break;
      case 'driftingBlocker':
        o.blockerRadius = Math.min(.78, o.blockerRadius + .05 * pressure);
        break;
      case 'phaseField':
        o.openRatio = Math.max(.3, (o.openRatio ?? .45) - .06 * pressure);
        break;
      case 'shiftingAperture':
        o.maxRadius = Math.max(o.minRadius + .2, o.maxRadius - .15 * pressure);
        break;
    }
  }
  // These low/high arcs need additional landing/ring clearance; do not relax validators.
  if (n === 64) c.target.radius = .84;
  if (n === 105 && c.obstacles[0].type === 'movingRing') c.obstacles[0].radius = .9;
  return level;
}
