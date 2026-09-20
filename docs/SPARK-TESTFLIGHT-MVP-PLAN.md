# Spark — Escape to Luma: Codex implementation plan

Date: 2026-09-20  
Repository: `/Users/kurt/Documents/mobile-apps/ball-game-cs`  
Status: audit complete; implementation backlog, not a release certification.

## 1. Recommendation

Ship a focused, offline-first TestFlight beta containing **World 1 and World 2, 30 levels**, with reliable progression, clear touch controls, a short opening, two distinct environments, earnable cosmetics, and a deliberate beta ending. Preserve the full 150-level catalog in source, but gate unvalidated worlds out of the tester build. Do not reset existing saves or mark the full campaign complete at level 30.

The first question for testers should be: **Is aiming, timing, and improving a shot enjoyable enough to play again?** Monetization and 150 levels make that question harder to answer while the opening experience is unfinished.

Recommended beta defaults:

- Free retries; no energy waiting, simulated ads, real ads, purchases, or tracking prompts. Preserve economy code behind explicit build configuration for a later economy test. Do not grant fake permanent entitlements to accomplish this.
- Shards and a small selection of attainable cosmetic Sparks; no purchased boosts before the tutorial. Introduce an optional free assist only after repeated failures.
- A short, skippable introduction using the existing scene, with control available in roughly 10 seconds. The longer storyboard remains a later target.
- A truthful “30 levels in this beta” message, chapter completion, replay, feedback, and Home. Hide or clearly label future worlds. Keep “150” only when explicitly described as the planned full journey.
- iPhone portrait first. Retain iPad support only if it passes the same QA matrix; current configuration enables it.
- Keep Expo/React Native, Three.js, Expo GL, current touch mechanics, current save IDs, and existing screen state. No engine migration, new navigation framework, account system, backend for progression, or broad rewrite.

These are proposed product decisions for the implementation, not changes made during this audit.

## 2. What I actually checked

### Interactive walkthrough

Used the exported web app at a 390 × 844 viewport. Entered Home → Continue → Level Ready → Play; observed the opening card and tutorial; took a shot, reached failure, retried, earned GREAT and 7 shards on level 1, and advanced to level 2. Failure reduced energy from 15 to 14. Reloading preserved the opening-seen state. The preceding home-screen task also exercised Journey, Sparks, Shop, Stats, and Settings and layouts at 320, 390, and 768 pixels.

One viewport resize left the 3D scene incorrectly framed until reload. Record this as a reproducible web resize symptom to investigate, not proof that native iPhones have the same issue.

This was not a complete 150-level playthrough, a native-device performance test, or a TestFlight installation. Browser automation does not establish real touch feel, haptics, battery use, or native GL compatibility.

### Code and checks

Reviewed app boot/navigation, campaign lifecycle, level catalog/builders, rewards and energy, save migration/storage, aiming/integration/prediction/collision paths, obstacle timing, scene/renderer lifecycle, UI flows, audio, purchases/ads/analytics, release configuration, and storyboard/implementation documentation.

- Current `npm run typecheck`: passes.
- Previous turn: web export and iOS/Android JavaScript bundle exports pass. These are not signed native app builds.
- Isolated checks against actual TypeScript functions, with storage mocked in memory: 150 unique level IDs and numbers; ten finales at 15-level intervals; repeat-finale reward bug reproduced; invalid save values accepted by migration.
- No automated test or lint scripts, `eas.json`, or checked-in CI configuration found. `app.json` has no iOS bundle identifier or EAS project identifier. Account-side configuration was not inspected.
- Existing uncommitted source changes are substantial. Preserve them; establish an agreed baseline before implementation commits.

## 3. Architecture to preserve

