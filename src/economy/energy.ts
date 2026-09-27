import { ECONOMY } from '../config/economy';

export type RewardedEnergyAdTracker = {
  rewardedEnergyAdsDayKey: string;
  rewardedEnergyAdsToday: number;
};

export function utcDayKey(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

export function missingEnergy(currentEnergy: number): number {
  return Math.max(0, ECONOMY.maxEnergy - currentEnergy);
}

/** Shard price to fill the meter from `currentEnergy` (0 when already full). */
export function energyRefillShardCost(currentEnergy: number): number {
  return missingEnergy(currentEnergy) * ECONOMY.energyRefillCostPerEnergy;
}

export function rewardedEnergyAdsUsedToday(
  tracker: Partial<RewardedEnergyAdTracker>,
  now = Date.now(),
): number {
  if (tracker.rewardedEnergyAdsDayKey !== utcDayKey(now)) {
    return 0;
  }
  return Math.max(0, tracker.rewardedEnergyAdsToday ?? 0);
}

export function rewardedEnergyAdsRemaining(
  tracker: Partial<RewardedEnergyAdTracker>,
  now = Date.now(),
): number {
  return Math.max(0, ECONOMY.maxRewardedEnergyAdsPerDay - rewardedEnergyAdsUsedToday(tracker, now));
}

export function canWatchRewardedEnergyAd(
  tracker: Partial<RewardedEnergyAdTracker>,
  currentEnergy: number,
  now = Date.now(),
): boolean {
  return currentEnergy < ECONOMY.maxEnergy && rewardedEnergyAdsRemaining(tracker, now) > 0;
}

export function bumpRewardedEnergyAdCount(
  tracker: RewardedEnergyAdTracker,
  now = Date.now(),
): void {
  const day = utcDayKey(now);
  if (tracker.rewardedEnergyAdsDayKey !== day) {
    tracker.rewardedEnergyAdsDayKey = day;
    tracker.rewardedEnergyAdsToday = 0;
  }
  tracker.rewardedEnergyAdsToday += 1;
}

export function regenerateEnergy(
  currentEnergy: number,
  energyUpdatedAt: number,
  now = Date.now(),
  unlimited = false,
): { energy: number; energyUpdatedAt: number; regenerated: number } {
  if (unlimited) {
    return { energy: ECONOMY.maxEnergy, energyUpdatedAt: now, regenerated: 0 };
  }
  if (currentEnergy >= ECONOMY.maxEnergy) {
    return { energy: ECONOMY.maxEnergy, energyUpdatedAt: now, regenerated: 0 };
  }
  const regenMs = ECONOMY.energyRegenMinutes * 60 * 1000;
  const elapsed = Math.max(0, now - energyUpdatedAt);
  const gained = Math.floor(elapsed / regenMs);
  if (gained <= 0) {
    return { energy: currentEnergy, energyUpdatedAt, regenerated: 0 };
  }
  const next = Math.min(ECONOMY.maxEnergy, currentEnergy + gained);
  const used = next - currentEnergy;
  const nextUpdatedAt = energyUpdatedAt + used * regenMs;
  return { energy: next, energyUpdatedAt: nextUpdatedAt, regenerated: used };
}

export function msUntilNextEnergy(currentEnergy: number, energyUpdatedAt: number, now = Date.now()): number {
  if (currentEnergy >= ECONOMY.maxEnergy) {
    return 0;
  }
  const regenMs = ECONOMY.energyRegenMinutes * 60 * 1000;
  const elapsed = Math.max(0, now - energyUpdatedAt);
  return Math.max(0, regenMs - (elapsed % regenMs));
}

/** Time until the meter reaches max from the current regen clock. */
export function msUntilFullEnergy(currentEnergy: number, energyUpdatedAt: number, now = Date.now()): number {
  if (currentEnergy >= ECONOMY.maxEnergy) {
    return 0;
  }
  const regenMs = ECONOMY.energyRegenMinutes * 60 * 1000;
  const remaining = ECONOMY.maxEnergy - currentEnergy;
  return msUntilNextEnergy(currentEnergy, energyUpdatedAt, now) + Math.max(0, remaining - 1) * regenMs;
}

export function formatCountdown(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
