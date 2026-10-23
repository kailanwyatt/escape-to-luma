export type { AdConsentState } from './adConsentDecision';
import type { AdConsentState } from './adConsentDecision';

const unavailable: AdConsentState = { canRequestAds: false, privacyOptionsRequired: false };

export async function gatherAdConsent(): Promise<AdConsentState> {
  return unavailable;
}

export async function adPrivacyOptionsRequired(): Promise<boolean> {
  return false;
}

export async function showAdPrivacyOptions(): Promise<void> {}
