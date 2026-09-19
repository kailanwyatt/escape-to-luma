import type { ExpoWebGLRenderingContext } from 'expo-gl';
import type { WebGLRenderer } from 'three';

import { AuthoredRunTracker } from '../challenge/AuthoredRunTracker';
import { RunDirector } from '../challenge/RunDirector';
import type { ChallengeConfig, EnvironmentId } from '../config/ChallengeConfig';
import { obstacleTypeOf } from '../config/ObstacleConfig';
import { AudioManager } from '../feedback/AudioManager';
import { GameHaptics } from '../feedback/Haptics';
import { Analytics, ANALYTICS_EVENTS } from '../services/analytics/Analytics';
import { AdService } from '../services/ads/AdService';
import { PurchaseService } from '../services/purchases/PurchaseService';
import { getCommercialConfig } from '../config/commercial';
import { ParticleSystem } from '../feedback/Particles';
import { ProjectileTrail } from '../feedback/ProjectileTrail';
import { ObstacleSlot } from '../obstacles/ObstacleSlot';
import { AimSystem } from '../projectile/AimSystem';
import { Projectile } from '../projectile/Projectile';
import { ProjectileSystem } from '../projectile/ProjectileSystem';
import { TrajectoryPredictor } from '../projectile/TrajectoryPredictor';
import { CameraController } from '../scene/CameraController';
import { DebugVisuals } from '../scene/DebugVisuals';
import { GameScene } from '../scene/GameScene';
import { Target } from '../target/Target';
import { distanceToTarget } from '../target/TargetCollision';
import { resultLabel, scoreTarget } from '../target/TargetScoring';
import {
  detectRecords,
  EMPTY_BESTS,
  mergeBests,
  type PersonalBests,
  type RecordFlags,
} from '../persistence/PersonalBests';
import {
  emptySave,
  loadGameSave,
  resetGameSave,
  saveGameSave,
  setSaveLevel,
  structuredCloneSave,
  type GameSettings,
  type PersistentGameData,
} from '../persistence/GameSave';
import { themeLabel } from '../challenge/RunTheme';
import {
  applyMilestones,
  detectNewMilestones,
  SHOT_MILESTONES,
  shotMilestoneLabel,
} from '../progression/milestones';
import {
  newlyUnlockedProjectiles,
  projectileStyle,
  unlockedProjectileIds,
  DEFAULT_PROJECTILE_ID,
} from '../progression/projectiles';
import { playerLevelFromXp, xpIntoLevel, xpToNextLevel } from '../progression/xp';
import { analyticPosition, makeTargetMissReport, predictShot, type ShotPrediction, type TargetMissReport } from '../debug/ShotDiagnostics';
import { createThreeRenderer, resizeThreeRenderer } from '../utils/createThreeRenderer';
import { signOr } from '../utils/math';
import { GameState, type DebugSnapshot, type HudSnapshot, type ObstacleDebug } from './GameState';
import { GAME_TUNING } from './gameTuning';
import { RunManager } from './RunManager';

export class Game {
  private readonly gl: ExpoWebGLRenderingContext;
  private readonly renderer: WebGLRenderer;
  private readonly scene: GameScene;
  private readonly camera: CameraController;
  private readonly state = new GameState();
  private readonly run = new RunManager();
  private readonly director = new RunDirector();
  private readonly authored = new AuthoredRunTracker();
  private readonly projectile = new Projectile();
  private readonly projectileSystem = new ProjectileSystem();
  private readonly aim = new AimSystem();
  private readonly trajectory = new TrajectoryPredictor();
  private readonly obstacles = [new ObstacleSlot('A'), new ObstacleSlot('B')];
  private readonly target = new Target();
  private readonly particles = new ParticleSystem();
  private readonly trail = new ProjectileTrail();
  private readonly debugVisuals = new DebugVisuals();

  private raf = 0;
  private running = false;
  private lastMs = 0;
  private timeScale = 1;
  private slowdownRemaining = 0;
  private resultTimer = 0;
  private resetTimer = 0;
  private transitionTime = 0;
  private transitionDuration = 1;
  private pendingAdvance = false;
  private pendingRunOver = false;
  private pendingEnvironment: EnvironmentId | null = null;
  private obstacleCleared = [false, false];
  private lastResult: HudSnapshot['resultKind'] = null;
  private lastResultPoints = 0;
  private flightTime = 0;
  private simTime = 0;
  private debugEnabled = false;
  private fps = 60;
  private lastNearMiss = false;
  private lastCloseCallClearance = 0;
  private closeCallTimer = 0;
  private liveNewBest = false;
  private suppressInterstitialForCurrentRun = false;
  private continueBusy = false;
  private continueGrantedThisDeath = false;
  private adMessage: string | null = null;
  private lastRunEndReason: 'death' | 'complete' | 'quit' = 'death';
  private adShowing = false;
  private lastEnvironmentTracked: EnvironmentId | null = null;
  private hasPlayedRun = false;
  private bests: PersonalBests = { ...EMPTY_BESTS };
  private records: RecordFlags = {
    score: false,
    longestRun: false,
    bestStreak: false,
    bullseyes: false,
    perfects: false,
    loop: false,
  };
  private banner: string | null = null;
  private bannerTimer = 0;
  private readonly hudListeners = new Set<(snapshot: HudSnapshot) => void>();
  private livePrediction: ShotPrediction | null = null;
  private launchPrediction: ShotPrediction | null = null;
  private launchStart = { x: 0, y: 0, z: 0 };
  private launchVelocity = { vx: 0, vy: 0, vz: 0 };
  private maxPathError = 0;
  private lastMissReport: TargetMissReport | null = null;
  private lastFail: string | null = null;
  private lastRotorHitIndex = 0;
  private save: PersistentGameData = emptySave();
  private unlockedName: string | null = null;
  private lastCompletedEnvironment: EnvironmentId | null = null;
  private envClears = { workshop: 0, rooftop: 0, space: 0 };
  private levelUpAnnounced = false;
  private startingLevel = 1;
  private leveledUpThisRun = false;
  private systemReduceMotion = false;
  private throwsThisRun = 0;

  constructor(gl: ExpoWebGLRenderingContext) {
    this.gl = gl;
    this.renderer = createThreeRenderer(gl);
    this.scene = new GameScene();
    this.camera = new CameraController();

    this.scene.add(
      this.projectile.mesh,
      this.trajectory.group,
      this.obstacles[0].group,
      this.obstacles[1].group,
      this.target.group,
      this.particles.group,
      this.trail.group,
      this.debugVisuals.group,
    );

    this.trajectory.setVisible(false);
    this.run.reset();
    this.applyChallenge(this.director.current, true);
    this.resize();
    AdService.configure({
      onPresentationChange: (showing) => {
        this.adShowing = showing;
        if (showing) {
          AudioManager.suspendForAd();
        } else {
          AudioManager.restoreFromSettings(this.save.settings.soundEnabled);
        }
        this.emitHud();
      },
    });
    void this.hydrateSave();
  }

