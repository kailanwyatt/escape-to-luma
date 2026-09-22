import {voyageReward} from '../progression/voyage';
import {t} from '../i18n';
import {ReflectorField} from '../reflectors/ReflectorField';
import {stepRicochet,RICOCHET_STEP} from '../reflectors/Reflection';
import type {Vec3} from '../reflectors/ReflectorConfig';
import {campaignEncounterStart} from '../campaign/EncounterStart';
import {FIRST_ESCAPE, storyForLevel, storyAfterWorld, pendingWorldStory, type StoryMoment} from '../campaign/StoryMoments';
import { sparkStateFor } from '../projectile/SparkVisualState';
import { OpeningScene } from '../scene/OpeningScene';
import { OPENING_DURATION, OPENING_BEATS, sampleOpening } from '../scene/OpeningSequence';
import type { ExpoWebGLRenderingContext } from 'expo-gl';
import {Vector3, type WebGLRenderer} from 'three';

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
import { ECONOMY, SHARD_PACKS, type ShardPackId } from '../config/economy';
import { RELEASE_POLICY } from '../config/release';
import {
  applyLevelFailure,
  applyLevelSuccess,
  consumeBoosts,
  canStartLevel,
  syncCampaignEnergy,
} from '../campaign/CampaignPlay';
import { getCampaignLevel, getPlayableCampaignLevels, WORLD1_LEVELS } from '../campaign/levels';
import type { CampaignLevelDefinition, PrecisionRank, SelectedBoosts } from '../campaign/types';
import { worldForLevel } from '../campaign/worlds';
import { sparkById, sparkVisualProfile } from '../customization/sparks';
import { trailById } from '../customization/trails';
import { rankFromResult } from '../economy/rewards';
import { ParticleSystem } from '../feedback/Particles';
import { ProjectileTrail } from '../feedback/ProjectileTrail';
import { WindField } from '../feedback/WindField';
import { GravityWellField } from '../feedback/GravityWellField';
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
  hasUnlimitedEnergy,
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
import { disposeThreeObject } from '../utils/disposeThree';
import { signOr } from '../utils/math';
import { GameState, type DebugSnapshot, type HudSnapshot, type ObstacleDebug } from './GameState';
import { GAME_TUNING } from './gameTuning';

