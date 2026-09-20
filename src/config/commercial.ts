import { RELEASE_POLICY } from './release';

export type CommercialConfig = {
  analyticsEnabled: boolean;
  adsEnabled: boolean;
  rewardedContinueEnabled: boolean;
  interstitialEnabled: boolean;
  purchasesEnabled: boolean;
  useTestAds: boolean;
};

export const INTERSTITIAL_CONFIG = {
  minimumRunsBeforeFirstAd: 3,
  minimumRunsBetweenAds: 2,
  minimumSecondsBetweenAds: 180,
  suppressAfterRewardedAd: true,
} as const;

export const REMOVE_ADS_PRODUCT_ID = 'aperture_remove_ads';

/** Google sample / test IDs. Replace before a store release. */
export const ADMOB_TEST = {
  androidAppId: 'ca-app-pub-3940256099942544~3347511713',
  iosAppId: 'ca-app-pub-3940256099942544~1458002511',
  rewardedAndroid: 'ca-app-pub-3940256099942544/5224354917',
  rewardedIos: 'ca-app-pub-3940256099942544/1712485313',
  interstitialAndroid: 'ca-app-pub-3940256099942544/1033173712',
  interstitialIos: 'ca-app-pub-3940256099942544/4411468910',
} as const;

const runtime: CommercialConfig = {
  analyticsEnabled: RELEASE_POLICY.analyticsEnabled,
  adsEnabled: RELEASE_POLICY.adsEnabled,
  rewardedContinueEnabled: RELEASE_POLICY.adsEnabled,
  interstitialEnabled: RELEASE_POLICY.adsEnabled,
  purchasesEnabled: RELEASE_POLICY.purchasesEnabled,
  useTestAds: true,
};

export function getCommercialConfig(): CommercialConfig {
  return runtime;
}

export function patchCommercialConfig(patch: Partial<CommercialConfig>): CommercialConfig {
  Object.assign(runtime, patch);
  return runtime;
}
