export const XP_REQUIRED = [
  0, 100, 225, 375, 550, 750, 975, 1225, 1500, 1800, 2125, 2475, 2850, 3250, 3675, 4125, 4600,
  5100, 5625, 6175,
] as const;

export const MAX_PLAYER_LEVEL = XP_REQUIRED.length;

export const XP_AWARD = {
  challengeCleared: 5,
  great: 1,
  bullseye: 2,
  perfect: 4,
  closeCall: 1,
  environmentCompleted: 10,
} as const;

export function playerLevelFromXp(totalXP: number): number {
  let level = 1;
  for (let i = 1; i < XP_REQUIRED.length; i += 1) {
    if (totalXP >= XP_REQUIRED[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return Math.min(MAX_PLAYER_LEVEL, level);
}

export function xpIntoLevel(totalXP: number): number {
  const level = playerLevelFromXp(totalXP);
  return totalXP - XP_REQUIRED[level - 1];
}

export function xpToNextLevel(totalXP: number): number {
  const level = playerLevelFromXp(totalXP);
  if (level >= MAX_PLAYER_LEVEL) {
    return 0;
  }
  return XP_REQUIRED[level] - XP_REQUIRED[level - 1];
}

export function xpForLevel(level: number): number {
  const clamped = Math.max(1, Math.min(MAX_PLAYER_LEVEL, Math.floor(level)));
  return XP_REQUIRED[clamped - 1];
}

export function awardRunXp(stats: {
  challengesCleared: number;
  greats: number;
  bullseyes: number;
  perfects: number;
  closeCalls: number;
  environmentsCompleted: number;
}): number {
  return (
    stats.challengesCleared * XP_AWARD.challengeCleared +
    stats.greats * XP_AWARD.great +
    stats.bullseyes * XP_AWARD.bullseye +
    stats.perfects * XP_AWARD.perfect +
    stats.closeCalls * XP_AWARD.closeCall +
    stats.environmentsCompleted * XP_AWARD.environmentCompleted
  );
}
