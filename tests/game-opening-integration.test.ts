import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExpoWebGLRenderingContext } from 'expo-gl';

vi.hoisted(() => { (globalThis as unknown as { __DEV__: boolean }).__DEV__ = false; });
vi.mock('react-native', () => ({ Platform: { OS: 'android' } }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: {
  getItem: vi.fn(async () => null), setItem: vi.fn(async () => {}), removeItem: vi.fn(async () => {}),
} }));
vi.mock('../src/feedback/AudioManager', () => ({ AudioManager: {
  enabled: true, init: vi.fn(async () => {}), syncOpening: vi.fn(), syncEnding: vi.fn(), prepareEnding: vi.fn(), releaseEnding: vi.fn(), pauseAll: vi.fn(),
  restoreFromSettings: vi.fn(), suspendForAd: vi.fn(), play: vi.fn(),
} }));
vi.mock('../src/feedback/Haptics', () => ({ GameHaptics: { enabled: false } }));
vi.mock('../src/services/ads/trackingPermission', () => ({ requestTrackingIfNeeded: async () => {} }));
vi.mock('../src/services/ads/AdService', () => ({ AdService: {
  configure: vi.fn(), start: async () => {}, rewardedReady: () => false,
  interstitialReady: () => false, adsOn: () => false, preloadDuringRun: vi.fn(),
} }));
vi.mock('../src/services/purchases/PurchaseService', () => ({ PurchaseService: {
  hydrate: vi.fn(), initialize: async () => {}, hasRemoveAdsEntitlement: () => false,
} }));
vi.mock('../src/utils/createThreeRenderer', () => ({
  createThreeRenderer: () => ({
    toneMapping: 0, toneMappingExposure: 1, autoClear: true,
    getClearColor: (color: THREE.Color) => color.set(0), getClearAlpha: () => 1,
    setClearColor: vi.fn(), clear: vi.fn(),
    extensions: { has: () => true }, getRenderTarget: () => null, setRenderTarget: vi.fn(),
    getDrawingBufferSize: (size: THREE.Vector2) => size.set(1080, 2400),
    compile: vi.fn(), render: vi.fn(), dispose: vi.fn(),
  }),
  resizeThreeRenderer: vi.fn(),
}));

import { Game } from '../src/game/Game';
import { AudioManager } from '../src/feedback/AudioManager';
import { getCampaignLevel } from '../src/campaign/levels';
import { CampaignEndingPresentation } from '../src/scene/CampaignEndingPresentation';
import { CameraController } from '../src/scene/CameraController';
import { GAME_TUNING } from '../src/game/gameTuning';
import type { PersistentGameData } from '../src/persistence/GameSave';
import type { ObstacleSlot } from '../src/obstacles/ObstacleSlot';
import type { Projectile } from '../src/projectile/Projectile';

type Internals = {
  update: (dt: number, raw: number) => void;
  loop: (ms: number) => void;
  openingTimer: number;
  ending: CampaignEndingPresentation;
  finishCampaignSuccess: () => void;
  render: () => void;
  lastResult: 'HIT';
  obstacleTime: number;
  simTime: number;
  adShowing: boolean;
  save: PersistentGameData;
  camera: CameraController;
  obstacles: ObstacleSlot[];
  projectile: Projectile;
  applyChallenge: (...args: unknown[]) => void;
};
let game: Game;
let state: Internals;
beforeEach(async () => {
  vi.clearAllMocks();
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  game = new Game({ drawingBufferWidth: 1080, drawingBufferHeight: 2400, endFrameEXP: vi.fn() } as unknown as ExpoWebGLRenderingContext);
  state = game as unknown as Internals;
  await vi.waitFor(() => expect(game.getHudSnapshot().hydrated).toBe(true));
  game.startCampaignLevel(1, {});
});
afterEach(() => { game?.dispose(); vi.unstubAllGlobals(); });

describe('campaign opening integration', () => {
  it('plays the cinematic, freezes gameplay and hands off without rebuilding any level meshes', () => {
    expect(game.getHudSnapshot().phase).toBe('CAMPAIGN_OPENING');
    expect(game.canAcceptInput()).toBe(false);
    const obstacleTime = state.obstacleTime;
    const geometryIds = state.obstacles.map(obstacle => obstacle.group.children.map(child => child.uuid));
    const energy = state.save.campaign.currentEnergy;
    const rebuild = vi.spyOn(state, 'applyChallenge');
    for (let i = 0; i < 140; i++) state.update(0, .25);
    expect(game.getHudSnapshot().phase).toBe('READY');
    expect(state.obstacleTime).toBe(obstacleTime);
    expect(state.simTime).toBe(0);
    expect(state.obstacles.map(obstacle => obstacle.group.children.map(child => child.uuid))).toEqual(geometryIds);
    expect(rebuild).not.toHaveBeenCalled();
    expect(state.projectile.position.toArray()).toEqual(Object.values(GAME_TUNING.projectile.startPosition));
    expect(state.projectile.mesh.visible).toBe(true);
    expect(state.save.campaign.currentEnergy).toBe(energy);
    expect(state.save.campaign.hasSeenOpening).toBe(true);
    expect(AudioManager.syncOpening).toHaveBeenLastCalledWith(null);
    game.resume();
    expect(game.canAcceptInput()).toBe(true);
  });

  it.each([0, 6, 14, 21, 28, 32.5])('skip at %ss stops audio and restores the exact playable camera', time => {
    state.update(0, time);
    game.skipCampaignOpening();
    const canonical = new CameraController(); canonical.setAspect(1080 / 2400);
    expect(state.camera.camera.position.toArray()).toEqual(canonical.camera.position.toArray());
    expect(state.camera.camera.quaternion.angleTo(canonical.camera.quaternion)).toBeLessThan(1e-7);
    expect(state.camera.camera.fov).toBe(GAME_TUNING.camera.fov);
    expect(game.getHudSnapshot().phase).toBe('READY');
    expect(AudioManager.syncOpening).toHaveBeenLastCalledWith(null);
    expect(state.save.campaign.hasSeenOpening).toBe(true);
  });

  it('pause and app background freeze film time; resume does not jump over the story', () => {
    game.resume(); state.update(0, 7);
    game.pause();
    const pausedAt = state.openingTimer;
    state.loop(60_000);
    expect(state.openingTimer).toBe(pausedAt);
    expect(AudioManager.pauseAll).toHaveBeenCalled();
    game.resume();
    expect(pausedAt - state.openingTimer).toBeCloseTo(1 / 60);
    expect(game.getHudSnapshot().openingStage).toBe(1);
    state.adShowing = true;
    const beforeAd = state.openingTimer;
    state.update(0, 8);
    expect(state.openingTimer).toBe(beforeAd);
  });

  it('replay starts from zero, reuses the cinematic and still returns to level one', () => {
    game.skipCampaignOpening();
    game.replayCampaignOpening();
    expect(state.openingTimer).toBe(35);
    expect(game.getHudSnapshot().openingStage).toBe(0);
    expect(game.getHudSnapshot().phase).toBe('CAMPAIGN_OPENING');
    expect(game.getHudSnapshot().campaignLevel).toBe(1);
    state.update(0, 34.9);
    const cameraBefore = state.camera.camera.position.clone();
    state.update(0, .2);
    expect(state.camera.camera.position.distanceTo(cameraBefore)).toBeLessThan(1e-9);
    expect(game.getHudSnapshot().phase).toBe('READY');
  });
});


