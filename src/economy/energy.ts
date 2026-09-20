import { ECONOMY } from '../config/economy';

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

export function formatCountdown(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
