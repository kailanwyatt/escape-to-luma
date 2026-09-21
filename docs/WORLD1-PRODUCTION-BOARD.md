# Spark — World 1 production board

Status: implementation in progress. The opening and reusable dressing are a first procedural pass, **not an art-approved or device-profiled release**. No builds, exports, publishing, account setup or submission are part of this milestone.

## Production authority

This board governs the opening and Containment milestone. `ASSET-MANIFEST.md` supplies per-family technical specifications. `story-board-new.md` is long-form story reference; where it conflicts, the approved story spine below governs. `GRAPHICS-NEEDS.md` is now an index, not a competing demand for sprites or custom models. Runtime truth remains the registry and actual scene code; a bundled image is not evidence of finished 3D art.

Canonical story: a deep-space probe captures Spark and brings it to Earth. Researchers imprison it beneath a city as an energy source. A familiar signal prompts escape. The signal's destination remains unnamed in-world until The Key. Nebula is False Home, a relay. Luma reflects Spark's own geometry and music. Reunion precedes Endless Voyage; no recapture.

## Implemented in this pass

- One six-beat, 35-second timeline using the existing game loop; fresh saves enter it directly.
- Live procedural Spark, sparse stars, modular probe/scanner/chamber and open-front vessel.
- Transparent captions, first-view skip, Settings replay, shared completion path and gameplay-camera handoff.
- Existing pause/background loop suspension freezes sequence time.
- Elapsed-time Spark orbit motion; no change to trajectory, scoring or obstacle movement.
- Five composition profiles applied to all fifteen Containment levels; shared modular geometry and materials for consoles, pipes, supports, security pylons and exit skyline.
- Full-room breach image removed from the 3D backdrop. Existing containment-glass obstacle retains collision ownership.
- Illustration downloads moved out of eager boot preload; existing gallery components retained but not routed as the opening.

## Opening shot list

| Time | Beat / framing | Actor and light action | Sound brief | Acceptance / remaining work |
|---|---|---|---|---|
| 0–5s | Living light; Spark centered against sparse stars | Restrained core pulse and filaments | Bare three-note home motif, distant breath | Implemented staging; tune halo and add motif |
| 5–12s | Discovery; probe approaches from beyond Spark | Modular panels, antenna, scanner, chamber | Scan sweep then damped capture tone | Probe and closing shutters present; needs capture choreography review |
| 12–19s | Specimen S-01; Earth laboratory | Same Spark within modular vessel; cyan light | Lab hum, contactor click | Scene change currently a cut; add transit/lighting bridge and monitor display |
| 19–25s | The Signal; hold on Spark | Answering pulse travels outward | Motif returns with missing final note | Expanding signal ring and core response implemented; subtle key-light response implemented; phone review pending |
| 25–31s | Containment failure | Reveal real obstacle; amber to red; field destabilizes | Alarm, electrical tear, glass ticks | Field fades from cyan to amber and disappears; exact rectangular glass edge and outward crack details implemented; bounded outward fracture animation implemented |
| 31–35s | Camera handoff | Ease to exact gameplay pose; reduced motion uses static pose | Alarm softens; gameplay ambience continues | Implemented; inspect on physical phones |
| Player-controlled | First shot through breach | Physics starts only after READY; no automatic throw | Existing launch/hit effects | Same reset path for watch and skip; manually compare trajectory |
| After level 1 | Laboratory progression | Existing level success/continue flow | Resolve first escape phrase | Continuous forward travel between authored levels still needs polish |

No caption during the signal names Luma. Branding may do so. No flickering strobe is required for an alarm.

## Benchmark scene layout

Use game units from `gameTuning.ts`, not a second scale system. Spark radius 0.22; launch at (0, 0.6, 0). Gameplay camera (0, 3.2, -8.5), looking at (0, 2.5, 6), FOV 45. World 1 near hazard at z=5.75, far hazard at z=8.25, target at z=12. The nearest safe opening is the visual priority, then Spark, then the Jump Gate. Keep decoration outside x ±3.1; avoid placing decorative cylinders behind targets where they read as extra scoring rings.

Front vessel rings and supports frame the launch point and persist through the first shot. Existing gate geometry defines the actual breach at the near plane. Do not paint an apparent traversable hole into a room image. Fracture details must sit outside the true safe opening. Camera zoom and visual Spark deformation must never alter collision radius or launch position.

