import { ECONOMY } from '../config/economy';
import type { LevelProgress, PrecisionRank } from '../campaign/types';

export function emptyLevelProgress(): LevelProgress {
  return {
    bestRank: 'CLEAR',
    bestScore: 0,
    attempts: 0,
    cleared: false,
    rewardsGranted: { clear: false, great: false, bullseye: false, perfect: false },
  };
}

export function rankFromResult(kind: string): PrecisionRank | null {
  if (kind === 'HIT') {
    return 'CLEAR';
  }
  if (kind === 'GREAT' || kind === 'BULLSEYE' || kind === 'PERFECT') {
    return kind;
  }
  return null;
}

export function rankOrdinal(rank: PrecisionRank): number {
  switch (rank) {
    case 'CLEAR':
      return 1;
    case 'GREAT':
      return 2;
    case 'BULLSEYE':
      return 3;
    case 'PERFECT':
      return 4;
  }
}

export function scoreForRank(rank: PrecisionRank): number {
  switch (rank) {
    case 'CLEAR':
      return ECONOMY.score.CLEAR;
    case 'GREAT':
      return ECONOMY.score.GREAT;
    case 'BULLSEYE':
      return ECONOMY.score.BULLSEYE;
    case 'PERFECT':
      return ECONOMY.score.PERFECT;
  }
}

/** First-time + newly earned performance shard rewards only. */
export function computeShardReward(
  progress: LevelProgress,
  rank: PrecisionRank,
): { shards: number; next: LevelProgress; newlyGranted: string[] } {
  const next: LevelProgress = {
    ...progress,
    rewardsGranted: { ...progress.rewardsGranted },
    cleared: true,
    bestRank: rankOrdinal(rank) > rankOrdinal(progress.bestRank) || !progress.cleared ? rank : progress.bestRank,
    bestScore: Math.max(progress.bestScore, scoreForRank(rank)),
  };
  let shards = 0;
  const newlyGranted: string[] = [];
  if (!progress.rewardsGranted.clear) {
    shards += ECONOMY.shards.levelClear;
    next.rewardsGranted.clear = true;
    newlyGranted.push('clear');
  }
  if (rankOrdinal(rank) >= 2 && !progress.rewardsGranted.great) {
    shards += ECONOMY.shards.greatBonus;
    next.rewardsGranted.great = true;
    newlyGranted.push('great');
  }
  if (rankOrdinal(rank) >= 3 && !progress.rewardsGranted.bullseye) {
    shards += ECONOMY.shards.bullseyeBonus;
    next.rewardsGranted.bullseye = true;
    newlyGranted.push('bullseye');
  }
  if (rankOrdinal(rank) >= 4 && !progress.rewardsGranted.perfect) {
    shards += ECONOMY.shards.perfectBonus;
    next.rewardsGranted.perfect = true;
    newlyGranted.push('perfect');
  }
  return { shards, next, newlyGranted };
}
