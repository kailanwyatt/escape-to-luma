import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  EMPTY_BESTS,
  type PersonalBests,
} from './PersonalBests';
import { EMPTY_MILESTONES, type MilestoneRecords } from '../progression/milestones';
import {
  DEFAULT_PROJECTILE_ID,
  unlockedProjectileIds,
  type ProjectileId,
} from '../progression/projectiles';
import { playerLevelFromXp, xpForLevel } from '../progression/xp';
import { GameLog } from '../debug/GameLog';
import { ECONOMY } from '../config/economy';
import type { LevelProgress } from '../campaign/types';
import { WORLDS } from '../campaign/worlds';
import {
  applyDualLayoutScaffolding,
  CAMPAIGN_CONTENT_EPOCH_LEGACY,
  CAMPAIGN_CONTENT_EPOCH_REFACTORED,
} from '../campaign/worldMigration';
import { DEFAULT_SPARK_ID } from '../customization/sparks';
import { DEFAULT_TRAIL_ID } from '../customization/trails';

export const SAVE_VERSION = 6;
// Keep the original storage namespace so renaming the app preserves existing progress.
const STORAGE_KEY = 'ball-game-cs.save.v1';
const BACKUP_KEY = 'ball-game-cs.save.v1.backup';
const LEGACY_BESTS_KEY = 'ball-game-cs.personal-bests.v1';
const MAX_CAMPAIGN_LEVEL = 150;
let writeQueue: Promise<boolean> = Promise.resolve(true);
let lastSaveError: string | null = null;

export type PlayerProgress = {
  totalXP: number;
  playerLevel: number;
  totalRuns: number;
  totalShotsCleared: number;
  totalBullseyes: number;
  totalPerfects: number;
  totalCloseCalls: number;
  highestScore: number;
  longestRun: number;
  bestStreak: number;
  unlockedProjectileIds: string[];
};

export type LifetimeStats = {
  workshopClears: number;
  rooftopClears: number;
  spaceClears: number;
};

export type GameSettings = {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  reduceMotion: boolean;
};

export type CommercialSave = {
  removeAds: boolean;
  bestScoreNoContinue: number;
  lastInterstitialAt: number;
  runsSinceLastInterstitial: number;
};

export type CampaignStats = {
  levelsCompleted: number;
  worldsCompleted: number;
  totalAttempts: number;
  failures: number;
  perfects: number;
  bullseyes: number;
  greats: number;
  closeCalls: number;
  shardsEarned: number;
  boostsUsed: number;
};

export type CampaignSave = {
  highestUnlockedLevel: number;
  completedLevels: Record<string, LevelProgress>;
  unlockedWorldIds: string[];
  campaignCompleted: boolean;
  hasSeenOpening: boolean;
  seenStoryIds?: string[];
  shards: number;
  processedPurchaseIds: string[];
  currentEnergy: number;
  energyUpdatedAt: number;
  ownedSparkIds: string[];
  equippedSparkId: string;
  ownedTrailIds: string[];
  equippedTrailId: string;
  boostInventory: {
    guidance: number;
    slowField: number;
    secondChance: number;
    portalBloom: number;
    hyperjump: number;
    phaseShield: number;
    timeLock: number;
  };
  unlimitedEnergyExpiresAt: number;
  consecutiveFailuresOnLevel: number;
  lastPlayedLevel: number;
  stats: CampaignStats;
  /** Dev: allow Endless Voyage before campaign complete. */
  endlessUnlockedDev: boolean;
  /**
   * Content layout epoch. 1 = live 10-world / 150-level catalog.
   * 2 reserved for refactored 20-chapter layout (not flipped live yet).
   */
  contentEpoch: number;
  /**
   * Preview unlocks for the 20-chapter map (dual-layout scaffolding).
   * Does not replace unlockedWorldIds or change playable WORLDS.
   */
  previewRefactoredChapterIds: string[];
};

export type PersistentGameData = {
  saveVersion: number;
  playerProgress: PlayerProgress;
  selectedProjectileId: string;
  personalBests: PersonalBests;
  milestoneRecords: MilestoneRecords;
  lifetimeStats: LifetimeStats;
  settings: GameSettings;
  hasCompletedOnboarding: boolean;
  commercial: CommercialSave;
  campaign: CampaignSave;
};

