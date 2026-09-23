import type { CampaignSave } from '../persistence/GameSave';
import { hasUnlimitedEnergy } from '../persistence/GameSave';
import {
  OVERCHARGE_PRODUCTS,
  type OverchargeProduct,
  type OverchargeProductId,
  overchargeProductById,
} from '../config/overcharge';

export type OverchargeGrantResult =
  | { status: 'applied'; expiresAt: number; product: OverchargeProduct }
  | { status: 'already'; expiresAt: number; product: OverchargeProduct }
  | { status: 'invalid' };

/**
 * Idempotent entitlement extend: one transaction ID grants once.
 * Extends from max(now, existingExpiration) + duration.
 */
export function applyOverchargePurchase(
  campaign: CampaignSave,
  productId: OverchargeProductId,
  transactionId: string,
  now = Date.now(),
): { campaign: CampaignSave; result: OverchargeGrantResult } {
  const product = overchargeProductById(productId);
  if (!product || !transactionId) {
    return { campaign, result: { status: 'invalid' } };
  }
  if (campaign.processedPurchaseIds.includes(transactionId)) {
    return {
      campaign,
      result: {
        status: 'already',
        expiresAt: campaign.unlimitedEnergyExpiresAt,
        product,
      },
    };
  }
  const expiresAt = Math.max(campaign.unlimitedEnergyExpiresAt, now) + product.durationMs;
  const next: CampaignSave = {
    ...campaign,
    unlimitedEnergyExpiresAt: expiresAt,
    processedPurchaseIds: [...campaign.processedPurchaseIds, transactionId].slice(-200),
  };
  return {
    campaign: next,
    result: { status: 'applied', expiresAt, product },
  };
}

/** Restore path: re-apply a validated transaction without double-granting. */
export function reconcileOverchargeFromReceipt(
  campaign: CampaignSave,
  productId: OverchargeProductId,
  transactionId: string,
  now = Date.now(),
): { campaign: CampaignSave; result: OverchargeGrantResult } {
  return applyOverchargePurchase(campaign, productId, transactionId, now);
}

export function overchargeRemainingMs(campaign: CampaignSave, now = Date.now()): number {
  return Math.max(0, campaign.unlimitedEnergyExpiresAt - now);
}

export function formatOverchargeRemaining(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSec = Math.ceil(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function overchargeStatus(campaign: CampaignSave, now = Date.now()) {
  const active = hasUnlimitedEnergy(campaign, now);
  return {
    active,
    expiresAt: campaign.unlimitedEnergyExpiresAt,
    remainingMs: overchargeRemainingMs(campaign, now),
    remainingLabel: formatOverchargeRemaining(overchargeRemainingMs(campaign, now)),
    products: OVERCHARGE_PRODUCTS,
  };
}