Use the same steel, cyan, amber and warning-red family in Home, gameplay and results. In small-phone screenshots the HUD must not cover Spark or the breach. The first-shot tutorial is now compact, and a pause control remains available. Phone preview confirms Spark is visible above it.

## Fifteen-level composition board

| Levels | Composition | Teaching / staging | Finish criteria |
|---|---|---|---|
| 1 | Vessel interior | Existing stationary glass breach; open-front supports, lab consoles beyond | Glass bounds match safe opening; Spark visible above tutorial |
| 2–3 | Research laboratory | Power, then moving gate; consoles and equipment silhouettes | Readable motion track; laboratory feels connected to vessel |
| 4–7 | Service corridor | Single arm, timing, two arms, reverse; long pipe runs and narrow side ribs | Direction cue obvious; machinery never hides arm tips |
| 8–11 | Security checkpoint | Horizontal, vertical, pulse, crossing lasers; structural pylons | Warning/off/on states distinguishable without relying only on color |
| 12–14 | Lockdown chamber | Near/far combinations; denser security framing | Both hazard planes remain visible and depth is unambiguous |
| 15 | Escape chamber | Rotor + gate finale; amber exit with distant city shapes | Add completed-world transition, Reactor reveal, audible release |

Current profiles select these kits without changing the authored challenge catalog. They are composition foundations; no claim of fifteen manually playtested levels is made.

## Modular laboratory kit

| ID / purpose | Runtime method and reuse | Parts / dimensions | Collision and ownership | Status |
|---|---|---|---|---|
| LAB-01 structure | Shared boxes/planes; floor, walls, beams, door frames | Existing 11-unit room width, 7.4-unit beams | Decorative; scene disposal | Existing, needs visual review |
| LAB-02 console | Unit cube shared geometry, steel body and emissive monitor detail | Body 1.1 × 1.6 × .9; separate monitor | Outside play lane; scene disposal | Implemented first pass |
| LAB-03 service | Pipe runs and upright ribs | Pipes .12 thick; ribs .8 × 5.2 × .25 | Outside lane; scene disposal | Implemented first pass |
| LAB-04 security | Shared posts with separate lamps | .55 × 5.6 × .6, lamp .06 × .65 × .4 | Decorative; existing obstacles own collisions | Implemented first pass |
| LAB-05 vessel | Torus base/cap and two supports, cyan emitters | Radius 2.4, support height 6 | Open front; actual glass uses existing gate | Implemented first pass; glass/field polish pending |
| LAB-06 probe | Modular body, panels, antenna, scanner, chamber rings | Body .8 × .65 × 1.2; detachable child parts | Opening only; no collision; scene disposal | Implemented first pass; capture animation pending |
| LAB-07 destination | Existing layered target rings and aperture | Uses target radius and scoring zones | Target config authoritative | Segmented structural housing implemented; device review pending |
| LAB-08 exit | Repeated skyline silhouette blocks and window strips | Procedural deterministic heights | Beyond play lane | Implemented first pass; exit vista review pending |

All new geometry is authored locally in code; no external model license. Shared resources are owned by the Three scene and disposed with it. Do not separately dispose shared materials when changing composition. Existing all-scene allocation should be profiled before introducing larger world kits; deferred world loading is not implemented yet.

## Spark animation sheet

| State / trigger | Visual brief | Physics rule | Status |
|---|---|---|---|
| Idle / READY | Small core pulse, slow orbital drift | Never move physics position | Existing; orbit now elapsed-time based |
| Signal / beat 4 | Core brightens, rings briefly align, answering halo | Visual children only | Core and signal-ring response implemented |
| Aim / AIMING | Energy condenses in direction of aim; readable cancel dim | No scaling collision | Charge brightness and existing cancel dim implemented |
| Launch / PROJECTILE_ACTIVE | Brief axial stretch and pooled trail | Velocity remains physics-owned | Existing trail and visual-only shell stretch |
| Near miss | Short filament recoil away from hazard | No trajectory nudge | Pending |
| Collision/reform | Energy fragments contract into restored core | Existing retry reset authoritative | Existing effects; art pass pending |
| Success | Ring expansion and warm core flourish | Rewards only from game state | Existing effects; art pass pending |
| Reunion | Matching pulses from distant Sparks | Campaign completion once after arrival | Later-world work |

