# Prototype 0.7 Report

## What shipped

Commercial instrumentation around the existing 0.6 loop — no gameplay redesign.

* Analytics abstraction (`Analytics.track`, session + run IDs, `continue_*` events)
* Simulated rewarded + interstitial ads (Expo Go safe)
* **Rewarded Continue** (replaces revive naming): KEEP GOING? → 1 heart, same challenge, streak 0, one per run
* Interstitial on TRY AGAIN only, gated by `InterstitialPolicy`
* Remove Ads purchase (simulated) + restore; persists on save v3
* Settings monetization section; `__DEV__` commercial debug controls
* Audio suspend/restore around ads; world freeze during CONTINUE_OFFER / ads
* Docs: `docs/PROTOTYPE-0.7-COMMERCIAL.md`

## Protected loop

Ads never sit between successful shots, during aim, flight, or environment transitions.

## Offline

Gameplay works offline. Unavailable ads skip continue / interstitial without trapping the player.

## Verification

* `npm run typecheck` — pass
* Interstitial policy matrix (scripted) — pass
* On-device Expo Go ad UI — not exercised this pass (no simulator attached)

## Not in 0.7

* Real AdMob / StoreKit (documented adapter path; Expo Go uses simulation)
* Prototype 0.8+
* Unlimited continues / continue currency

## STOP

Prototype 0.7 complete. Do not start 0.8 unless requested.