| Area | Files | Direction |
| --- | --- | --- |
| App lifecycle and screen routing | `App.tsx` | Keep existing screen state; add loading, pause, and completion routes deliberately. |
| Game orchestration | `src/game/Game.ts`, `GameState.ts`, `RunManager.ts` | Keep throw loop; isolate campaign transitions as fixes demand. |
| Campaign | `src/campaign/CampaignPlay.ts`, `levels/*`, `worlds.ts` | One progression policy and one beta availability policy. |
| Physics | `src/projectile/*`, `src/obstacles/*`, `src/target/*` | Shared simulation/timing conventions; preserve established feel. |
| Persistence/economy | `src/persistence/GameSave.ts`, `src/economy/*` | Validated, durable, ordered writes and idempotent rewards. |
| Presentation | `src/ui/*`, `src/design/*`, `src/environment/EnvironmentManager.ts` | Extend home design to the playable experience using primitives. |
| Services | `src/services/{ads,purchases,analytics}/*` | Explicit beta behavior; never present simulated commerce as real. |
| Release | `app.json`, `package.json`, new `eas.json` | Reproducible store-signed build and documented test process. |

## 4. Findings that determine the work order

### Confirmed correctness issues

1. **World rewards can be farmed by replay.** `CampaignPlay.applyLevelSuccess` awards the world bonus and increments worlds-completed whenever `isWorldFinale` is true, without a first-completion guard. Isolated reproduction: first CLEAR at level 15 earns 55; repeating it earns 50 again and increases worlds-completed to 2. Fix before balancing cosmetics.
2. **The final Continue has no terminal transition.** `Game.continueAfterLevel` attempts level 151 after level 150. `startCampaignLevel` silently returns for a missing definition, while the HUD still shows the normal world-complete Continue. Add explicit campaign and beta terminal flows.
3. **Slow Field does not slow every obstacle.** Game scales obstacle `dt` but passes unscaled `simTime`; gates, rings, lasers, and phase fields use absolute elapsed time. Give obstacles a consistent scaled clock and use it in prediction/collision too.
4. **Continue Home favors the old level.** Success leaves `lastPlayedLevel` on the completed level; `App.continueLevelNumber` prefers it over the next unlocked level. Starting the next level does not persist a new resume position. Define whether resume means interrupted attempt or next uncleared level, and apply it consistently.
5. **Campaign tutorials use endless state.** `onboardingCopy` and onboarding completion inspect `director.challengeNumber`; authored `tutorialHint` values are not connected to the HUD. Campaign advancement therefore does not reliably advance tutorial teaching.
6. **Save normalization is incomplete.** Isolated migration checks preserved energy −10, shards −100, and highest level 999; a string `ownedSparkIds` became an array of characters. Storage write errors are swallowed. Validate nested data and retain a recoverable last-known-good save.

### Confirmed product/release gaps

- Purchases complete after a timeout in `PurchaseService`; ads use `SimulatedAdController`; unlimited-energy buttons directly grant time. These are mocks, not store integrations. Shop and energy screens expose “MOCK” copy; commercial flags default on.
- There is no pause or Home control during active campaign play. Home appears on result overlays. A player should not need to lose a shot to leave.
- Level Ready introduces three unexplained boosts before the first throw; tapping unowned boosts silently does nothing.
- Level 1 is a moving two-blade rotor, despite the storyboard describing a stationary breach and a later first rotor. The game currently teaches timing before basic aim is established.
- The opening is a 2.8-second card, not the planned story sequence. The gameplay environment is a brown workshop rather than the home screen's containment visual language.
- The analytics provider only prints when development logging is enabled. There is no configured remote provider; existing event calls alone will not produce a tester funnel dashboard.
- The app icon is the Expo starter icon. Settings and other secondary screens retain prototype presentation.

### Risks requiring focused verification

- Save hydration is asynchronous, while the game/UI can start before it completes. Test rapid cold-start input and guard against defaults overwriting loaded progress.
- Level-entry validation lives partly in UI; retry/next call directly into Game. Centralize availability/energy guards, including beta boundaries. Inspect reward-ad completion and energy-expiry recovery on both Home and in-game overlays.
- Physics uses variable frame delta; prediction uses a different numerical step size. Verify outcomes at 30/60/120 Hz, dropped frames, and moving-obstacle crossings before changing tuning.
- GL remains mounted/rendering behind opaque menus. `Game.dispose` disposes the renderer but not an explicit scene resource graph; obstacle replacement removes old groups without disposing resources. Profile first, then fix lifecycle and ownership.
- Audio initialization is invoked from App and Game; test concurrent init, interruptions, mute, and disposal.
- Only three environment skins serve ten worlds. Later level builders vary parameters, but that is not evidence of full campaign balance or visual differentiation.

