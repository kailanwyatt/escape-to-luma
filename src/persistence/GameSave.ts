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
import { DEFAULT_SPARK_ID } from '../customization/sparks';
import { DEFAULT_TRAIL_ID } from '../customization/trails';

export const SAVE_VERSION = 4;
const STORAGE_KEY = 'ball-game-cs.save.v1';
const LEGACY_BESTS_KEY = 'ball-game-cs.personal-bests.v1';

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
  shards: number;
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
    hyperjump: number;
  };
  unlimitedEnergyExpiresAt: number;
  consecutiveFailuresOnLevel: number;
  lastPlayedLevel: number;
  stats: CampaignStats;
  /** Dev: allow Endless Voyage before campaign complete. */
  endlessUnlockedDev: boolean;
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
  shards: 0,
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
    hyperjump: 0,
  },
  unlimitedEnergyExpiresAt: 0,
  consecutiveFailuresOnLevel: 0,
  lastPlayedLevel: 1,
  stats: { ...EMPTY_CAMPAIGN_STATS },
  endlessUnlockedDev: false,
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
      energyUpdatedAt: Date.now(),
    },
  };
}

export function migrateSaveData(oldVersion: number, data: Partial<PersistentGameData>): PersistentGameData {
  const next = emptySave();
  if (data.playerProgress) {
    next.playerProgress = { ...EMPTY_PROGRESS, ...data.playerProgress };
  }
  if (data.selectedProjectileId) {
    next.selectedProjectileId = data.selectedProjectileId;
  }
  if (data.personalBests) {
    next.personalBests = { ...EMPTY_BESTS, ...data.personalBests };
  }
  if (data.milestoneRecords) {
    next.milestoneRecords = { ...EMPTY_MILESTONES, ...data.milestoneRecords };
  }
  if (data.lifetimeStats) {
    next.lifetimeStats = { ...EMPTY_LIFETIME, ...data.lifetimeStats };
  }
  if (data.settings) {
    next.settings = { ...DEFAULT_SETTINGS, ...data.settings };
  }
  if (typeof data.hasCompletedOnboarding === 'boolean') {
    next.hasCompletedOnboarding = data.hasCompletedOnboarding;
  }
  if (data.commercial) {
    next.commercial = { ...EMPTY_COMMERCIAL, ...data.commercial };
  }
  if (data.campaign) {
    next.campaign = {
      ...EMPTY_CAMPAIGN,
      ...data.campaign,
      completedLevels: { ...(data.campaign.completedLevels ?? {}) },
      unlockedWorldIds: data.campaign.unlockedWorldIds?.length
        ? [...data.campaign.unlockedWorldIds]
        : ['containment'],
      ownedSparkIds: data.campaign.ownedSparkIds?.length
        ? [...data.campaign.ownedSparkIds]
        : [DEFAULT_SPARK_ID],
      ownedTrailIds: data.campaign.ownedTrailIds?.length
        ? [...data.campaign.ownedTrailIds]
        : [DEFAULT_TRAIL_ID],
      boostInventory: { ...EMPTY_CAMPAIGN.boostInventory, ...data.campaign.boostInventory },
      stats: { ...EMPTY_CAMPAIGN_STATS, ...data.campaign.stats },
    };
  } else if (oldVersion < 4) {
    // Prototype → SPARK: keep endless progress; start journey at level 1 with full energy.
    next.campaign.hasSeenOpening = false;
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
  if (!next.campaign.ownedSparkIds.includes(next.campaign.equippedSparkId)) {
    next.campaign.equippedSparkId = DEFAULT_SPARK_ID;
  }
  next.saveVersion = SAVE_VERSION;
  return next;
}

export async function loadGameSave(): Promise<PersistentGameData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        GameLog.warnOnce('corrupt-save', 'Save data could not be parsed; using defaults');
        return emptySave();
      }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        GameLog.warnOnce('corrupt-save-shape', 'Save data was not an object; using defaults');
        return emptySave();
      }
      const data = parsed as Partial<PersistentGameData> & { saveVersion?: number };
      return migrateSaveData(data.saveVersion ?? 0, data);
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

export async function saveGameSave(save: PersistentGameData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...save, saveVersion: SAVE_VERSION }));
  } catch {
    // Persistence is best-effort.
  }
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
