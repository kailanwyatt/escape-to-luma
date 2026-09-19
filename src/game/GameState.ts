import type { RecordFlags } from '../persistence/PersonalBests';

export type { RecordFlags };

export type GamePhase =
  | 'READY'
  | 'AIMING'
  | 'PROJECTILE_ACTIVE'
  | 'RESULT'
  | 'RESETTING'
  | 'TRANSITIONING'
  | 'RUN_START'
  | 'CONTINUE_OFFER'
  | 'RUN_OVER'
  | 'PROTOTYPE_COMPLETE';

export type ShotResultKind =
  | 'ROTOR_HIT'
  | 'MISS'
  | 'HIT'
  | 'GREAT'
  | 'BULLSEYE'
  | 'PERFECT';

export class GameState {
  phase: GamePhase = 'READY';

  set(phase: GamePhase): void {
    this.phase = phase;
  }

  canAcceptInput(): boolean {
    return this.phase === 'READY' || this.phase === 'AIMING' || this.phase === 'RUN_START';
  }
}

export type HudSnapshot = {
  phase: GamePhase;
  lives: number;
  score: number;
  shotId: number;
  totalShots: number;
  resultKind: ShotResultKind | null;
  resultText: string | null;
  showOnboarding: boolean;
  onboardingText: string | null;
  shotsReached: number;
  hits: number;
  greats: number;
  bullseyes: number;
  perfects: number;
  rotorHits: number;
  targetMisses: number;
  streak: number;
  bestStreak: number;
  multiplier: number;
  environment: string;
  shotInEnvironment: number;
  shotsPerEnvironment: number;
  banner: string | null;
  closeCall: boolean;
  closeCallText: string | null;
  closeCalls: number;
  cancelReady: boolean;
  runMode: string;
  attempts: number;
  firstTryClears: number;
  unlimitedHearts: boolean;
  lastFail: string | null;
  bestScore: number;
  newBest: boolean;
  records: RecordFlags;
  loopNumber: number;
  runTheme: string;
  runXp: number;
  playerLevel: number;
  xpIntoLevel: number;
  xpForNext: number;
  totalXP: number;
  unlockedName: string | null;
  levelUp: boolean;
  continueOffer: boolean;
  adBusy: boolean;
  adMessage: string | null;
  removeAds: boolean;
};

export type ObstacleDebug = {
  type: string;
  z: number;
  rotation: number;
  speed: number;
  x: number;
  y: number;
  extra: string;
} | null;

export type DebugSnapshot = {
  fps: number;
  shotId: number;
  phase: GamePhase;
  projectile: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  rotorAngle: number;
  rotorSpeed: number;
  aimX: number;
  aimY: number;
  power: number;
  lastResult: ShotResultKind | null;
  runSeed: string;
  challengeId: string;
  template: string;
  difficulty: number;
  environment: string;
  loopNumber: number;
  obstacleA: ObstacleDebug;
  obstacleB: ObstacleDebug;
  target: { x: number; y: number; moving: string };
  closeCall: boolean;
  closeCallClearance: number;
  runScore: number;
  currentStreak: number;
  multiplier: number;
  bestStreak: number;
  challengesCleared: number;
  personalBest: number;
  lives: number;
  closeCalls: number;
  aimState: string;
  rawDragX: number;
  rawDragY: number;
  normalizedX: number;
  normalizedY: number;
  curvedAimX: number;
  maxDragDistance: number;
  hasEnteredAim: boolean;
  cancelReady: boolean;
  horizontalExponent: number;
  aimStartX: number;
  aimStartY: number;
  aimCurrentX: number;
  aimCurrentY: number;
  screenWidth: number;
  screenHeight: number;
  vz: number;
  predA: string;
  predB: string;
  predT: string;
  timeA: number;
  timeB: number;
  timeT: number;
  pathError: number;
  analyticVsSimY: number;
  lastMiss: string;
  runMode: string;
  unlimitedHearts: boolean;
  authoredAttempts: number;
  lastFail: string;
  spike: boolean;
  firstTryClears: number;
      runTheme: string;
      playerLevel: number;
      totalXP: number;
      selectedProjectile: string;
      rewardedReady: boolean;
      interstitialReady: boolean;
      removeAds: boolean;
      hasUsedContinue: boolean;
      analyticsDebug: boolean;
      adsEnabled: boolean;
      useTestAds: boolean;
      continueUsed: boolean;
    };