export const EMPTY_PROGRESS: PlayerProgress = {
  totalXP: 0,
  playerLevel: 1,
  totalRuns: 0,
  totalShotsCleared: 0,
  totalBullseyes: 0,
  totalPerfects: 0,
  totalCloseCalls: 0,
  highestScore: 0,
  longestRun: 0,
  bestStreak: 0,
  unlockedProjectileIds: [DEFAULT_PROJECTILE_ID],
};

export const EMPTY_LIFETIME: LifetimeStats = {
  workshopClears: 0,
  rooftopClears: 0,
  spaceClears: 0,
};

export const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  hapticsEnabled: true,
  reduceMotion: false,
};

export const EMPTY_COMMERCIAL: CommercialSave = {
  removeAds: false,
  bestScoreNoContinue: 0,
  lastInterstitialAt: 0,
  runsSinceLastInterstitial: 99,
};

export const EMPTY_CAMPAIGN_STATS: CampaignStats = {
  levelsCompleted: 0,
  worldsCompleted: 0,
  totalAttempts: 0,
  failures: 0,
  perfects: 0,
  bullseyes: 0,
  greats: 0,
  closeCalls: 0,
  shardsEarned: 0,
  boostsUsed: 0,
};

export const EMPTY_CAMPAIGN: CampaignSave = {
  highestUnlockedLevel: 1,
  completedLevels: {},
  unlockedWorldIds: ['containment'],
  campaignCompleted: false,
  hasSeenOpening: false,
  seenStoryIds: [],
  shards: 0,
  processedPurchaseIds: [],
  currentEnergy: ECONOMY.maxEnergy,
  energyUpdatedAt: Date.now(),
  ownedSparkIds: [DEFAULT_SPARK_ID],
  equippedSparkId: DEFAULT_SPARK_ID,
  ownedTrailIds: [DEFAULT_TRAIL_ID],
  equippedTrailId: DEFAULT_TRAIL_ID,
  boostInventory: {
    guidance: 0,
    slowField: 0,
    secondChance: 0,
    portalBloom: 0,
    hyperjump: 0,
    phaseShield: 0,
    timeLock: 0,
  },
  unlimitedEnergyExpiresAt: 0,
  consecutiveFailuresOnLevel: 0,
  lastPlayedLevel: 1,
  stats: { ...EMPTY_CAMPAIGN_STATS },
  endlessUnlockedDev: false,
  contentEpoch: 2,
  previewRefactoredChapterIds: [],
};

export function emptySave(): PersistentGameData {
  return {
    saveVersion: SAVE_VERSION,
    playerProgress: { ...EMPTY_PROGRESS, unlockedProjectileIds: [...EMPTY_PROGRESS.unlockedProjectileIds] },
    selectedProjectileId: DEFAULT_PROJECTILE_ID,
    personalBests: { ...EMPTY_BESTS },
    milestoneRecords: { ...EMPTY_MILESTONES },
    lifetimeStats: { ...EMPTY_LIFETIME },
    settings: { ...DEFAULT_SETTINGS },
    hasCompletedOnboarding: false,
    commercial: { ...EMPTY_COMMERCIAL },
    campaign: {
      ...EMPTY_CAMPAIGN,
      completedLevels: {},
      unlockedWorldIds: [...EMPTY_CAMPAIGN.unlockedWorldIds],
      ownedSparkIds: [...EMPTY_CAMPAIGN.ownedSparkIds],
      ownedTrailIds: [...EMPTY_CAMPAIGN.ownedTrailIds],
      boostInventory: { ...EMPTY_CAMPAIGN.boostInventory },
      stats: { ...EMPTY_CAMPAIGN_STATS },
      previewRefactoredChapterIds: [...EMPTY_CAMPAIGN.previewRefactoredChapterIds],
      energyUpdatedAt: Date.now(),
    },
  };
}

function finiteNumber(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}

function integer(value: unknown, fallback: number, min: number, max: number): number {
  return Math.round(finiteNumber(value, fallback, min, max));
}

function stringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }
  return Array.from(new Set(value.filter((entry): entry is string => typeof entry === 'string')));
}

function normalizeLevelProgress(value: unknown): LevelProgress | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const raw = value as Partial<LevelProgress>;
  const rank =
    raw.bestRank === 'GREAT' || raw.bestRank === 'BULLSEYE' || raw.bestRank === 'PERFECT'
      ? raw.bestRank
      : 'CLEAR';
  const rewards = raw.rewardsGranted;
  return {
    bestRank: rank,
    bestScore: integer(raw.bestScore, 0, 0, 1_000_000),
    attempts: integer(raw.attempts, 0, 0, 1_000_000),
    cleared: Boolean(raw.cleared),
    rewardsGranted: {
      clear: Boolean(rewards?.clear),
      great: Boolean(rewards?.great),
      bullseye: Boolean(rewards?.bullseye),
      perfect: Boolean(rewards?.perfect),
    },
  };
}

