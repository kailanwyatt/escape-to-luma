import { getCommercialConfig, REMOVE_ADS_PRODUCT_ID } from '../../config/commercial';
import { ANALYTICS_EVENTS, Analytics } from '../analytics/Analytics';

export type PurchaseOfferings = {
  removeAdsProductId: string;
  available: boolean;
};

class PurchaseServiceImpl {
  private removeAds = false;
  private forceFail = false;

  hydrate(removeAds: boolean): void {
    this.removeAds = removeAds;
  }

  hasRemoveAdsEntitlement(): boolean {
    return this.removeAds;
  }

  getOfferings(): PurchaseOfferings {
    return {
      removeAdsProductId: REMOVE_ADS_PRODUCT_ID,
      available: getCommercialConfig().purchasesEnabled && !this.forceFail,
    };
  }

  async purchaseRemoveAds(): Promise<'completed' | 'cancelled' | 'failed' | 'already'> {
    Analytics.track(ANALYTICS_EVENTS.purchaseStarted, { productId: REMOVE_ADS_PRODUCT_ID });
    if (this.removeAds) {
      Analytics.track(ANALYTICS_EVENTS.purchaseCompleted, { productId: REMOVE_ADS_PRODUCT_ID, already: true });
      return 'already';
    }
    if (!getCommercialConfig().purchasesEnabled || this.forceFail) {
      Analytics.track(ANALYTICS_EVENTS.purchaseFailed, { productId: REMOVE_ADS_PRODUCT_ID });
      return 'failed';
    }
    await new Promise((resolve) => setTimeout(resolve, 280));
    this.removeAds = true;
    Analytics.track(ANALYTICS_EVENTS.purchaseCompleted, { productId: REMOVE_ADS_PRODUCT_ID });
    return 'completed';
  }

  async restorePurchases(): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 180));
    Analytics.track(ANALYTICS_EVENTS.purchaseRestored, {
      productId: REMOVE_ADS_PRODUCT_ID,
      entitled: this.removeAds,
    });
    return this.removeAds;
  }

  setEntitlement(enabled: boolean): void {
    this.removeAds = enabled;
  }

  setForceFail(enabled: boolean): void {
    this.forceFail = enabled;
  }
}

export const PurchaseService = new PurchaseServiceImpl();
