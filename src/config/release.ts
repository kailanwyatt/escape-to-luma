/**
 * App Store / production policy.
 *
 * Ads + ATT are enabled so AdMob serves as soon as the approved build is live.
 * Analytics stays off until a real analytics backend is wired.
 */
export const RELEASE_POLICY = {
  channel: 'production',
  campaignMaxLevel: 150,
  freeRetries: false,
  adsEnabled: true,
  purchasesEnabled: true,
  analyticsEnabled: false,
  trackingPromptEnabled: true,
  showDeveloperGraphicsScreen: typeof __DEV__ !== 'undefined' && __DEV__,
} as const;

export type ReleaseChannel = typeof RELEASE_POLICY.channel;
