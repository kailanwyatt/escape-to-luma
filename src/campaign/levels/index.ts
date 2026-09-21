import {applyEncounterProgression} from './EncounterProgression';
import {applyNewEncounters} from './NewEncounters';
import {applyPrecisionProgression} from './PrecisionProgression';
import {applyPrecisionBenchmark} from './PrecisionBenchmarks';
import {applyCityShutterProgression} from './CityShutterProgression';
import {rebalanceCampaign} from './CampaignBalance';
import {applyRicochetCourse} from './RicochetCourses';
import {applyWorldRotorVariants} from '../RotorWorldVariants';
import {composeCampaignLevel} from './LevelComposition';
import {applyPortalDifficulty} from '../PortalDifficulty';
import { WORLD1_LEVELS } from './world1';
import { WORLD2_LEVELS, buildWorlds3to10 } from './worldsPack';
import type { CampaignLevelDefinition } from '../types';

const ALL_LEVELS: CampaignLevelDefinition[] = [
  ...WORLD1_LEVELS,
  ...WORLD2_LEVELS,
  ...buildWorlds3to10(),
].map(applyPortalDifficulty).map(composeCampaignLevel).map(applyWorldRotorVariants).map(applyRicochetCourse).map(rebalanceCampaign).map(applyCityShutterProgression).map(applyPrecisionProgression).map(applyPrecisionBenchmark).map(applyNewEncounters).map(applyEncounterProgression);

const BY_NUMBER = new Map<number, CampaignLevelDefinition>();
for (const level of ALL_LEVELS) {
  BY_NUMBER.set(level.levelNumber, level);
}

export function getCampaignLevel(levelNumber: number): CampaignLevelDefinition | null {
  return BY_NUMBER.get(levelNumber) ?? null;
}

export function getPlayableCampaignLevels(): CampaignLevelDefinition[] {
  return ALL_LEVELS;
}

export function maxAuthoredCampaignLevel(): number {
  return Math.max(...BY_NUMBER.keys());
}

export { WORLD1_LEVELS, WORLD2_LEVELS };