  private async hydrateSave(): Promise<void> {
    this.save = await loadGameSave();
    this.bests = this.save.personalBests;
    this.startingLevel = this.save.playerProgress.playerLevel;
    PurchaseService.hydrate(this.save.commercial.removeAds);
    this.applySettings();
    this.applyProjectileLook();
    this.emitHud();
    void AudioManager.init();
    Analytics.appOpen();
    if (!this.save.hasCompletedOnboarding) {
      Analytics.markOnboardingStarted();
    }
    AdService.start();
  }

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.lastMs = 0;
    this.resize();
    this.loop(0);
  }

  pause(): void {
    if (this.state.phase === 'AIMING') {
      this.cancelAim();
    }
    this.running = false;
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    this.lastMs = 0;
    AudioManager.pauseAll();
  }

  resume(): void {
    if (!this.running) {
      this.start();
    }
  }

  dispose(): void {
    this.pause();
    this.renderer.dispose();
    this.hudListeners.clear();
  }

  resize(): void {
    resizeThreeRenderer(this.renderer, this.gl);
    const width = this.gl.drawingBufferWidth;
    const height = this.gl.drawingBufferHeight;
    if (width > 0 && height > 0) {
      this.camera.setAspect(width / height);
    }
  }

  setScreenSize(width: number, height: number): void {
    this.aim.setScreenSize(width, height);
  }

  setDebugEnabled(enabled: boolean): void {
    this.debugEnabled = __DEV__ && enabled;
    this.debugVisuals.setEnabled(this.debugEnabled);
    this.trajectory.setDebugFull(this.debugEnabled);
    this.emitHud();
  }

  subscribeHud(listener: (snapshot: HudSnapshot) => void): () => void {
    this.hudListeners.add(listener);
    listener(this.getHudSnapshot());
    return () => {
      this.hudListeners.delete(listener);
    };
  }

  canAcceptInput(): boolean {
    return this.state.canAcceptInput();
  }

  onTouchStart(x: number, y: number): void {
    if (this.state.phase === 'RUN_START') {
      this.state.set('READY');
      this.camera.clearEffects();
      this.camera.allowShake = false;
      AudioManager.play('ui');
      this.emitHud();
      return;
    }
    if (this.state.phase !== 'READY') {
      return;
    }
    this.camera.clearEffects();
    this.camera.allowShake = false;
    this.aim.begin(x, y);
    this.state.set('AIMING');
    this.syncTrajectory();
    this.trajectory.setVisible(false);
    this.projectile.setCancelReady(false);
    GameHaptics.forAimStart();
    AudioManager.play('aim');
    this.emitHud();
  }

  onTouchMove(x: number, y: number): void {
    if (this.state.phase !== 'AIMING') {
      return;
    }
    const wasCancelReady = this.aim.isCancelReady;
    this.aim.move(x, y);
    if (this.aim.isCancelReady && !wasCancelReady) {
      void GameHaptics.light();
    }
    this.syncAimVisuals();
    if (this.aim.isCancelReady !== wasCancelReady) {
      this.emitHud();
    }
  }

  onTouchEnd(): void {
    if (this.state.phase !== 'AIMING') {
      return;
    }
    if (!this.aim.shouldLaunch()) {
      this.cancelAim();
      return;
    }
    const velocity = this.aim.end();
    this.trajectory.setVisible(false);
    this.projectile.setCancelReady(false);
    this.launchStart = {
      x: this.projectile.position.x,
      y: this.projectile.position.y,
      z: this.projectile.position.z,
    };
    this.launchVelocity = velocity;
    this.launchPrediction = predictShot(
      this.launchStart,
      velocity,
      this.obstacles,
      this.target,
      this.simTime,
    );
    this.maxPathError = 0;
    this.projectile.velocity.set(velocity.vx, velocity.vy, velocity.vz);
    this.projectile.previousPosition.copy(this.projectile.position);
    this.obstacleCleared = [false, false];
    this.targetResolved = false;
    this.flightTime = 0;
    this.lastNearMiss = false;
    this.lastCloseCallClearance = 0;
    this.closeCallTimer = 0;
    this.lastFail = null;
    this.run.markAttempt();
    this.throwsThisRun += 1;
    Analytics.track(ANALYTICS_EVENTS.shotStarted, this.shotAnalyticsProps());
    this.camera.allowShake = true;
    this.camera.punchLaunch();
    this.trail.start();
    GameHaptics.forThrow();
    AudioManager.play('launch');
    if (this.director.isAuthored) {
      this.authored.noteAttempt(this.director.index);
    }
    this.state.set('PROJECTILE_ACTIVE');
    this.emitHud();
  }

  onTouchCancel(): void {
    if (this.state.phase === 'AIMING') {
      this.cancelAim();
    }
  }

  restart(seed?: number, options?: { awaitStart?: boolean }): void {
    this.run.reset();
    this.director.restart(seed);
    if (this.director.isAuthored) {
      this.authored.reset();
    }
    this.simTime = 0;
    this.applyChallenge(this.director.current, true);
    this.resetProjectile();
    this.aim.cancel();
    this.trajectory.setVisible(false);
    this.lastResult = null;
    this.pendingAdvance = false;
    this.pendingRunOver = false;
    this.timeScale = 1;
    this.liveNewBest = false;
    this.records = {
      score: false,
      longestRun: false,
      bestStreak: false,
      bullseyes: false,
      perfects: false,
      loop: false,
    };
    this.lastNearMiss = false;
    this.closeCallTimer = 0;
    this.unlockedName = null;
    this.lastCompletedEnvironment = null;
    this.envClears = { workshop: 0, rooftop: 0, space: 0 };
    this.levelUpAnnounced = false;
    this.leveledUpThisRun = false;
    this.throwsThisRun = 0;
    this.startingLevel = this.save.playerProgress.playerLevel;
    this.applyProjectileLook();
    this.camera.clearEffects();
    this.camera.allowShake = false;
    this.banner = this.director.mode === 'GENERATED' ? themeLabel(this.director.theme) : null;
    this.bannerTimer = this.banner ? 1.1 : 0;
    this.camera.rebase();
    this.scene.environment.hidePortal();
    this.suppressInterstitialForCurrentRun = false;
    this.continueBusy = false;
    this.continueGrantedThisDeath = false;
    this.adMessage = null;
    this.lastRunEndReason = 'death';
    this.lastEnvironmentTracked = null;
    Analytics.newRunId();
    const immediateRetry = Analytics.isImmediateRetry();
    Analytics.track(immediateRetry ? ANALYTICS_EVENTS.retryStarted : ANALYTICS_EVENTS.runStarted, {
      runId: Analytics.runId,
      seed: this.director.seed.toString(16),
      theme: this.director.theme,
      mode: this.director.mode,
      playerLevel: this.save.playerProgress.playerLevel,
      immediateRetry,
    });
    this.trackEnvironmentEntered();
    AdService.preloadDuringRun();
    this.state.set(options?.awaitStart ? 'RUN_START' : 'READY');
    this.emitHud();
  }

  debugNextChallenge(): void {
    if (this.director.isLastShot) {
      return;
    }
    this.director.advance();
    this.applyChallenge(this.director.current, true);
    this.resetProjectile();
    this.state.set('READY');
    this.emitHud();
  }

  debugReplayChallenge(): void {
    this.director.replayCurrent();
    this.applyChallenge(this.director.current, true);
    this.resetProjectile();
    this.state.set('READY');
    this.emitHud();
  }

  debugRestartSeed(): void {
    this.restart(this.director.seed);
  }

  debugJumpEnvironment(): void {
    this.director.jumpEnvironment();
    this.applyChallenge(this.director.current, true);
    this.resetProjectile();
    this.state.set('READY');
    this.emitHud();
  }

  debugPreviousChallenge(): void {
    this.director.previous();
    this.applyChallenge(this.director.current, true);
    this.resetProjectile();
    this.state.set('READY');
    this.emitHud();
  }

  debugJumpToShot(shotNumber: number): void {
    this.director.jumpToShot(shotNumber);
    this.applyChallenge(this.director.current, true);
    this.resetProjectile();
    this.state.set('READY');
    this.emitHud();
  }

  debugToggleUnlimitedHearts(): void {
    this.run.unlimitedHearts = !this.run.unlimitedHearts;
    if (this.run.unlimitedHearts) {
      this.run.lives = GAME_TUNING.run.lives;
    }
    this.emitHud();
  }

  debugRestartGauntlet(): void {
    this.restart(this.director.seed);
  }

  debugSetMode(mode: 'GENERATED' | 'AUTHORED_30' | 'VALIDATION_15' | 'OBSTACLE_TEST'): void {
    this.director.setMode(mode);
    this.restart(this.director.seed);
  }

  debugForceRunOver(): void {
    if (this.state.phase === 'RUN_OVER' || this.state.phase === 'PROTOTYPE_COMPLETE') {
      return;
    }
    this.aim.cancel();
    this.trajectory.setVisible(false);
    this.projectile.setCancelReady(false);
    this.timeScale = 1;
    this.slowdownRemaining = 0;
    this.enterRunOver();
  }

  debugResetLocalBests(): void {
    this.save.personalBests = { ...EMPTY_BESTS };
    this.bests = this.save.personalBests;
    this.liveNewBest = false;
    this.records = {
      score: false,
      longestRun: false,
      bestStreak: false,
      bullseyes: false,
      perfects: false,
      loop: false,
    };
    void saveGameSave(this.save);
    this.emitHud();
  }

  debugResetProgress(): void {
    void resetGameSave().then((save) => {
      this.save = save;
      this.bests = save.personalBests;
      this.startingLevel = 1;
      PurchaseService.hydrate(false);
      this.applyProjectileLook();
      this.applySettings();
      this.emitHud();
    });
  }

  debugAddXp(amount = 50): void {
    this.save.playerProgress.totalXP += amount;
    this.syncProgressUnlocks();
    void saveGameSave(this.save);
    this.emitHud();
  }

  debugSetLevel(level: number): void {
    this.save = setSaveLevel(this.save, level);
    this.startingLevel = this.save.playerProgress.playerLevel;
    this.applyProjectileLook();
    void saveGameSave(this.save);
    this.emitHud();
  }

  debugUnlockAllProjectiles(): void {
    this.save.playerProgress.unlockedProjectileIds = unlockedProjectileIds(20);
    void saveGameSave(this.save);
    this.emitHud();
  }

  debugLockProjectiles(): void {
    this.save.playerProgress.unlockedProjectileIds = [DEFAULT_PROJECTILE_ID];
    this.save.selectedProjectileId = DEFAULT_PROJECTILE_ID;
    this.applyProjectileLook();
    void saveGameSave(this.save);
    this.emitHud();
  }

  setSelectedProjectile(id: string): void {
    if (!this.save.playerProgress.unlockedProjectileIds.includes(id)) {
      return;
    }
    this.save.selectedProjectileId = id;
    this.applyProjectileLook();
    void saveGameSave(this.save);
    Analytics.track(ANALYTICS_EVENTS.projectileSelected, { projectileId: id });
    this.emitHud();
  }

  getSave(): PersistentGameData {
    return this.save;
  }

  playFromHome(): void {
    this.restart(undefined, { awaitStart: true });
  }

  requestRetry(): void {
    void this.requestRetryAsync();
  }

  acceptContinue(): void {
    void this.acceptContinueAsync();
  }

  declineContinue(): void {
    if (this.state.phase !== 'CONTINUE_OFFER' || this.continueBusy) {
      return;
    }
    Analytics.track(ANALYTICS_EVENTS.continueDeclined, this.continueAnalyticsProps());
    this.enterRunOver();
  }

  setSystemReduceMotion(enabled: boolean): void {
    this.systemReduceMotion = enabled;
    this.applySettings();
  }

  setSettings(patch: Partial<GameSettings>): void {
    this.save.settings = { ...this.save.settings, ...patch };
    this.applySettings();
    void saveGameSave(this.save);
    this.emitHud();
  }

  debugResetOnboarding(): void {
    this.save.hasCompletedOnboarding = false;
    void saveGameSave(this.save);
    this.emitHud();
  }

  debugToggleAnalytics(): void {
    Analytics.debug = !Analytics.debug;
    this.emitHud();
  }

  debugToggleAdsEnabled(): void {
    AdService.setAdsEnabled(!AdService.adsOn());
    this.emitHud();
  }

  debugToggleTestAds(): void {
    AdService.setUseTestAds(!getCommercialConfig().useTestAds);
    this.emitHud();
  }

  debugForceRewardedReady(): void {
    AdService.forceRewardedReady();
    this.emitHud();
  }

  debugForceRewardedFailure(): void {
    AdService.forceRewardedFailure();
    this.emitHud();
  }

  debugForceInterstitialReady(): void {
    AdService.forceInterstitialReady();
    this.emitHud();
  }

  debugForceInterstitialFailure(): void {
    AdService.forceInterstitialFailure();
    this.emitHud();
  }

  debugResetAdCounters(): void {
    this.save.commercial.lastInterstitialAt = 0;
    this.save.commercial.runsSinceLastInterstitial = 99;
    void saveGameSave(this.save);
    this.emitHud();
  }

  debugSetRemoveAds(enabled: boolean): void {
    PurchaseService.setEntitlement(enabled);
    this.save.commercial.removeAds = enabled;
    void saveGameSave(this.save);
    this.emitHud();
  }

  debugResetContinueUsed(): void {
    this.run.hasUsedRewardedContinue = false;
    this.suppressInterstitialForCurrentRun = false;
    this.emitHud();
  }

  debugSetContinueUsed(): void {
    this.run.hasUsedRewardedContinue = true;
    this.emitHud();
  }

  debugForceContinueSuccess(): void {
    if (this.state.phase !== 'CONTINUE_OFFER') {
      return;
    }
    this.grantContinueAndResume();
  }

  debugForceContinueFailure(): void {
    AdService.forceRewardedFailure();
    this.adMessage = 'CONTINUE UNAVAILABLE';
    this.enterRunOver();
  }

  async purchaseRemoveAds(): Promise<'completed' | 'cancelled' | 'failed' | 'already'> {
    const result = await PurchaseService.purchaseRemoveAds();
    if (result === 'completed' || result === 'already') {
      this.save.commercial.removeAds = true;
      void saveGameSave(this.save);
    }
    this.emitHud();
    return result;
  }

  async restorePurchases(): Promise<boolean> {
    const entitled = await PurchaseService.restorePurchases();
    this.save.commercial.removeAds = PurchaseService.hasRemoveAdsEntitlement();
    void saveGameSave(this.save);
    this.emitHud();
    return entitled;
  }

  private applySettings(): void {
    if (!this.adShowing) {
      AudioManager.enabled = this.save.settings.soundEnabled;
    }
    GameHaptics.enabled = this.save.settings.hapticsEnabled;
    this.camera.reduceMotion = this.save.settings.reduceMotion || this.systemReduceMotion;
  }

  private applyProjectileLook(): void {
    const style = projectileStyle(this.save.selectedProjectileId);
    this.projectile.applyStyle(style);
    this.trail.setStyle(style.trailColor, style.trailWidth);
  }

  private onboardingCopy(): string | null {
    if (this.state.phase === 'AIMING' && this.aim.isCancelReady && this.throwsThisRun >= 1) {
      return 'RETURN TO START TO CANCEL';
    }
    if (this.save.hasCompletedOnboarding) {
      return null;
    }
    if (
      this.director.challengeNumber === 1 &&
      (this.state.phase === 'READY' || this.state.phase === 'AIMING') &&
      !this.aim.hasEnteredAim
    ) {
      return 'DRAG TO AIM';
    }
    if (this.director.challengeNumber === 2 && this.state.phase === 'READY') {
      return 'TIME THE OPENING';
    }
    return null;
  }

  private targetResolved = false;

  getHudSnapshot(): HudSnapshot {
    const challenge = this.director.current;
    return {
      phase: this.state.phase,
      lives: this.run.lives,
      score: this.run.score,
      shotId: this.director.challengeNumber,
      totalShots: this.director.totalShots,
      resultKind: this.state.phase === 'RESULT' ? this.lastResult : null,
      resultText:
        this.state.phase === 'RESULT' && this.lastResult
          ? resultLabel(this.lastResult, this.lastResultPoints)
          : null,
      showOnboarding: Boolean(this.onboardingCopy() === 'DRAG TO AIM'),
      onboardingText: this.onboardingCopy(),
      shotsReached: this.run.challengesCleared,
      hits: this.run.hits,
      greats: this.run.greats,
      bullseyes: this.run.bullseyes,
      perfects: this.run.perfects,
      rotorHits: this.run.rotorHits,
      targetMisses: this.run.targetMisses,
      streak: this.run.currentStreak,
      bestStreak: this.run.bestStreak,
      multiplier: this.run.multiplier,
      environment: challenge.environment,
      shotInEnvironment: this.director.shotInEnvironment,
      shotsPerEnvironment: this.director.shotsPerEnvironment,
      banner: this.banner,
      closeCall: this.lastNearMiss && this.closeCallTimer > 0,
      closeCallText:
        this.lastNearMiss && this.closeCallTimer > 0
          ? `CLOSE CALL +${GAME_TUNING.score.CLOSE_CALL}`
          : null,
      closeCalls: this.run.closeCalls,
      cancelReady: this.state.phase === 'AIMING' && this.aim.isCancelReady,
      runMode: this.director.mode,
      attempts: this.run.attempts,
      firstTryClears: this.authored.firstTryClears,
      unlimitedHearts: this.run.unlimitedHearts,
      lastFail: this.lastFail,
      bestScore: this.bests.bestScore,
      newBest: this.liveNewBest || this.records.score,
      records: this.records,
      loopNumber: this.director.loopNumber,
      runTheme: themeLabel(this.director.theme),
      runXp: this.run.runXp,
      playerLevel: playerLevelFromXp(this.projectedXp()),
      xpIntoLevel: xpIntoLevel(this.projectedXp()),
      xpForNext: xpToNextLevel(this.projectedXp()),
      totalXP: this.projectedXp(),
      unlockedName: this.unlockedName,
      levelUp: this.leveledUpThisRun || playerLevelFromXp(this.projectedXp()) > this.startingLevel,
      continueOffer: this.state.phase === 'CONTINUE_OFFER',
      adBusy: this.continueBusy || this.adShowing,
      adMessage: this.adMessage,
      removeAds: PurchaseService.hasRemoveAdsEntitlement(),
    };
  }

  getDebugSnapshot(): DebugSnapshot {
    const challenge = this.director.current;
    const prediction =
      this.state.phase === 'AIMING' ? this.livePrediction : this.launchPrediction;
    return {
      fps: Math.round(this.fps),
      shotId: this.director.challengeNumber,
      phase: this.state.phase,
      projectile: {
        x: round3(this.projectile.position.x),
        y: round3(this.projectile.position.y),
        z: round3(this.projectile.position.z),
      },
      velocity: {
        x: round3(this.projectile.velocity.x),
        y: round3(this.projectile.velocity.y),
        z: round3(this.projectile.velocity.z),
      },
      rotorAngle: round3(this.obstacles[0].angle),
      rotorSpeed: round3(this.obstacles[0].currentSpeed),
      aimX: round3(this.aim.aimX),
      aimY: round3(this.aim.aimY),
      power: round3(this.aim.power),
      lastResult: this.lastResult,
      runSeed: this.director.seed.toString(16),
      challengeId: challenge.id,
      template: challenge.template,
      difficulty: challenge.difficulty,
      environment: challenge.environment,
      loopNumber: this.director.loopNumber,
      obstacleA: this.obstacleDebug(this.obstacles[0]),
      obstacleB: this.obstacleDebug(this.obstacles[1]),
      target: {
        x: round3(this.target.x),
        y: round3(this.target.y),
        moving: challenge.target.movement?.type ?? 'none',
      },
      closeCall: this.lastNearMiss,
      closeCallClearance: round3(this.lastCloseCallClearance),
      runScore: this.run.score,
      currentStreak: this.run.currentStreak,
      multiplier: this.run.multiplier,
      bestStreak: this.run.bestStreak,
      challengesCleared: this.run.challengesCleared,
      personalBest: this.bests.bestScore,
      lives: this.run.lives,
      closeCalls: this.run.closeCalls,
      aimState: this.aim.isCancelReady
        ? 'CANCEL'
        : this.aim.hasEnteredAim
          ? 'AIMING'
          : 'PENDING',
      rawDragX: round3(this.aim.currentX - this.aim.startX),
      rawDragY: round3(this.aim.currentY - this.aim.startY),
      normalizedX: round3(this.aim.normalizedX),
      normalizedY: round3(this.aim.normalizedY),
      curvedAimX: round3(this.aim.aimX),
      maxDragDistance: round3(this.aim.maxDragDistance),
      hasEnteredAim: this.aim.hasEnteredAim,
      cancelReady: this.aim.isCancelReady,
      horizontalExponent: GAME_TUNING.aim.horizontalAimExponent,
      aimStartX: this.aim.startX,
      aimStartY: this.aim.startY,
      aimCurrentX: this.aim.currentX,
      aimCurrentY: this.aim.currentY,
      screenWidth: this.aim.screenWidth,
      screenHeight: this.aim.screenHeight,
      vz: round3(prediction?.vz ?? this.projectile.velocity.z),
      predA: formatRotorPred(prediction?.rotors[0]),
      predB: formatRotorPred(prediction?.rotors[1]),
      predT: formatTargetPred(prediction?.target),
      timeA: round3(prediction?.rotors[0].time ?? 0),
      timeB: round3(prediction?.rotors[1].time ?? 0),
      timeT: round3(prediction?.target.time ?? 0),
      pathError: round3(this.maxPathError),
      analyticVsSimY: round3(prediction?.analyticVsSimMaxY ?? 0),
      lastMiss: formatMiss(this.lastMissReport),
      runMode: this.director.mode,
      unlimitedHearts: this.run.unlimitedHearts,
      authoredAttempts: this.authored.shots[this.director.index]?.attempts ?? 0,
      lastFail: this.lastFail ?? '-',
      spike: (this.authored.shots[this.director.index]?.attempts ?? 0) >= 4,
      firstTryClears: this.authored.firstTryClears,
      runTheme: this.director.theme,
      playerLevel: this.save.playerProgress.playerLevel,
      totalXP: this.save.playerProgress.totalXP,
      selectedProjectile: this.save.selectedProjectileId,
      rewardedReady: AdService.rewardedReady(),
      interstitialReady: AdService.interstitialReady(),
      removeAds: PurchaseService.hasRemoveAdsEntitlement(),
      hasUsedContinue: this.run.hasUsedRewardedContinue,
      analyticsDebug: Analytics.debug,
      adsEnabled: AdService.adsOn(),
      useTestAds: getCommercialConfig().useTestAds,
      continueUsed: this.run.hasUsedRewardedContinue,
    };
  }

  private obstacleDebug(obstacle: ObstacleSlot): ObstacleDebug {
    if (!obstacle.active) {
      return null;
    }
    const info = obstacle.getDebugInfo();
    return {
      type: obstacle.type,
      z: round3(obstacle.z),
      rotation: round3(info.angle),
      speed: round3(info.speed),
      x: round3(info.x),
      y: round3(info.y),
      extra: info.extra,
    };
  }

  private loop = (ms: number): void => {
    if (!this.running) {
      return;
    }
    this.raf = requestAnimationFrame(this.loop);
    const rawDt =
      this.lastMs === 0 ? 1 / 60 : Math.min((ms - this.lastMs) / 1000, GAME_TUNING.timing.maxDeltaSeconds);
    this.lastMs = ms;
    this.fps = this.fps * 0.9 + (rawDt > 0 ? 1 / rawDt : 60) * 0.1;

    if (this.slowdownRemaining > 0) {
      this.slowdownRemaining -= rawDt;
      if (this.slowdownRemaining <= 0) {
        this.timeScale = 1;
      }
    }

    this.update(rawDt * this.timeScale, rawDt);
    this.render();
  };

  private update(dt: number, rawDt: number): void {
    const freezeWorld =
      this.adShowing ||
      this.state.phase === 'CONTINUE_OFFER' ||
      this.state.phase === 'RUN_OVER' ||
      this.state.phase === 'PROTOTYPE_COMPLETE';

    if (!freezeWorld) {
      this.simTime += dt;
    }
    if (this.director.isAuthored && !freezeWorld) {
      this.authored.noteTime(this.director.index, dt);
    }
    if (!freezeWorld) {
      for (const rotor of this.obstacles) {
        rotor.update(dt, this.simTime);
      }
      this.target.update(dt, this.simTime);
    }
    this.particles.update(dt);
    this.trail.update(dt, this.projectile.position, this.state.phase === 'PROJECTILE_ACTIVE');
    this.camera.allowShake =
      this.state.phase !== 'READY' &&
      this.state.phase !== 'AIMING' &&
      this.state.phase !== 'RUN_START' &&
      this.state.phase !== 'CONTINUE_OFFER' &&
      !this.adShowing;
    this.camera.update(dt);
    this.scene.environment.update(dt);

    if (this.bannerTimer > 0) {
      this.bannerTimer -= rawDt;
      if (this.bannerTimer <= 0) {
        this.banner = null;
        this.emitHud();
      }
    }

    if (this.closeCallTimer > 0) {
      this.closeCallTimer -= rawDt;
      if (this.closeCallTimer <= 0) {
        this.closeCallTimer = 0;
        this.emitHud();
      }
    }

    const shouldIntegrate =
      this.state.phase === 'PROJECTILE_ACTIVE' ||
      (this.state.phase === 'RESULT' && (this.lastResult === 'ROTOR_HIT' || this.lastResult === 'MISS'));
    if (shouldIntegrate) {
      this.projectileSystem.integrate(this.projectile, dt);
      this.flightTime += dt;
      if (this.state.phase === 'PROJECTILE_ACTIVE') {
        this.checkCollisions();
        this.checkOutOfBounds();
      }
    }

    if (this.state.phase === 'RESULT') {
      this.resultTimer -= rawDt;
      if (this.resultTimer <= 0) {
        this.finishResult();
      }
    }

    if (this.state.phase === 'RESETTING') {
      this.resetTimer -= rawDt;
      if (this.resetTimer <= 0) {
        this.state.set('READY');
        this.emitHud();
      }
    }

    if (this.state.phase === 'TRANSITIONING') {
      this.transitionTime += rawDt;
      const t = Math.min(1, this.transitionTime / this.transitionDuration);
      this.camera.setTravel(t);
      if (t >= 0.45 && this.pendingEnvironment) {
        this.scene.environment.setEnvironment(this.pendingEnvironment, this.scene.scene, false);
        this.showPortalFor(this.pendingEnvironment);
        this.banner = this.pendingEnvironment.toUpperCase();
        this.bannerTimer = GAME_TUNING.transition.bannerDuration;
        this.pendingEnvironment = null;
        this.emitHud();
      }
      if (t >= 1) {
        this.completeTransition();
      }
    }

    this.projectile.syncMesh();
    this.updateDiagnostics();
    this.debugVisuals.sync(
      this.projectile.position,
      this.obstacles,
      this.target,
      this.state.phase === 'AIMING' ? this.livePrediction : this.launchPrediction,
      this.state.phase === 'PROJECTILE_ACTIVE'
        ? analyticPosition(this.launchStart, this.launchVelocity, this.flightTime)
        : null,
    );
  }

  private updateDiagnostics(): void {
    if (this.state.phase === 'AIMING' && this.aim.hasEnteredAim && !this.aim.isCancelReady) {
      this.syncTrajectory();
      this.livePrediction = predictShot(
        {
          x: this.projectile.position.x,
          y: this.projectile.position.y,
          z: this.projectile.position.z,
        },
        this.aim.getLaunchVelocity(),
        this.obstacles,
        this.target,
        this.simTime,
      );
    } else if (this.state.phase !== 'PROJECTILE_ACTIVE' && this.state.phase !== 'RESULT') {
      this.livePrediction = null;
    }

    if (this.state.phase === 'PROJECTILE_ACTIVE') {
      const predicted = analyticPosition(this.launchStart, this.launchVelocity, this.flightTime);
      const dx = predicted.x - this.projectile.position.x;
      const dy = predicted.y - this.projectile.position.y;
      const dz = predicted.z - this.projectile.position.z;
      this.maxPathError = Math.max(this.maxPathError, Math.sqrt(dx * dx + dy * dy + dz * dz));
    }
  }

  private checkCollisions(): void {
    const ordered = this.obstacles
      .map((rotor, index) => ({ rotor, index }))
      .filter((item) => item.rotor.active)
      .sort((a, b) => a.rotor.z - b.rotor.z);

    for (const item of ordered) {
      if (this.obstacleCleared[item.index]) {
        continue;
      }
      const result = item.rotor.testProjectileCrossing(
        this.projectile.previousPosition,
        this.projectile.position,
        GAME_TUNING.projectile.radius,
      );
      if (!result) {
        continue;
      }
      if (result.hit) {
        const at = item.rotor.interpolateCrossing(
          this.projectile.previousPosition,
          this.projectile.position,
        );
        this.projectile.position.copy(at);
        this.projectile.velocity.z = -2;
        this.projectile.velocity.y += 1.5;
        this.projectile.velocity.x += signOr(at.x - item.rotor.getDebugInfo().x, 1) * 2;
        this.particles.spawnSparks(this.projectile.position, 14);
        this.camera.collisionImpulse();
        GameHaptics.forResult('ROTOR_HIT');
        AudioManager.play(collisionEvent(item.rotor.type));
        this.trail.stop();
        this.lastRotorHitIndex = item.index;
        this.lastFail = failLabel(item.rotor.type, item.index);
        if (this.director.isAuthored) {
          this.authored.noteRotorHit(this.director.index, item.index);
        }
        this.beginResult('ROTOR_HIT', 0, GAME_TUNING.timing.ricochetDuration / 1000);
        return;
      }
      this.obstacleCleared[item.index] = true;
      this.lastCloseCallClearance = result.clearance;
      if (result.nearMiss) {
        this.lastNearMiss = true;
        this.closeCallTimer = 0.85;
        this.run.noteCloseCall();
        Analytics.track(ANALYTICS_EVENTS.closeCall, this.shotAnalyticsProps());
        this.particles.spawnCloseCall(this.projectile.position);
        this.trail.pulseFlare();
        GameHaptics.forCloseCall();
        AudioManager.play('close-call');
        this.maybeAnnounceNewBest();
        this.emitHud();
      }
    }

    const allClear = ordered.every((item) => this.obstacleCleared[item.index]);
    if (!allClear || this.targetResolved) {
      return;
    }
    if (!this.projectileSystem.crossedPlane(this.projectile, this.target.z)) {
      return;
    }

    const atPlane = this.projectileSystem.interpolateAtZ(this.projectile, this.target.z);
    const distance = distanceToTarget(atPlane.x, atPlane.y, this.target.x, this.target.y);
    const scored = scoreTarget(distance, this.target.radius);
    this.targetResolved = true;
    this.projectile.position.set(atPlane.x, atPlane.y, atPlane.z);

    if (scored.kind === 'MISS') {
      this.lastMissReport = makeTargetMissReport(
        this.launchPrediction,
        atPlane,
        { x: this.target.x, y: this.target.y },
        this.target.radius,
      );
      this.lastFail = 'TARGET MISS';
      this.beginResult('MISS', 0, GAME_TUNING.timing.resultDelay / 1000);
      return;
    }

    this.projectile.velocity.set(0, 0, 0);
    const pulse =
      scored.kind === 'PERFECT' ? 1.6 : scored.kind === 'BULLSEYE' ? 1.25 : scored.kind === 'GREAT' ? 0.9 : 0.55;
    this.target.triggerPulse(pulse);
    const particleCount =
      scored.kind === 'PERFECT' ? 22 : scored.kind === 'BULLSEYE' ? 16 : scored.kind === 'GREAT' ? 12 : 8;
    const color = scored.kind === 'PERFECT' ? 0xfff1a8 : scored.kind === 'BULLSEYE' ? 0x7ef0ff : 0xffffff;
    this.particles.spawnHit(this.projectile.position, particleCount, color, scored.kind === 'PERFECT' ? 4.2 : 2.6);
    this.camera.hitEmphasis(scored.kind === 'PERFECT');
    this.trail.stop();
    GameHaptics.forResult(scored.kind);
    AudioManager.play(
      scored.kind === 'PERFECT'
        ? 'perfect'
        : scored.kind === 'BULLSEYE'
          ? 'bullseye'
          : scored.kind === 'GREAT'
            ? 'great'
            : 'hit',
    );
    if (scored.kind === 'PERFECT') {
      this.timeScale = GAME_TUNING.timing.perfectTimeScale;
      this.slowdownRemaining = GAME_TUNING.timing.perfectSlowdownDuration;
    }
    this.beginResult(scored.kind, scored.points, GAME_TUNING.timing.hitAdvanceDelay / 1000);
  }

  private checkOutOfBounds(): void {
    if (this.state.phase !== 'PROJECTILE_ACTIVE') {
      return;
    }
    if (
      this.projectile.position.y < GAME_TUNING.projectile.floorY ||
      this.flightTime > GAME_TUNING.projectile.maxFlightTime ||
      this.projectile.position.z < -3
    ) {
      this.targetResolved = true;
      this.lastFail = 'TARGET MISS';
      this.beginResult('MISS', 0, GAME_TUNING.timing.resultDelay / 1000);
    }
  }

  private beginResult(kind: NonNullable<HudSnapshot['resultKind']>, points: number, delaySeconds: number): void {
    if (this.state.phase === 'RESULT') {
      return;
    }
    this.hasPlayedRun = true;
    if (!this.save.hasCompletedOnboarding && this.director.challengeNumber >= 2) {
      this.save.hasCompletedOnboarding = true;
      Analytics.markOnboardingCompleted();
      void saveGameSave(this.save);
    }
    const outcome = this.run.applyResult(kind, points);
    this.lastResult = kind;
    this.lastResultPoints = outcome.awarded;
    if (this.director.isAuthored) {
      if (kind === 'MISS') {
        this.authored.noteTargetMiss(this.director.index);
      } else if (kind !== 'ROTOR_HIT') {
        this.authored.noteSuccess(this.director.index, kind);
      }
    }
    if (kind === 'MISS') {
      AudioManager.play('miss');
    }
    if (kind === 'ROTOR_HIT' || kind === 'MISS') {
      GameHaptics.forHeartLost();
      AudioManager.play('heart');
    }
    if (outcome.streakThreshold) {
      this.banner = `x${outcome.multiplier} STREAK`;
      this.bannerTimer = 0.8;
      this.particles.spawnStreak(this.projectile.position);
      GameHaptics.forStreak();
      AudioManager.play('streak');
    }
    this.maybeAnnounceNewBest();
    this.maybeAnnounceProgress();
    this.pendingRunOver = outcome.runOver;
    this.pendingAdvance = kind !== 'ROTOR_HIT' && kind !== 'MISS' && !outcome.runOver;
    this.resultTimer = delaySeconds;
    this.state.set('RESULT');
    this.trackShotResult(kind);
    this.emitHud();
  }

  private finishResult(): void {
    if (this.pendingRunOver) {
      this.maybeOfferContinue();
      return;
    }

    if (this.pendingAdvance) {
      if (this.director.isLastShot) {
        this.enterRunComplete();
        return;
      }
      const previousEnv = this.director.current.environment;
      const previousLoop = this.director.loopNumber;
      this.director.advance();
      const nextEnv = this.director.current.environment;
      this.pendingEnvironment = nextEnv !== previousEnv ? nextEnv : null;
      this.run.loopsCompleted = Math.max(0, this.director.loopNumber - 1);
      if (this.pendingEnvironment) {
        this.lastCompletedEnvironment = previousEnv;
        this.envClears[previousEnv] += 1;
        this.run.noteEnvironmentCompleted();
      }
      if (this.director.loopNumber > previousLoop) {
        Analytics.track(ANALYTICS_EVENTS.loopCompleted, {
          runId: Analytics.runId,
          loopNumber: previousLoop,
        });
      }
      this.transitionDuration = this.pendingEnvironment
        ? GAME_TUNING.transition.environmentDuration
        : GAME_TUNING.transition.normalDuration;
      this.transitionTime = 0;
      this.state.set('TRANSITIONING');
      this.emitHud();
      return;
    }

    this.resetProjectile();
    if (this.director.isAuthored) {
      this.applyChallenge(this.director.current, true);
    }
    this.state.set('RESETTING');
    this.resetTimer = GAME_TUNING.timing.resetDelay / 1000;
    this.emitHud();
  }

  private enterRunOver(): void {
    this.lastRunEndReason = 'death';
    this.commitProgress();
    this.logRunTelemetry();
    this.trackRunEnded();
    GameHaptics.forRunOver();
    AudioManager.play('run-over');
    this.state.set('RUN_OVER');
    this.emitHud();
  }

  private enterRunComplete(): void {
    this.lastRunEndReason = 'complete';
    this.commitProgress();
    this.logRunTelemetry();
    this.trackRunEnded();
    if (this.director.isAuthored) {
      console.log(this.authored.summaryLines().join('\n'));
    }
    this.state.set('PROTOTYPE_COMPLETE');
    this.emitHud();
  }

  private runRecordInput() {
    return {
      score: this.run.score,
      challengesCleared: this.run.challengesCleared,
      bestStreak: this.run.bestStreak,
      bullseyes: this.run.bullseyes,
      perfects: this.run.perfects,
      loopNumber: this.director.loopNumber,
    };
  }

  private maybeAnnounceNewBest(): void {
    if (this.liveNewBest || this.run.score <= this.bests.bestScore) {
      return;
    }
    this.liveNewBest = true;
    if (!this.banner) {
      this.banner = 'NEW BEST';
      this.bannerTimer = 0.9;
    }
    GameHaptics.forNewBest();
    AudioManager.play('new-best');
  }

  private commitBests(): void {
    const input = this.runRecordInput();
    this.records = detectRecords(this.bests, input);
    this.bests = mergeBests(this.bests, input);
  }

  private commitProgress(): void {
    this.commitBests();
    const previousLevel = this.save.playerProgress.playerLevel;
    const next = structuredCloneSave(this.save);
    next.personalBests = this.bests;
    next.playerProgress.totalXP += this.run.runXp;
    next.playerProgress.playerLevel = playerLevelFromXp(next.playerProgress.totalXP);
    next.playerProgress.totalRuns += 1;
    next.playerProgress.totalShotsCleared += this.run.challengesCleared;
    next.playerProgress.totalBullseyes += this.run.bullseyes;
    next.playerProgress.totalPerfects += this.run.perfects;
    next.playerProgress.totalCloseCalls += this.run.closeCalls;
    next.playerProgress.highestScore = Math.max(next.playerProgress.highestScore, this.run.score);
    next.playerProgress.longestRun = Math.max(next.playerProgress.longestRun, this.run.challengesCleared);
    next.playerProgress.bestStreak = Math.max(next.playerProgress.bestStreak, this.run.bestStreak);
    next.lifetimeStats.workshopClears += this.envClears.workshop;
    next.lifetimeStats.rooftopClears += this.envClears.rooftop;
    next.lifetimeStats.spaceClears += this.envClears.space;
    const unlocked = detectNewMilestones(next.milestoneRecords, {
      challengesCleared: this.run.challengesCleared,
      bullseyes: this.run.bullseyes,
      perfects: this.run.perfects,
      closeCalls: this.run.closeCalls,
      bestStreak: this.run.bestStreak,
      currentStreak: this.run.currentStreak,
      environmentsCompleted: this.run.environmentsCompleted,
      lastCompletedEnvironment: this.lastCompletedEnvironment,
      loopNumber: this.director.loopNumber,
      loopsCompleted: this.run.loopsCompleted,
      workshopCleared: this.envClears.workshop > 0,
      rooftopCleared: this.envClears.rooftop > 0,
      spaceCleared: this.envClears.space > 0,
    });
    next.milestoneRecords = applyMilestones(next.milestoneRecords, unlocked);
    const cosmetics = newlyUnlockedProjectiles(previousLevel, next.playerProgress.playerLevel);
    next.playerProgress.unlockedProjectileIds = Array.from(
      new Set([
        ...next.playerProgress.unlockedProjectileIds,
        ...unlockedProjectileIds(next.playerProgress.playerLevel),
      ]),
    );
    this.unlockedName = cosmetics[0]?.name ?? null;
    if (cosmetics[0]) {
      AudioManager.play('unlock');
    }
    this.leveledUpThisRun = next.playerProgress.playerLevel > previousLevel;
    next.commercial.removeAds = PurchaseService.hasRemoveAdsEntitlement();
    next.commercial.runsSinceLastInterstitial += 1;
    if (!this.run.hasUsedRewardedContinue) {
      next.commercial.bestScoreNoContinue = Math.max(
        next.commercial.bestScoreNoContinue,
        this.run.score,
      );
    }
    this.save = next;
    void saveGameSave(this.save);
    if (this.leveledUpThisRun) {
      Analytics.track(ANALYTICS_EVENTS.levelUp, {
        runId: Analytics.runId,
        playerLevel: next.playerProgress.playerLevel,
      });
    }
    if (cosmetics[0]) {
      Analytics.track(ANALYTICS_EVENTS.projectileUnlocked, { projectileId: cosmetics[0].id });
    }
    if (this.records.score) {
      Analytics.track(ANALYTICS_EVENTS.newHighScore, {
        runId: Analytics.runId,
        score: this.run.score,
        usedRewardedContinue: this.run.hasUsedRewardedContinue,
      });
    }
  }

  private projectedXp(): number {
    return this.save.playerProgress.totalXP + this.run.runXp;
  }

  private syncProgressUnlocks(): void {
    this.save.playerProgress.playerLevel = playerLevelFromXp(this.save.playerProgress.totalXP);
    this.save.playerProgress.unlockedProjectileIds = Array.from(
      new Set([
        ...this.save.playerProgress.unlockedProjectileIds,
        ...unlockedProjectileIds(this.save.playerProgress.playerLevel),
      ]),
    );
  }

  private maybeAnnounceProgress(): void {
    const cleared = this.run.challengesCleared;
    if ((SHOT_MILESTONES as readonly number[]).includes(cleared)) {
      this.banner = shotMilestoneLabel(cleared);
      this.bannerTimer = 1;
      this.particles.spawnStreak(this.projectile.position);
      GameHaptics.forStreak();
    }
    const projected = playerLevelFromXp(this.projectedXp());
    if (!this.levelUpAnnounced && projected > this.startingLevel) {
      this.levelUpAnnounced = true;
      this.banner = `LEVEL UP  ${projected}`;
      this.bannerTimer = 1.1;
      GameHaptics.forLevelUp();
      AudioManager.play('level-up');
    }
  }

  private logRunTelemetry(): void {
    const lines = [
      '=== RUN TELEMETRY ===',
      `duration ${this.run.durationSeconds().toFixed(1)}s`,
      `score ${this.run.score}`,
      `challengesCleared ${this.run.challengesCleared}`,
      `attempts ${this.run.attempts}`,
      `rotorHits ${this.run.rotorHits}`,
      `targetMisses ${this.run.targetMisses}`,
      `hits ${this.run.hits}`,
      `greats ${this.run.greats}`,
      `bullseyes ${this.run.bullseyes}`,
      `perfects ${this.run.perfects}`,
      `closeCalls ${this.run.closeCalls}`,
      `bestStreak ${this.run.bestStreak}`,
      `loop ${this.director.loopNumber}`,
      `environment ${this.director.current.environment}`,
      `seed ${this.director.seed.toString(16)}`,
      `theme ${this.director.theme}`,
      `xp ${this.run.runXp}`,
    ];
    console.log(lines.join('\n'));
  }

  private completeTransition(): void {
    this.camera.rebase();
    this.scene.environment.hidePortal();
    this.applyChallenge(this.director.current, true);
    this.resetProjectile();
    this.trackEnvironmentEntered();
    this.state.set('READY');
    this.emitHud();
  }

  private applyChallenge(config: ChallengeConfig, immediateEnv: boolean): void {
    this.scene.environment.setEnvironment(config.environment, this.scene.scene, immediateEnv);
    for (let i = 0; i < this.obstacles.length; i += 1) {
      const rotorConfig = config.obstacles[i];
      if (rotorConfig) {
        this.obstacles[i].applyConfig(rotorConfig, config.environment);
      } else {
        this.obstacles[i].hide();
      }
    }
    this.target.applyConfig(config.target);
    this.obstacleCleared = [false, false];
  }

  private showPortalFor(environment: EnvironmentId): void {
    if (environment === 'rooftop') {
      this.scene.environment.showPortal('door');
    } else if (environment === 'space') {
      this.scene.environment.showPortal('tunnel');
    } else {
      this.scene.environment.showPortal('ring');
    }
  }

  private resetProjectile(): void {
    this.projectile.reset();
    this.trail.reset();
    this.camera.clearEffects();
    this.camera.allowShake = false;
    this.obstacleCleared = [false, false];
    this.targetResolved = false;
    this.flightTime = 0;
    this.aim.cancel();
    this.trajectory.setVisible(false);
  }

  private cancelAim(): void {
    this.aim.cancel();
    this.trajectory.setVisible(false);
    this.projectile.setCancelReady(false);
    this.state.set('READY');
    this.emitHud();
  }

  private syncAimVisuals(): void {
    this.syncTrajectory();
    const showPreview = this.aim.hasEnteredAim && !this.aim.isCancelReady;
    this.trajectory.setVisible(showPreview);
    this.projectile.setCancelReady(this.aim.isCancelReady);
  }

  private syncTrajectory(): void {
    this.trajectory.update(
      this.projectile.position,
      this.aim.getLaunchVelocity(),
      this.target.z,
    );
  }

  private emitHud(): void {
    const snapshot = this.getHudSnapshot();
    for (const listener of this.hudListeners) {
      listener(snapshot);
    }
  }

  private maybeOfferContinue(): void {
    if (this.run.hasUsedRewardedContinue || !AdService.rewardedReady()) {
      this.enterRunOver();
      return;
    }
    this.continueGrantedThisDeath = false;
    this.continueBusy = false;
    this.adMessage = null;
    this.state.set('CONTINUE_OFFER');
    Analytics.track(ANALYTICS_EVENTS.continueOffered, this.continueAnalyticsProps());
    this.emitHud();
  }

  private async acceptContinueAsync(): Promise<void> {
    if (this.state.phase !== 'CONTINUE_OFFER' || this.continueBusy || this.run.hasUsedRewardedContinue) {
      return;
    }
    this.continueBusy = true;
    this.emitHud();
    Analytics.track(ANALYTICS_EVENTS.continueSelected, this.continueAnalyticsProps());
    const result = await AdService.showRewarded();
    if (result !== 'completed' || this.continueGrantedThisDeath || this.run.hasUsedRewardedContinue) {
      this.adMessage = 'CONTINUE UNAVAILABLE';
      this.continueBusy = false;
      this.enterRunOver();
      return;
    }
    this.grantContinueAndResume();
  }

  private grantContinueAndResume(): void {
    if (this.continueGrantedThisDeath) {
      return;
    }
    this.continueGrantedThisDeath = true;
    this.run.grantContinue();
    this.suppressInterstitialForCurrentRun = true;
    this.pendingRunOver = false;
    this.pendingAdvance = false;
    this.continueBusy = false;
    this.adMessage = null;
    this.applyChallenge(this.director.current, true);
    this.resetProjectile();
    this.timeScale = 1;
    this.slowdownRemaining = 0;
    this.state.set('READY');
    this.emitHud();
  }

  private async requestRetryAsync(): Promise<void> {
    if (this.continueBusy || this.adShowing) {
      return;
    }
    if (
      this.state.phase !== 'RUN_OVER' &&
      this.state.phase !== 'PROTOTYPE_COMPLETE'
    ) {
      this.restart();
      return;
    }
    const eligible = AdService.canShowInterstitial(this.interstitialContext());
    if (eligible) {
      this.continueBusy = true;
      this.emitHud();
      Analytics.track(ANALYTICS_EVENTS.interstitialEligible, {
        runId: Analytics.runId,
        runsCompleted: this.save.playerProgress.totalRuns,
      });
      const result = await AdService.showInterstitial();
      this.continueBusy = false;
      if (result !== 'failed') {
        this.save.commercial.lastInterstitialAt = Date.now();
        this.save.commercial.runsSinceLastInterstitial = 0;
        void saveGameSave(this.save);
      }
    }
    this.restart();
  }

  private interstitialContext() {
    const lastAt = this.save.commercial.lastInterstitialAt;
    return {
      removeAds: PurchaseService.hasRemoveAdsEntitlement(),
      onboardingComplete: this.save.hasCompletedOnboarding,
      runsCompleted: this.save.playerProgress.totalRuns,
      runsSinceLastInterstitial: this.save.commercial.runsSinceLastInterstitial,
      secondsSinceLastInterstitial: lastAt === 0 ? 1e9 : (Date.now() - lastAt) / 1000,
      suppressAfterRewarded: this.suppressInterstitialForCurrentRun,
    };
  }

  private continueAnalyticsProps() {
    return {
      runId: Analytics.runId,
      score: this.run.score,
      shotsCleared: this.run.challengesCleared,
      loopNumber: this.director.loopNumber,
      environment: this.director.current.environment,
      previousBestScore: this.bests.bestScore,
    };
  }

  private shotAnalyticsProps() {
    return {
      runId: Analytics.runId,
      shotId: this.director.challengeNumber,
      environment: this.director.current.environment,
      loopNumber: this.director.loopNumber,
      obstacleTypes: this.director.current.obstacles.map((obstacle) => obstacleTypeOf(obstacle)).join(','),
    };
  }

  private trackShotResult(kind: NonNullable<HudSnapshot['resultKind']>): void {
    const props = {
      ...this.shotAnalyticsProps(),
      kind,
      points: this.lastResultPoints,
      fail: this.lastFail,
    };
    if (kind === 'ROTOR_HIT' || kind === 'MISS') {
      Analytics.track(ANALYTICS_EVENTS.shotFailed, props);
      if (kind === 'ROTOR_HIT') {
        Analytics.track(ANALYTICS_EVENTS.obstacleCollision, props);
      } else {
        Analytics.track(ANALYTICS_EVENTS.targetMiss, props);
      }
      return;
    }
    Analytics.track(ANALYTICS_EVENTS.shotSuccess, props);
    if (kind === 'BULLSEYE') {
      Analytics.track(ANALYTICS_EVENTS.bullseye, props);
    }
    if (kind === 'PERFECT') {
      Analytics.track(ANALYTICS_EVENTS.perfect, props);
    }
  }

  private trackRunEnded(): void {
    Analytics.track(ANALYTICS_EVENTS.runEnded, {
      runId: Analytics.runId,
      reason: this.lastRunEndReason,
      score: this.run.score,
      shotsCleared: this.run.challengesCleared,
      duration: Math.round(this.run.durationSeconds()),
      usedRewardedContinue: this.run.hasUsedRewardedContinue,
      loopNumber: this.director.loopNumber,
      environment: this.director.current.environment,
      playerLevel: this.save.playerProgress.playerLevel,
    });
    Analytics.noteRunEnded();
  }

  private trackEnvironmentEntered(): void {
    const environment = this.director.current.environment;
    if (this.lastEnvironmentTracked === environment) {
      return;
    }
    this.lastEnvironmentTracked = environment;
    Analytics.track(ANALYTICS_EVENTS.environmentEntered, {
      runId: Analytics.runId,
      environment,
      loopNumber: this.director.loopNumber,
    });
  }

  private render(): void {
    this.renderer.render(this.scene.scene, this.camera.camera);
    this.gl.endFrameEXP();
  }
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function formatRotorPred(
  rotor: ShotPrediction['rotors'][number] | undefined,
): string {
  if (!rotor?.active) {
    return '-';
  }
  const part = rotor.hitPart ? `-${rotor.hitPart}` : '';
  const radius =
    rotor.predicted.openingRadius > 0 ? ` r${rotor.predicted.openingRadius.toFixed(2)}` : '';
  return `${rotor.type} ${rotor.verdict}${part} ${rotor.time.toFixed(2)}s${radius}`;
}

