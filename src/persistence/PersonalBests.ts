import AsyncStorage from '@react-native-async-storage/async-storage';

// Keep the original storage namespace so renaming the app preserves existing progress.
const STORAGE_KEY = 'ball-game-cs.personal-bests.v1';

export type PersonalBests = {
  bestScore: number;
  longestRun: number;
  bestStreak: number;
  mostBullseyes: number;
  mostPerfects: number;
  furthestLoop: number;
};

export const EMPTY_BESTS: PersonalBests = {
  bestScore: 0,
  longestRun: 0,
  bestStreak: 0,
  mostBullseyes: 0,
  mostPerfects: 0,
  furthestLoop: 1,
};

export type RecordFlags = {
  score: boolean;
  longestRun: boolean;
  bestStreak: boolean;
  bullseyes: boolean;
  perfects: boolean;
  loop: boolean;
};

export function detectRecords(bests: PersonalBests, run: {
  score: number;
  challengesCleared: number;
  bestStreak: number;
  bullseyes: number;
  perfects: number;
  loopNumber: number;
}): RecordFlags {
  return {
    score: run.score > bests.bestScore,
    longestRun: run.challengesCleared > bests.longestRun,
    bestStreak: run.bestStreak > bests.bestStreak,
    bullseyes: run.bullseyes > bests.mostBullseyes,
    perfects: run.perfects > bests.mostPerfects,
    loop: run.loopNumber > bests.furthestLoop,
  };
}

export function mergeBests(bests: PersonalBests, run: {
  score: number;
  challengesCleared: number;
  bestStreak: number;
  bullseyes: number;
  perfects: number;
  loopNumber: number;
}): PersonalBests {
  return {
    bestScore: Math.max(bests.bestScore, run.score),
    longestRun: Math.max(bests.longestRun, run.challengesCleared),
    bestStreak: Math.max(bests.bestStreak, run.bestStreak),
    mostBullseyes: Math.max(bests.mostBullseyes, run.bullseyes),
    mostPerfects: Math.max(bests.mostPerfects, run.perfects),
    furthestLoop: Math.max(bests.furthestLoop, run.loopNumber),
  };
}

export async function loadPersonalBests(): Promise<PersonalBests> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...EMPTY_BESTS };
    }
    const parsed = JSON.parse(raw) as Partial<PersonalBests>;
    return { ...EMPTY_BESTS, ...parsed };
  } catch {
    return { ...EMPTY_BESTS };
  }
}

export async function savePersonalBests(bests: PersonalBests): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bests));
  } catch {
    // Persistence is best-effort on unsupported platforms.
  }
}

export async function resetPersonalBests(): Promise<PersonalBests> {
  const empty = { ...EMPTY_BESTS };
  await savePersonalBests(empty);
  return empty;
}
