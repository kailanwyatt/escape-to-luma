# Campaign shot-reuse audit

Player feedback: reached Level 91, usually cleared each level within three misses, and could reuse the same drag across successive levels.

## Method

`scripts/audit-shot-reuse.ts` samples all 150 current campaign definitions using the actual AimSystem and existing shot predictor. It tests 32 fixed normalized drags at eight deterministic encounter-start samples (38,400 predictions). A robust reusable shot means it is predicted to clear every obstacle and reach the target in at least six of those eight samples. Results are written to `/tmp/spark-shot-reuse.json`.

This is a diagnostic simulation, not a manual playthrough, a device test, a statistical estimate of human win rates, or exhaustive solvability verification. It does not sample every possible release time. The existing predictor's accuracy limits apply.

## Baseline

| World | Most levels accepting one fixed drag robustly |
|---|---:|
| Containment | 10 / 15 |
| City | 7 / 15 |
| Sky | 11 / 15 (Levels 31–41 consecutively) |
| Upper Atmosphere | 5 / 15 |
| Orbit | 14 / 15 |
| Moon | 9 / 15 |
| Asteroid Belt | 6 / 15 |
| Nebula | 1 / 15 |
| Ancient Network | 6 / 15 |
| Homeward | 6 / 15 |

Across the campaign, one fixed drag was predicted to succeed in 37 levels at six or more samples, including 29 at all eight samples. This is enough to warrant redesign. It does not mean all remaining levels are difficult: another fixed drag may work there, and the sample is limited.

## Structural causes

- `LevelComposition.ts` repeats the same 15 target positions across worlds. Most horizontal offsets are only 0–0.6 units while many target radii are 0.78–0.92 or larger.
- Obstacles are deliberately centered along the target's route, preserving a forgiving common corridor.
- Many worlds reuse a family with modest parameter changes rather than requiring a different decision.
- Existing reachability checks establish that some route exists, not that players must adapt. The normal-course reachability search also explores velocity components independently rather than exclusively testing reachable drag gestures.
- Encounter phase randomization exists already, but broad safe corridors allow repeat gestures despite changed timing.

## Recommended rebalance

1. Establish explicit level roles: introduce, aim change, power change, timing, combination, mastery. Author different routes rather than repeat one world-local pattern.
2. Separate landing regions enough that the previous shot fails on precision levels. Vary height and distance as well as lateral position, within real drag reachability and camera limits.
3. Use tighter portals selectively; retain larger destinations when timing or a two-obstacle route already supplies the challenge.
4. Author meaningful blocker intersections and timing windows. More hazards or higher speed alone do not ensure a better challenge.
5. Vary reflector angles and approach routes so one learned ricochet gesture does not solve subsequent courses.
6. Preserve deterministic, learnable retries. Randomize starting phases while retaining authored timing relationships; do not secretly move the destination after a player aims.
7. Extend validation with actual drag-input searches over multiple release times/phases, successful-shot overlap between adjacent levels, and visual alignment checks.
8. Validate first on the especially repetitive Sky/Orbit blocks, then expand the same quality bar to every world. Preserve the tutorial and final safe arrival.
9. Use human playtest attempts and time-to-clear to tune the resulting curve. No arbitrary required failure count or day-long grind.

No campaign balance values or saved progress were changed during this assessment.
