import { describe, expect, it } from 'vitest';
import { readConsentDecision } from '../src/services/ads/adConsentDecision';

describe('Google UMP consent', () => {
  it('requests ads only after the certified message allows it', () => {
    expect(readConsentDecision({ canRequestAds: false, privacyOptionsRequirementStatus: 'REQUIRED' })).toEqual({
      canRequestAds: false,
      privacyOptionsRequired: true,
    });
    expect(readConsentDecision({ canRequestAds: true, privacyOptionsRequirementStatus: 'NOT_REQUIRED' })).toEqual({
      canRequestAds: true,
      privacyOptionsRequired: false,
    });
  });

  it('keeps a privacy-choices entry for regulated regions', () => {
    expect(readConsentDecision({ canRequestAds: true, privacyOptionsRequirementStatus: 'REQUIRED' }).privacyOptionsRequired).toBe(true);
    expect(readConsentDecision({ canRequestAds: true, privacyOptionsRequirementStatus: 'UNKNOWN' }).privacyOptionsRequired).toBe(false);
  });
});
