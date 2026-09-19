import type { ChallengeConfig } from '../config/ChallengeConfig';
import type { ObstacleType } from '../config/ObstacleConfig';
import type { RunMode } from '../config/RunMode';
import { AUTHORED_30_SHOTS, AUTHORED_SHOT_COUNT } from '../config/authored30ShotRun';
import {
  OBSTACLE_TEST_SHOTS,
  VALIDATION_15_SHOTS,
  VALIDATION_SHOT_COUNT,
} from '../config/authoredValidation15';
import { GAME_TUNING } from '../game/gameTuning';
import { generateChallenge, loopNumberForChallenge } from './ChallengeGenerator';
import { pickRunTheme, type RunThemeId } from './RunTheme';
import { primaryTypeForChallenge, rememberTypes } from './VarietyDirector';
import { generateRunSeed, SeededRng } from '../utils/SeededRng';

export class RunDirector {
  seed = generateRunSeed();
  index = 0;
  current: ChallengeConfig;
  mode: RunMode = GAME_TUNING.run.mode;
  recentTypes: ObstacleType[] = [];
  theme: RunThemeId = 'classic';
  private rng: SeededRng;

  constructor(seed?: number) {
    this.seed = seed ?? generateRunSeed();
    this.rng = new SeededRng(this.seed);
    this.theme = this.mode === 'GENERATED' ? pickRunTheme(new SeededRng(this.seed ^ 0x51a11)) : 'classic';
    this.current = this.load(0);
  }

  get isAuthored(): boolean {
    return this.mode !== 'GENERATED';
  }

  get challengeNumber(): number {
    return this.index + 1;
  }

  get loopNumber(): number {
    return this.mode === 'GENERATED' ? loopNumberForChallenge(this.index) : 1;
  }

  get shotInEnvironment(): number {
    if (this.mode === 'GENERATED') {
      return (this.index % GAME_TUNING.run.shotsPerEnvironment) + 1;
    }
    return (this.index % 10) + 1;
  }

  get shotsPerEnvironment(): number {
    return this.mode === 'GENERATED' ? GAME_TUNING.run.shotsPerEnvironment : 10;
  }

  get isLastShot(): boolean {
    return this.isAuthored && this.index >= this.courseLength - 1;
  }

  get totalShots(): number {
    return this.isAuthored ? this.courseLength : 0;
  }

  private get courseLength(): number {
    if (this.mode === 'AUTHORED_30') {
      return AUTHORED_SHOT_COUNT;
    }
    if (this.mode === 'VALIDATION_15') {
      return VALIDATION_SHOT_COUNT;
    }
    if (this.mode === 'OBSTACLE_TEST') {
      return OBSTACLE_TEST_SHOTS.length;
    }
    return 0;
  }

  setMode(mode: RunMode): ChallengeConfig {
    this.mode = mode;
    return this.restart();
  }

  advance(): ChallengeConfig {
    if (this.isAuthored) {
      if (this.index < this.courseLength - 1) {
        this.index += 1;
        this.current = this.load(this.index);
      }
      return this.current;
    }
    this.index += 1;
    this.current = generateChallenge(this.rng, this.index, this.recentTypes, this.theme);
    this.recentTypes = rememberTypes(this.recentTypes, primaryTypeForChallenge(this.current));
    return this.current;
  }

  restart(seed?: number): ChallengeConfig {
    this.seed = seed ?? generateRunSeed();
    this.rng = new SeededRng(this.seed);
    this.index = 0;
    this.recentTypes = [];
    this.theme = this.mode === 'GENERATED' ? pickRunTheme(new SeededRng(this.seed ^ 0x51a11)) : 'classic';
    this.current = this.load(0);
    return this.current;
  }

  replayCurrent(): ChallengeConfig {
    this.current = this.load(this.index);
    return this.current;
  }

  previous(): ChallengeConfig {
    this.index = Math.max(0, this.index - 1);
    this.current = this.load(this.index);
    return this.current;
  }

  jumpToShot(shotNumber: number): ChallengeConfig {
    const max = this.isAuthored ? this.courseLength : 80;
    this.index = Math.max(0, Math.min(max - 1, Math.floor(shotNumber) - 1));
    this.current = this.load(this.index);
    return this.current;
  }

  jumpEnvironment(): ChallengeConfig {
    if (this.isAuthored) {
      const phase = Math.floor(this.index / 10);
      const next = Math.min(this.courseLength - 1, (phase + 1) * 10);
      return this.jumpToShot(next + 1);
    }
    const nextIndex = Math.floor(this.index / 8) * 8 + 8;
    return this.jumpToShot(nextIndex + 1);
  }

  private load(index: number): ChallengeConfig {
    if (this.mode === 'AUTHORED_30') {
      return AUTHORED_30_SHOTS[Math.max(0, Math.min(AUTHORED_SHOT_COUNT - 1, index))];
    }
    if (this.mode === 'VALIDATION_15') {
      return VALIDATION_15_SHOTS[Math.max(0, Math.min(VALIDATION_SHOT_COUNT - 1, index))];
    }
    if (this.mode === 'OBSTACLE_TEST') {
      return OBSTACLE_TEST_SHOTS[Math.max(0, Math.min(OBSTACLE_TEST_SHOTS.length - 1, index))];
    }
    this.rng = new SeededRng(this.seed);
    this.recentTypes = [];
    let challenge = generateChallenge(this.rng, 0, this.recentTypes, this.theme);
    this.recentTypes = rememberTypes(this.recentTypes, primaryTypeForChallenge(challenge));
    for (let i = 1; i <= index; i += 1) {
      challenge = generateChallenge(this.rng, i, this.recentTypes, this.theme);
      this.recentTypes = rememberTypes(this.recentTypes, primaryTypeForChallenge(challenge));
    }
    return challenge;
  }
}
