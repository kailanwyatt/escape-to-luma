# Stats dashboard

## Implemented
Native, scrollable dashboard with campaign progress hero, ten numbered world nodes, activity, collectible balance/earnings, precision rings, optional arcade/endless records, derived milestone badges and a shallow gradient quote banner. Compact back control calls the existing callback. No Settings overlay, new dependencies, generated images, gameplay changes or save writes.

## Stat audit and sources
- Campaign progress: known world/level definitions and completedLevels[*].cleared, through journeyProgress. World cleared means all fifteen levels have cleared records. Percent is unique cleared core levels / 150, rounded for display. Developer finale skips do not fabricate full completion.
- Activity: campaign.stats.totalAttempts, failures and closeCalls. These are recorded resolved attempts, not a newly invented count of gestures or sessions.
- Precision: bestRank of each cleared campaign level, explicitly labeled BEST RESULT PER CLEARED CAMPAIGN LEVEL. CLEAR/GREAT/BULLSEYE/PERFECT are mutually exclusive here. Stored cumulative campaign rank counters remain unchanged; the display does not silently substitute arcade precision counters.
- Shards: campaign.stats.shardsEarned is lifetime tracked earnings; campaign.shards is available wallet balance. They remain separate even after spending.
- Arcade/endless: playerProgress.totalRuns, longestRun, bestStreak, highestScore and totalShotsCleared. Game.commitProgress accumulates these for the run-based mode, including earlier prototype sessions. The save does not distinguish old runs from current Endless Voyage, so the card explicitly includes earlier arcade play. It is hidden when locked and all run counters are zero. Actual elapsed playtime is not stored and is not shown.
- Workshop Clears, Rooftop Clears and Space Clears are legacy run environment counters in lifetimeStats, not campaign world completion. They are removed from production presentation, retained in the save and untouched by this task.
- Milestones: exact nonzero world, lifetime shard, longest-run, streak, perfect-level and level-clear highlights, derived on render. No achievement store, invented rewards or fake attained thresholds.

## Files
Modified: src/ui/StatsScreen.tsx.
Created: src/campaign/statsSummary.ts, tests/stats-summary.test.ts, docs/STATS-UI.md.

## Responsive behavior / compatibility
One vertical scroller, safe-area padding and max content width 980. Two columns when usable width adjusted for font scale reaches 660; otherwise stacked. Ten nodes wrap into two rows on phones. Performance occupies full width when no run card is shown. Numeric values use locale formatting. Missing/nonfinite optional counters safely default to zero. Existing saves and persisted field names are unchanged.

## Verification
Typecheck and 140 tests in 35 files passed. Added fresh, campaign-only, campaign-completed, substantial arcade/earnings and migrated-prototype cases, including no-mutation assertions. Browser review at 320×568, 430×932 and normal wide viewport; verified scroll, card readability, milestone display and back navigation. Current browser save was not modified. No standalone lint script exists. No Expo builds, exports or submissions.

## Placeholders / known limits
World nodes intentionally use numbers/state labels rather than thumbnails. Shard and quote art use lightweight native shapes/gradients; no missing artwork is required. Physical iPhone safe areas and large accessibility text still need device review. Historical run data cannot be separated into old/current modes without new tracking; this UI labels that limitation rather than inventing totals.
