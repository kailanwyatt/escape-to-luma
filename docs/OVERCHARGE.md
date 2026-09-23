# Overcharge — timed unlimited Energy

## Entitlement

Overcharge is a paid, timed unlimited-Energy entitlement, using the existing `campaign.unlimitedEnergyExpiresAt` as the authoritative persisted expiration. Products are **2-hour, 24-hour and 7-day** durations. Store product IDs, localized prices and availability are configuration/storefront data; UI must not hardcode dollars. Test examples only: $0.99 / $1.99 / $4.99.

While active, campaign failure spends **no Energy**. Normal Energy regeneration still runs underneath, including offline. Expiration is real elapsed time (`Date.now()`/validated store time), persists through app closure, and an additional validated purchase extends from `max(now, existingExpiration) + purchasedDuration`.

## UI flow

1. **Shop card:** “Overcharge — unlimited Energy for a limited time,” status/remaining time if active, and an entry action.
2. **Duration selection:** three configured products, duration, localized storefront price, restore link and free alternatives; no pressure copy.
3. **Purchase confirmation:** platform purchase sheet plus clear post-purchase entitlement summary.
4. **Activation:** concise success state with expiry and “Play now”; update the same entitlement once.
5. **HUD:** render `∞` Energy while active plus a compact countdown/status affordance. Do not show a misleading depleted numeric count.
6. **Zero Energy:** contextual offer may surface alongside normal regeneration timer and rewarded-ad refill; decline must be easy and non-blocking.
7. **Active details:** expiry timestamp/remaining duration, benefits, restore/purchase validation status, and **Extend time** returning to duration selection.

## Purchase and reliability contract

- Validate/restore through the storefront provider (`react-native-purchases` is already installed) and use a stable purchase/transaction ID. Reuse `processedPurchaseIds` to make grants idempotent: one validated transaction extends once, never also gives shards, boosts, Energy, or duplicate analytics/rewards.
- Reconcile entitlement at launch, foreground, restore, and successful purchase. A client-side timestamp is a cached presentation of the verified entitlement; server/store truth wins on conflict.
- Offline: show cached active time counting down locally; permit no unverifiable new purchase/grant. Clearly state that restore/validation needs connectivity, then reconcile when available. Never extend an expired entitlement merely because the app was offline.
- Keep rewarded Energy (+1 in current config) and normal regeneration as free alternatives. Do not tighten Energy costs/regeneration or force ads to manufacture demand.

## Configuration and migration

Keep duration, product ID, price display from storefront, entitlement key and test flags in a central purchase/economy config. The existing timestamp can support this design; add versioned receipt/validation metadata only if required by the purchase integration. Existing 24h/7d mocks should migrate as valid timestamp state, not be double-granted.

## Responsibilities

### CURSOR

Own product configuration, purchase/restore validation, idempotent entitlement state, save migration, functional screens/HUD state, test clocks and tests. Keep current energy regeneration/failure rules as the base system.

### CODEX

Own polished shop/selection/active-state UX, countdown readability, confirmation presentation, visual assets and post-mechanics responsive/performance cleanup. Do not implement duplicate entitlement grants or change validated economy behavior.