Reduced motion: static cinematic framing, subdued pulse, no orbit spin. Avoid accumulating time-based rotations or unbounded particle allocations. Use one visual-state adapter driven by gameplay events before adding reaction variants.

## First texture and effect briefs

These are production specifications, not claims that new images have been created. Generate and inspect one representative family in the scene before variants. Store source, license, generator/tool and date alongside each delivered file. Images must contain no interface text.

| ID | Delivery specification | Material use / validation | Priority |
|---|---|---|---|
| TEX-01 industrial | 1024² PNG atlas, orthographic, neutral flat light; steel panels, paint, grate, rubber; 8px gutters | Color sRGB; no baked perspective/highlights; verify seam-free tiling in repeatable cells | First surface test |
| TEX-02 equipment | 1024² atlas: vents, seams, access panels, fasteners | Neutral albedo; no fake geometry silhouettes; reserve UV cells and padding | After TEX-01 |
| TEX-03 decals | 1024² RGBA: hazard stripes, arrows, symbols, empty number frames | Transparent background; no black matte fringes; restrained contrast, not on safe edges | World 1 |
| TEX-04 glass | 1024² RGBA detail sheet, fine scratches and separate fracture branches | No room, hole, perspective or baked scene light; test against light/dark backgrounds | Benchmark |
| FX-01 glow | 256² radial grayscale mask, smooth center falloff to transparent edge | Linear mask; additive material; no visible square or banding | Benchmark |
| FX-02 filament | 512² seamless grayscale noise, fine organic strands, no focal image | Linear data; repeat both axes; bounded animated UV offset | Spark polish |
| FX-03 arc | 512² RGBA 4×4 sheet, 16 ordered electrical arc frames, padded cells | 128px cells; transparent background; frame stepping based on seconds | Signal/failure |
| FX-04 impact | 512² RGBA 4×4 sheet, sparks/fragments dissipating to zero | Pooled quads; verify last frame completely clear; cap active count | Collision |
| FX-05 portal | 512² radial/ripple mask, centered aperture, black edge | Linear mask; repeatable ring motion, scoring boundaries remain solid | Jump Gate |
| FX-06 dust | 256² RGBA sheet, 4 mote shapes, soft edges | Pooled low-opacity cards; sparse, behind play plane | Lab atmosphere |
| SKY-01 city | 1024×512 RGBA layers: near roofs, distant towers, sparse windows | Orthographic skyline, no baked camera; reuse separated depth layers | Level 15 exit |
| UI-01 icons | Editable vector sources on consistent 24px grid | Navigation, settings, pause, audio, haptics, energy, shards, boosts, replay, feedback; 44px touch targets | UI polish |

Textures are optional where procedural material/geometry is sufficient. Do not add postprocessing bloom before a device profile establishes a budget.

## Sound board

Retain existing UI/launch/collision audio until replacements are inspected. Needed: home motif (three notes with unresolved cadence), scan/capture, restrained laboratory hum, electrical fault, alarm loop, gate motors, laser warning/on/off, portal activation, Spark charge/reform/success and two Containment music layers (tension and escape). All files require provenance/license and loop-point checks. A first original 35-second synthesized score now follows the game clock, pauses/mutes safely and stops on skip. Sound-design review on speakers/headphones and final mastering remain pending. Later-world ambience families and Luma's resolution follow after the benchmark.

## Acceptance ledger and next work

Automated now: typecheck; timeline boundary/duration/determinism checks; exact camera endpoint; decorative geometry outside play corridor; existing save/physics/laser/campaign checks; 150-level catalog audit. Browser inspection: clean launch, phone Home, Settings replay, opening captions and 3D scene, level-1 handoff. These do not establish native performance or full gameplay completion.

Next in order:
1. Review the implemented compact HUD, exact glass boundary, target-zone layering, core response, field fade, capture shutters and signal pulse. Inspect the implemented fracture fragments, target structural segments and signal/alarm lighting on phones; refine cinematic transitions and materials.
2. Expand the implemented gameplay-driven Spark visual-state adapter with near-miss and reunion reactions; finish remaining gameplay effects and audition/master the implemented opening score.
3. Physically playtest first three levels, including skip at each beat, retry, background/resume, reduced motion and small-screen aiming. Compare watched/skipped starting snapshots (obstacle clock, projectile, inventory, rewards).
4. Playtest and tune all fifteen World 1 levels. Finish level-15 exit transition and Reactor unlock reveal. Record attempts/success/clarity notes per level; automated catalog validation is insufficient.
5. Profile representative real iPhones: stable target frame rate, peak memory, heat after ten minutes, transparent overdraw, load/unload cycles. Record devices and measurements before setting budgets.
6. Expand the approved later-world kits one at a time. Remaining world milestones: Skybreak, storm crossing, escape velocity, orbital graveyard, Far Side, Collision Course, False Home, The Key, reunion.
7. Add ordered challenge stages for level 150 with a safe final launch and once-only completion/reward tests. Finish map reveal, ending statistics and Endless introduction.