## 5. Ordered implementation batches

Each batch should be a reviewable change with its own verification notes. Run typecheck and relevant regression tests after every code batch; run web/native exports after rendering or platform changes. Update this checklist with results, rather than treating successful compilation as gameplay validation.

### M0 — Baseline, beta policy, and first native build

Files: `app.json`, `package.json`, new `eas.json`, new `src/config/release.ts`, campaign availability helpers, short release runbook.

- [ ] Preserve existing work and record the baseline revision/diff.
- [ ] Define `betaMaxLevel = 30`, no-commerce/free-retry policy, and dev-tool gates. Separate planned campaign size from beta availability.
- [ ] Apply availability in Journey, Continue, Game entry, rewards/unlocks, and completion; retain saves above level 30 without downgrading them.
- [ ] Configure a development build and a **store-distribution** TestFlight profile, version/build numbering, real bundle ID, and EAS project linkage.
- [ ] Run Expo dependency/configuration diagnostics. Build/install on a physical iPhone early to discover Expo GL/Three compatibility issues before visual polish.

Acceptance: repeatable native build; fresh install reaches the menu and renders a playable scene; beta policy cannot be bypassed through Next/retry; existing saves survive. Apple/Expo identities come from the owner, never invented.

### M1 — Progression and save integrity

Files: `CampaignPlay.ts`, `GameSave.ts`, `Game.ts`, `App.tsx`, `HUD.tsx`, new focused tests.

- [ ] Grant world rewards once; keep rank-improvement rewards independent and clamp world statistics to real completion.
- [ ] Add explicit beta-complete and campaign-complete states. No attempt to load level 31 in this beta or level 151 in the full game.
- [ ] Fix resume policy and record the selected/interrupted level at a defined checkpoint.
- [ ] Centralize level-start guards and prevent double taps from producing duplicate starts, consumption, or rewards.
- [ ] Gate play on hydration; validate nested save shapes, finite numeric ranges, IDs, ranks, arrays, and version compatibility.
- [ ] Serialize save writes, report failures, retain a backup, and avoid overwriting an unreadable/future-version save with defaults without a recovery path.
- [ ] Cover energy recovery and replay-at-zero behavior even when the first beta has free retries.

Acceptance: unit tests for first/repeat finale, rank upgrades, locked levels, 30/150 boundaries, save migration, malformed/future saves, repeated actions, and failed storage. Cold launch, force quit after success, and upgrade preserve resources and progression.

### M2 — First-session gameplay and control reliability

Files: `world1.ts`, `AimSystem.ts`, `Game.ts`, `GameState.ts`, `HUD.tsx`, `LevelReadyScreen.tsx`, `ProjectileSystem.ts`, `TrajectoryPredictor.ts`, obstacle timing.

- [ ] First launch goes directly into teaching, without a boost shopping decision.
- [ ] Level 1 stationary breach; level 2 aim/power; level 3 forgiving moving opening; level 4 introduces one rotor arm, then gradually adds complexity. Resolve storyboard/code differences in a short canonical level table.
- [ ] Connect tutorial steps to actual campaign events: drag, aim adjustment, cancel, release, timing, success. Teach pull direction visually; avoid persistent generic text on every level.
- [ ] Add pause/resume/restart/Home. Cancel an active aim on interruption; resuming must not launch accidentally or advance hidden simulation.
- [ ] Give all moving hazards a consistent clock; verify Slow Field and assists across obstacle families.
- [ ] Share or align integration rules between prediction and flight; add a fixed-step accumulator if the determinism checks show materially different outcomes. Check hazard state at crossing time.

