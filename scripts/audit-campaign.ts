import { validateChallenge } from '../src/challenge/ChallengeValidator';
import { estimateDifficulty } from '../src/challenge/difficulty';
import { getPlayableCampaignLevels } from '../src/campaign/levels';
import { WORLDS } from '../src/campaign/worlds';
import { isRotorConfig, obstacleTypeOf } from '../src/config/ObstacleConfig';

const levels = getPlayableCampaignLevels();
const failures: string[] = [];

if (levels.length !== 150) {
  failures.push(`expected 150 levels, found ${levels.length}`);
}

for (let number = 1; number <= 150; number += 1) {
  const level = levels.find((candidate) => candidate.levelNumber === number);
  if (!level) {
    failures.push(`level ${number}: missing`);
    continue;
  }
  const world = WORLDS.find((candidate) => candidate.id === level.worldId);
  if (!world || number < world.firstLevel || number > world.lastLevel) {
    failures.push(`level ${number}: invalid world boundary`);
  }
  const issue = validateChallenge(
    level.challenge,
    Math.max(level.challenge.difficulty, estimateDifficulty(level.challenge)),
    {
      windX: level.windX,
      gravityScale: level.gravityScale,
      wells: level.gravityWells,
    },
  );
  if (issue) {
    failures.push(`level ${number}: ${issue}`);
  }
  for (const obstacle of level.challenge.obstacles) {
    const type = obstacleTypeOf(obstacle);
    if (isRotorConfig(obstacle) && obstacle.rotationSpeed > 0.82) {
      failures.push(`level ${number}: rotor speed ${obstacle.rotationSpeed}`);
    }
    if (type === 'slidingGate' && obstacle.type === 'slidingGate' && obstacle.openingWidth < 1.45) {
      failures.push(`level ${number}: gate width ${obstacle.openingWidth}`);
    }
  }
  if (Math.abs(level.windX ?? 0) > 0.36) {
    failures.push(`level ${number}: wind ${level.windX}`);
  }
}

for (const world of WORLDS) {
  const finale = levels.find((level) => level.levelNumber === world.lastLevel);
  if (!finale?.isWorldFinale) {
    failures.push(`${world.name}: level ${world.lastLevel} is not a finale`);
  }
  if (world.stub) {
    failures.push(`${world.name}: unexpectedly stubbed`);
  }
}

if (failures.length > 0) {
  console.error(`Campaign audit failed (${failures.length})`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  const families = Array.from(
    new Set(levels.flatMap((level) => level.challenge.obstacles.map(obstacleTypeOf))),
  ).sort();
  console.log(`Campaign audit passed: 150 levels, 10 worlds, ${families.length} obstacle families.`);
}
