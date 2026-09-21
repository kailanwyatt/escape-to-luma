import {t} from '../../i18n';
import { iris, pendulum, orbiter, Z_B } from './helpers';
import type { CampaignLevelDefinition } from '../types';
import type { ObstacleConfig } from '../../config/ObstacleConfig';
import { isRotorConfig } from '../../config/ObstacleConfig';

// Authored aiming routes, not random seeds. Position changes survive retries.
// Coordinates are world-space: +X appears on the left of the gameplay camera.
const ROUTES = [
  [0, 3], [0, 3.3], [0.4, 3], [-0.4, 3.1], [0, 2.7],
  [0.5, 3.3], [-0.5, 2.8], [0.25, 3.35], [-0.3, 3.25], [0.55, 2.85],
  [-0.55, 3], [0.35, 2.7], [-0.4, 3.4], [0.6, 3.15], [-0.6, 2.9],
] as const;
const RING_PATHS = ['horizontal','vertical','ellipse','horizontal','vertical','ellipse','horizontal','vertical','ellipse','horizontal','ellipse','vertical','horizontal','ellipse','vertical'] as const;

/** Compose readable routes on top of each world's authored speed/size ramp.
 * IDs, reward flags, story beats and mechanic introductions remain stable. */
export function composeCampaignLevel(input: CampaignLevelDefinition): CampaignLevelDefinition {
  const n = input.levelNumber;
  // Preserve the bespoke opening/security lessons and the safe reunion.
  if (n <= 15) {
    if (n !== 5) return input;
    return { ...input, tutorialHint: t("levelcomposition.aim_high_wait_for_the_arm"), challenge: {
      ...input.challenge, target: { ...input.challenge.target, x: 0.3, y: 3.3 },
    }};
  }
  if (n === 150) return input;
  const local = (n - 1) % 15;
  const [x, routeY] = ROUTES[local];
  // This debris/ring crossing needs a lower arc to clear both planes.
  const y = n === 103 ? 3.05 : routeY;
  const level = { ...input, challenge: { ...input.challenge, target: { ...input.challenge.target, x, y },
    obstacles: input.challenge.obstacles.map(o => JSON.parse(JSON.stringify(o)) as ObstacleConfig) } };
  // Early wind lessons face opposite crosswinds; strength still grows within the world.
  if (level.windX && [2,4,6,8,10,12,14].includes(local)) level.windX = -Math.abs(level.windX);
  for (let index = 0; index < level.challenge.obstacles.length; index++) {
    const obstacle = level.challenge.obstacles[index];
    const depthRatio = obstacle.z / (level.challenge.target.z ?? 12);
    // Keep the opening on the ballistic route, with a modest offset between planes.
    const routeX = x * depthRatio;
    const routeY = 3 + (y - 3) * 0.6;
    dressRoute(obstacle, routeX, routeY, local, index);
  }
  // The homeward mastery ramp continues through 149; only 150 is the safe arrival.
  if (n === 146) level.challenge.obstacles.push(pendulum(0.74, 0.68, Z_B));
  if (n === 148) level.challenge.obstacles.push(iris(0.48, 1.6, 0.82, Z_B));
  if (n === 149) level.challenge.obstacles.push(orbiter(0.8, 1.25, 0.32, Z_B));
  // Two-plane chapters use different approaches: matching, crossing, staggered,
  // reversed order. Order changes only where the existing pair is symmetric/legal.
  const obstacles = level.challenge.obstacles;
  if (obstacles.length === 2 && [9,12,14].includes(local) && canReverse(obstacles)) {
    const [near, far] = obstacles.map(o => o.z);
    obstacles.reverse(); obstacles[0].z = near; obstacles[1].z = far;
  }
  // Portal precision grows within each difficulty stage. A second hazard keeps
  // a larger target so timing and accuracy do not spike simultaneously.
  if (!obstacles.some(isRotorConfig)) {
    const floor = obstacles.length > 1 || level.gravityWells?.length ? 0.88 : 0.78;
    level.challenge.target.radius = Math.max(floor, level.challenge.target.radius - local / 14 * 0.06);
  }
  return level;
}

function dressRoute(o: ObstacleConfig, x: number, y: number, local: number, plane: number): void {
  const second = plane === 1;
  if (isRotorConfig(o)) {
    // A translating rotor is reserved for later mastery encounters.
    if (local >= 10) o.movement = { type: local % 2 ? 'vertical' : 'horizontal', amplitude: 0.18, speed: 0.32, phase: second ? 1.2 : 0 };
    return;
  }
  switch (o.type) {
    case 'slidingGate':
      o.baseX = x; o.baseY = y;
      if (local === 4 || local === 9) o.openingHeight = Math.max(2.25, o.openingHeight - 0.35);
      if (second) o.phase = local % 2 ? Math.PI : Math.PI / 2;
      break;
    case 'movingRing': {
      o.baseX = x; o.baseY = y;
      const type = RING_PATHS[(local + (second ? 4 : 0)) % 15];
      const amp = Math.max(o.movement.amplitudeX, o.movement.amplitudeY);
      o.movement = { ...o.movement, type, amplitudeX: type === 'vertical' ? 0 : amp,
        amplitudeY: type === 'horizontal' ? 0 : amp * (type === 'ellipse' ? 0.6 : 1),
        phase: second ? (local % 2 ? Math.PI : Math.PI / 2) : 0 };
      break;
    }
    case 'iris': o.centerX = x; o.centerY = y; o.phase = second ? (local % 2 ? Math.PI / 2 : Math.PI) : 0; break;
    case 'pendulum':
      o.pivotX = x; o.length = [1.85,2.1,2.3][local % 3];
      o.pivotY = y + o.length; o.phase = second ? Math.PI / 2 : 0;
      break;
    case 'orbiter':
      o.centerX = x; o.centerY = y;
      if (local % 3 === 1) o.speed = -Math.abs(o.speed);
      o.phase = second ? Math.PI : 0;
      break;
    case 'driftingBlocker':
      o.baseX += x; o.baseY = y;
      // Alternating lateral, climbing and diagonal debris passages.
      if (local % 3 === 1) { o.amplitudeY = o.amplitudeX * 0.8; o.amplitudeX *= 0.5; }
      if (local % 3 === 2) o.amplitudeY = 0.55;
      o.phase = second ? (local % 2 ? Math.PI : Math.PI / 2) : 0;
      break;
    case 'phaseField': o.centerX = x; o.centerY = y; o.phase = second ? Math.PI / 2 : 0; break;
    case 'shiftingAperture': o.baseX = x; o.baseY = y; o.phase = second ? Math.PI / 2 : 0; break;
  }
}

function canReverse(obstacles: ObstacleConfig[]): boolean {
  // Pendulum + ring is intentionally one-way in the legal pair catalog.
  return !obstacles.some(o => o.type === 'pendulum') || !obstacles.some(o => o.type === 'movingRing');
}