Remaining production assets: ten world identities; twelve additional catalog appearances with matching portraits; six final trails; ten world emblems; shared vector UI set; final wordmark/splash; later-world audio. Existing three portraits and five story illustrations are retained, not automatically marked approved. Store artwork stays deferred.

## Verification record — this implementation pass

- `npm run quality`: typecheck, **29 tests**, and 150-level / 10-world / 10-obstacle-family audit passed.
- Local development browser at 390 × 844: Home, Settings replay, watched opening handoff, early skip, visible glass/target/Spark, throwing, Level Clear (+5 shards), persisted Level 2 progress and pause overlay inspected.
- Browser hot refresh after source edits retained a stale result panel; clean reload restored current saved progress. Verification used clean reloads after subsequent code edits.
- Not verified: all fifteen levels end-to-end, native iPhone performance, physical-device background recovery, full sound sequencing, all-world ending.
- No Expo build/export or submission was run. No dependency was added.

## Files changed for this production pass

New runtime: `src/scene/OpeningSequence.ts`, `src/scene/OpeningScene.ts`, `src/environment/WorldPresentation.ts`, `src/environment/ContainmentKit.ts`, `src/projectile/SparkVisualState.ts`.

Integrated runtime: `App.tsx`, `src/game/Game.ts`, `src/environment/EnvironmentManager.ts`, `src/projectile/Projectile.ts`, `src/target/Target.ts`, `src/obstacles/ObstacleVisuals.ts`, `src/obstacles/ObstacleSlot.ts`, `src/graphics/assetRegistry.ts`, `src/ui/CampaignOpening.tsx`, `src/ui/SettingsScreen.tsx`, `src/ui/HUD.tsx`, `src/ui/FirstRunStoryScreen.tsx` (retained reference copy corrected).

Tests: `tests/opening.test.ts`, `tests/presentation.test.ts`.

Production documents: this board, `docs/GRAPHICS-NEEDS.md`, `docs/ASSET-MANIFEST.md`. Other pre-existing uncommitted work was retained; the full repository diff includes that earlier work too.

## Continuation pass — opening sound and effects

Implemented an original 35-second synthesized score with the D–A–E home motif, probe scan/capture, laboratory hum, electrical fault and restrained two-tone alarm. Source: `scripts/generate_opening_audio.py`; provenance: `assets/sfx/OPENING-PROVENANCE.md`; runtime: `assets/sfx/opening-score.wav`. It is a first sound-design pass, not mastered final music. Mono PCM16 at 22,050 Hz, 1.55 MB, measured peak 0.484 and RMS 0.065 full scale, silent endpoints. No external samples or new dependencies.

`TimelineAudio` synchronizes the track to the existing game clock. Late loading joins the current scene, drift is corrected without seeking every frame, pause/mute/skip invalidate pending playback, and resume seeks to frozen scene time. Native playback still needs phone checks; browser autoplay can require interaction. Concurrent audio initialization now shares one pending initialization. Asset registry identifies the lazy opening score and AudioManager ownership.

Added twelve reusable fracture shards positioned from the actual authored glass bounds. They travel outward only during failure, disappear at handoff and are disabled by reduced motion. The star field now uses one point-cloud draw instead of seventy sphere draws. Signal strength gently changes laboratory key light; security lamps gain red as the World 1 profile escalates. Added six structural Jump Gate segments outside the scoring disc. Spark now has a soft procedural halo shader instead of a visibly hard sphere edge, without texture downloads or fullscreen bloom.

Changed in this continuation: `src/feedback/AudioManager.ts`, new `src/feedback/TimelineAudio.ts`, `src/game/Game.ts`, `src/scene/OpeningScene.ts`, `src/environment/EnvironmentManager.ts`, `src/target/Target.ts`, `src/projectile/Projectile.ts`, new `src/projectile/SparkHaloMaterial.ts`, `src/graphics/assetRegistry.ts`, new audio/source/provenance files above, `tests/timeline-audio.test.ts`, `tests/presentation.test.ts`, this board and the asset manifest.

