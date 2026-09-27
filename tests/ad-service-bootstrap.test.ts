import { describe, expect, it } from 'vitest';
import { RELEASE_POLICY } from '../src/config/release';
import { getCommercialConfig } from '../src/config/commercial';

describe('production ads policy', () => {
  it('enables ads and ATT for store builds', () => {
    expect(RELEASE_POLICY.channel).toBe('production');
    expect(RELEASE_POLICY.adsEnabled).toBe(true);
    expect(RELEASE_POLICY.trackingPromptEnabled).toBe(true);
    expect(getCommercialConfig().adsEnabled).toBe(true);
  });
});
