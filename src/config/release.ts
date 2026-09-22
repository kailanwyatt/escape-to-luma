/**
 * TestFlight policy.
 *
 * All 150 campaign levels remain playable. The beta disables simulated
 * commerce/tracking surfaces so testers evaluate the game, not mocks.
 */
export const RELEASE_POLICY = {
  channel: 'testflight',
  campaignMaxLevel: 150,
  freeRetries: false,
  adsEnabled: false,
  purchasesEnabled: true,
  analyticsEnabled: false,
  trackingPromptEnabled: false,
  showDeveloperGraphicsScreen: typeof __DEV__ !== 'undefined' && __DEV__,
} as const;

export type ReleaseChannel = typeof RELEASE_POLICY.channel;
