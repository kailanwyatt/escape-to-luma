# Three-level difficulty playtest — 2026-09-20

Scope: 44, 68, 86 only. L28 unchanged. Save IDs, rewards, physics, input controls and obstacle visuals retained. Applied after general campaign balancing.

- 44: portal moved farther right and higher, radius .88 → .78; moving-ring opening .98 → .78 with more vertical travel; ring/rotor planes spread apart. Wind and rotor speed unchanged.
- 68: portal moved left/lower, radius .88 → .78; pendulums placed at z4.8 and z9.1 with larger .61 blockers, distinct speeds and pivots through the approach. Requires checking both crossings.
- 86: portal moved left/higher, radius .88 → .78; orbiter repositioned so its orbit crosses the approach rather than leaving the central route mostly clear. Blocker .397 → .6, orbit radius 1.329 → .98; rotor farther back. Gravity well and rotation speeds retained.

Input sampling uses actual AimSystem and predictShot, six encounter starts, thirteen launch waits (0–6s), and a normalized drag grid. Each level had 44,538 samples before and after. These are NOT player win rates or proof of every possible start.

| Level | Winning samples before | After | Successful sampled starts |
| --- | ---: | ---: | ---: |
| 44 | 936 | 452 | 6/6 |
| 68 | 1,257 | 194 | 6/6 |
| 86 | 1,152 | 586 | 6/6 |

Run `node --import tsx scripts/check-precision-benchmarks.ts` to repeat current sampling. Optional positional baseline JSON path compares previous definitions. Regression tests verify witness shots at two phone dimensions and all six starts.

Next: iPhone playtest without boosts. Record attempts, whether aim/power needed adjustment, and whether failures were understandable. L68 received the largest increase; watch for frustratingly narrow timing. Do not propagate to other levels until feedback confirms the benchmark.

## Approved campaign rollout

After positive iPhone feedback on the three benchmarks, the user approved extending the approach. `PrecisionProgression.ts` now applies a practice-to-mastery precision ramp after general balancing, while leaving levels 1–7, the first three levels of each world, L28, the approved benchmarks, and L150 untouched. Other World 1/City levels receive target refinement only, retaining their authored lessons and shutter patterns.

Later chapters tighten moving rings/irises, put pendulum weights lower into the ballistic approach, offset orbiter centers, enlarge selected blockers, shorten phase-field openings and narrow shifting apertures. Most speeds remain unchanged; mastery pendulums use differentiated speeds. Ricochet geometry remains authored, with only the target-size ramp applied. Target radius remains at least .78. L64 retains a .84 target and L105 a .9 ring to meet the existing clearance validator.

Validation: full typecheck/tests, all-level course audit, normal-input reachability at three encounter starts per level (450 checks), and sampled repeated-shot audit. Benchmark witness tests continue to cover six starts and two phone sizes. These tests establish sampled reachability and regression protection, not a measured human difficulty curve. Further iPhone feedback is still needed; do not equate obstacle complexity with player difficulty.
