import { Platform } from 'react-native';
import Purchases, { PRODUCT_CATEGORY, type PurchasesError, type PurchasesStoreProduct } from 'react-native-purchases';

import { getCommercialConfig, REMOVE_ADS_PRODUCT_ID } from '../../config/commercial';
import { SHARD_PACKS, type ShardPackId } from '../../config/economy';
import { ANALYTICS_EVENTS, Analytics } from '../analytics/Analytics';

export type PurchaseOfferings = {
  removeAdsProductId: string;
  available: boolean;
};

export type ShardProduct = {
  packId: ShardPackId;
  productId: string;
  localizedPrice: string;
};

export type ShardPurchaseResult =
  | { status: 'completed'; packId: ShardPackId; transactionId: string }
  | { status: 'cancelled' | 'failed' | 'unavailable'; packId: ShardPackId };

class PurchaseServiceImpl {
  private removeAds = false;
  private forceFail = false;
  private initialized = false;
  private products = new Map<string, PurchasesStoreProduct>();

  async initialize(): Promise<void> {
    if (this.initialized || !getCommercialConfig().purchasesEnabled || Platform.OS !== 'ios') return;
    const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim();
    if (!apiKey) return;
    try {
      if (!(await Purchases.isConfigured())) {
        Purchases.configure({ apiKey });
      }
      this.initialized = true;
      await this.refreshShardProducts();
    } catch {
      this.initialized = false;
    }
  }

  async refreshShardProducts(): Promise<ShardProduct[]> {
    if (!this.initialized) return [];
    try {
      const products = await Purchases.getProducts(
        SHARD_PACKS.map((pack) => pack.productId),
        PRODUCT_CATEGORY.NON_SUBSCRIPTION,
      );
      this.products = new Map(products.map((product) => [product.identifier, product]));
      return SHARD_PACKS.flatMap((pack) => {
        const product = this.products.get(pack.productId);
        return product ? [{ packId: pack.id, productId: pack.productId, localizedPrice: product.priceString }] : [];
      });
    } catch {
      return [];
    }
  }

  async getShardProducts(): Promise<ShardProduct[]> {
    await this.initialize();
    return this.refreshShardProducts();
  }

  async purchaseShardPack(packId: ShardPackId): Promise<ShardPurchaseResult> {
    const pack = SHARD_PACKS.find((candidate) => candidate.id === packId);
    if (!pack) return { status: 'unavailable', packId };
    await this.initialize();
    let product = this.products.get(pack.productId);
    if (!product) {
      await this.refreshShardProducts();
      product = this.products.get(pack.productId);
    }
    if (!product) return { status: 'unavailable', packId };
    Analytics.track(ANALYTICS_EVENTS.purchaseStarted, { productId: pack.productId });
    try {
      const result = await Purchases.purchaseStoreProduct(product);
      Analytics.track(ANALYTICS_EVENTS.purchaseCompleted, { productId: pack.productId });
      return { status: 'completed', packId, transactionId: result.transaction.transactionIdentifier };
    } catch (error) {
      const purchaseError = error as Partial<PurchasesError>;
      if (purchaseError.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR || purchaseError.userCancelled) {
        return { status: 'cancelled', packId };
      }
      Analytics.track(ANALYTICS_EVENTS.purchaseFailed, { productId: pack.productId });
      return { status: 'failed', packId };
    }
  }

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
