# Journey / Worlds redesign

Implemented a ten-world connected timeline, compact brand/progress header, contextual back button, and an in-screen level-selection view. No new navigator, saved state, progression system, rewards or gameplay changes. No overlapping Settings control is mounted by Journey.

## Data and behavior

`journeyProgress.ts` derives core-level counts exclusively from known campaign definitions and saved cleared records. It uses existing highestUnlockedLevel, unlockedWorldIds, bestRank and campaignCompleted. Developer access makes content accessible without marking it completed. A dev skip to the finale does not fabricate 150 clears. Completed, current, unlocked and locked cards have distinct symbols and labels. Only all 150 recorded clears produce JOURNEY COMPLETE; reaching the ending otherwise shows HOME FOUND and the actual count.

The current world receives a static glow (no continuous animation). Initial scrolling leaves the preceding world visible. All ten worlds remain in the list. Locked cards show an unlock explanation and never enter level selection. World selection opens the existing level-choice flow inside Journey; selecting an available level calls the existing onSelectLevel callback. Back returns to worlds, then Home. Campaign completion keeps replay access.

## Replaceable art

`journeyPresentation.ts` owns asset IDs, accent palettes and fallback motifs. No filenames are imported into the screen. Reused: containment crack/lab artwork, city gateway, Nebula, Ancient Network, and Homeward scenery. Homeward art is withheld until the existing campaign/story unlock reveals Luma.

Final banners still needed for Sky, Upper Atmosphere, Orbit, Moon and Asteroid Belt. Current native-view cloud, Earth-horizon, satellite, lunar and debris illustrations are deliberate placeholders. Suggested replacement sources: 1024×320 JPG/WebP, restrained compression (~100–200 KB each), quiet left third, environmental interest on the right, no embedded text. Existing working assets were not renamed. No new art generation.

Nebula brief: blue-violet gas filaments with fractured minerals and a faint remote relay; beauty and uncertainty, not a welcoming inhabited home. Keep the central/left text zone dark, with asymmetric luminous clouds on the right. Avoid a second bright gameplay portal or premature Luma imagery.

## Validation

Typecheck and 135 tests pass. Four new selector tests cover initial locks, mastery/completion, developer access, skipped finale counts and complete-campaign replay. Browser checked at 320×568, 390×844 and 430×932. Verified world selection, disabled levels, back navigation, locked City/Homeward explanations and loaded image crops. Portrait image sizing was corrected during review. iPhone safe-area/font-scale verification remains a device check. No separate lint command is configured. No Expo builds, exports or submissions.

Files created: src/campaign/journeyProgress.ts, src/ui/journeyPresentation.ts, tests/journey-progress.test.ts, this document.
Files modified: src/ui/JourneyScreen.tsx.
