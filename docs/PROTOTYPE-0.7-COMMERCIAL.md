# Prototype 0.7 — Commercial Layer

Vendor-agnostic analytics, ads, and purchases for Expo SDK 57 / Expo Go.

## Architecture

```text
src/config/commercial.ts          flags + INTERSTITIAL_CONFIG + ADMOB_TEST IDs
src/services/analytics/           Analytics + ConsoleAnalyticsProvider
src/services/ads/                 AdService, SimulatedAdController, InterstitialPolicy
src/services/purchases/           PurchaseService (local entitlement + simulated buy/restore)
```

Gameplay talks only to these services. No SDK calls from HUD or Game systems.

## Expo Go vs native ads

`react-native-google-mobile-ads` is **not** installed. It requires a development build and would crash Expo Go.

Current runtime:

* `SimulatedAdController` — preload ~240ms, show ~700ms, force ready/fail for debug
* Google **test** unit IDs are listed in `ADMOB_TEST` for a future native adapter
* `useTestAds` defaults to `true`

To wire AdMob later:

1. Create a development build (`expo prebuild` / EAS)
2. Install `react-native-google-mobile-ads` and configure app IDs from `ADMOB_TEST` (or production IDs only for store builds)
3. Replace the controllers inside `AdService` while keeping the same public API

## Rewarded Continue (not Revive)

On final heart loss, if a rewarded ad is ready and continue has not been used:

```text
KEEP GOING? → CONTINUE / END RUN
```

Success: restore **1** heart, streak = 0, retry the **same** challenge, score/seed/env preserved, `suppressInterstitialForCurrentRun = true`.

One continue per run. Failed/unavailable ads go to Run Over with no punishment.

Remove Ads does **not** grant free continues.

## Interstitials

Shown only on **TRY AGAIN** after Run Over / Gauntlet Complete (never mid-run).

Policy (`INTERSTITIAL_CONFIG`):

* earliest after 3 completed runs
* at least 2 runs between ads
* at least 180 seconds between ads
* suppressed after a rewarded continue on that run
* never during onboarding
* never when Remove Ads is owned

## Remove Ads IAP

Product id: `aperture_remove_ads`

* Settings → REMOVE ADS / RESTORE PURCHASES
* Simulated purchase in Expo Go; entitlement persisted on save v3 `commercial.removeAds`
* Disables interstitials only

## Analytics

`Analytics.track` with session + run IDs. Console provider logs when `Analytics.debug` is on (`__DEV__` debug panel).

No PII. Events use `continue_*` names (not `revive_*`).

## ATT / privacy

`expo-tracking-transparency` is installed and plugged in `app.json`.

`requestTrackingIfNeeded()` is reserved for **real** ad presentation and is not called for simulated ads. It is never requested on first launch.

## Save

Save version **3**. New `commercial` block:

* `removeAds`
* `bestScoreNoContinue`
* `lastInterstitialAt`
* `runsSinceLastInterstitial`

Offline play always works; ads fail soft.
