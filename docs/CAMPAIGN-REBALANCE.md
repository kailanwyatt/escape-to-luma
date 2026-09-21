# Campaign rebalance — first measured pass

Preserves level IDs, saved progress, worlds, rewards, physics, aiming, starting-phase randomization, opening lessons 1–7, City introduction 16 and safe final arrival 150. Other direct courses alternate landing regions and heights across worlds, with progressively larger offsets. Single-obstacle approach depths vary. Gates, rings and irises are more selective; pendulums, orbiters and debris occupy more of the route. Paired courses keep some portal forgiveness. Existing moving targets in these revised direct courses become fixed authored precision destinations; hazards retain motion. No random destination changes on retry.

Ricochet courses now alternate approach direction and drag strength. Smaller and moving panels demand more accuracy. The first single and double lessons keep their original gestures. Authoring witnesses, integration tests and the local demo use each course's actual input.

## Results using the same 32 gestures and eight starting-phase samples

| World | Largest number accepting one unchanged gesture before | After |
|---|---:|---:|
| Containment | 10 | 7 |
| City | 7 | 4 |
| Sky | 11 | 4 |
| Upper Atmosphere | 5 | 4 |
| Orbit | 14 | 5 |
| Moon | 9 | 5 |
| Asteroid Belt | 6 | 2 |
| Nebula | 1 | 1 |
| Ancient Network | 6 | 2 |
| Homeward | 6 | 3 |

A gesture counts when predicted to succeed at six or more of eight sampled phases. After the tutorial, the longest consecutive run is now two levels. 111 of 133 adjacent target pairs from Level 16 through 149 have disjoint acceptance discs, requiring a changed landing point. This measures landing precision, not total difficulty.

The real-input check found a successful drag for every level at each of three sampled encounter phases (450 checks), allowing release waits from zero to six seconds. It uses the existing predictor and does not prove every randomized phase, phone aspect ratio or human timing is fair. It is not a manual 150-level playthrough. Human playtesting remains necessary, particularly around new worlds, paired hazards and the late campaign.

Run `npm run quality`, `npm run audit:inputs` and `npm run audit:shot-reuse`. The shot-reuse command now fails if sampled repetition exceeds the allowed consecutive-run/world thresholds. Detailed diagnostic outputs go to the temporary directory. No Expo build/export or submission is needed.

Main files: `src/campaign/levels/CampaignBalance.ts`, `src/campaign/levels/index.ts`, `src/campaign/levels/ricochetCourses.json`, `src/challenge/playableCorridor.ts`, `scripts/generate-ricochet-courses.ts`, `scripts/check-campaign-inputs.ts`, `scripts/audit-shot-reuse.ts`, `tests/campaign-balance.test.ts`, `tests/ricochet.test.ts`, local review files and package scripts.

Continue from L91 after reloading Expo Go. Cleared levels remain cleared and can be replayed with revised layouts. No lives, energy or rewards are changed by this revision.
