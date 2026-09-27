/**
 * Save/content mapping for the 10→20 world migration.
 * Live WORLDS is now the 20-chapter layout; this module still documents legacy
 * source mapping and keeps dual-layout scaffolding helpers for saves.
 */

import { WORLDS, TOTAL_CORE_LEVELS } from './worlds';
import {
  REFACTORED_CHAPTERS,
  type LegacyWorldId,
  type RefactoredChapterId,
} from './refactoredWorlds';
import type { CampaignSave } from '../persistence/GameSave';
import { getCampaignLevel } from './levels';

/** Content epoch used when authored levels move to the 20-chapter layout. */
export const CAMPAIGN_CONTENT_EPOCH_LEGACY = 1;
export const CAMPAIGN_CONTENT_EPOCH_REFACTORED = 2;

/**
 * Authoritative forward map: each legacy world contributes content to one or
 * more target chapters. Splits (sky → ascent/storm) are explicit, not name matching.
 */
export const LEGACY_TO_REFACTORED: Record<LegacyWorldId, RefactoredChapterId[]> = {
  containment: ['containment', 'lockdown'],
  city: ['city'],
  sky: ['ascent', 'storm'],
  atmosphere: ['upper_atmosphere'],
  orbit: ['orbit', 'orbital_graveyard'],
  moon: ['moon', 'far_side'],
  asteroid: ['asteroid_belt', 'drift'],
  nebula: ['nebula', 'the_null', 'false_home'],
  network: ['false_home', 'ancient_network', 'the_machine'],
  homeward: ['the_signal', 'homeward', 'luma'],
};

/** Inverse helper: which legacy band a live level number came from. */
const LEGACY_BANDS: { id: LegacyWorldId; first: number; last: number }[] = [
  { id: 'containment', first: 1, last: 15 },
  { id: 'city', first: 16, last: 30 },
  { id: 'sky', first: 31, last: 45 },
  { id: 'atmosphere', first: 46, last: 60 },
  { id: 'orbit', first: 61, last: 75 },
  { id: 'moon', first: 76, last: 90 },
  { id: 'asteroid', first: 91, last: 105 },
  { id: 'nebula', first: 106, last: 120 },
  { id: 'network', first: 121, last: 135 },
  { id: 'homeward', first: 136, last: 150 },
];

export type LevelContentMapping = {
  legacyLevelNumber: number;
  legacyWorldId: LegacyWorldId;
  levelId: string;
  targetChapterId: RefactoredChapterId | null;
  indexInLegacyWorld: number;
};

export type CampaignMigrationPlan = {
  currentEpoch: typeof CAMPAIGN_CONTENT_EPOCH_REFACTORED;
  targetEpoch: typeof CAMPAIGN_CONTENT_EPOCH_REFACTORED;
  legacyWorldCount: number;
  targetChapterCount: number;
  legacyLevelCount: number;
  plannedTargetLevelCount: number;
  levelMappings: LevelContentMapping[];
  preserveLevelIds: true;
  preserveHighestUnlockedLevel: true;
};

function legacyWorldForLevel(level: number): LegacyWorldId {
  const band = LEGACY_BANDS.find((b) => level >= b.first && level <= b.last);
  return band?.id ?? 'containment';
}

