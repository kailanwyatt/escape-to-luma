import { getCommercialConfig, patchCommercialConfig } from '../../config/commercial';
import { ANALYTICS_EVENTS, Analytics } from '../analytics/Analytics';
import { PurchaseService } from '../purchases/PurchaseService';
import { AdMobController, adMobNativeAvailable, initializeMobileAds } from './AdMobController';
import { InterstitialPolicy, type InterstitialContext } from './InterstitialPolicy';
import { SimulatedAdController } from './SimulatedAdController';
import type { AdController, AdShowResult, AdStatus } from './AdTypes';

export type AdServiceHooks = {
  onPresentationChange?: (showing: boolean) => void;
};

function createSimulatedControllers(): { rewarded: AdController; interstitial: AdController } {
  return {
    rewarded: new SimulatedAdController('rewarded'),
    interstitial: new SimulatedAdController('interstitial'),
  };
}

class AdServiceImpl {
  private rewarded: AdController = createSimulatedControllers().rewarded;
  private interstitial: AdController = createSimulatedControllers().interstitial;
  private hooks: AdServiceHooks = {};
  private testPresenter: (() => Promise<AdShowResult>) | null = null;
  private usingLive = false;
  private startPromise: Promise<void> | null = null;
  adsEnabledOverride: boolean | null = null;

  setTestRewardedPresenter(p: (() => Promise<AdShowResult>) | null) {
    this.testPresenter = p;
  }

  configure(hooks: AdServiceHooks): void {
    this.hooks = hooks;
  }

  /** Initialize AdMob when native is available; otherwise keep the simulated path (tests / Expo Go). */
  start(): Promise<void> {
    if (!this.adsOn()) {
      return Promise.resolve();
    }
    if (this.startPromise) {
      return this.startPromise;
    }
    this.startPromise = this.bootstrap();
    return this.startPromise;
  }

  private async bootstrap(): Promise<void> {
    if (!this.usingLive && adMobNativeAvailable()) {
      const ok = await initializeMobileAds();
      if (ok) {
        this.rewarded = new AdMobController('rewarded');
        this.interstitial = new AdMobController('interstitial');
        this.usingLive = true;
      }
    }
    this.rewarded.preload();
    this.interstitial.preload();
  }

  adsOn(): boolean {
    if (this.adsEnabledOverride !== null) {
      return this.adsEnabledOverride;
    }
    return getCommercialConfig().adsEnabled;
  }

  rewardedStatus(): AdStatus {
    return this.rewarded.status;
  }

  interstitialStatus(): AdStatus {
    return this.interstitial.status;
  }

  rewardedReady(): boolean {
    return (
      this.adsOn() &&
      getCommercialConfig().rewardedContinueEnabled &&
      this.rewarded.isReady()
    );
  }

  interstitialReady(): boolean {
    if (PurchaseService.hasRemoveAdsEntitlement()) {
      return false;
    }
    return this.adsOn() && getCommercialConfig().interstitialEnabled && this.interstitial.isReady();
  }

  preloadDuringRun(): void {
    if (!this.adsOn()) {
      return;
    }
    this.rewarded.preload();
    this.interstitial.preload();
  }

  canShowInterstitial(context: Omit<InterstitialContext, 'adAvailable' | 'adsDisabled'>): boolean {
    return InterstitialPolicy.canShow({
      ...context,
      adsDisabled: !this.adsOn() || !getCommercialConfig().interstitialEnabled,
      adAvailable: this.interstitialReady(),
    });
  }

  async showRewarded(): Promise<AdShowResult> {
    if (this.rewarded.status === 'SHOWING') {
      return 'failed';
    }
    this.hooks.onPresentationChange?.(true);
    Analytics.track(ANALYTICS_EVENTS.continueAdStarted, { runId: Analytics.runId });
    const result =
      typeof __DEV__ !== 'undefined' && __DEV__ && this.testPresenter
        ? await this.testPresenter()
        : this.rewardedReady()
          ? await this.rewarded.show()
          : 'failed';
    this.hooks.onPresentationChange?.(false);
    if (result === 'completed') {
      Analytics.track(ANALYTICS_EVENTS.continueAdCompleted, { runId: Analytics.runId });
    } else {
      Analytics.track(ANALYTICS_EVENTS.continueAdFailed, { runId: Analytics.runId, result });
    }
    return result;
  }

  async showInterstitial(): Promise<AdShowResult> {
    if (this.interstitial.status === 'SHOWING') {
      return 'failed';
    }
    this.hooks.onPresentationChange?.(true);
    const result = await this.interstitial.show();
    this.hooks.onPresentationChange?.(false);
    if (result === 'failed') {
      Analytics.track(ANALYTICS_EVENTS.interstitialFailed, { runId: Analytics.runId });
    } else {
      Analytics.track(ANALYTICS_EVENTS.interstitialShown, { runId: Analytics.runId });
      Analytics.track(ANALYTICS_EVENTS.interstitialDismissed, { runId: Analytics.runId });
    }
    return result;
  }

  setAdsEnabled(enabled: boolean): void {
    this.adsEnabledOverride = enabled;
    patchCommercialConfig({ adsEnabled: enabled });
    if (enabled) {
      this.startPromise = null;
      void this.start();
    }
  }

  setUseTestAds(enabled: boolean): void {
    patchCommercialConfig({ useTestAds: enabled });
    if (this.usingLive) {
      this.rewarded = new AdMobController('rewarded');
      this.interstitial = new AdMobController('interstitial');
      if (this.adsOn()) {
        this.rewarded.preload();
        this.interstitial.preload();
      }
    } else {
      this.resetControllers();
    }
  }

  forceRewardedReady(): void {
    this.rewarded.forceReady();
  }

  forceRewardedFailure(): void {
    this.rewarded.forceFailure();
  }

  forceInterstitialReady(): void {
    this.interstitial.forceReady();
  }

  forceInterstitialFailure(): void {
    this.interstitial.forceFailure();
  }

  resetControllers(): void {
    this.rewarded.reset();
    this.interstitial.reset();
  }
}

export const AdService = new AdServiceImpl();
