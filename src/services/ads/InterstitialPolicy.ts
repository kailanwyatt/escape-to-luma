import { INTERSTITIAL_CONFIG } from '../../config/commercial';

export type InterstitialContext = {
  adsDisabled: boolean;
  removeAds: boolean;
  onboardingComplete: boolean;
  runsCompleted: number;
  runsSinceLastInterstitial: number;
  secondsSinceLastInterstitial: number;
  suppressAfterRewarded: boolean;
  adAvailable: boolean;
};

export const InterstitialPolicy = {
  canShow(context: InterstitialContext): boolean {
    if (context.adsDisabled || context.removeAds) {
      return false;
    }
    if (!context.onboardingComplete) {
      return false;
    }
    if (context.runsCompleted < INTERSTITIAL_CONFIG.minimumRunsBeforeFirstAd) {
      return false;
    }
    if (context.suppressAfterRewarded && INTERSTITIAL_CONFIG.suppressAfterRewardedAd) {
      return false;
    }
    if (context.runsSinceLastInterstitial < INTERSTITIAL_CONFIG.minimumRunsBetweenAds) {
      return false;
    }
    if (context.secondsSinceLastInterstitial < INTERSTITIAL_CONFIG.minimumSecondsBetweenAds) {
      return false;
    }
    if (!context.adAvailable) {
      return false;
    }
    return true;
  },
};
