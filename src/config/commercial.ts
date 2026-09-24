import { RELEASE_POLICY } from './release';

export type CommercialConfig = {
  analyticsEnabled: boolean;
  adsEnabled: boolean;
  rewardedContinueEnabled: boolean;
  interstitialEnabled: boolean;
  purchasesEnabled: boolean;
  useTestAds: boolean;
};

/** Interstitial every 6 play screens (run count is authoritative). */
export const INTERSTITIAL_CONFIG = {
  minimumRunsBeforeFirstAd: 6,
  minimumRunsBetweenAds: 6,
  minimumSecondsBetweenAds: 0,
  suppressAfterRewardedAd: true,
} as const;

export const REMOVE_ADS_PRODUCT_ID = 'aperture_remove_ads';

/** Google sample / test IDs — used while useTestAds is true. */
export const ADMOB_TEST = {
  androidAppId: 'ca-app-pub-3940256099942544~3347511713',
  iosAppId: 'ca-app-pub-3940256099942544~1458002511',
  rewardedAndroid: 'ca-app-pub-3940256099942544/5224354917',
  rewardedIos: 'ca-app-pub-3940256099942544/1712485313',
  interstitialAndroid: 'ca-app-pub-3940256099942544/1033173712',
  interstitialIos: 'ca-app-pub-3940256099942544/4411468910',
} as const;

/** Production AdMob IDs (from .env / EAS; platform-specific). */
export const ADMOB_PROD = {
  iosAppId:
    process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ??
    'ca-app-pub-1715335515944327~5238132731',
  androidAppId:
    process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ??
    'ca-app-pub-1715335515944327~9693302939',
  rewardedIos:
    process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_UNIT_ID ??
    'ca-app-pub-1715335515944327/4154035794',
  rewardedAndroid:
    process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_UNIT_ID ??
    'ca-app-pub-1715335515944327/1914974559',
  interstitialIos:
    process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL_UNIT_ID ??
    'ca-app-pub-1715335515944327/5038822187',
  interstitialAndroid:
    process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL_UNIT_ID ??
    'ca-app-pub-1715335515944327/8380221265',
} as const;

export type AdMobIds = typeof ADMOB_PROD;

/** Active unit IDs: Google samples while testing, production otherwise. */
export function getAdMobIds(useTestAds = getCommercialConfig().useTestAds): AdMobIds {
  return useTestAds ? ADMOB_TEST : ADMOB_PROD;
}

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