Validation: typecheck, 36 tests and full campaign audit passed. New tests cover late load, pause during seek, mute, resume, drift, rejected seeks, bounded fracture geometry and motion reduction. Local browser replay/handoff and halo shader rendering inspected; no shader/audio errors appeared in captured browser logs. Existing web style/native-driver warnings remain. This does not certify physical-device sound, performance, or all fifteen World 1 levels. No builds, exports or submissions.

## First-three-level benchmark pass

See [Opening benchmark test record](OPENING-BENCHMARK-TEST.md) for the gameplay changes, test matrix, browser outcomes and iPhone checklist. This pass adds eased capture staging synchronized to the score, a covered location transition, cinematic pause, input gating while paused, working campaign Restart, consistent retry clocks and correct initial phone dimensions. Standard gate borders are now visible; level 3 movement is more noticeable without reducing the safe opening. Typecheck, 45 tests and full campaign audit pass. Browser failure/retry, L2/L3 success and progression were exercised. Physical iPhone validation is pending user feedback from the local Expo Go session. No build/export/submission.

Files in this pass: `App.tsx`, `src/scene/OpeningSequence.ts`, `src/scene/OpeningScene.ts`, `src/game/Game.ts`, `src/ui/CampaignOpening.tsx`, `src/ui/HUD.tsx`, `src/obstacles/ObstacleVisuals.ts`, `src/campaign/levels/world1.ts`, `tests/opening.test.ts`, new `tests/opening-levels.test.ts`, new `docs/OPENING-BENCHMARK-TEST.md`, and this board.

Benchmark follow-up: level 1 also cleared after the revised cinematic, with only the rank-improvement shard difference awarded. Added a small browser audio adapter to handle normal play/pause aborts without unhandled promise errors; Expo Audio remains the native implementation. Two dedicated web-audio tests bring the suite to 47 passing tests. Physical-device feedback remains pending.


### Physical breach layout revision — 2026-09-20

The opening now uses a rounded containment chamber whose footprint includes Spark and the gameplay camera. Its low deck, launch cradle, curved glass returns, front supports and upper/lower rims connect to the actual front pane at the authored obstacle depth. Laboratory consoles sit beside the forward route.

`BreachBoundary.ts` owns the asymmetric fracture polygon. The visible pane is triangulated around that hole; exposed edges have thickness. Live collision, aim prediction and campaign corridor validation use the same polygon with projectile-radius clearance, including concave edges. This intentionally replaces Level 1's old rectangular collision opening; other gate families remain rectangular. The launch physics, scoring, progression and navigation are unchanged.

Verified in the phone-sized browser: skip reaches the rebuilt vessel; a central throw clears Level 1 with GREAT. Automated checks cover mesh ray intersections versus the collision opening and prediction versus actual crossings. Native device performance remains unmeasured. The environment still needs final material/lighting art polish; this pass establishes coherent spatial construction. No Expo builds or submissions.


### Spark spherical energy revision — 2026-09-20

The gameplay/cinematic rig now uses a physical-radius sphere with a white-hot centre, cosmetic tint at the edge, subtle time-driven internal currents, and two soft additive halo layers. Orbital geometry and launch deformation are removed. Charge, signal, impact and success modulate light; reduced motion freezes internal movement and pulsing. A faint floor light fades with height and is disabled in space. Home illustration and Original selection preview use the same ring-free direction. Existing cosmetic palettes and trails remain; older illustrated cosmetic portraits need a later consistency review. Checked in a 390×844 gameplay preview; no builds or submissions.

### Continuing story screens — 2026-09-20

A successful first breach now opens “Spark is finally free” with the instruction to help him escape the lab. Continue enters Level 2. If the app closes before acknowledgement, the same unread story is available when Level 2 is entered. Later authored cards introduce the moving gate (3), first rotor/service corridor (4), laser checkpoint (8), combined lockdown (12), and escape chamber (15). Each later world gets arrival story copy; first appearances of other obstacle families use their relevant instruction. World revelation copy preserves the Nebula relay and The Key before naming Luma in-world.

