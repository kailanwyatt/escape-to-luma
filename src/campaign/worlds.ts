import type { WorldDefinition, WorldId } from './types';
import { REFACTORED_CHAPTERS } from './refactoredWorlds';

/**
 * Live 20-chapter bands over the existing 150 authored levels.
 * Sparks unlock on the same legacy finale level numbers as before.
 */
const CHAPTER_BANDS: { id: WorldId; first: number; last: number; spark?: string }[] = [
  { id: 'containment', first: 1, last: 8 },
  { id: 'lockdown', first: 9, last: 15, spark: 'reactor' },
  { id: 'city', first: 16, last: 30, spark: 'neon' },
  { id: 'ascent', first: 31, last: 38 },
  { id: 'storm', first: 39, last: 45, spark: 'storm' },
  { id: 'upper_atmosphere', first: 46, last: 60, spark: 'aurora' },
  { id: 'orbit', first: 61, last: 68 },
  { id: 'orbital_graveyard', first: 69, last: 75, spark: 'solar' },
  { id: 'moon', first: 76, last: 83 },
  { id: 'far_side', first: 84, last: 90, spark: 'lunar' },
  { id: 'asteroid_belt', first: 91, last: 98 },
  { id: 'drift', first: 99, last: 105, spark: 'meteor' },
  { id: 'nebula', first: 106, last: 110 },
  { id: 'the_null', first: 111, last: 115 },
  { id: 'false_home', first: 116, last: 120, spark: 'nebula' },
  { id: 'ancient_network', first: 121, last: 125 },
  { id: 'the_machine', first: 126, last: 135, spark: 'ancient' },
  { id: 'the_signal', first: 136, last: 140 },
  { id: 'homeward', first: 141, last: 146 },
  { id: 'luma', first: 147, last: 150, spark: 'origin' },
];

function environmentFor(id: WorldId): WorldDefinition['environmentId'] {
  if (id === 'containment' || id === 'lockdown') return 'workshop';
  if (id === 'city' || id === 'ascent' || id === 'storm') return 'rooftop';
  return 'space';
}

export const WORLDS: WorldDefinition[] = CHAPTER_BANDS.map((band, index) => {
  const chapter = REFACTORED_CHAPTERS.find((c) => c.id === band.id)!;
  return {
    id: band.id,
    index: index + 1,
    name: chapter.name,
    subtitle: chapter.subtitle,
    firstLevel: band.first,
    lastLevel: band.last,
    environmentId: environmentFor(band.id),
    storyBeat: chapter.subtitle,
    primaryMechanics: chapter.obstacleFocus,
    homeSignalStrength: chapter.homeSignalStrength,
    distanceFromEarth: chapter.progressionRole,
    finaleName: chapter.name,
    completionSparkId: band.spark,
    stub: false,
  };
});

export const TOTAL_CORE_LEVELS = 150;

export function worldById(id: string): WorldDefinition | undefined {
  return WORLDS.find((world) => world.id === id);
}

export function worldForLevel(levelNumber: number): WorldDefinition | undefined {
  return WORLDS.find((world) => levelNumber >= world.firstLevel && levelNumber <= world.lastLevel);
}

export function journeyDestinationLabel(unlockedWorldIds: string[], campaignCompleted: boolean): string {
  if (campaignCompleted || unlockedWorldIds.includes('luma') || unlockedWorldIds.includes('homeward')) {
    return 'HOME';
  }
  return 'UNKNOWN';
}

/** Stamp chapter id + finale flags onto authored levels after composition. */
export function applyWorldBands(
  source: import('./types').CampaignLevelDefinition,
): import('./types').CampaignLevelDefinition {
  const world = worldForLevel(source.levelNumber);
  if (!world) return source;
  return {
    ...source,
    worldId: world.id,
    isWorldFinale: source.levelNumber === world.lastLevel,
  };
}
