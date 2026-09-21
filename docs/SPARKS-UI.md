# Sparks collection redesign

Reference-inspired native dashboard: compact brand and real shard wallet, featured selectable Spark, All/Owned/Locked/Special filters, responsive collection cards, equipped checkmark, reward explanations and compact Back. All 15 catalog appearances are retained. Special means world rewards, mastery and premium appearances; Locked includes all unowned Sparks, including shard purchases.

Card selection previews only and returns to the featured panel. Equip and Buy are separate explicit actions through existing callbacks. Shard costs come from SPARK_CATALOG, never the reference mockup. Insufficient balances disable buying and show the exact shortfall. World locks describe the existing world reward. Ancient/mastery and Prism/premium have no currently implemented acquisition action and are explicitly marked not yet available. No new unlock system or store purchase flow was added.

Previews are lightweight native glow/gradient spheres with electric filaments and cosmetic colors from the existing catalog. No static orbital rings, external artwork, dependencies or realtime 3D scenes. Only the featured preview gently pulses, and reduced motion stops that animation. These are stylized menu previews, not exact captures of every in-game effect.

Layout: maximum width 980, three columns on wide screens, two on ordinary phones, one with narrow effective width/large text. Safe-area padding; one vertical scroller. Uses the existing tentative HOME_BRAND identity. No gameplay, save format, price or physics changes.

Files modified: src/ui/SparksScreen.tsx.
Files created: src/ui/sparkPresentation.ts, docs/SPARKS-UI.md.

Validation: typecheck and 140 existing tests passed. Browser review at 320×568, 390×844 and normal wide size. Confirmed Original equipped state, Owned and Special filtering, world reward explanation, Frost price 800 / wallet 65 / shortfall 735 and disabled purchase. No purchases or equipment mutations made while testing. Physical iPhone visual acceptance remains a device check. No Expo builds, exports or submissions.