Story copy and selection live in `src/campaign/StoryMoments.ts`; presentation lives in `src/ui/StoryScreen.tsx`. The existing game state machine owns `CAMPAIGN_STORY`, freezes simulation and rejects throwing while it is active. The existing Continue and Home actions remain in use. Acknowledged IDs persist in the campaign save, with an empty default for older saves. New story cards use lightweight native graphics; illustrated scene-specific artwork remains future polish.

Verified: typecheck, 56 tests, 150-level campaign audit; browser Level 1 success displays the congratulations card and Enter the Lab hands off directly to Level 2. No Expo builds, publishing or submissions.

### Jump Gate destination — 2026-09-20

Replaced visible target scoring discs with a unit-radius dark portal aperture, stationary mechanical housing, rear mounting rails, six cyan frame segments, three counter-rotating energy arc layers, a soft rim halo and 32 recycled fading motes. `JumpGateVisualConfig` separates appearance from the target mechanic; only the Containment design is authored so far. No reference image is imported into gameplay.

Target positions, movement sampling and scoring radii are unchanged. Precision rings are available only through the existing development debug toggle, together with the target plane and actual crossing marker. Entry uses the existing result and audio/haptic hooks; the rendered Spark shrinks, brightens and disappears over 450 ms, with a 500 ms success presentation before progression. Physics vectors are not animated. The first breach retains its glass presentation and original success timing.

Validation: typecheck, 59 tests, 150-level audit. New checks cover aperture dimensions, unchanged scores during feedback, static housing, bounded/reused particles, reduced motion, stronger PERFECT response and visual-only entry/reset. Browser preview inspected behind the Level 4 rotor and through the Level 2 gate. No camera changes, builds, submissions, large assets or post-processing. Native device performance still requires measurement. Further variants await visual review of this implementation.

### Variable encounter starts and portal difficulty trial — 2026-09-20

Campaign attempt setup now chooses a shared randomized obstacle-clock offset and applies the initial pose before gameplay can accept input. Rotors receive an equivalent initial angular offset because their rotation integrates dt; other families sample the shared clock. Retries choose a fresh start, while pause/resume and story dismissal preserve the current pose. Static breach/aim tutorials remain fixed. Authored campaign configs are not mutated, and seeded Endless behavior is retained.

Portal-size experiment: Level 9 radius 1.28 → 1.04; Level 11 radius 1.18 → 1.00. Both are non-rotor laser levels. Camera, throwing physics and scoring fractions are unchanged. Moving-target prediction now takes the target's simulation time separately from the randomized/slowed obstacle clock.

Typecheck, 65 tests and the 150-level audit pass. Regression checks cover varied initial poses, authored-data immutability, live/predicted laser phase agreement, separate target clocks and reachable shots through the smaller portals at four sampled phases each. Broader user difficulty testing remains necessary; random starts remove a repeatable startup pattern rather than preventing every immediate success. No builds or submissions.

### Rooftop equipment pass — 2026-09-20

Replaced the basic rooftop block scene with `RooftopScene.ts`: four AC units with top fans, grilles, plinths and conduit; flanged ducts and weather vents; parapet caps and drains; a stairwell access house with door hardware and canopy; mast and shallow communications dish; and windowed skyline buildings with roof crowns. Repeated rectangular components are instanced by material; geometry/materials are shared. Roof surfaces and gate panels use lightweight procedural textures.

The central flight lane and gameplay camera remain unchanged. The existing shared rooftop environment also serves Sky until a distinct Sky environment is produced. Visual review used an isolated local environment preview with the game's camera, without gameplay obstacles; full native play/performance review remains pending. Typecheck, 67 tests and the campaign audit pass. No Expo builds, publishing or submissions.


### Security rotor art pass — 20 September 2026

Rotors now represent ring-driven security sweep barriers, with machined annular casing, motor hub, metal arms, amber hazard inserts and cyan tip markers. The casing counter-rotates against the authoritative obstacle transform so it stays stationary while the arms move. All environments share the full collision arm silhouette; rooftop and space no longer use narrower visible blades. No new obstacle mechanics, textures or dependencies. Native device performance remains to be reviewed.


### Airborne gate and obstacle inventory — 20 September 2026

Moving-ring presentation replaced by `AirborneGateVisual.ts`: machined metal ring, stabilizer pods and an amber security field with a true clear aperture. Motion/collision unchanged. See [Obstacle graphics production board](OBSTACLE-ART-BOARD.md) for the eight remaining families, known visual/collision mismatches and the recommended treatment order.
