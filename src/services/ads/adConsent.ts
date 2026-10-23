import { Platform } from 'react-native';
import { AdsConsent, AdsConsentPrivacyOptionsRequirementStatus } from 'react-native-google-mobile-ads';
import { readConsentDecision, type AdConsentState } from './adConsentDecision';

export type { AdConsentState };

const unavailable: AdConsentState = { canRequestAds: false, privacyOptionsRequired: false };

/**
 * Google-certified UMP message, before the Mobile Ads SDK starts.
 * Outside the EEA, UK, and Switzerland this resolves without a form.
 */
export async function gatherAdConsent(): Promise<AdConsentState> {
  if (Platform.OS === 'web') return unavailable;
  try {
    return readConsentDecision(await AdsConsent.gatherConsent());
  } catch {
    try {
      return readConsentDecision(await AdsConsent.getConsentInfo());
    } catch {
      return unavailable;
    }
  }
}

export async function adPrivacyOptionsRequired(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const current = await AdsConsent.getConsentInfo();
    if (current.privacyOptionsRequirementStatus !== AdsConsentPrivacyOptionsRequirementStatus.UNKNOWN) {
      return readConsentDecision(current).privacyOptionsRequired;
    }
    return readConsentDecision(await AdsConsent.requestInfoUpdate()).privacyOptionsRequired;
  } catch {
    return false;
  }
}

export async function showAdPrivacyOptions(): Promise<void> {
  if (Platform.OS === 'web') return;
  await AdsConsent.showPrivacyOptionsForm();
}
