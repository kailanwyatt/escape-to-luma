export type AdConsentState = {
  /** Google Mobile Ads may be initialized and requested. */
  canRequestAds: boolean;
  /** EEA, UK, or Switzerland users must be able to change their choice. */
  privacyOptionsRequired: boolean;
};

export function readConsentDecision(info: {
  canRequestAds: boolean;
  privacyOptionsRequirementStatus: string;
}): AdConsentState {
  return {
    canRequestAds: info.canRequestAds,
    privacyOptionsRequired: info.privacyOptionsRequirementStatus === 'REQUIRED',
  };
}