function normalizeCompletedLevels(value: unknown): Record<string, LevelProgress> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  const normalized: Record<string, LevelProgress> = {};
  for (const [id, progress] of Object.entries(value)) {
    const level = normalizeLevelProgress(progress);
    if (id.length <= 80 && level) {
      normalized[id] = level;
    }
  }
  return normalized;
}

function normalizeSave(data: Partial<PersistentGameData>): PersistentGameData {
  const next = emptySave();
  const player = data.playerProgress;
  if (player && typeof player === 'object') {
    next.playerProgress = {
      ...EMPTY_PROGRESS,
      ...player,
      totalXP: integer(player.totalXP, 0, 0, 100_000_000),
      playerLevel: 1,
      totalRuns: integer(player.totalRuns, 0, 0, 10_000_000),
      totalShotsCleared: integer(player.totalShotsCleared, 0, 0, 100_000_000),
      totalBullseyes: integer(player.totalBullseyes, 0, 0, 100_000_000),
      totalPerfects: integer(player.totalPerfects, 0, 0, 100_000_000),
      totalCloseCalls: integer(player.totalCloseCalls, 0, 0, 100_000_000),
      highestScore: integer(player.highestScore, 0, 0, 1_000_000_000),
      longestRun: integer(player.longestRun, 0, 0, 1_000_000),
      bestStreak: integer(player.bestStreak, 0, 0, 1_000_000),
      unlockedProjectileIds: stringArray(
        player.unlockedProjectileIds,
        EMPTY_PROGRESS.unlockedProjectileIds,
      ),
    };
  }
  next.selectedProjectileId =
    typeof data.selectedProjectileId === 'string'
      ? data.selectedProjectileId
      : DEFAULT_PROJECTILE_ID;
  next.personalBests = { ...EMPTY_BESTS, ...(data.personalBests ?? {}) };
  next.milestoneRecords = { ...EMPTY_MILESTONES, ...(data.milestoneRecords ?? {}) };
  next.lifetimeStats = { ...EMPTY_LIFETIME, ...(data.lifetimeStats ?? {}) };
  next.settings = { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) };
  next.hasCompletedOnboarding = Boolean(data.hasCompletedOnboarding);
  next.commercial = { ...EMPTY_COMMERCIAL, ...(data.commercial ?? {}) };

  const campaign = data.campaign;
  if (campaign && typeof campaign === 'object') {
    const highestUnlockedLevel = integer(
      campaign.highestUnlockedLevel,
      1,
      1,
      MAX_CAMPAIGN_LEVEL,
    );
    const unlockedFromProgress = WORLDS
      .filter((world) => world.firstLevel <= highestUnlockedLevel)
      .map((world) => world.id);
    const allowedWorldIds = new Set(WORLDS.map((world) => world.id));
    const unlockedWorldIds = stringArray(campaign.unlockedWorldIds, unlockedFromProgress)
      .filter((id) => allowedWorldIds.has(id as (typeof WORLDS)[number]['id']));
    next.campaign = {
      ...EMPTY_CAMPAIGN,
      ...campaign,
      highestUnlockedLevel,
      completedLevels: normalizeCompletedLevels(campaign.completedLevels),
      unlockedWorldIds: Array.from(new Set(['containment', ...unlockedFromProgress, ...unlockedWorldIds])),
      campaignCompleted: Boolean(campaign.campaignCompleted),
      hasSeenOpening: Boolean(campaign.hasSeenOpening),
      seenStoryIds: stringArray(campaign.seenStoryIds, []).slice(0, 200),
      shards: integer(campaign.shards, 0, 0, 100_000_000),
      processedPurchaseIds: stringArray(campaign.processedPurchaseIds, []).slice(-200),
      currentEnergy: integer(campaign.currentEnergy, ECONOMY.maxEnergy, 0, ECONOMY.maxEnergy),
      energyUpdatedAt: finiteNumber(campaign.energyUpdatedAt, Date.now(), 0, Number.MAX_SAFE_INTEGER),
      ownedSparkIds: stringArray(campaign.ownedSparkIds, [DEFAULT_SPARK_ID]),
      equippedSparkId:
        typeof campaign.equippedSparkId === 'string'
          ? campaign.equippedSparkId
          : DEFAULT_SPARK_ID,
      ownedTrailIds: stringArray(campaign.ownedTrailIds, [DEFAULT_TRAIL_ID]),
      equippedTrailId:
        typeof campaign.equippedTrailId === 'string'
          ? campaign.equippedTrailId
          : DEFAULT_TRAIL_ID,
      boostInventory: {
        guidance: integer(campaign.boostInventory?.guidance, 0, 0, 999),
        slowField: integer(campaign.boostInventory?.slowField, 0, 0, 999),
        secondChance: integer(campaign.boostInventory?.secondChance, 0, 0, 999),
        portalBloom: integer(campaign.boostInventory?.portalBloom, 0, 0, 999),
        hyperjump: integer(campaign.boostInventory?.hyperjump, 0, 0, 999),
        phaseShield: integer(campaign.boostInventory?.phaseShield, 0, 0, 999),
        timeLock: integer(campaign.boostInventory?.timeLock, 0, 0, 999),
      },
      unlimitedEnergyExpiresAt: finiteNumber(
        campaign.unlimitedEnergyExpiresAt,
        0,
        0,
        Number.MAX_SAFE_INTEGER,
      ),
      consecutiveFailuresOnLevel: integer(campaign.consecutiveFailuresOnLevel, 0, 0, 999),
      lastPlayedLevel: integer(
        campaign.lastPlayedLevel,
        1,
        1,
        highestUnlockedLevel,
      ),
      stats: {
        levelsCompleted: integer(campaign.stats?.levelsCompleted, 0, 0, MAX_CAMPAIGN_LEVEL),
        worldsCompleted: integer(campaign.stats?.worldsCompleted, 0, 0, WORLDS.length),
        totalAttempts: integer(campaign.stats?.totalAttempts, 0, 0, 100_000_000),
        failures: integer(campaign.stats?.failures, 0, 0, 100_000_000),
        perfects: integer(campaign.stats?.perfects, 0, 0, 100_000_000),
        bullseyes: integer(campaign.stats?.bullseyes, 0, 0, 100_000_000),
        greats: integer(campaign.stats?.greats, 0, 0, 100_000_000),
        closeCalls: integer(campaign.stats?.closeCalls, 0, 0, 100_000_000),
        shardsEarned: integer(campaign.stats?.shardsEarned, 0, 0, 100_000_000),
        boostsUsed: integer(campaign.stats?.boostsUsed, 0, 0, 100_000_000),
      },
      endlessUnlockedDev: Boolean(campaign.endlessUnlockedDev),
      contentEpoch: integer(campaign.contentEpoch, 1, 1, 2),
      previewRefactoredChapterIds: stringArray(campaign.previewRefactoredChapterIds, []).slice(0, 40),
    };
  }
  next.playerProgress.playerLevel = playerLevelFromXp(next.playerProgress.totalXP);
  return next;
}

