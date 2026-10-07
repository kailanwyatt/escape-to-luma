import { isWebArcadeBuild } from './webArcade';

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
  // The embedded browser Arcade has no AdMob or purchase experience. Its
  // parent site owns navigation, while this bundle stays focused on play.
  adsEnabled: !isWebArcadeBuild,
  purchasesEnabled: !isWebArcadeBuild,
  analyticsEnabled: false,
  trackingPromptEnabled: !isWebArcadeBuild,
  showDeveloperGraphicsScreen: typeof __DEV__ !== 'undefined' && __DEV__,
} as const;

export type ReleaseChannel = typeof RELEASE_POLICY.channel;
