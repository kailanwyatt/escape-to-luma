# In-app purchase catalog

Bundle ID: `com.escapetoluma.spark`
RevenueCat entitlement: `remove_ads`

Configure each item as a **consumable** in App Store Connect, except Remove Ads,
which is a **non-consumable**. Use the identifiers verbatim — they are the
contract between the app, App Store Connect, and RevenueCat.

| Store product ID | Apple type | Display name | Reference price |
| --- | --- | --- | --- |
| `aperture_remove_ads` | Non-consumable | Remove Ads | $2.99 |
| `com.escapetoluma.spark.shards250` | Consumable | Pocket of Light — 250 Shards | $0.99 |
| `com.escapetoluma.spark.shards700` | Consumable | Journey Supply — 700 Shards | $2.99 |
| `com.escapetoluma.spark.shards1600` | Consumable | Voyage Reserve — 1,600 Shards | $5.99 |
| `com.escapetoluma.spark.overcharge2h` | Consumable | Overcharge — 2 Hours | $0.99 |
| `com.escapetoluma.spark.overcharge24h` | Consumable | Overcharge — 24 Hours | $1.99 |
| `com.escapetoluma.spark.overcharge7d` | Consumable | Overcharge — 7 Days | $4.99 |

## RevenueCat configuration

1. Create an Apple App for bundle ID `com.escapetoluma.spark` in the RevenueCat
   project and connect its App Store Connect credentials.
2. Import the seven products above after they exist in App Store Connect.
3. Create the `remove_ads` entitlement and attach only `aperture_remove_ads` to it.
4. Copy the project’s public Apple SDK key to `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
   in EAS and the local `.env`. Do not use a secret API key in the app.
5. Rebuild the iOS development/production build. Expo Go cannot make real IAPs.

Consumables are intentionally not included in Restore Purchases: Apple does not
restore consumable purchases. The Remove Ads entitlement is restored through
RevenueCat and controls the app’s interstitial-ad suppression.
