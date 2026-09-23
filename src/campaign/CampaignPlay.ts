import {devLevelsUnlocked} from '../config/devAccess';
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
import { RELEASE_POLICY } from '../config/release';

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
  if (!Number.isInteger(levelNumber) || levelNumber < 1 || levelNumber > RELEASE_POLICY.campaignMaxLevel) {
    return { ok: false, reason: 'missing' };
  }
  const synced = syncCampaignEnergy(campaign, now);
  if (!devLevelsUnlocked() && levelNumber > synced.highestUnlockedLevel) {
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
  if (
    !RELEASE_POLICY.freeRetries &&
    !replay &&
    !hasUnlimitedEnergy(synced, now) &&
    synced.currentEnergy <= 0
  ) {
    return { ok: false, reason: 'energy' };
  }
  return { ok: true };
}

export function applyLevelSuccess(
  save: PersistentGameData,
  definition: CampaignLevelDefinition,
  rank: PrecisionRank,
  closeCalls: number,
  options?: { firstClearValueBonus?: number },
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
  const { shards: baseShards, next } = computeShardReward(prev, rank);
  let shards = baseShards;
  // Solar Energy Harvest: modest first-clear only bonus (never replays).
  const bonusMult = options?.firstClearValueBonus ?? 1;
  if (!prev.cleared && bonusMult > 1 && shards > 0) {
    shards += Math.min(3, Math.max(1, Math.round(baseShards * (bonusMult - 1))));
  }
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

  if (definition.isWorldFinale && !prev.cleared) {
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

  // This outcome is a one-time event, not the persistent completion status.
  const campaignComplete =
    definition.levelNumber === RELEASE_POLICY.campaignMaxLevel && !campaign.campaignCompleted;
  if (campaignComplete) campaign.campaignCompleted = true;

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
  if (
    !RELEASE_POLICY.freeRetries &&
    options.consumeEnergy &&
    !hasUnlimitedEnergy(campaign) &&
    !options.usedSecondChance
  ) {
    const replay = prev.cleared;
    if (!replay) {
      if(campaign.currentEnergy===ECONOMY.maxEnergy)campaign.energyUpdatedAt=Date.now();
      campaign.currentEnergy = Math.max(0, campaign.currentEnergy - 1);
    }
  }
  return { ...save, campaign };
}

export function consumeBoosts(campaign: CampaignSave, boosts: SelectedBoosts): CampaignSave {
  const next = {
    ...campaign,
    boostInventory: { ...campaign.boostInventory },
  };
  const spend = (id: keyof CampaignSave['boostInventory']) => {
    if (!boosts[id as keyof SelectedBoosts]) return;
    next.boostInventory[id] = Math.max(0, next.boostInventory[id] - 1);
    next.stats = { ...next.stats, boostsUsed: next.stats.boostsUsed + 1 };
  };
  spend('guidance');
  spend('slowField');
  spend('secondChance');
  spend('portalBloom');
  spend('phaseShield');
  spend('timeLock');
  return next;
}

function structuredClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