describe('campaign ending integration', () => {
  function finalClear() {
    game.skipCampaignOpening();
    state.save.campaign.highestUnlockedLevel = 150;
    game.startCampaignLevel(150, {}, {force: true});
    state.lastResult = 'HIT'; state.finishCampaignSuccess();
  }
  function frame(dt = .1) { state.update(0, dt); state.render(); }
  function warm() { for (let i = 0; i < 20 && !state.ending.ready; i++) frame(); expect(state.ending.ready).toBe(true); }

  it('saves the final reward before fading, freezes gameplay, and acknowledges the ending once', () => {
    finalClear();
    expect(game.getHudSnapshot().phase).toBe('CAMPAIGN_ENDING');
    expect(game.canAcceptInput()).toBe(false);
    expect(state.save.campaign.campaignCompleted).toBe(true);
    expect(state.save.campaign.completedLevels[getCampaignLevel(150)!.id].cleared).toBe(true);
    const shards = state.save.campaign.shards, clock = state.obstacleTime, energy = state.save.campaign.currentEnergy;
    const rebuild = vi.spyOn(state, 'applyChallenge');
    warm(); expect(state.ending.time).toBe(0);
    for (let i = 0; i < 153; i++) frame(.25);
    expect(game.getHudSnapshot().phase).toBe('CAMPAIGN_COMPLETE');
    expect(state.save.campaign.seenStoryIds?.filter(id => id === 'departure.luma.v1')).toHaveLength(1);
    expect(state.obstacleTime).toBe(clock); expect(rebuild).not.toHaveBeenCalled();
    expect(state.save.campaign.shards).toBe(shards); expect(state.save.campaign.currentEnergy).toBe(energy);
    expect(AudioManager.syncEnding).toHaveBeenLastCalledWith(null);
    game.replayCampaignEnding(); warm(); game.skipCampaignEnding();
    expect(state.save.campaign.shards).toBe(shards);
    expect(state.save.campaign.seenStoryIds?.filter(id => id === 'departure.luma.v1')).toHaveLength(1);
    game.exploreFromFinale();
    expect(game.getHudSnapshot().sessionMode).toBe('endless'); expect(game.getHudSnapshot().phase).toBe('READY');
    expect(state.ending.active).toBe(false); expect(AudioManager.releaseEnding).toHaveBeenCalled();
    const after = game.getHudSnapshot().shotId; game.exploreFromFinale(); expect(game.getHudSnapshot().shotId).toBe(after);
  });

  it('pauses loading and film time across app background and resumes without a time jump', () => {
    finalClear(); game.pause(); state.loop(60_000); expect(state.ending.time).toBe(0);
    warm(); frame(5); game.pause(); const time = state.ending.time;
    state.loop(120_000); expect(state.ending.time).toBe(time);
    game.resume(); expect(state.ending.time - time).toBeCloseTo(1 / 60);
    expect(AudioManager.pauseAll).toHaveBeenCalled();
    state.adShowing = true; frame(8); expect(state.ending.time - time).toBeCloseTo(1 / 60);
  });

  it('supports final-level replays and reduced motion, and cleans up when another level starts', () => {
    finalClear(); warm(); game.skipCampaignEnding();
    state.save.settings.reduceMotion = true;
    game.startCampaignLevel(150, {}, {force: true}); state.lastResult = 'HIT'; state.finishCampaignSuccess();
    expect(game.getHudSnapshot().phase).toBe('CAMPAIGN_ENDING');
    expect(game.getHudSnapshot().unlockedSparkName).toBeNull();
    warm(); frame(13); expect(game.getHudSnapshot().endingStage).toBe(1);
    game.skipCampaignEnding(); expect(game.getHudSnapshot().phase).toBe('CAMPAIGN_COMPLETE');
    game.startCampaignLevel(1, {}, {force: true});
    expect(state.ending.active).toBe(false); expect(game.getHudSnapshot().phase).not.toBe('CAMPAIGN_ENDING');
    expect(AudioManager.releaseEnding).toHaveBeenCalled();
  });
});
