import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('react-native-purchases', () => ({
  default: { purchaseStoreProduct: vi.fn() },
  PRODUCT_CATEGORY: { NON_SUBSCRIPTION: 'NON_SUBSCRIPTION' },
}));
vi.mock('../src/services/analytics/Analytics', () => ({
  Analytics: { track: vi.fn() },
  ANALYTICS_EVENTS: {},
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('production Overcharge purchases', () => {
  it('does not grant a mock purchase when the Apple SDK is unavailable', async () => {
    vi.stubGlobal('__DEV__', false);
    vi.stubEnv('EXPO_PUBLIC_REVENUECAT_IOS_API_KEY', '');
    const { PurchaseService } = await import('../src/services/purchases/PurchaseService');
    expect(await PurchaseService.purchaseOvercharge('overcharge_2h')).toEqual({
      status: 'unavailable',
      productId: 'overcharge_2h',
    });
    expect(await PurchaseService.restoreOverchargePurchases()).toEqual([]);
  });
});