/** Build a read-only migration plan from the legacy 10-world bands. */
export function buildCampaignMigrationPlan(): CampaignMigrationPlan {
  const levelMappings: LevelContentMapping[] = [];
  for (const band of LEGACY_BANDS) {
    const targets = LEGACY_TO_REFACTORED[band.id];
    for (let level = band.first; level <= band.last; level += 1) {
      const indexInLegacyWorld = level - band.first;
      let targetChapterId: RefactoredChapterId | null = targets[0] ?? null;
      if (targets.length > 1) {
        const mid = Math.ceil((band.last - band.first + 1) / targets.length);
        const slice = Math.min(targets.length - 1, Math.floor(indexInLegacyWorld / mid));
        targetChapterId = targets[slice] ?? targets[targets.length - 1];
      }
      const authored = getCampaignLevel(level);
      levelMappings.push({
        legacyLevelNumber: level,
        legacyWorldId: band.id,
        levelId: authored?.id ?? `missing-${level}`,
        targetChapterId,
        indexInLegacyWorld,
      });
    }
  }

  return {
    currentEpoch: CAMPAIGN_CONTENT_EPOCH_REFACTORED,
    targetEpoch: CAMPAIGN_CONTENT_EPOCH_REFACTORED,
    legacyWorldCount: LEGACY_BANDS.length,
    targetChapterCount: REFACTORED_CHAPTERS.length,
    legacyLevelCount: TOTAL_CORE_LEVELS,
    plannedTargetLevelCount: REFACTORED_CHAPTERS.reduce((sum, c) => sum + c.plannedLevelCount, 0),
    levelMappings,
    preserveLevelIds: true,
    preserveHighestUnlockedLevel: true,
  };
}

export type MigratedCampaignProgress = {
  highestUnlockedLevel: number;
  unlockedWorldIds: string[];
  completedLevelIds: string[];
  campaignCompleted: boolean;
  contentEpoch: number;
};

/**
 * Expand unlocks for the live 20-chapter layout from highestUnlockedLevel.
 */
export function previewRefactoredUnlocks(campaign: CampaignSave): MigratedCampaignProgress {
  const unlockedChapters = new Set<RefactoredChapterId>();
  for (const world of WORLDS) {
    if (world.firstLevel <= campaign.highestUnlockedLevel) {
      unlockedChapters.add(world.id as RefactoredChapterId);
    }
  }
  // Expand any lingering legacy IDs from older saves.
  for (const id of campaign.unlockedWorldIds) {
    const mapped = LEGACY_TO_REFACTORED[id as LegacyWorldId];
    if (mapped) {
      for (const chapterId of mapped) unlockedChapters.add(chapterId);
    } else if (WORLDS.some((w) => w.id === id)) {
      unlockedChapters.add(id as RefactoredChapterId);
    }
  }
  if (campaign.highestUnlockedLevel >= 1) {
    unlockedChapters.add('containment');
  }

  return {
    highestUnlockedLevel: campaign.highestUnlockedLevel,
    unlockedWorldIds: Array.from(unlockedChapters),
    completedLevelIds: Object.keys(campaign.completedLevels).filter(
      (id) => campaign.completedLevels[id]?.cleared,
    ),
    campaignCompleted: campaign.campaignCompleted,
    contentEpoch: CAMPAIGN_CONTENT_EPOCH_REFACTORED,
  };
}

/**
 * Stamp content epoch + live chapter unlocks after the WORLDS flip.
 */
export function applyDualLayoutScaffolding(campaign: CampaignSave): CampaignSave {
  const preview = previewRefactoredUnlocks(campaign);
  return {
    ...campaign,
    contentEpoch: CAMPAIGN_CONTENT_EPOCH_REFACTORED,
    unlockedWorldIds: preview.unlockedWorldIds,
    previewRefactoredChapterIds: preview.unlockedWorldIds,
  };
}

export function assertLegacyCoverage(): string[] {
  const errors: string[] = [];
  const covered = new Set<RefactoredChapterId>();
  for (const targets of Object.values(LEGACY_TO_REFACTORED)) {
    for (const id of targets) covered.add(id);
  }
  for (const chapter of REFACTORED_CHAPTERS) {
    if (!covered.has(chapter.id)) {
      errors.push(`uncovered chapter ${chapter.id}`);
    }
  }
  for (const world of WORLDS) {
    if (!REFACTORED_CHAPTERS.some((c) => c.id === world.id)) {
      errors.push(`live world missing from catalog ${world.id}`);
    }
  }
  void legacyWorldForLevel;
  return errors;
}