const CAMPAIGN_OPENING_DURATION = OPENING_DURATION;
const CAMPAIGN_OPENING_STAGES = OPENING_BEATS.length;
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
  private readonly reflectors = new ReflectorField();
  private ricochetStatus={bounces:0,blocked:false};
  private ricochetAccumulator=0;
  private ricochetPreviewAt=-Infinity;
  private ricochetPreviewVelocity={vx:Infinity,vy:Infinity,vz:Infinity};
  private readonly obstacles = [new ObstacleSlot('A'), new ObstacleSlot('B'), new ObstacleSlot('C')];
  private readonly target = new Target();
  private readonly particles = new ParticleSystem();
  private readonly trail = new ProjectileTrail();
  private readonly windField = new WindField();
  private readonly gravityWellField = new GravityWellField();
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
  private obstacleCleared = [false, false, false];
  private lastResult: HudSnapshot['resultKind'] = null;
  private lastResultPoints = 0;
  private flightTime = 0;
  private simTime = 0;
  private obstacleTime = 0;
  private lastObstacleStep = 0;
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
  private sessionMode: 'campaign' | 'endless' = 'endless';
  private campaignDef: CampaignLevelDefinition | null = null;
  private boostsCommitted=false;
  private selectedBoosts: SelectedBoosts = {};
  private campaignWindX = 0;
  private campaignGravityScale = 1;
  private lastShardsGained = 0;
  private lastPrecisionRank: PrecisionRank | null = null;
  private campaignStory: StoryMoment | null = null;
  private storyReturn: 'READY' | 'LEVEL_COMPLETE' | 'WORLD_COMPLETE' | 'CAMPAIGN_COMPLETE' = 'READY';
  private storyBeat: string | null = null;
  private pendingWorldComplete = false;
  private secondChancePending = false;
  private helpOffer = false;
  private campaignShotFired=false;
  private readonly openingScene = new OpeningScene();
  private openingTimer = 0;
  private openingStage = 0;
  private pendingCampaignFail = false;
  private slowFieldActive = false;
  private hydrated = false;
  private pendingCampaignComplete = false;
  private voyageShards = 0;
  private runProgressCommitted = true;
  private unlockedSparkName: string | null = null;

  constructor(gl: ExpoWebGLRenderingContext) {
    this.gl = gl;
    this.renderer = createThreeRenderer(gl);
    this.scene = new GameScene();
    this.camera = new CameraController();

    this.scene.add(
      this.openingScene.group,
      this.projectile.mesh,
      this.trajectory.group,
      this.reflectors.group,
      this.obstacles[0].group,
      this.obstacles[1].group,
      this.obstacles[2].group,
      this.target.group,
      this.particles.group,
      this.trail.group,
      this.windField.group,
      this.gravityWellField.group,
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
    void PurchaseService.initialize();
    this.applySettings();
    this.syncCampaignEnergyOnSave();
    this.applySparkLook();
    this.hydrated = true;
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
    this.syncCampaignEnergyOnSave();
    if (!this.adShowing) {
      AudioManager.restoreFromSettings(this.save.settings.soundEnabled);
    }
    if (!this.running) {
      this.start();
    }
    this.emitHud();
  }

  dispose(): void {
    this.pause();
    disposeThreeObject(this.scene.scene);
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
    this.syncTrajectoryDebugFull();
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
    return this.hydrated && this.running && this.state.canAcceptInput();
  }

  onTouchStart(x: number, y: number): void {
    if (!this.canAcceptInput()) return;
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
    if (!this.running || this.state.phase !== 'AIMING') {
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
    if (!this.running || this.state.phase !== 'AIMING') {
      return;
    }
    if (!this.aim.shouldLaunch()) {
      this.cancelAim();
      return;
    }
    if(this.sessionMode==='campaign'&&!this.boostsCommitted){
      this.save={...this.save,campaign:consumeBoosts(this.save.campaign,this.selectedBoosts)};
      this.boostsCommitted=true;void saveGameSave(this.save);
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
      this.obstacleTime,
      this.obstacleTimeScale(),
      {
        windX: this.campaignWindX,
        gravityScale: this.campaignGravityScale,
        wells: this.projectileSystem.wells,
      },
      this.simTime,
      this.campaignDef?.challenge.ricochet,
    );
    this.maxPathError = 0;
    this.projectile.velocity.set(velocity.vx, velocity.vy, velocity.vz);
    this.projectile.previousPosition.copy(this.projectile.position);
    this.obstacleCleared = [false, false, false];
    this.targetResolved = false;
    this.flightTime = 0;
    this.ricochetStatus={bounces:0,blocked:false};
    this.lastNearMiss = false;
    this.lastCloseCallClearance = 0;
    this.closeCallTimer = 0;
    this.lastFail = null;
    this.run.markAttempt();
    this.throwsThisRun += 1;
    if(this.sessionMode==='campaign')this.campaignShotFired=true;
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
    this.finishEndlessVoyage();
    this.runProgressCommitted = false;
    this.voyageShards = 0;
    this.run.reset();
    this.director.restart(seed);
    if (this.director.isAuthored) {
      this.authored.reset();
    }
    this.simTime = 0;
    this.obstacleTime = 0;
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
    this.startEndlessVoyage();
  }

  startEndlessVoyage(options?: {awaitStart?: boolean}): void {
    this.finishEndlessVoyage();
    this.runProgressCommitted = true;
    this.sessionMode = 'endless';
    this.director.mode = 'GENERATED';
    this.run.unlimitedHearts = false;
    this.campaignDef = null;
    this.campaignWindX = 0;
    this.windField.setWind(0);
    this.campaignGravityScale = 1;
    this.projectileSystem.windX = 0;
    this.projectileSystem.gravityScale = 1;
    this.projectileSystem.wells = [];
    this.reflectors.setReflectors([]);
    this.gravityWellField.setWells([]);
    this.selectedBoosts = {};
    this.secondChancePending = false;
    this.slowFieldActive = false;
    this.helpOffer = false;
    this.pendingCampaignFail = false;
    this.syncTrajectoryDebugFull();
    this.restart(undefined, { awaitStart: options?.awaitStart ?? true });
  }

  /** Finish the existing reunion acknowledgement, then enter a playable Voyage once. */
  exploreFromFinale(): void {
    if (this.sessionMode !== 'campaign') return;
    const reunion = this.state.phase === 'CAMPAIGN_STORY' && this.campaignStory?.visual === 'reunion';
    if (!reunion && this.state.phase !== 'CAMPAIGN_COMPLETE') return;
    if (reunion) this.continueAfterLevel();
    this.campaignStory = null;
    this.pendingCampaignComplete = false;
    this.pendingWorldComplete = false;
    this.unlockedSparkName = null;
    this.startEndlessVoyage({awaitStart: false});
  }

  /** Bank earned XP and records when leaving; repeated Home/Restart cannot pay twice. */
  finishEndlessVoyage(): void {
    if (this.sessionMode !== 'endless' || this.runProgressCommitted || this.throwsThisRun === 0) return;
    this.commitProgress();
  }

  canChooseCampaignBoosts():boolean {
    return this.sessionMode==='campaign'&&this.state.phase==='READY'&&!this.campaignShotFired&&Object.keys(this.selectedBoosts).length===0&&(this.campaignDef?.levelNumber??0)>5;
  }

  equipCampaignBoosts(boosts:SelectedBoosts):boolean {
    if(!this.canChooseCampaignBoosts())return false;
    const additions:SelectedBoosts={};
    for(const id of ['guidance','slowField','secondChance','portalBloom'] as const){
      if(boosts[id]&&!this.selectedBoosts[id]&&this.save.campaign.boostInventory[id]>0)additions[id]=true;
    }
    if(Object.keys(additions).length){
      // Selection reserves stock; only an actual launch consumes it.
      this.selectedBoosts={...this.selectedBoosts,...additions};
      this.secondChancePending ||= Boolean(additions.secondChance);
      this.slowFieldActive ||= Boolean(additions.slowField);
      this.applyBloom();this.syncTrajectoryDebugFull();this.emitHud();
    }
    return true;
  }

  startCampaignLevel(levelNumber: number, boosts: SelectedBoosts): void {
    if (!this.hydrated) {
      return;
    }
    const def = getCampaignLevel(levelNumber);
    if (!def) {
      return;
    }
    if (
      this.sessionMode === 'campaign' &&
      this.campaignDef?.levelNumber === levelNumber &&
      (this.state.phase === 'READY' || this.state.phase === 'CAMPAIGN_OPENING' || this.state.phase === 'CAMPAIGN_STORY')
    ) {
      return;
    }
    this.syncCampaignEnergyOnSave();
    if(canStartLevel(this.save.campaign,levelNumber).reason==='energy'){this.campaignDef=def;this.state.set('OUT_OF_ENERGY');this.emitHud();return;}
    this.sessionMode = 'campaign';
    this.campaignStory = null;
    this.campaignDef = def;
    this.campaignShotFired=false;
    this.helpOffer = false;
    this.pendingCampaignFail = false;
    this.pendingWorldComplete = false;
    this.pendingCampaignComplete = false;
    this.unlockedSparkName = null;
    this.lastShardsGained = 0;
    this.lastPrecisionRank = null;
    this.pendingAdvance = false;
    this.pendingRunOver = false;

    const inv = this.save.campaign.boostInventory;
    const toConsume: SelectedBoosts = {};
    for (const id of ['guidance', 'slowField', 'secondChance', 'portalBloom'] as const) {
      if (boosts[id] && (inv[id] ?? 0) > 0) {
        toConsume[id] = true;
      }
    }
    this.boostsCommitted=false;
    this.selectedBoosts = toConsume;
    this.secondChancePending = Boolean(toConsume.secondChance);
    this.slowFieldActive = Boolean(toConsume.slowField);

    this.campaignWindX = def.windX ?? 0;
    this.windField.setWind(this.campaignWindX);
    this.campaignGravityScale = def.gravityScale ?? 1;
    this.projectileSystem.windX = this.campaignWindX;
    this.projectileSystem.gravityScale = this.campaignGravityScale;
    this.projectileSystem.wells = def.gravityWells ?? [];
    this.gravityWellField.setWells(def.gravityWells ?? []);
    this.syncTrajectoryDebugFull();

    this.run.reset();
    this.run.unlimitedHearts = true;
    this.simTime = 0;
    this.obstacleTime = 0;
    this.storyBeat = def.storyBeat ?? worldForLevel(def.levelNumber)?.storyBeat ?? null;
    this.applyChallenge(def.challenge, true);
    this.reflectors.setReflectors(def.challenge.ricochet?.reflectors ?? []);
    this.ricochetAccumulator=0;this.ricochetPreviewAt=-Infinity;
    this.resetProjectile();
    this.aim.cancel();
    this.trajectory.setVisible(false);
    this.lastResult = null;
    this.banner = null;
    this.bannerTimer = 0;
    this.camera.clearEffects();
    this.camera.allowShake = false;
    this.camera.rebase();
    this.scene.environment.hidePortal();
    this.applySparkLook();

    Analytics.track(ANALYTICS_EVENTS.levelStarted, {
      levelNumber: def.levelNumber,
      worldId: def.worldId,
      boosts: Object.keys(toConsume).join(',') || 'none',
    });

    if (!this.save.campaign.hasSeenOpening) {
      this.openingTimer = CAMPAIGN_OPENING_DURATION;
      this.openingStage = 0;
      this.state.set('CAMPAIGN_OPENING');
    } else {
      this.state.set('READY');
      const story = pendingWorldStory(levelNumber, this.save.campaign.seenStoryIds ?? [], this.save.campaign.completedLevels) ?? storyForLevel(levelNumber, this.save.campaign.seenStoryIds ?? []);
      if (story) this.showCampaignStory(story, 'READY');
    }
    this.emitHud();
  }

  retryCampaignLevel(): void {
    if (!this.campaignDef) {
      return;
    }
    this.startCampaignLevel(this.campaignDef.levelNumber, {});
  }

  private showCampaignStory(story: StoryMoment, returnTo: 'READY' | 'LEVEL_COMPLETE' | 'WORLD_COMPLETE' | 'CAMPAIGN_COMPLETE'): void {
    this.campaignStory = story; this.storyReturn = returnTo;
    this.aim.cancel(); this.trajectory.setVisible(false);
    this.state.set('CAMPAIGN_STORY');
  }

  continueAfterLevel(): void {
    if (this.state.phase === 'CAMPAIGN_STORY' && this.campaignStory) {
      const id = this.campaignStory.id;
      this.save = {...this.save,campaign:{...this.save.campaign,seenStoryIds:[...new Set([...(this.save.campaign.seenStoryIds ?? []),id,...(this.campaignStory.acknowledgements??[])])]}};
      void saveGameSave(this.save);
      this.campaignStory = null;
      this.state.set(this.storyReturn);
      if (this.storyReturn === 'READY') {
        const next = this.campaignDef ? storyForLevel(this.campaignDef.levelNumber, this.save.campaign.seenStoryIds ?? []) : null;
        if (next) this.showCampaignStory(next, 'READY');
        this.emitHud(); return;
      }
      if (this.storyReturn === 'WORLD_COMPLETE' || this.storyReturn === 'CAMPAIGN_COMPLETE') { this.emitHud(); return; }
    }
    // Ignore double taps after an entry story has already handed control back.
    if (!['LEVEL_COMPLETE','WORLD_COMPLETE','SPARK_UNLOCKED','CAMPAIGN_COMPLETE'].includes(this.state.phase)) return;
    if (!this.campaignDef) {
      this.state.set('READY');
      this.emitHud();
      return;
    }
    if (this.state.phase === 'WORLD_COMPLETE' && this.unlockedSparkName) {
      this.state.set('SPARK_UNLOCKED');
      this.emitHud();
      return;
    }
    if (
      (this.state.phase === 'WORLD_COMPLETE' || this.state.phase === 'SPARK_UNLOCKED') &&
      this.pendingCampaignComplete
    ) {
      this.pendingWorldComplete = false;
      this.state.set('CAMPAIGN_COMPLETE');
      this.emitHud();
      return;
    }
    if (this.state.phase === 'CAMPAIGN_COMPLETE') {
      this.startEndlessVoyage();
      return;
    }
    if (this.campaignDef.levelNumber >= RELEASE_POLICY.campaignMaxLevel) {
      // A replay of the final level offers another attempt, not another ending.
      this.retryCampaignLevel();
      return;
    }
    const nextLevel = this.campaignDef.levelNumber + 1;
    this.pendingWorldComplete = false;
    this.startCampaignLevel(nextLevel, {});
  }

  declineHelp(): void {
    this.helpOffer = false;
    this.emitHud();
  }

  useHelpSlowField(): void {
    if (!this.helpOffer || !this.campaignDef) {
      return;
    }
    this.helpOffer = false;
    this.slowFieldActive = true;
    this.resetCampaignAttempt();
    this.state.set('READY');
    this.emitHud();
  }

  watchRewardedEnergy(): Promise<void> {
    return this.watchRewardedEnergyAsync();
  }

  activateUnlimitedEnergy(durationMs: number): void {
    this.activateUnlimitedEnergyInternal(durationMs);
    this.emitHud();
  }

  addShards(amount: number): void {
    this.save.campaign.shards += amount;
    void saveGameSave(this.save);
    this.emitHud();
  }

  setEnergy(amount: number): void {
    this.save.campaign.currentEnergy = Math.max(0, Math.min(ECONOMY.maxEnergy, amount));
    this.save.campaign.energyUpdatedAt = Date.now();
    void saveGameSave(this.save);
    this.emitHud();
  }

  unlockEndless(): void {
    this.save.campaign.endlessUnlockedDev = true;
    void saveGameSave(this.save);
    this.emitHud();
  }

  completeWorld1(): void {
    const campaign = structuredCloneSave(this.save).campaign;
    for (const level of WORLD1_LEVELS) {
      const prev = campaign.completedLevels[level.id];
      campaign.completedLevels[level.id] = {
        bestRank: 'CLEAR',
        bestScore: ECONOMY.score.CLEAR,
        attempts: prev?.attempts ?? 0,
        cleared: true,
        rewardsGranted: prev?.rewardsGranted ?? {
          clear: true,
          great: false,
          bullseye: false,
          perfect: false,
        },
      };
    }
    campaign.highestUnlockedLevel = Math.max(campaign.highestUnlockedLevel, 16);
    if (!campaign.unlockedWorldIds.includes('city')) {
      campaign.unlockedWorldIds.push('city');
    }
    if (!campaign.ownedSparkIds.includes('reactor')) {
      campaign.ownedSparkIds.push('reactor');
    }
    this.save = { ...this.save, campaign };
    void saveGameSave(this.save);
    this.emitHud();
  }

  resetCampaign(): void {
    this.save.campaign = structuredCloneSave(emptySave()).campaign;
    this.syncCampaignEnergyOnSave();
    void saveGameSave(this.save);
    this.runProgressCommitted = true;
    this.sessionMode = 'endless';
    this.campaignDef = null;
    this.emitHud();
  }

  syncCampaignSave(): void {
    this.syncCampaignEnergyOnSave();
    void saveGameSave(this.save);
    this.emitHud();
  }

  buySparkWithShards(sparkId: string): boolean {
    const spark = sparkById(sparkId);
    if (spark.acquisition !== 'shards' || spark.shardCost == null) {
      return false;
    }
    if (this.save.campaign.ownedSparkIds.includes(sparkId)) {
      return false;
    }
    if (this.save.campaign.shards < spark.shardCost) {
      return false;
    }
    this.save.campaign.shards -= spark.shardCost;
    this.save.campaign.ownedSparkIds.push(sparkId);
    void saveGameSave(this.save);
    this.emitHud();
    return true;
  }

  equipSpark(sparkId: string): void {
    if (!this.save.campaign.ownedSparkIds.includes(sparkId)) {
      return;
    }
    this.save.campaign.equippedSparkId = sparkId;
    void saveGameSave(this.save);
    this.applySparkLook();
    this.emitHud();
  }

  buyBoostWithShards(boostId: 'guidance' | 'slowField' | 'secondChance' | 'portalBloom'): boolean {
    const cost = ECONOMY.boostCosts[boostId];
    if (this.save.campaign.shards < cost) {
      return false;
    }
    this.save.campaign.shards -= cost;
    const inv = this.save.campaign.boostInventory;
    inv[boostId] = (inv[boostId] ?? 0) + 1;
    void saveGameSave(this.save);
    this.emitHud();
    return true;
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
    this.adMessage = t("game.continue_unavailable");
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
      if (!this.save.settings.soundEnabled) AudioManager.pauseAll();
    }
    GameHaptics.enabled = this.save.settings.hapticsEnabled;
    this.camera.reduceMotion = this.save.settings.reduceMotion || this.systemReduceMotion;
    this.scene.environment.setReduceMotion(
      this.save.settings.reduceMotion || this.systemReduceMotion,
    );
  }

  private applyProjectileLook(): void {
    if (this.sessionMode === 'campaign') {
      this.applySparkLook();
      return;
    }
    const style = projectileStyle(this.save.selectedProjectileId);
    this.projectile.applyStyle(style);
    this.trail.setStyle(style.trailColor, style.trailWidth);
  }

  private applySparkLook(): void {
    const spark = sparkById(this.save.campaign.equippedSparkId);
    const trail = trailById(this.save.campaign.equippedTrailId);
    this.projectile.applyStyle(
      {
        color: spark.color,
        emissive: spark.emissive,
        emissiveIntensity: spark.emissiveIntensity,
        shininess: spark.shininess,
      },
      sparkVisualProfile(spark),
    );
    this.trail.setStyle(spark.trailColor || trail.color, spark.trailWidth || trail.width);
  }

  private syncCampaignEnergyOnSave(): void {
    this.save = {
      ...this.save,
      campaign: syncCampaignEnergy(this.save.campaign),
    };
  }

  private syncTrajectoryDebugFull(): void {
    const guidance =
      this.sessionMode === 'campaign' && Boolean(this.selectedBoosts.guidance);
    this.trajectory.setDebugFull(this.debugEnabled || guidance);
  }

  skipCampaignOpening(): void {
    if (this.state.phase !== 'CAMPAIGN_OPENING') return;
    this.finishCampaignOpening();
    AudioManager.play('ui');
  }

  replayCampaignOpening(): void {
    this.startCampaignLevel(1, {});
    this.simTime = 0;
    this.obstacleTime = 0;
    this.openingTimer = CAMPAIGN_OPENING_DURATION;
    this.openingStage = 0;
    this.state.set('CAMPAIGN_OPENING');
    this.emitHud();
  }

  private finishCampaignOpening(): void {
    this.markCampaignOpeningSeen();
    this.openingTimer = 0;
    this.openingStage = CAMPAIGN_OPENING_STAGES - 1;
    this.openingScene.hide();
    this.scene.environment.group.visible = true;
    if (this.campaignDef) this.applyChallenge(this.campaignDef.challenge, true);
    this.resetProjectile();
    this.camera.clearEffects();
    this.camera.rebase();
    this.camera.update(0);
    this.state.set('READY');
    this.emitHud();
  }

  private markCampaignOpeningSeen(): void {
    if (!this.save.campaign.hasSeenOpening) {
      this.save.campaign.hasSeenOpening = true;
      void saveGameSave(this.save);
    }
  }

  private applyBloom():void {
    if(this.sessionMode==='campaign'&&this.campaignDef)this.target.applyConfig({...this.campaignDef.challenge.target,radius:this.campaignDef.challenge.target.radius*(this.selectedBoosts.portalBloom?ECONOMY.portalBloomMultiplier:1)});
  }
  buyEnergyRefill():boolean {
    this.syncCampaignEnergyOnSave();
    if(this.save.campaign.currentEnergy>=ECONOMY.maxEnergy||this.save.campaign.shards<ECONOMY.energyRefillCost)return false;
    this.save.campaign.shards-=ECONOMY.energyRefillCost;this.save.campaign.currentEnergy=ECONOMY.maxEnergy;this.save.campaign.energyUpdatedAt=Date.now();void saveGameSave(this.save);this.emitHud();return true;
  }
  async purchaseShardPack(packId: ShardPackId): Promise<'completed' | 'cancelled' | 'failed' | 'unavailable' | 'already'> {
    const result = await PurchaseService.purchaseShardPack(packId);
    if (result.status !== 'completed') return result.status;
    if (this.save.campaign.processedPurchaseIds.includes(result.transactionId)) return 'already';
    const pack = SHARD_PACKS.find((candidate) => candidate.id === packId);
    if (!pack) return 'failed';
    this.save.campaign.shards += pack.shards;
    this.save.campaign.processedPurchaseIds = [
      ...this.save.campaign.processedPurchaseIds,
      result.transactionId,
    ].slice(-200);
    await saveGameSave(this.save);
    this.emitHud();
    return 'completed';
  }
  private resetCampaignAttempt(): void {
    if (!this.campaignDef) {
      return;
    }
    this.simTime = 0;
    this.obstacleTime = 0;
    this.lastObstacleStep = 0;
    this.closeCallTimer = 0;
    this.banner = null;
    this.bannerTimer = 0;
    this.camera.rebase();
    this.applyChallenge(this.campaignDef.challenge, true);
    this.resetProjectile();
    this.pendingCampaignFail = false;
    this.pendingRunOver = false;
    this.pendingAdvance = false;
    this.lastResult = null;
    this.timeScale = 1;
    this.slowdownRemaining = 0;
  }

  private activateUnlimitedEnergyInternal(durationMs: number): void {
    const now = Date.now();
    const expires = Math.max(this.save.campaign.unlimitedEnergyExpiresAt, now) + durationMs;
    this.save.campaign.unlimitedEnergyExpiresAt = expires;
    this.syncCampaignEnergyOnSave();
    void saveGameSave(this.save);
  }

  private async watchRewardedEnergyAsync(): Promise<void> {
    if (this.continueBusy || this.adShowing) {
      return;
    }
    this.continueBusy = true;
    this.emitHud();
    const result = await AdService.showRewarded();
    this.continueBusy = false;
    if (result === 'completed') {
      this.syncCampaignEnergyOnSave();
      this.save.campaign.currentEnergy = Math.min(
        ECONOMY.maxEnergy,
        this.save.campaign.currentEnergy + ECONOMY.rewardedAdEnergyAmount,
      );
      if(this.save.campaign.currentEnergy===ECONOMY.maxEnergy)this.save.campaign.energyUpdatedAt = Date.now();
      this.syncCampaignEnergyOnSave();
      void saveGameSave(this.save);

    }
    this.emitHud();
  }

  private onboardingCopy(): string | null {
    if (this.firstLevelOnboardingActive()) {
      if (this.state.phase === 'AIMING' && this.aim.isCancelReady) {
        return t("game.pull_back_to_center_to_cancel");
      }
      if (this.state.phase === 'AIMING') {
        return t("game.drag_to_aim_finger_up_to_release");
      }
      if (this.state.phase === 'READY') {
        return t("game.pull_to_power_up");
      }
    }
    if (this.state.phase === 'AIMING' && this.aim.isCancelReady && this.throwsThisRun >= 1) {
      return t("game.return_to_start_to_cancel");
    }
    if (
      this.sessionMode === 'campaign' &&
      this.campaignDef?.tutorialHint &&
      (this.state.phase === 'READY' || this.state.phase === 'AIMING')
    ) {
      return this.campaignDef.tutorialHint;
    }
    if (this.save.hasCompletedOnboarding) {
      return null;
    }
    if (
      this.director.challengeNumber === 1 &&
      (this.state.phase === 'READY' || this.state.phase === 'AIMING') &&
      !this.aim.hasEnteredAim
    ) {
      return t("game.drag_to_aim");
    }
    if (this.director.challengeNumber === 2 && this.state.phase === 'READY') {
      return t("game.time_the_opening");
    }
    return null;
  }

  private firstLevelOnboardingActive(): boolean {
    const def = this.campaignDef;
    return Boolean(
      this.sessionMode === 'campaign' &&
      def?.levelNumber === 1 &&
      !this.save.campaign.completedLevels[def.id]?.cleared,
    );
  }

  private targetResolved = false;

  getHudSnapshot(): HudSnapshot {
    const challenge =
      this.sessionMode === 'campaign' && this.campaignDef
        ? this.campaignDef.challenge
        : this.director.current;
    const campaign = this.save.campaign;
    const unlimitedEnergy = hasUnlimitedEnergy(campaign);
    const world = this.campaignDef
      ? worldForLevel(this.campaignDef.levelNumber)
      : worldForLevel(campaign.lastPlayedLevel);
    return {
      hydrated: this.hydrated,
      openingStage: this.openingStage,
      phase: this.state.phase,
      lives: this.run.lives,
      score: this.run.score,
      shotId:
        this.sessionMode === 'campaign' && this.campaignDef
          ? this.campaignDef.levelNumber
          : this.director.challengeNumber,
      totalShots: this.sessionMode === 'campaign' ? 1 : this.director.totalShots,
      resultKind: this.state.phase === 'RESULT' ? this.lastResult : null,
      resultText:
        this.state.phase === 'RESULT' && this.lastResult
          ? resultLabel(
              this.lastResult,
              this.lastResultPoints,
              this.sessionMode === 'campaign',
            )
          : null,
      showOnboarding: Boolean(this.onboardingCopy() === t("game.drag_to_aim")),
      onboardingText: this.onboardingCopy(),
      firstLevelOnboarding: this.firstLevelOnboardingActive(),
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
          ? t("game.close_call", {value1: GAME_TUNING.score.CLOSE_CALL})
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
      voyageShards: this.voyageShards,
      firstCampaignCompletion: this.pendingCampaignComplete,
      equippedSparkId: campaign.equippedSparkId,
      completionSparkId: world?.completionSparkId && campaign.ownedSparkIds.includes(world.completionSparkId) ? world.completionSparkId : null,
      campaignLevelsCompleted: campaign.stats.levelsCompleted,
      campaignWorldsCompleted: campaign.stats.worldsCompleted,
      currentWorldClears: world ? getPlayableCampaignLevels().filter(level => level.worldId === world.id && campaign.completedLevels[level.id]?.cleared).length : 0,
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
      sessionMode: this.sessionMode,
      campaignLevel: this.campaignDef?.levelNumber ?? campaign.lastPlayedLevel,
      campaignWorldName: world?.name ?? null,
      energy: campaign.currentEnergy,
      maxEnergy: ECONOMY.maxEnergy,
      shards: campaign.shards,
      unlimitedEnergy,
      lastShardsGained: this.lastShardsGained,
      lastPrecisionRank: this.lastPrecisionRank,
      storyBeat: this.storyBeat,
      campaignStory: this.campaignStory,
      windActive: Math.abs(this.campaignWindX) > 0.001,
      // Gameplay camera faces +Z, so world +X projects toward screen left.
      windDirection: this.campaignWindX > 0 ? 'left' : 'right',
      canChooseBoosts: this.canChooseCampaignBoosts(),
      helpOffer: this.helpOffer,
      unlockedSparkName: this.unlockedSparkName,
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
      predT: `${prediction?.bounces ? t("game.bounces", {value1: prediction.bounces.length}) : ''}${formatTargetPred(prediction?.target)}`,
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

    if(this.sessionMode==='campaign'&&this.campaignDef?.challenge.ricochet){
      this.ricochetAccumulator+=rawDt;
      while(this.ricochetAccumulator>=RICOCHET_STEP){this.update(RICOCHET_STEP*this.timeScale,RICOCHET_STEP);this.ricochetAccumulator-=RICOCHET_STEP;}
    }else this.update(rawDt * this.timeScale, rawDt);
    this.render();
  };

  private update(dt: number, rawDt: number): void {
    const freezeWorld =
      this.adShowing ||
      this.state.phase === 'CONTINUE_OFFER' ||
      this.state.phase === 'RUN_OVER' ||
      this.state.phase === 'PROTOTYPE_COMPLETE' ||
      this.state.phase === 'CAMPAIGN_STORY' ||
      this.state.phase === 'CAMPAIGN_OPENING' ||
      this.state.phase === 'LEVEL_COMPLETE' ||
      this.state.phase === 'LEVEL_FAILED' ||
      this.state.phase === 'WORLD_COMPLETE' ||
      this.state.phase === 'SPARK_UNLOCKED' ||
      this.state.phase === 'CAMPAIGN_COMPLETE' ||
      this.state.phase === 'OUT_OF_ENERGY';

    if (!freezeWorld) {
      this.simTime += dt;
    }
    if (this.director.isAuthored && !freezeWorld) {
      this.authored.noteTime(this.director.index, dt);
    }
    const deferObstacleUpdate=Boolean(this.sessionMode==='campaign'&&this.campaignDef?.challenge.ricochet&&this.state.phase==='PROJECTILE_ACTIVE');
    if (!freezeWorld) {
      const obstacleDt =
        this.sessionMode === 'campaign' && this.slowFieldActive
          ? dt * ECONOMY.boostSlowFieldMultiplier
          : dt;
      this.lastObstacleStep = obstacleDt;
      this.obstacleTime += obstacleDt;
      for (const rotor of this.obstacles) {
        if(!deferObstacleUpdate)rotor.update(obstacleDt, this.obstacleTime);
      }
      this.target.update(dt, this.simTime);
    }
    this.reflectors.update(this.simTime,this.save.settings.reduceMotion || this.systemReduceMotion,this.debugEnabled);
    this.particles.update(dt);
    this.windField.update(dt, this.save.settings.reduceMotion || this.systemReduceMotion);
    this.gravityWellField.update(
      this.simTime,
      this.save.settings.reduceMotion || this.systemReduceMotion,
    );
    this.trail.update(dt, this.projectile.position, this.state.phase === 'PROJECTILE_ACTIVE');
    this.camera.allowShake =
      this.state.phase !== 'READY' &&
      this.state.phase !== 'AIMING' &&
      this.state.phase !== 'RUN_START' &&
      this.state.phase !== 'CONTINUE_OFFER' &&
      this.state.phase !== 'CAMPAIGN_OPENING' &&
      this.state.phase !== 'LEVEL_COMPLETE' &&
      this.state.phase !== 'LEVEL_FAILED' &&
      this.state.phase !== 'WORLD_COMPLETE' &&
      this.state.phase !== 'SPARK_UNLOCKED' &&
      this.state.phase !== 'CAMPAIGN_COMPLETE' &&
      this.state.phase !== 'OUT_OF_ENERGY' &&
      !this.adShowing;
    this.camera.update(dt);
    this.scene.environment.update(freezeWorld ? 0 : dt);

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
      const ricochet=this.sessionMode==='campaign'?this.campaignDef?.challenge.ricochet:undefined;
      if(ricochet&&this.state.phase==='PROJECTILE_ACTIVE'){
        const p=this.projectile;const motion={x:p.position.x,y:p.position.y,z:p.position.z,vx:p.velocity.x,vy:p.velocity.y,vz:p.velocity.z};
        stepRicochet(motion,dt,this.simTime-dt,{windX:this.campaignWindX,gravityScale:this.campaignGravityScale,wells:this.projectileSystem.wells},ricochet,this.ricochetStatus,GAME_TUNING.projectile.radius,
          (a,b,clock,duration)=>this.checkRicochetSegment(a,b,clock,duration),bounce=>{
            this.particles.spawnHit(new Vector3(bounce.point.x,bounce.point.y,bounce.point.z),6,0x85f5ff,1.4);
            GameHaptics.forCloseCall();AudioManager.play('ricochet');this.trail.pulseFlare();
            if(ricochet.fullGuide){this.banner=t('labels.RICOCHET');this.bannerTimer=.65;this.emitHud();}
          });
        if(this.state.phase==='PROJECTILE_ACTIVE'){
          p.position.set(motion.x,motion.y,motion.z);p.velocity.set(motion.vx,motion.vy,motion.vz);
          if(this.ricochetStatus.blocked){this.lastFail=t("game.reflector_frame_backing");this.particles.spawnSparks(p.position,8);this.beginResult('ROTOR_HIT',0,.4);}
        }
      }else this.projectileSystem.integrate(this.projectile, dt);
      this.flightTime += dt;
      if (this.state.phase === 'PROJECTILE_ACTIVE') {
        if(!ricochet)this.checkCollisions();
        this.checkOutOfBounds();
      }
    }

    if(deferObstacleUpdate&&!freezeWorld)for(const obstacle of this.obstacles)obstacle.update(this.lastObstacleStep,this.obstacleTime);

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

    if (this.state.phase === 'CAMPAIGN_OPENING') {
      this.openingTimer -= rawDt;
      const elapsed = CAMPAIGN_OPENING_DURATION - Math.max(0, this.openingTimer);
      AudioManager.syncOpening(elapsed);
      const { stage, progress } = sampleOpening(elapsed);
      this.scene.environment.setOpeningLighting(stage, progress);
      const space = this.openingScene.sample(elapsed, this.camera.camera, this.save.settings.reduceMotion || this.systemReduceMotion);
      this.scene.environment.group.visible = !space;
      this.obstacles.forEach((obstacle, index) => { obstacle.group.visible = stage >= 4 && index < (this.campaignDef?.challenge.obstacles.length ?? 0); });
      this.target.group.visible = stage >= 4;
      if (stage !== this.openingStage) {
        this.openingStage = stage;
        this.emitHud();
      }
      if (this.openingTimer <= 0) {
        this.finishCampaignOpening();
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

    this.target.updateVisual(rawDt, this.save.settings.reduceMotion || this.systemReduceMotion);
    this.projectile.syncMesh();
    this.projectile.updateVisual(
      this.state.phase === 'CAMPAIGN_OPENING' ? CAMPAIGN_OPENING_DURATION - this.openingTimer : this.simTime,
      this.save.settings.reduceMotion || this.systemReduceMotion,
      sparkStateFor(this.state.phase, this.lastResult, this.openingStage),
      this.scene.environment.group.visible &&
        (this.sessionMode === 'campaign' ? this.campaignDef?.challenge.environment : this.director.current.environment) !== 'space',
      rawDt,
    );
    this.updateDiagnostics();
    this.debugVisuals.sync(
      this.projectile.position,
      this.obstacles,
      this.target,
      this.state.phase === 'AIMING' ? this.livePrediction : this.launchPrediction,
      this.state.phase === 'PROJECTILE_ACTIVE'&&!this.campaignDef?.challenge.ricochet
        ? analyticPosition(this.launchStart, this.launchVelocity, this.flightTime)
        : null,
    );
  }

  private updateDiagnostics(): void {
    if (this.state.phase === 'AIMING' && this.aim.hasEnteredAim && !this.aim.isCancelReady) {
      this.syncTrajectory();
      if(!this.campaignDef?.challenge.ricochet)this.livePrediction = predictShot(
        {
          x: this.projectile.position.x,
          y: this.projectile.position.y,
          z: this.projectile.position.z,
        },
        this.aim.getLaunchVelocity(),
        this.obstacles,
        this.target,
        this.obstacleTime,
        this.obstacleTimeScale(),
        {
          windX: this.campaignWindX,
          gravityScale: this.campaignGravityScale,
          wells: this.projectileSystem.wells,
        },
        this.simTime,
        this.campaignDef?.challenge.ricochet,
      );
    } else if (this.state.phase !== 'PROJECTILE_ACTIVE' && this.state.phase !== 'RESULT') {
      this.livePrediction = null;
    }

    if (this.state.phase === 'PROJECTILE_ACTIVE'&&!this.campaignDef?.challenge.ricochet) {
      const predicted = analyticPosition(this.launchStart, this.launchVelocity, this.flightTime);
      const dx = predicted.x - this.projectile.position.x;
      const dy = predicted.y - this.projectile.position.y;
      const dz = predicted.z - this.projectile.position.z;
      this.maxPathError = Math.max(this.maxPathError, Math.sqrt(dx * dx + dy * dy + dz * dz));
    }
  }

  private obstacleTimeScale(): number {
    return this.sessionMode === 'campaign' && this.slowFieldActive
      ? ECONOMY.boostSlowFieldMultiplier
      : 1;
  }

  private checkRicochetSegment(a:Vec3,b:Vec3,clock:number,duration:number):boolean {
    const p=this.projectile;p.previousPosition.set(a.x,a.y,a.z);p.position.set(b.x,b.y,b.z);
    for(let i=0;i<this.obstacles.length;i++){
      const o=this.obstacles[i];if(!o.active||(a.z-o.z)*(b.z-o.z)>0||a.z===b.z)continue;
      const u=(o.z-a.z)/(b.z-a.z);if(u<0||u>1)continue;
      const at={x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,z:o.z};
      const hit=o.evaluateAt(at.x,at.y,GAME_TUNING.projectile.radius,o.predictState(Math.max(0,clock+duration*u-(this.simTime-RICOCHET_STEP))*this.obstacleTimeScale(),this.obstacleTime-this.lastObstacleStep));
      if(hit.hit){p.position.set(at.x,at.y,at.z);this.lastFail=failLabel(o.type,i);this.particles.spawnSparks(p.position,14);GameHaptics.forResult('ROTOR_HIT');AudioManager.play(collisionEvent(o.type));this.beginResult('ROTOR_HIT',0,.4);return false;}
      this.obstacleCleared[i]=true;
    }
    if(a.z<this.target.z&&b.z>=this.target.z){
      const required=this.campaignDef?.challenge.ricochet?.requiredBounces??0;
      if(this.ricochetStatus.bounces<required){this.lastFail=t("game.use_the_reflector");this.beginResult('MISS',0,.4);return false;}
      // Collision was checked above; retain the existing portal precision/reward path.
      this.obstacleCleared=this.obstacles.map(()=>true);this.checkCollisions();
      return this.state.phase==='PROJECTILE_ACTIVE';
    }return true;
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
        this.obstacleTime,
        this.lastObstacleStep,
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
    this.debugVisuals.recordTargetCrossing(atPlane);
    this.projectile.position.set(atPlane.x, atPlane.y, atPlane.z);

    if (scored.kind === 'MISS') {
      this.lastMissReport = makeTargetMissReport(
        this.launchPrediction,
        atPlane,
        { x: this.target.x, y: this.target.y },
        this.target.radius,
      );
      this.lastFail = t("game.target_miss");
      this.beginResult('MISS', 0, GAME_TUNING.timing.resultDelay / 1000);
      return;
    }

    this.projectile.velocity.set(0, 0, 0);
    const pulse =
      scored.kind === 'PERFECT' ? 1.6 : scored.kind === 'BULLSEYE' ? 1.25 : scored.kind === 'GREAT' ? 0.9 : 0.55;
    this.target.triggerPulse(pulse);
    if (!this.target.isBreach) this.projectile.beginPortalEntry();
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
    this.beginResult(scored.kind, scored.points, this.target.isBreach ? GAME_TUNING.timing.hitAdvanceDelay / 1000 : .5);
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
      this.lastFail = t("game.target_miss");
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
    if (this.sessionMode === 'endless' && kind !== 'MISS' && kind !== 'ROTOR_HIT') {
      const reward = voyageReward(this.run.challengesCleared);
      this.voyageShards += reward;
      this.save.campaign.shards += reward;
      this.save.campaign.stats.shardsEarned += reward;
      void saveGameSave(this.save);
    }
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
      this.banner = t("game.x_streak", {value1: outcome.multiplier});
      this.bannerTimer = 0.8;
      this.particles.spawnStreak(this.projectile.position);
      GameHaptics.forStreak();
      AudioManager.play('streak');
    }
    this.maybeAnnounceNewBest();
    this.maybeAnnounceProgress();
    if (this.sessionMode === 'endless' && kind !== 'MISS' && kind !== 'ROTOR_HIT' && voyageReward(this.run.challengesCleared) > 2) {
      this.banner = t('voyage.milestone', {count: this.run.challengesCleared});
      this.bannerTimer = 1.6;
    }
    if (this.sessionMode === 'campaign') {
      if (kind === 'ROTOR_HIT' || kind === 'MISS') {
        this.pendingCampaignFail = true;
        this.pendingRunOver = false;
        this.pendingAdvance = false;
      } else {
        this.pendingCampaignFail = false;
        this.pendingRunOver = false;
        this.pendingAdvance = false;
      }
    } else {
      this.pendingRunOver = outcome.runOver;
      this.pendingAdvance = kind !== 'ROTOR_HIT' && kind !== 'MISS' && !outcome.runOver;
    }
    this.resultTimer = delaySeconds;
    this.state.set('RESULT');
    this.trackShotResult(kind);
    this.emitHud();
  }

  private finishResult(): void {
    if (this.sessionMode === 'campaign' && this.campaignDef) {
      if (this.pendingCampaignFail) {
        this.finishCampaignFailure();
        return;
      }
      if (
        this.lastResult &&
        this.lastResult !== 'ROTOR_HIT' &&
        this.lastResult !== 'MISS'
      ) {
        this.finishCampaignSuccess();
        return;
      }
    }

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

  private finishCampaignSuccess(): void {
    const def = this.campaignDef!;
    const rank = rankFromResult(this.lastResult ?? '');
    if (!rank) {
      this.resetCampaignAttempt();
      this.state.set('READY');
      this.emitHud();
      return;
    }
    const outcome = applyLevelSuccess(this.save, def, rank, this.run.closeCalls);
    this.save = outcome.save;
    void saveGameSave(this.save);
    this.lastShardsGained = outcome.shardsGained;
    this.lastPrecisionRank = rank;
    this.pendingWorldComplete = outcome.worldComplete;
    this.pendingCampaignComplete = outcome.campaignComplete;
    this.unlockedSparkName = outcome.unlockedSparkId
      ? (sparkById(outcome.unlockedSparkId)?.name ?? t("game.new_spark"))
      : null;
    Analytics.track(ANALYTICS_EVENTS.levelCompleted, {
      levelNumber: def.levelNumber,
      worldId: def.worldId,
      rank,
      shardsGained: outcome.shardsGained,
      worldComplete: outcome.worldComplete,
    });
    this.state.set(
      outcome.worldComplete
        ? 'WORLD_COMPLETE'
        : outcome.campaignComplete
          ? 'CAMPAIGN_COMPLETE'
          : 'LEVEL_COMPLETE',
    );
    const milestone = storyAfterWorld(def.levelNumber, this.save.campaign.seenStoryIds ?? []);
    if (milestone) this.showCampaignStory(milestone, outcome.worldComplete ? 'WORLD_COMPLETE' : outcome.campaignComplete ? 'CAMPAIGN_COMPLETE' : 'LEVEL_COMPLETE');
    if (def.levelNumber === 1 && !(this.save.campaign.seenStoryIds ?? []).includes(FIRST_ESCAPE.id)) {
      this.showCampaignStory(FIRST_ESCAPE, 'LEVEL_COMPLETE');
    }
    this.emitHud();
  }

  private finishCampaignFailure(): void {
    const def = this.campaignDef!;
    this.pendingCampaignFail = false;

    if (this.firstLevelOnboardingActive()) {
      this.resetCampaignAttempt();
      this.banner = t("game.try_again_find_the_crack");
      this.bannerTimer = 1.6;
      this.state.set('READY');
      this.emitHud();
      return;
    }

    if (this.secondChancePending) {
      this.secondChancePending = false;
      this.resetCampaignAttempt();
      this.state.set('READY');
      this.emitHud();
      return;
    }

    this.save = applyLevelFailure(this.save, def, {
      consumeEnergy: true,
      usedSecondChance: false,
    });
    this.syncCampaignEnergyOnSave();
    void saveGameSave(this.save);

    Analytics.track(ANALYTICS_EVENTS.levelFailed, {
      levelNumber: def.levelNumber,
      worldId: def.worldId,
      fail: this.lastFail,
    });

    if (
      !RELEASE_POLICY.freeRetries &&
      !this.save.campaign.completedLevels[def.id]?.cleared &&
      !hasUnlimitedEnergy(this.save.campaign) &&
      this.save.campaign.currentEnergy <= 0
    ) {
      this.state.set('OUT_OF_ENERGY');
      this.emitHud();
      return;
    }

    this.helpOffer =
      this.save.campaign.consecutiveFailuresOnLevel >= ECONOMY.helpAfterFailures;
    this.state.set('LEVEL_FAILED');
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
      this.banner = t("game.new_best");
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
    if (this.runProgressCommitted) return;
    this.runProgressCommitted = true;
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
    return this.save.playerProgress.totalXP + (this.runProgressCommitted ? 0 : this.run.runXp);
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
      this.banner = t("game.level_up", {value1: projected});
      this.bannerTimer = 1.1;
      GameHaptics.forLevelUp();
      AudioManager.play('level-up');
    }
  }

  private logRunTelemetry(): void {
    const lines = [
      t("game.run_telemetry"),
      t("game.duration_s", {value1: this.run.durationSeconds().toFixed(1)}),
      t("game.score", {value1: this.run.score}),
      t("game.challengescleared", {value1: this.run.challengesCleared}),
      t("game.attempts", {value1: this.run.attempts}),
      t("game.rotorhits", {value1: this.run.rotorHits}),
      t("game.targetmisses", {value1: this.run.targetMisses}),
      t("game.hits", {value1: this.run.hits}),
      t("game.greats", {value1: this.run.greats}),
      t("game.bullseyes", {value1: this.run.bullseyes}),
      t("game.perfects", {value1: this.run.perfects}),
      t("game.closecalls", {value1: this.run.closeCalls}),
      t("game.beststreak", {value1: this.run.bestStreak}),
      t("game.loop", {value1: this.director.loopNumber}),
      t("game.environment", {value1: this.director.current.environment}),
      t("game.seed", {value1: this.director.seed.toString(16)}),
      t("game.theme", {value1: this.director.theme}),
      t("game.xp", {value1: this.run.runXp}),
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
    const encounter = this.sessionMode === 'campaign'
      ? campaignEncounterStart(config)
      : {offset: this.obstacleTime, obstacles: config.obstacles};
    this.obstacleTime = encounter.offset;
    AudioManager.syncOpening(null);
    this.openingScene.hide();
    this.scene.environment.group.visible = true;
    this.scene.environment.setEnvironment(config.environment, this.scene.scene, immediateEnv);
    this.scene.environment.setSpaceWorld(this.sessionMode === 'campaign' ? this.campaignDef?.worldId ?? null : null);
    this.scene.environment.setCampaignLevel(this.sessionMode === 'campaign' && this.campaignDef?.worldId === 'containment' ? this.campaignDef.levelNumber : null);
    const showBreachPlate = config.obstacles.some(
      (obstacle) =>
        obstacle.type === 'slidingGate' && obstacle.appearance === 'containmentGlass',
    );
    this.scene.environment.setBreachPlateVisible(showBreachPlate);
    if (showBreachPlate) {
      const glass = config.obstacles.find(obstacle => obstacle.type === 'slidingGate' && obstacle.appearance === 'containmentGlass');
      if (glass?.type === 'slidingGate') {
        this.openingScene.setBreach({x: glass.baseX, y: glass.baseY ?? GAME_TUNING.gate.baseY, z: glass.z, width: glass.openingWidth, height: glass.openingHeight});
      }
      this.openingScene.showPlayableVessel();
    }
    for (let i = 0; i < this.obstacles.length; i += 1) {
      const rotorConfig = encounter.obstacles[i];
      if (rotorConfig) {
        this.obstacles[i].applyConfig(rotorConfig, config.environment);
        this.obstacles[i].update(0, this.obstacleTime);
      } else {
        this.obstacles[i].hide();
      }
    }
    this.debugVisuals.recordTargetCrossing(null);
    this.target.applyConfig(config.target);
    this.applyBloom();
    this.target.setWorld(this.sessionMode === 'campaign' ? this.campaignDef?.worldId ?? 'containment' : config.environment === 'rooftop' ? 'city' : config.environment === 'space' ? 'orbit' : 'containment');
    this.target.setBreachPresentation(showBreachPlate);
    this.obstacleCleared = [false, false, false];
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
    this.obstacleCleared = [false, false, false];
    this.targetResolved = false;
    this.flightTime = 0;
    this.ricochetStatus={bounces:0,blocked:false};
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
    this.syncTrajectoryDebugFull();
    const ricochet=this.sessionMode==='campaign'?this.campaignDef?.challenge.ricochet:undefined;
    if(ricochet){
      const velocity=this.aim.getLaunchVelocity(),old=this.ricochetPreviewVelocity;
      if(this.simTime-this.ricochetPreviewAt<1/30&&Math.abs(velocity.vx-old.vx)+Math.abs(velocity.vy-old.vy)+Math.abs(velocity.vz-old.vz)<.025)return;
      this.ricochetPreviewAt=this.simTime;this.ricochetPreviewVelocity=velocity;
      const prediction=predictShot(this.projectile.position,this.aim.getLaunchVelocity(),this.obstacles,this.target,this.obstacleTime,this.obstacleTimeScale(),{windX:this.campaignWindX,gravityScale:this.campaignGravityScale,wells:this.projectileSystem.wells},this.simTime,ricochet);
      this.livePrediction=prediction;
      this.trajectory.showRicochet(prediction,Boolean(ricochet.fullGuide||this.selectedBoosts.guidance||this.debugEnabled));return;
    }
    this.trajectory.update(
      this.projectile.position,
      this.aim.getLaunchVelocity(),
      this.target.z,
      {
        windX: this.projectileSystem.windX,
        gravityScale: this.projectileSystem.gravityScale,
        wells: this.projectileSystem.wells,
      },
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
      this.adMessage = t("game.continue_unavailable");
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
    if (this.sessionMode === 'campaign') {
      if (
        this.state.phase === 'LEVEL_FAILED' ||
        this.state.phase === 'OUT_OF_ENERGY'
      ) {
        this.retryCampaignLevel();
      } else if (this.state.phase === 'CAMPAIGN_OPENING') {
        this.replayCampaignOpening();
      } else if (['READY', 'AIMING', 'PROJECTILE_ACTIVE', 'RESULT', 'RESETTING'].includes(this.state.phase)) {
        this.resetCampaignAttempt();
        this.state.set('READY');
        this.emitHud();
      }
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
    rotor.predicted.openingRadius > 0 ? t("game.r", {value1: rotor.predicted.openingRadius.toFixed(2)}) : '';
  return t("game.s", {value1: rotor.type, value2: rotor.verdict, value3: part, value4: rotor.time.toFixed(2), value5: radius});
}

function formatTargetPred(
  target: ShotPrediction['target'] | undefined,
): string {
  if (!target) {
    return '-';
  }
  return t("game.s_d", {value1: target.verdict, value2: target.time.toFixed(2), value3: target.distance.toFixed(2)});
}

function formatMiss(report: TargetMissReport | null): string {
  if (!report) {
    return '-';
  }
  return t("game.act_tgt_d_r_ball_edge", {value1: report.actualX.toFixed(2), value2: report.actualY.toFixed(2), value3: report.targetX.toFixed(2), value4: report.targetY.toFixed(2), value5: report.distance.toFixed(2), value6: report.targetRadius.toFixed(2), value7: report.projectileRadius.toFixed(2), value8: report.edgeWouldHit ? 'Y' : 'N'});
}

function failLabel(type: string, index: number): string {
  const names: Record<string, string> = {
    rotor: 'ROTOR',
    slidingGate: 'GATE',
    iris: 'IRIS',
    pendulum: 'PENDULUM',
    movingRing: 'RING',
    orbiter: 'ORBITER',
    driftingBlocker: 'DRIFT',
    phaseField: 'PHASE',
    shiftingAperture: 'APERTURE',
    laserGrid: 'LASER',
    formation: 'OBSTACLE',
  };
  return `${names[type] ?? type.toUpperCase()} ${String.fromCharCode(65 + index)}`;
}

function collisionEvent(
  type: string,
): 'rotor' | 'gate' | 'iris' | 'pendulum' | 'ring' {
  if (type === 'slidingGate') {
    return 'gate';
  }
  if (type === 'iris' || type === 'shiftingAperture' || type === 'phaseField') {
    return 'iris';
  }
  if (type === 'pendulum' || type === 'orbiter' || type === 'driftingBlocker') {
    return 'pendulum';
  }
  if (type === 'movingRing') {
    return 'ring';
  }
  if (type === 'laserGrid') {
    return 'gate';
  }
  return 'rotor';
}
