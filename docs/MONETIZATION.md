# Monetization (as implemented)

## Hierarchy

1. Timed Unlimited Energy (mock)
2. Cosmetics (Shards / premium stubs)
3. Optional boosts (Shards)
4. Rewarded ads (energy, endless continue)
5. Shard packs (architected, not live)
6. Remove Ads (existing Settings entitlement)

## Campaign ads

- No forced ads mid-aim / mid-flight / every fail
- Rewarded energy via Shop / Out of Energy (`AdService.showRewarded`)
- Endless Continue + interstitial policy unchanged

## Unlimited Energy

Mock purchase sets `campaign.unlimitedEnergyExpiresAt`. Failures consume no Energy while active. Persists across relaunch.

## Remove Ads

Still removes interstitials only — not optional rewarded ads or continues.

## Pricing

UI uses MOCK labels from `ECONOMY`; no hardcoded storefront dollars.
