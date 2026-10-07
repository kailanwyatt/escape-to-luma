import type {CampaignLevelDefinition} from '../types';

/**
 * The first three post-lesson Ascent drills need a sharper skill ramp. Keep
 * one readable ring per level: players learn to lead a horizontal path, then
 * a vertical path, then an ellipse while compensating for stronger wind.
 */
const ASCENT_RING_MASTERY: Record<number, {
  windX: number;
  targetRadius: number;
  ringRadius: number;
  speed: number;
  amplitudeX: number;
  amplitudeY: number;
}> = {
  34: {windX: 0.32, targetRadius: 0.78, ringRadius: 0.91, speed: 0.72, amplitudeX: 0.82, amplitudeY: 0},
  35: {windX: -0.34, targetRadius: 0.78, ringRadius: 0.89, speed: 0.8, amplitudeX: 0, amplitudeY: 0.82},
  36: {windX: 0.36, targetRadius: 0.78, ringRadius: 0.9, speed: 0.86, amplitudeX: 0.72, amplitudeY: 0.46},
};

export function applyAscentDifficulty(source: CampaignLevelDefinition): CampaignLevelDefinition {
  const tuning = ASCENT_RING_MASTERY[source.levelNumber];
  if (!tuning) return source;
  const level: CampaignLevelDefinition = JSON.parse(JSON.stringify(source));
  const ring = level.challenge.obstacles.find((obstacle) => obstacle.type === 'movingRing');
  if (!ring || ring.type !== 'movingRing') return source;

  level.windX = tuning.windX;
  level.challenge.target.radius = tuning.targetRadius;
  ring.radius = tuning.ringRadius;
  ring.movement.speed = tuning.speed;
  ring.movement.amplitudeX = tuning.amplitudeX;
  ring.movement.amplitudeY = tuning.amplitudeY;
  if (level.levelNumber === 36) {
    // A generous rear ring makes the finale visibly different without relying
    // on a tiny near opening. Its offset phase asks the player to read both
    // crossings before throwing.
    level.challenge.obstacles.push({
      ...ring,
      z: 9,
      radius: 1.06,
      baseX: level.challenge.target.x * 0.75,
      baseY: ring.baseY,
      movement: {
        type: 'vertical',
        amplitudeX: 0,
        amplitudeY: 0.54,
        speed: 0.62,
        phase: Math.PI / 2,
      },
    });
  }
  level.challenge.tags = ['ascent-ring-mastery', ...(level.challenge.tags ?? [])];
  return level;
}
