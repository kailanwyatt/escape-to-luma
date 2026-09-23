import { describe, expect, it } from 'vitest';

import { emptySave } from '../src/persistence/GameSave';
import { OVERCHARGE_PRODUCTS } from '../src/config/overcharge';
import {
  applyOverchargePurchase,
  overchargeRemainingMs,
  overchargeStatus,
} from '../src/economy/overcharge';
import { ECONOMY } from '../src/config/economy';

describe('Overcharge entitlement', () => {
  it('configures 2h / 24h / 7d products', () => {
    expect(OVERCHARGE_PRODUCTS.map((p) => p.hours)).toEqual([2, 24, 168]);
    expect(ECONOMY.unlimitedEnergy2hMs).toBe(2 * 60 * 60 * 1000);
  });

  it('extends from max(now, existing) and is idempotent per transaction', () => {
    const now = 1_700_000_000_000;
    let campaign = emptySave().campaign;
    const first = applyOverchargePurchase(campaign, 'overcharge_2h', 'tx-1', now);
    expect(first.result.status).toBe('applied');
    campaign = first.campaign;
    expect(campaign.unlimitedEnergyExpiresAt).toBe(now + OVERCHARGE_PRODUCTS[0].durationMs);

    const dup = applyOverchargePurchase(campaign, 'overcharge_2h', 'tx-1', now + 1000);
    expect(dup.result.status).toBe('already');
    expect(dup.campaign.unlimitedEnergyExpiresAt).toBe(campaign.unlimitedEnergyExpiresAt);

    const extend = applyOverchargePurchase(campaign, 'overcharge_24h', 'tx-2', now + 60_000);
    expect(extend.result.status).toBe('applied');
    if (extend.result.status === 'applied') {
      expect(extend.result.expiresAt).toBe(
        Math.max(campaign.unlimitedEnergyExpiresAt, now + 60_000) + OVERCHARGE_PRODUCTS[1].durationMs,
      );
    }
  });

  it('reports remaining time without inventing offline extensions', () => {
    const now = 1_700_000_000_000;
    const campaign = emptySave().campaign;
    campaign.unlimitedEnergyExpiresAt = now + 90_000;
    expect(overchargeRemainingMs(campaign, now)).toBe(90_000);
    expect(overchargeStatus(campaign, now + 120_000).active).toBe(false);
  });
});
