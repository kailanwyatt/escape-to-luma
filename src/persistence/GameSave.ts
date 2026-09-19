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

export const SAVE_VERSION = 3;
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
  next.playerProgress.playerLevel = playerLevelFromXp(next.playerProgress.totalXP);
  const unlocked = new Set([
    ...unlockedProjectileIds(next.playerProgress.playerLevel),
    ...(next.playerProgress.unlockedProjectileIds ?? []),
  ]);
  next.playerProgress.unlockedProjectileIds = Array.from(unlocked);
  if (!next.playerProgress.unlockedProjectileIds.includes(next.selectedProjectileId)) {
    next.selectedProjectileId = DEFAULT_PROJECTILE_ID;
  }
  next.saveVersion = SAVE_VERSION;
  void oldVersion;
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