export function migrateSaveData(oldVersion: number, data: Partial<PersistentGameData>): PersistentGameData {
  const next = normalizeSave(data);
  if (!data.campaign && oldVersion < 4) {
    // Prototype → SPARK: keep endless progress; start journey at level 1 with full energy.
    next.campaign.hasSeenOpening = false;
  }
  if (oldVersion < 6) {
    // 20-chapter layout: expand unlocks from progress; preserve level IDs.
    next.campaign = applyDualLayoutScaffolding({
      ...next.campaign,
      contentEpoch: CAMPAIGN_CONTENT_EPOCH_LEGACY,
    });
  } else if ((next.campaign.contentEpoch ?? 1) < CAMPAIGN_CONTENT_EPOCH_REFACTORED) {
    next.campaign = applyDualLayoutScaffolding(next.campaign);
  }
  next.playerProgress.playerLevel = playerLevelFromXp(next.playerProgress.totalXP);
  const unlocked = new Set([
    ...unlockedProjectileIds(next.playerProgress.playerLevel),
    ...(next.playerProgress.unlockedProjectileIds ?? []),
  ]);
  next.playerProgress.unlockedProjectileIds = Array.from(unlocked);
  if (!next.playerProgress.unlockedProjectileIds.includes(next.selectedProjectileId)) {
    next.selectedProjectileId = DEFAULT_PROJECTILE_ID;
  }
  if (!next.campaign.ownedSparkIds.includes(DEFAULT_SPARK_ID)) {
    next.campaign.ownedSparkIds.unshift(DEFAULT_SPARK_ID);
  }
  if (!next.campaign.ownedSparkIds.includes(next.campaign.equippedSparkId)) {
    next.campaign.equippedSparkId = DEFAULT_SPARK_ID;
  }
  if (!next.campaign.ownedTrailIds.includes(DEFAULT_TRAIL_ID)) {
    next.campaign.ownedTrailIds.unshift(DEFAULT_TRAIL_ID);
  }
  if (!next.campaign.ownedTrailIds.includes(next.campaign.equippedTrailId)) {
    next.campaign.equippedTrailId = DEFAULT_TRAIL_ID;
  }
  next.saveVersion = SAVE_VERSION;
  return next;
}

