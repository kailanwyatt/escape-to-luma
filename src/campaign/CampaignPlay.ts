import { ECONOMY } from '../config/economy';
import { getCampaignLevel } from './levels';
import type { CampaignLevelDefinition, PrecisionRank, SelectedBoosts } from './types';
import { worldById, worldForLevel } from './worlds';
import { computeShardReward, emptyLevelProgress, scoreForRank } from '../economy/rewards';
import {
  hasUnlimitedEnergy,
  type CampaignSave,
  type PersistentGameData,
} from '../persistence/GameSave';
import { regenerateEnergy } from '../economy/energy';

export function syncCampaignEnergy(campaign: CampaignSave, now = Date.now()): CampaignSave {
  const unlimited = hasUnlimitedEnergy(campaign, now);
  const regen = regenerateEnergy(campaign.currentEnergy, campaign.energyUpdatedAt, now, unlimited);
  return {
    ...campaign,
    currentEnergy: regen.energy,
    energyUpdatedAt: regen.energyUpdatedAt,
  };
}

export function canStartLevel(campaign: CampaignSave, levelNumber: number, now = Date.now()): {
  ok: boolean;
  reason?: 'locked' | 'missing' | 'energy' | 'stub';
} {
  const synced = syncCampaignEnergy(campaign, now);
  if (levelNumber > synced.highestUnlockedLevel) {
    return { ok: false, reason: 'locked' };
  }
  const def = getCampaignLevel(levelNumber);
  if (!def) {
    const world = worldForLevel(levelNumber);
    if (!world || world.stub) {
      return { ok: false, reason: 'stub' };
    }
    return { ok: false, reason: 'missing' };
  }
  const replay = Boolean(synced.completedLevels[def.id]?.cleared);
  if (!replay && !hasUnlimitedEnergy(synced, now) && synced.currentEnergy <= 0) {
    return { ok: false, reason: 'energy' };
  }
  return { ok: true };
}

export function applyLevelSuccess(
  save: PersistentGameData,
  definition: CampaignLevelDefinition,
  rank: PrecisionRank,
  closeCalls: number,
): {
  save: PersistentGameData;
  shardsGained: number;
  score: number;
  worldComplete: boolean;
  campaignComplete: boolean;
  unlockedSparkId: string | null;
  nextLevel: number;
} {
  const campaign = syncCampaignEnergy(structuredClone(save.campaign));
  const prev = campaign.completedLevels[definition.id] ?? emptyLevelProgress();
  const { shards, next } = computeShardReward(prev, rank);
  next.attempts = prev.attempts + 1;
  campaign.completedLevels[definition.id] = next;
  campaign.shards += shards;
  campaign.stats.shardsEarned += shards;
  campaign.stats.totalAttempts += 1;
  campaign.consecutiveFailuresOnLevel = 0;
  campaign.lastPlayedLevel = definition.levelNumber;
  if (rank === 'GREAT') {
    campaign.stats.greats += 1;
  }
  if (rank === 'BULLSEYE') {
    campaign.stats.bullseyes += 1;
  }
  if (rank === 'PERFECT') {
    campaign.stats.perfects += 1;
  }
  campaign.stats.closeCalls += closeCalls;

  let unlockedSparkId: string | null = null;
  let worldComplete = false;
  if (!prev.cleared) {
    campaign.stats.levelsCompleted += 1;
  }

  const nextLevel = definition.levelNumber + 1;
  if (nextLevel > campaign.highestUnlockedLevel) {
    campaign.highestUnlockedLevel = Math.min(150, nextLevel);
  }

  if (definition.isWorldFinale) {
    const world = worldById(definition.worldId);
    if (world) {
      worldComplete = true;
      campaign.shards += ECONOMY.shards.worldCompletion;
      campaign.stats.shardsEarned += ECONOMY.shards.worldCompletion;
      campaign.stats.worldsCompleted += 1;
      if (world.completionSparkId && !campaign.ownedSparkIds.includes(world.completionSparkId)) {
        campaign.ownedSparkIds.push(world.completionSparkId);
        unlockedSparkId = world.completionSparkId;
      }
      const nextWorld = worldForLevel(world.lastLevel + 1);
      if (nextWorld && !campaign.unlockedWorldIds.includes(nextWorld.id)) {
        campaign.unlockedWorldIds.push(nextWorld.id);
      }
    }
  }

  let campaignComplete = campaign.campaignCompleted;
  if (definition.levelNumber >= 150) {
    campaign.campaignCompleted = true;
    campaignComplete = true;
  }

  return {
    save: { ...save, campaign },
    shardsGained: shards + (worldComplete ? ECONOMY.shards.worldCompletion : 0),
    score: scoreForRank(rank),
    worldComplete,
    campaignComplete,
    unlockedSparkId,
    nextLevel: campaign.highestUnlockedLevel,
  };
}

export function applyLevelFailure(
  save: PersistentGameData,
  definition: CampaignLevelDefinition,
  options: { consumeEnergy: boolean; usedSecondChance: boolean },
): PersistentGameData {
  const campaign = syncCampaignEnergy(structuredClone(save.campaign));
  const prev = campaign.completedLevels[definition.id] ?? emptyLevelProgress();
  campaign.completedLevels[definition.id] = {
    ...prev,
    attempts: prev.attempts + 1,
  };
  campaign.stats.totalAttempts += 1;
  campaign.stats.failures += 1;
  campaign.consecutiveFailuresOnLevel += 1;
  campaign.lastPlayedLevel = definition.levelNumber;
  if (options.consumeEnergy && !hasUnlimitedEnergy(campaign) && !options.usedSecondChance) {
    const replay = prev.cleared;
    if (!replay) {
      campaign.currentEnergy = Math.max(0, campaign.currentEnergy - 1);
      campaign.energyUpdatedAt = Date.now();
    }
  }
  return { ...save, campaign };
}

export function consumeBoosts(campaign: CampaignSave, boosts: SelectedBoosts): CampaignSave {
  const next = {
    ...campaign,
    boostInventory: { ...campaign.boostInventory },
  };
  if (boosts.guidance) {
    next.boostInventory.guidance = Math.max(0, next.boostInventory.guidance - 1);
    next.stats = { ...next.stats, boostsUsed: next.stats.boostsUsed + 1 };
  }
  if (boosts.slowField) {
    next.boostInventory.slowField = Math.max(0, next.boostInventory.slowField - 1);
    next.stats = { ...next.stats, boostsUsed: next.stats.boostsUsed + 1 };
  }
  if (boosts.secondChance) {
    next.boostInventory.secondChance = Math.max(0, next.boostInventory.secondChance - 1);
    next.stats = { ...next.stats, boostsUsed: next.stats.boostsUsed + 1 };
  }
  return next;
}

function structuredClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
