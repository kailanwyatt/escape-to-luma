/** Timed unlimited-Energy entitlement products (docs/OVERCHARGE.md). */

export type OverchargeProductId = 'overcharge_2h' | 'overcharge_24h' | 'overcharge_7d';

export type OverchargeProduct = {
  id: OverchargeProductId;
  /** Store product identifier; UI must not hardcode dollars. */
  productId: string;
  durationMs: number;
  /** Fallback when storefront price is unavailable (dev/mock). */
  fallbackPrice: string;
  label: string;
  hours: number;
};

export const OVERCHARGE_PRODUCTS: readonly OverchargeProduct[] = [
  {
    id: 'overcharge_2h',
    productId: 'com.escapetoluma.spark.overcharge2h',
    durationMs: 2 * 60 * 60 * 1000,
    fallbackPrice: '$0.99',
    label: '2 hours',
    hours: 2,
  },
  {
    id: 'overcharge_24h',
    productId: 'com.escapetoluma.spark.overcharge24h',
    durationMs: 24 * 60 * 60 * 1000,
    fallbackPrice: '$1.99',
    label: '24 hours',
    hours: 24,
  },
  {
    id: 'overcharge_7d',
    productId: 'com.escapetoluma.spark.overcharge7d',
    durationMs: 7 * 24 * 60 * 60 * 1000,
    fallbackPrice: '$4.99',
    label: '7 days',
    hours: 168,
  },
] as const;

export function overchargeProductById(id: OverchargeProductId): OverchargeProduct | undefined {
  return OVERCHARGE_PRODUCTS.find((product) => product.id === id);
}

export function overchargeProductByStoreId(productId: string): OverchargeProduct | undefined {
  return OVERCHARGE_PRODUCTS.find((product) => product.productId === productId);
}