export async function loadGameSave(): Promise<PersistentGameData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const loaded = parseStoredSave(raw);
      if (loaded) {
        return loaded;
      }
      const backup = await AsyncStorage.getItem(BACKUP_KEY);
      const recovered = backup ? parseStoredSave(backup) : null;
      if (recovered) {
        GameLog.warnOnce('save-backup-recovered', 'Recovered progress from the save backup');
        return recovered;
      }
      GameLog.warnOnce('corrupt-save', 'Save data was invalid; using defaults');
      return emptySave();
    }
    const legacy = await AsyncStorage.getItem(LEGACY_BESTS_KEY);
    if (legacy) {
      const bests = JSON.parse(legacy) as Partial<PersonalBests>;
      const save = emptySave();
      save.personalBests = { ...EMPTY_BESTS, ...bests };
      save.playerProgress.highestScore = save.personalBests.bestScore;
      save.playerProgress.longestRun = save.personalBests.longestRun;
      save.playerProgress.bestStreak = save.personalBests.bestStreak;
      await saveGameSave(save);
      return save;
    }
    return emptySave();
  } catch {
    GameLog.warnOnce('save-load', 'Save load failed; using defaults');
    return emptySave();
  }
}

function parseStoredSave(raw: string): PersistentGameData | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    const data = parsed as Partial<PersistentGameData> & { saveVersion?: number };
    const version = integer(data.saveVersion, 0, 0, Number.MAX_SAFE_INTEGER);
    if (version > SAVE_VERSION) {
      GameLog.warnOnce('future-save', 'Save data is from a newer version; ignoring it safely');
      return null;
    }
    return migrateSaveData(version, data);
  } catch {
    return null;
  }
}

export function saveGameSave(save: PersistentGameData): Promise<boolean> {
  const snapshot = JSON.stringify({ ...normalizeSave(save), saveVersion: SAVE_VERSION });
  const write = async (): Promise<boolean> => {
    try {
      const previous = await AsyncStorage.getItem(STORAGE_KEY);
      if (previous && parseStoredSave(previous)) {
        await AsyncStorage.setItem(BACKUP_KEY, previous);
      }
      await AsyncStorage.setItem(STORAGE_KEY, snapshot);
      lastSaveError = null;
      return true;
    } catch (error) {
      lastSaveError = error instanceof Error ? error.message : 'Unknown save write failure';
      GameLog.warnOnce('save-write', `Save write failed: ${lastSaveError}`);
      return false;
    }
  };
  writeQueue = writeQueue.then(write, write);
  return writeQueue;
}

export function getLastSaveError(): string | null {
  return lastSaveError;
}

export async function flushGameSaveWrites(): Promise<boolean> {
  return writeQueue;
}

export async function resetGameSave(): Promise<PersistentGameData> {
  const empty = emptySave();
  await saveGameSave(empty);
  return empty;
}

export function setSaveLevel(save: PersistentGameData, level: number): PersistentGameData {
  const next = structuredCloneSave(save);
  next.playerProgress.totalXP = xpForLevel(level);
  next.playerProgress.playerLevel = playerLevelFromXp(next.playerProgress.totalXP);
  next.playerProgress.unlockedProjectileIds = unlockedProjectileIds(next.playerProgress.playerLevel);
  if (!next.playerProgress.unlockedProjectileIds.includes(next.selectedProjectileId)) {
    next.selectedProjectileId = DEFAULT_PROJECTILE_ID as ProjectileId;
  }
  return next;
}

export function structuredCloneSave(save: PersistentGameData): PersistentGameData {
  return JSON.parse(JSON.stringify(save)) as PersistentGameData;
}

export function hasUnlimitedEnergy(campaign: CampaignSave, now = Date.now()): boolean {
  return campaign.unlimitedEnergyExpiresAt > now;
}

export function isEndlessUnlocked(campaign: CampaignSave): boolean {
  return campaign.campaignCompleted || campaign.endlessUnlockedDev;
}