Acceptance: a new tester can clear the first three levels without spoken help; retries are quick; pause works in ready/aiming/flight/results; identical recorded shots have consistent outcomes at 30/60/120 Hz and under frame spikes. All 30 beta levels can be cleared without paid boosts, developer overrides, or impossible aim angles.

### M3 — Complete the 30-level player experience

Files: `src/ui/*`, design components/tokens, `EnvironmentManager.ts`, `Projectile.ts`, target/obstacle visuals, audio hooks, branding config.

- [ ] Build a short containment intro from current geometry and hand control directly to gameplay. Offer skip/replay and respect reduced motion.
- [ ] Give World 1 a readable cyan/amber containment palette; distinguish World 2 with an inexpensive rooftop/sky treatment. Prioritize depth, aperture edges, and Spark visibility over effects.
- [ ] Bring Level Ready, results, Journey, Sparks, Stats, and Settings into the home screen's visual system. Use 44-point touch targets, labels/roles, safe areas, scrolling, and text-size checks.
- [ ] Explain failure in player language (“Hit the rotating arm” rather than “ROTOR A”). Make success, first unlock, world completion, and beta completion distinct.
- [ ] Hide ad/IAP/restore/mock controls under beta policy, including their handlers. Shop can become a clearly labeled shard-only cosmetic catalog or be omitted from the beta navigation.
- [ ] Make the first cosmetic attainable in the beta; show a preview and a meaningful earned unlock. Keep gameplay physics identical across skins.
- [ ] Replace starter icon/splash; keep tentative display branding isolated from bundle IDs and save keys. Add build/version and feedback access in Settings.

Acceptance: a player can start, fail, recover, finish both worlds, earn/equip a cosmetic, replay, and leave feedback without a dead end or developer-facing copy. Screenshot review on small/notched phones and iPad if supported. No large cinematic video or screenshot-as-gameplay background.

### M4 — Evidence from testers and technical hardening

Files: analytics service/events, new feedback/error boundary integration, renderer/scene/audio lifecycle, tests and CI.

- [ ] Define a minimal funnel: first launch, tutorial steps, level start/attempt/result, retry, abandon, world/beta completion, assist, cosmetic unlock. Include build, level, attempt identifier, elapsed time, and failure category; avoid per-frame events and personal data.
- [ ] Choose a small telemetry/crash solution only after verifying current compatibility and data handling. If no remote service is approved, provide a bounded local diagnostic export and structured tester form; do not claim remote analytics is operating.
- [ ] Add a useful recoverable launch/render error screen and a feedback route with build/level context.
- [ ] Stop or throttle hidden rendering; make cleanup explicit for scene geometry/materials, obstacle swaps, subscriptions, audio, and GL recreation.
- [ ] Add CI for typecheck, focused logic tests, catalog validation, and web export; schedule native build verification for release candidates.
- [ ] Run a 20-minute device soak and repeated menu/level transitions, including low-power mode, interruptions, offline use, and background/foreground.

Acceptance: no known blocker crash, save loss, impossible beta level, or progression dead end. Target smooth 60 fps on the chosen baseline iPhone, with a documented 30 fps fallback if required; no sustained memory growth after repeated transitions. Record actual devices, OS/build, frame measurements, and thermal observations rather than claiming these targets are already met.

### M5 — TestFlight release candidate and cohort rollout

Files: release configuration, release runbook, beta test instructions and QA results.

- [ ] Confirm Apple Developer membership, App Store Connect access/app record, signing, bundle ID, and Expo project ownership.
- [ ] Produce a signed store-distribution iOS archive. Install the exact processed TestFlight build and run the release checklist.
- [ ] Complete beta description, feedback email/contact, What to Test, review notes, and any required compliance/privacy declarations based on the shipped dependencies and actual data use.
- [ ] Use an internal team cohort first; fix critical issues; submit for external beta review; then invite a small external cohort.
- [ ] Record exact build IDs and changelog; keep a known-good build available. Do not use an EAS ad-hoc/internal-distribution build as the TestFlight artifact.

