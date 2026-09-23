import { describe, expect, it } from 'vitest';

import { emptySave } from '../src/persistence/GameSave';
import { WORLDS, TOTAL_CORE_LEVELS } from '../src/campaign/worlds';
import {
  REFACTORED_CHAPTERS,
  REFACTORED_PLANNED_CORE_LEVELS,
} from '../src/campaign/refactoredWorlds';
import {
  assertLegacyCoverage,
  applyDualLayoutScaffolding,
  buildCampaignMigrationPlan,
  previewRefactoredUnlocks,
  LEGACY_TO_REFACTORED,
  CAMPAIGN_CONTENT_EPOCH_REFACTORED,
} from '../src/campaign/worldMigration';
import { getCampaignLevel } from '../src/campaign/levels';

describe('20-world campaign migration plan', () => {
  it('uses live WORLDS as the 20-chapter / 150-level layout', () => {
    expect(WORLDS).toHaveLength(20);
    expect(TOTAL_CORE_LEVELS).toBe(150);
    expect(WORLDS[0].id).toBe('containment');
    expect(WORLDS[19].id).toBe('luma');
    expect(WORLDS.every((w) => w.lastLevel >= w.firstLevel)).toBe(true);
    expect(WORLDS[WORLDS.length - 1].lastLevel).toBe(150);
  });

  it('defines twenty target chapters with planned level budgets', () => {
    expect(REFACTORED_CHAPTERS).toHaveLength(20);
    expect(REFACTORED_PLANNED_CORE_LEVELS).toBeGreaterThanOrEqual(160);
    expect(REFACTORED_PLANNED_CORE_LEVELS).toBeLessThanOrEqual(200);
    expect(REFACTORED_CHAPTERS[19].id).toBe('luma');
    expect(REFACTORED_CHAPTERS[19].plannedLevelCount).toBeLessThanOrEqual(5);
  });

  it('maps every legacy world and covers every target chapter', () => {
    expect(assertLegacyCoverage()).toEqual([]);
    expect(LEGACY_TO_REFACTORED.sky).toEqual(['ascent', 'storm']);
  });

  it('builds a level mapping that preserves authored level IDs and unlock numbers', () => {
    const plan = buildCampaignMigrationPlan();
    expect(plan.legacyLevelCount).toBe(150);
    expect(plan.levelMappings).toHaveLength(150);
    expect(plan.preserveLevelIds).toBe(true);
    expect(plan.levelMappings[0]).toMatchObject({
      legacyLevelNumber: 1,
      levelId: 'w1-01',
      legacyWorldId: 'containment',
    });
    expect(plan.levelMappings.every((entry) => !entry.levelId.startsWith('missing-'))).toBe(true);
    expect(plan.levelMappings[30].legacyWorldId).toBe('sky');
  });

  it('assigns live levels into twenty chapter bands', () => {
    expect(getCampaignLevel(1)?.worldId).toBe('containment');
    expect(getCampaignLevel(9)?.worldId).toBe('lockdown');
    expect(getCampaignLevel(16)?.worldId).toBe('city');
    expect(getCampaignLevel(31)?.worldId).toBe('ascent');
    expect(getCampaignLevel(39)?.worldId).toBe('storm');
    expect(getCampaignLevel(147)?.worldId).toBe('luma');
    expect(getCampaignLevel(8)?.isWorldFinale).toBe(true);
    expect(getCampaignLevel(15)?.isWorldFinale).toBe(true);
  });

  it('previews unlock expansion from progress', () => {
    const save = emptySave();
    save.campaign.highestUnlockedLevel = 45;
    save.campaign.unlockedWorldIds = ['containment', 'city', 'sky'];
    const preview = previewRefactoredUnlocks(save.campaign);
    expect(preview.highestUnlockedLevel).toBe(45);
    expect(preview.unlockedWorldIds).toEqual(
      expect.arrayContaining(['containment', 'lockdown', 'city', 'ascent', 'storm']),
    );
    expect(preview.contentEpoch).toBe(CAMPAIGN_CONTENT_EPOCH_REFACTORED);
  });

  it('applies live 20-chapter unlock scaffolding', () => {
    const save = emptySave();
    save.campaign.highestUnlockedLevel = 45;
    save.campaign.unlockedWorldIds = ['containment', 'city', 'sky'];
    const next = applyDualLayoutScaffolding(save.campaign);
    expect(next.contentEpoch).toBe(CAMPAIGN_CONTENT_EPOCH_REFACTORED);
    expect(next.unlockedWorldIds).toEqual(
      expect.arrayContaining(['containment', 'lockdown', 'city', 'ascent', 'storm']),
    );
    expect(next.previewRefactoredChapterIds).toEqual(
      expect.arrayContaining(['containment', 'lockdown', 'city', 'ascent', 'storm']),
    );
  });
});
