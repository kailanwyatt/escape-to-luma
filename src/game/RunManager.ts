import { GAME_TUNING } from './gameTuning';
import type { ShotResultKind } from './GameState';
import { STREAK_THRESHOLDS, streakMultiplier } from '../target/TargetScoring';
import { XP_AWARD } from '../progression/xp';

export class RunManager {
  lives = GAME_TUNING.run.lives;
  score = 0;
  attempts = 0;
  challengesCleared = 0;
  rotorHits = 0;
  targetMisses = 0;
  hits = 0;
  greats = 0;
  bullseyes = 0;
  perfects = 0;
  closeCalls = 0;
  currentStreak = 0;
  bestStreak = 0;
  environmentsCompleted = 0;
  loopsCompleted = 0;
  unlimitedHearts = false;
  multiplier = 1;
  startedAt = 0;
  runXp = 0;
  hasUsedRewardedContinue = false;

  reset(): void {
    this.lives = GAME_TUNING.run.lives;
    this.score = 0;
    this.attempts = 0;
    this.challengesCleared = 0;
    this.rotorHits = 0;
    this.targetMisses = 0;
    this.hits = 0;
    this.greats = 0;
    this.bullseyes = 0;
    this.perfects = 0;
    this.closeCalls = 0;
    this.currentStreak = 0;
    this.bestStreak = 0;
    this.environmentsCompleted = 0;
    this.loopsCompleted = 0;
    this.multiplier = 1;
    this.startedAt = Date.now();
    this.runXp = 0;
    this.hasUsedRewardedContinue = false;
  }

  markAttempt(): void {
    this.attempts += 1;
  }

  noteCloseCall(): number {
    this.closeCalls += 1;
    this.score += GAME_TUNING.score.CLOSE_CALL;
    this.runXp += XP_AWARD.closeCall;
    return GAME_TUNING.score.CLOSE_CALL;
  }

  noteEnvironmentCompleted(): void {
    this.environmentsCompleted += 1;
    this.runXp += XP_AWARD.environmentCompleted;
  }

  applyResult(kind: ShotResultKind, basePoints: number): {
    runOver: boolean;
    awarded: number;
    multiplier: number;
    streakThreshold: boolean;
  } {
    if (kind === 'ROTOR_HIT') {
      this.rotorHits += 1;
      this.currentStreak = 0;
      this.multiplier = 1;
      return { runOver: this.loseHeart(), awarded: 0, multiplier: 1, streakThreshold: false };
    }

    if (kind === 'MISS') {
      this.targetMisses += 1;
      this.currentStreak = 0;
      this.multiplier = 1;
      return { runOver: this.loseHeart(), awarded: 0, multiplier: 1, streakThreshold: false };
    }

    this.challengesCleared += 1;
    this.currentStreak += 1;
    this.bestStreak = Math.max(this.bestStreak, this.currentStreak);
    this.multiplier = streakMultiplier(this.currentStreak);
    const awarded = Math.round(basePoints * this.multiplier);
    this.score += awarded;
    this.runXp += XP_AWARD.challengeCleared;

    if (kind === 'HIT') {
      this.hits += 1;
    }
    if (kind === 'GREAT') {
      this.greats += 1;
      this.runXp += XP_AWARD.great;
    }
    if (kind === 'BULLSEYE') {
      this.bullseyes += 1;
      this.runXp += XP_AWARD.bullseye;
    }
    if (kind === 'PERFECT') {
      this.perfects += 1;
      this.runXp += XP_AWARD.perfect;
    }

    return {
      runOver: false,
      awarded,
      multiplier: this.multiplier,
      streakThreshold: (STREAK_THRESHOLDS as readonly number[]).includes(this.currentStreak),
    };
  }

  durationSeconds(): number {
    if (!this.startedAt) {
      return 0;
    }
    return (Date.now() - this.startedAt) / 1000;
  }

  grantContinue(): void {
    this.lives = GAME_TUNING.run.lives;
    this.currentStreak = 0;
    this.multiplier = 1;
    this.hasUsedRewardedContinue = true;
  }

  private loseHeart(): boolean {
    if (this.unlimitedHearts) {
      return false;
    }
    this.lives = Math.max(0, this.lives - 1);
    return this.lives <= 0;
  }
}