TestFlight requires a store-distribution build and Apple account setup; a JavaScript export is insufficient. See [Expo's TestFlight guide](https://docs.expo.dev/submit/testflight/). External testing requires the applicable Beta App Review process and test information; follow [Apple's external tester workflow](https://developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers).

## 6. Required regression and device matrix

| Scenario | Passing result |
| --- | --- |
| Fresh install, rapid Continue taps, interrupted hydration | No default-save overwrite, duplicate game instance, or blank dead end. |
| Fail/retry, assist, pause while dragging, background during flight | Exactly one outcome; no phantom launch; stable resume. |
| Clear/replay/improve rank/world finale | Correct one-time rewards, unlocks, attempts, and statistics. |
| Level 30 / full-game level 150 | Explicit completion action; no missing-level Continue. |
| Force quit and relaunch after a reward/equip | Save and selection persist; no duplicated rewards. |
| Old/corrupt/future save, failed write | Safe recovery without silent destructive reset. |
| Energy zero/recovery/expiry under economy-test policy | UI and engine agree; replay remains possible; no stuck overlay. |
| Airplane mode and unavailable service | Full beta campaign works; errors do not block play. |
| Small iPhone, notched iPhone, 120 Hz phone, supported iPad | Readable aim/target, reachable controls, correct safe areas and GL viewport. |
| Sound off, system/app reduced motion, interruption | Preferences honored across menus and gameplay. |
| Repeated obstacle swaps and 20-minute session | Stable resources; no worsening frame time or overheating trend. |
| Upgrade from prior beta | Progress survives and availability expands without granting duplicate completion rewards. |

## 7. First user test and decision gates

Suggested rollout: 3–5 internal testers, then 10–20 external testers. Ask external testers to play naturally before reading detailed instructions. Observe the first session where possible.

Proposed success targets, not current measurements:

- At least 80% of observed new testers clear level 3 without verbal instruction.
- First meaningful shot within 60 seconds of opening the app.
- No known save loss, recurring crash, unescapable screen, or impossible level.
- Record attempts and abandonment by level; investigate sudden spikes rather than choosing arbitrary difficulty increases.
- Ask whether misses felt understandable, which level was frustrating, whether they wanted another attempt, and whether they voluntarily returned for a second session.
- Collect build/device/level with each issue. A small cohort provides qualitative direction, not statistically reliable retention estimates.

If aiming is confusing, work on M2; if success feels weak, work on feedback/readability; if level variety falls flat, revise Worlds 1–2. Do not respond to those problems by expanding the catalog or adding monetization.

## 8. After the MVP

1. Validate and release Worlds 3–4, then 5–7, then 8–10 in separate content updates. Each needs a distinct visual identity, tutorial for its mechanic, solvability/timing checks, and native playtest evidence.
2. Complete Luma arrival and an intentional transition to Endless Voyage. Clean out prototype naming and decide how endless cosmetics/progression relate to campaign cosmetics.
3. Test energy and assistance as a separate, clearly identified economy beta. Use real outcomes to tune limits, prices, and frustration recovery.
4. Only then implement actual StoreKit purchases/restore and an ad SDK if the business model calls for them. Validate cancellation, offline failures, duplicate callbacks, entitlements, and disclosures in the appropriate sandbox.
5. Add a longer story sequence, more trails, localized copy, and richer effects only when the core experience and device budget support them.

## 9. Immediate next implementation task

Start with **M0 and M1**, beginning with regression tests for finale replay and terminal transitions, then fixing those paths and save hydration/validation. In parallel with the calendar—not by introducing new architecture—resolve signing/account prerequisites and get an early native build installed. Continue to M2 before spending time on elaborate art.

Owner inputs needed before distribution: Apple/Expo account ownership and access, final bundle identifier, feedback contact, available physical test devices, and agreement on the proposed 30-level/no-commerce beta scope. These do not block writing and reviewing the code changes.