function formatTargetPred(
  target: ShotPrediction['target'] | undefined,
): string {
  if (!target) {
    return '-';
  }
  return `${target.verdict} ${target.time.toFixed(2)}s d${target.distance.toFixed(2)}`;
}

function formatMiss(report: TargetMissReport | null): string {
  if (!report) {
    return '-';
  }
  return `act ${report.actualX.toFixed(2)},${report.actualY.toFixed(2)} tgt ${report.targetX.toFixed(2)},${report.targetY.toFixed(2)} d${report.distance.toFixed(2)} r${report.targetRadius.toFixed(2)} ball${report.projectileRadius.toFixed(2)} edge${report.edgeWouldHit ? 'Y' : 'N'}`;
}

function failLabel(type: string, index: number): string {
  const names: Record<string, string> = {
    rotor: 'ROTOR',
    slidingGate: 'GATE',
    iris: 'IRIS',
    pendulum: 'PENDULUM',
    movingRing: 'RING',
  };
  return `${names[type] ?? type.toUpperCase()} ${index === 0 ? 'A' : 'B'}`;
}

function collisionEvent(
  type: string,
): 'rotor' | 'gate' | 'iris' | 'pendulum' | 'ring' {
  if (type === 'slidingGate') {
    return 'gate';
  }
  if (type === 'iris') {
    return 'iris';
  }
  if (type === 'pendulum') {
    return 'pendulum';
  }
  if (type === 'movingRing') {
    return 'ring';
  }
  return 'rotor';
}
