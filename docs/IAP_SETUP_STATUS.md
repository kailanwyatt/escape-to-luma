# IAP setup status — September 27, 2026

## Verified in the dashboards

All seven App Store Connect records exist, with worldwide availability, English (U.S.) display names/descriptions, and price schedules:

| Product | Apple ID | USD price |
| --- | --- | --- |
| Remove Ads | 6816669562 | 2.99 |
| 250 Shards | 6816680470 | 0.99 |
| 700 Shards | 6816681339 | 2.99 |
| 1,600 Shards | 6816682007 | 5.99 |
| Overcharge 2 Hours | 6816682114 | 0.99 |
| Overcharge 24 Hours | 6816682136 | 1.99 |
| Overcharge 7 Days | 6816682214 | 4.99 |

All seven matching identifiers are present in RevenueCat project `44dd9862`, Apple app `app02638733f3`. Overcharge products were imported from Apple. The three current shard products have `(Current)` appended to their RevenueCat-only display names because legacy products already occupy the original names. Legacy `com.kurt.sparkescapetoluma.*` records were left untouched. Remove Ads has one entitlement attached; the consumables intentionally have none.

The Apple public SDK key is present once in local `.env` and in the production EAS build profile.

## Review screenshots and submission

- Accepted review screenshots are in `design/iap-review/`: `shards250-review.jpg`, `shards700-review.jpg`, `shards1600-review.jpg`, `overcharge-review.jpg`, and `remove-ads-review.jpg` (640×920). All seven products have accepted screenshots. Earlier PNG-named captures were rejected because their bytes were JPEG; the correctly named JPEG files resolved this.
- These are real release-mode browser-preview offer screens, not native StoreKit confirmations. Browser purchases are unavailable and Settings identifies its build as DEV. Browser-only AdMob and tracking-permission fallbacks permit rendering; iOS code is unaffected.
- With user approval, removed the 24-hour Overcharge and 250-shard memberships from a duplicate draft and re-added them to the main draft. Product records and screenshots remained intact; the empty duplicate disappeared.
- App Store Connect now confirms **Waiting for Review** for all seven IAPs and version **1.0 / build 25** in one submission: `4d22188a-8b2a-4c2b-a8c5-22cc6b3a748b`, September 27, 2026 at 1:17 PM.
- The workflow unexpectedly advanced beyond intended draft-only staging to **8 Items Submitted**. This was disclosed to the user immediately; the submission was left intact. Existing release setting is automatic release after approval.
- Sandbox purchase validation was not performed in this pass; user confirmed the new app build was working.

## Verification

- Purchase-service regression and Overcharge tests: 4 passed.
- Typecheck has existing errors in `tests/story.test.ts:63` (`exit.instruction` possibly undefined) and `src/ui/ShopScreen.tsx:147` (`measureInWindow` and callback parameter types).
- Apple sometimes leaves the form looking dirty after saving. Fresh detail-page reads verified persisted availability, pricing schedules, and English descriptions for all seven products.
