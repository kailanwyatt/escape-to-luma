# IMPLEMENTATION REPORT — SPARK Campaign (Full Core)

## SUMMARY

Prototype throw loop preserved. Full campaign: Worlds 1–10 (levels 1–150), Jump Gate presentation, Energy/Shards, Shop/Sparks/Boosts, Endless Voyage gate, save v4. New obstacle families: orbiter, drifting blocker, phase field, shifting aperture + gravity wells. Placeholder visuals only.

## FILES CREATED

- `src/config/economy.ts`
- `src/campaign/types.ts`, `worlds.ts`, `CampaignPlay.ts`
- `src/campaign/levels/world1.ts`, `world2.ts`, `helpers.ts`, `worldsPack.ts`, `index.ts`
- New obstacles: `OrbiterObstacle`, `DriftingBlockerObstacle`, `PhaseFieldObstacle`, `ShiftingApertureObstacle`
- `src/customization/sparks.ts`, `trails.ts`
- `src/economy/energy.ts`, `rewards.ts`
- `src/ui/JourneyScreen.tsx`, `LevelReadyScreen.tsx`, `SparksScreen.tsx`, `ShopScreen.tsx`, `OutOfEnergyScreen.tsx`
- Campaign docs under `docs/`

## WORLD SYSTEM

10 world definitions; all `stub: false`. Journey shows full map.

## LEVEL SYSTEM

150 authored `CampaignLevelDefinition`s → `ChallengeConfig` / obstacles (max 2 slots). Level 150 HOME has no hazard.

## WORLD FINALES

15, 30, 45, 60, 75, 90, 105, 120, 135, 150.

## JUMP GATE

Same radius zones; campaign copy CLEAR/GREAT/BULLSEYE/PERFECT.

## CAMPAIGN SAVE / CHECKPOINTS

`highestUnlockedLevel` never rolls back on fail/energy empty.

## SAVE MIGRATION

v3 → v4 safe defaults; documented in `SAVE-SCHEMA.md`.

## SCORE

Skill-only; centralized in `ECONOMY.score` / `GAME_TUNING.score`.

## SHARDS / ENERGY / REGEN / UNLIMITED / REWARDED

See `ECONOMY.md` / `MONETIZATION.md`.

## SHOP / SPARK CUSTOMIZATION / BOOSTS

Shop + Sparks screens; Guidance (full traj), Slow Field (0.6× obstacles), Second Chance (no energy, retry). Hyperjump inventoried but not enabled.

## MONETIZATION

Mocks for unlimited energy; Remove Ads preserved; rewarded energy via AdService.

## ENDLESS VOYAGE MIGRATION

Existing endless behind unlock (`campaignCompleted` or `endlessUnlockedDev`).

## ANALYTICS

Campaign event names added; level start/complete/fail tracked from Game.

## OFFLINE

Campaign/shards/energy/cosmetics work offline; ads soft-fail.

## DEV TOOLS

Game: `addShards`, `setEnergy`, `unlockEndless`, `completeWorld1`, `resetCampaign` (wire more into DebugOverlay as needed).

## TESTS

`npm run typecheck` pass. Manual vertical slice recommended on device/web.

## PERFORMANCE

No new per-frame systems beyond wind integrate + optional slow dt.

## KNOWN ISSUES

- Wind is simple constant accel (not full CFD)
- Opening cinematic is title-card only
- Debug overlay campaign buttons may be incomplete vs architecture list
- Web subfolder still needs `experiments.baseUrl`

## PLACEHOLDER SYSTEMS

Primitives, mock IAP labels, temporary spark materials, no final art/audio for story.

## MANUAL CONFIGURATION REQUIRED

- Real IAP product IDs when leaving mocks
- Official name / icons later
- Rebuild web zip if redeploying

## RECOMMENDED NEXT STEP

Playtest full campaign progression (W1 → W10 → HOME → Endless). Then art/audio pass.
