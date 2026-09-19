import { GAME_TUNING } from '../game/gameTuning';
import type { ShotResultKind } from '../game/GameState';

export const STREAK_THRESHOLDS = [3, 6, 10, 15] as const;

export function streakMultiplier(streak: number): number {
  if (streak >= 15) {
    return 2;
  }
  if (streak >= 10) {
    return 1.75;
  }
  if (streak >= 6) {
    return 1.5;
  }
  if (streak >= 3) {
    return 1.25;
  }
  return 1;
}

export function scoreTarget(
  distance: number,
  targetRadius: number,
): { kind: ShotResultKind; points: number } {
  const scale = targetRadius;
  const zones = GAME_TUNING.target.zones;
  const score = GAME_TUNING.score;

  if (distance > zones.hit * scale) {
    return { kind: 'MISS', points: 0 };
  }
  if (distance <= zones.perfect * scale) {
    return { kind: 'PERFECT', points: score.PERFECT };
  }
  if (distance <= zones.bullseye * scale) {
    return { kind: 'BULLSEYE', points: score.BULLSEYE };
  }
  if (distance <= zones.great * scale) {
    return { kind: 'GREAT', points: score.GREAT };
  }
  return { kind: 'HIT', points: score.HIT };
}

export function resultLabel(kind: ShotResultKind, points: number): string {
  switch (kind) {
    case 'PERFECT':
      return `PERFECT +${points}`;
    case 'BULLSEYE':
      return `BULLSEYE +${points}`;
    case 'GREAT':
      return `GREAT +${points}`;
    case 'HIT':
      return `HIT +${points}`;
    case 'ROTOR_HIT':
      return 'BLOCKED';
    case 'MISS':
      return 'MISS';
  }
}

export function formatScore(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}
