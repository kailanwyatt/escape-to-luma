import type { ShotResultKind } from '../game/GameState';
import { AUTHORED_30_SHOTS } from '../config/authored30ShotRun';

export type AuthoredShotStats = {
  challengeId: string;
  attempts: number;
  rotorAHits: number;
  rotorBHits: number;
  targetMisses: number;
  successfulResult: 'HIT' | 'GREAT' | 'BULLSEYE' | 'PERFECT' | null;
  firstTryClear: boolean;
  totalTimeSpent: number;
};

export class AuthoredRunTracker {
  shots: AuthoredShotStats[] = [];

  reset(): void {
    this.shots = AUTHORED_30_SHOTS.map((challenge) => ({
      challengeId: challenge.id,
      attempts: 0,
      rotorAHits: 0,
      rotorBHits: 0,
      targetMisses: 0,
      successfulResult: null,
      firstTryClear: false,
      totalTimeSpent: 0,
    }));
  }

  constructor() {
    this.reset();
  }

  noteTime(index: number, dt: number): void {
    const shot = this.shots[index];
    if (shot) {
      shot.totalTimeSpent += dt;
    }
  }

  noteAttempt(index: number): void {
    const shot = this.shots[index];
    if (shot) {
      shot.attempts += 1;
    }
  }

  noteRotorHit(index: number, rotorIndex: number): void {
    const shot = this.shots[index];
    if (!shot) {
      return;
    }
    if (rotorIndex === 0) {
      shot.rotorAHits += 1;
    } else {
      shot.rotorBHits += 1;
    }
  }

  noteTargetMiss(index: number): void {
    const shot = this.shots[index];
    if (shot) {
      shot.targetMisses += 1;
    }
  }

  noteSuccess(index: number, kind: ShotResultKind): void {
    const shot = this.shots[index];
    if (!shot) {
      return;
    }
    if (kind === 'HIT' || kind === 'GREAT' || kind === 'BULLSEYE' || kind === 'PERFECT') {
      shot.successfulResult = kind;
      shot.firstTryClear = shot.attempts <= 1;
    }
  }

  get firstTryClears(): number {
    return this.shots.filter((shot) => shot.firstTryClear).length;
  }

  get spikes(): AuthoredShotStats[] {
    return this.shots.filter((shot) => shot.attempts >= 4);
  }

  summaryLines(): string[] {
    return this.shots.map((shot) => {
      const warn = shot.attempts >= 4 ? ' ⚠' : '';
      return `${shot.challengeId}  ${shot.attempts} attempt${shot.attempts === 1 ? '' : 's'}${warn}`;
    });
  }
}
