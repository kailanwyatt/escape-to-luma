# Prototype 0.2 — Endless Variety Vertical Slice

## Agent Mission

Extend the working Prototype 0.1 Expo game into Prototype 0.2.

Prototype 0.1 has already validated the core interaction:

**Aim → Time → Throw → Clear Moving Opening → Hit Target**

Do **not** redesign or replace the existing throwing mechanic unless a change is required to support the features in this document.

Prototype 0.2 exists to answer the next question:

> Can the existing throwing mechanic remain interesting for 30–50+ consecutive shots by combining moving targets, moving obstacles, multiple obstacle depths, changing environments, and controlled challenge generation?

The primary loop becomes:

**Aim → Predict Multiple Motions → Throw → Clear Course → Hit Target → Advance Forward → Next Course**

This prototype should begin feeling like an endless arcade game, but it is still not the production game.

---

# 1. Preserve Prototype 0.1

Before implementing new systems:

1. Run the existing project.
2. Verify Prototype 0.1 still works.
3. Identify the existing:

   * projectile system
   * aiming system
   * trajectory predictor
   * rotor collision
   * target collision
   * game state machine
   * ShotConfig
   * tuning configuration
4. Extend those systems rather than replacing them.

Do not change the existing shot feel merely because another architecture seems cleaner.

The tested gameplay behavior has priority over refactoring preferences.

---

# 2. Technology Constraints

Continue using the existing Expo architecture.

Target:

* iOS
* Android
* portrait orientation
* TypeScript
* current Expo SDK
* current working 3D renderer
* Expo Haptics
* existing gesture/input system

Do not:

* downgrade Expo
* switch rendering engines without explicit approval
* introduce a general-purpose physics engine unless absolutely necessary
* introduce Blender/model dependencies
* replace deterministic projectile simulation

Maintain approximately 60 FPS on reasonable modern mobile hardware.

---

# 3. Prototype 0.2 Core Systems

Add:

1. Moving targets
2. Moving rotors
3. Multiple obstacle depth planes
4. Dual-rotor challenges
5. Reusable challenge definitions
6. Controlled challenge generation
7. Difficulty budgeting
8. Workshop environment
9. Rooftop environment
10. Space environment
11. Environment-specific obstacle skins
12. Forward camera transitions
13. Continuous scene progression
14. Looping Workshop → Rooftop → Space
15. Endless run structure
16. Improved scoring/streak tracking sufficient for playtesting

Do not add production metagame systems.

---

# 4. Core World Layout

Preserve the existing coordinate convention:

```text
X = horizontal
Y = vertical
Z = depth toward target
```

Default depth:

```text
Projectile:
Z = 0

Obstacle Plane A:
Z = 6

Obstacle Plane B:
Z = 9

Target:
Z = 12
```

Allow challenge definitions to modify obstacle depth within safe bounds.

Recommended:

```text
Obstacle A:
Z = 5.5–6.5

Obstacle B:
Z = 8.0–9.5

Target:
Z = 11.5–13
```

Do not allow obstacles to overlap visually or physically.

---

# 5. Moving Targets

Extend the target system to support movement.

Supported Prototype 0.2 target movement:

```text
NONE
HORIZONTAL
VERTICAL
```

Do not add complex target paths yet.

Define:

```ts
type MovementType =
  | "none"
  | "horizontal"
  | "vertical";

interface MovementConfig {
  type: MovementType;

  amplitude?: number;

  speed?: number;

  phase?: number;
}
```

Movement should use deterministic sinusoidal motion.

Horizontal:

```ts
x =
  baseX +
  Math.sin(
    elapsedTime * speed + phase
  ) * amplitude;
```

Vertical:

```ts
y =
  baseY +
  Math.sin(
    elapsedTime * speed + phase
  ) * amplitude;
```

Use the same simulation time source as gameplay.

Do not use independent React timers.

---

# 6. Moving Target Constraints

Initial safe ranges:

```text
Horizontal amplitude:
0.3–1.3 world units

Vertical amplitude:
0.2–0.8 world units

Movement speed:
0.4–1.2
```

Target movement must remain visually predictable.

The target should not abruptly reverse.

The player must be able to understand:

> The target will be there when my projectile reaches it.

Movement should create prediction, not randomness.

---

# 7. Moving Rotors

Extend `RotorObstacle` so the entire rotor assembly can move while its blades rotate.

Supported movement:

```text
NONE
HORIZONTAL
VERTICAL
```

Prototype 0.2 should primarily use horizontal rotor movement.

Example:

```ts
rotor.position.x =
  baseX +
  Math.sin(
    elapsedTime * movementSpeed + phase
  ) * amplitude;
```

The rotor's collision geometry must move with the rendered rotor.

Never calculate collision against the rotor's original position while displaying it elsewhere.

---

# 8. Moving Rotor Configuration

Extend obstacle configuration:

```ts
interface RotorConfig {
  z: number;

  bladeCount: number;

  rotationSpeed: number;

  direction: 1 | -1;

  speedPulse?: {
    amplitude: number;
    frequency: number;
  };

  reverseInterval?: number;

  movement?: {
    type:
      | "none"
      | "horizontal"
      | "vertical";

    amplitude?: number;

    speed?: number;

    phase?: number;
  };
}
```

Safe initial values:

```text
Horizontal amplitude:
0.25–1.1

Vertical amplitude:
0.2–0.6

Movement speed:
0.35–0.9
```

---

# 9. Dual-Depth Obstacles

Prototype 0.2 must support more than one obstacle in a course.

Replace assumptions such as:

```ts
currentRotor
```

with:

```ts
obstacles[]
```

A challenge may contain:

```text
0–2 obstacles
```

Normal gameplay should contain at least one obstacle.

Prototype 0.2 maximum:

```text
2 simultaneous gameplay obstacles
```

Do not implement three or more yet.

---

# 10. Obstacle Interface

Create or adapt toward a shared obstacle contract.

Example:

```ts
interface GameplayObstacle {
  id: string;

  type: "rotor";

  z: number;

  update(
    dt: number,
    elapsedTime: number
  ): void;

  testProjectileCrossing(
    previousPosition: Vector3,
    currentPosition: Vector3,
    projectileRadius: number
  ): ObstacleCollisionResult;
}
```

Prototype 0.2 only requires rotor mechanics.

Environment skins may render rotors differently.

Do not create different collision systems for:

```text
Workshop Fan
Rooftop Turbine
Space Energy Rotor
```

They are visual variants of the same gameplay obstacle.

---

# 11. Dual-Rotor Collision

For every projectile simulation step:

1. Track previous projectile position.
2. Determine which obstacle Z planes were crossed.
3. Process crossed obstacles in increasing Z order.
4. Interpolate projectile X/Y at the exact crossing Z.
5. Evaluate obstacle position and rotation at the crossing time.
6. Test collision.
7. If collision occurs:

   * stop further course processing
   * trigger obstacle hit result
8. Otherwise continue projectile flight.

Example:

```text
Projectile
    ↓
Rotor A @ Z=6
    ↓
Rotor B @ Z=9
    ↓
Target @ Z=12
```

A projectile may:

```text
Clear A
Hit B

or

Clear A
Clear B
Miss target

or

Clear A
Clear B
Hit target
```

These must be distinguishable during debugging.

---

# 12. Critical Timing Requirement

The second rotor must not simply duplicate the first rotor's phase.

Allow:

```ts
initialRotation: number;
```

or:

```ts
phase: number;
```

Example:

```text
Rotor A:
clockwise
speed 0.7

Rotor B:
counter-clockwise
speed 0.55
phase offset 90°
```

This creates actual multi-stage prediction.

---

# 13. Challenge Definition

Prototype 0.1 used individual `ShotConfig` objects.

Prototype 0.2 should generalize this into:

```ts
interface ChallengeConfig {
  id: string;

  environment:
    | "workshop"
    | "rooftop"
    | "space";

  difficulty: number;

  obstacles: RotorConfig[];

  target: {
    x: number;
    y: number;
    radius: number;

    movement?: MovementConfig;
  };

  tags?: string[];
}
```

Example:

```ts
{
  id: "dual-counter-01",

  environment: "space",

  difficulty: 6,

  obstacles: [
    {
      z: 6,
      bladeCount: 3,
      rotationSpeed: 0.72,
      direction: 1
    },
    {
      z: 9,
      bladeCount: 2,
      rotationSpeed: 0.56,
      direction: -1,
      phase: Math.PI / 2
    }
  ],

  target: {
    x: 0.3,
    y: 3,
    radius: 0.9
  },

  tags: [
    "dual",
    "counter-rotation"
  ]
}
```

---

# 14. Do Not Build Pure Random Generation

Prototype 0.2 must not randomly combine every available mechanic.

That will generate:

* impossible shots
* ugly combinations
* difficulty spikes
* repetitive challenges
* configurations that are technically valid but not enjoyable

Instead build a controlled `ChallengeGenerator`.

---

# 15. Challenge Templates

Create reusable templates.

Examples:

```text
BASIC_ROTOR

FAST_ROTOR

REVERSE_ROTOR

PULSE_ROTOR

OFFSET_TARGET

MOVING_TARGET

MOVING_ROTOR

MOVING_ROTOR_OFFSET_TARGET

DUAL_ROTOR

DUAL_COUNTER_ROTATION

DUAL_DIFFERENT_SPEED

DUAL_ROTOR_MOVING_TARGET
```

Templates should produce bounded variation.

Example:

```ts
template: "MOVING_TARGET"

rotor:
  blades = random from [2,3]
  speed = bounded range

target:
  movement = horizontal
  amplitude = bounded range
  speed = bounded range
```

Use seeded randomness where practical so problematic courses can be reproduced.

---

# 16. Seeded Runs

Prefer deterministic run generation.

At run start:

```ts
runSeed = generateSeed();
```

Challenge generation uses that seed.

Debug overlay should show:

```text
RUN SEED
```

Allow development mode to restart a known seed.

This will make debugging much easier.

---

# 17. Difficulty Budget

Every mechanic should contribute to an approximate difficulty cost.

Initial suggested values:

```text
2-blade rotor                 +1

3-blade rotor                 +2

4-blade rotor                 +3

moderate rotor speed          +1

high rotor speed              +2

reverse rotor                 +2

speed pulse                   +2

offset target                 +1

smaller target                +1

moving target                 +2

moving rotor                  +2

second rotor                  +3

counter-rotating second rotor +1 additional
```

These are starting values only.

Centralize them.

---

# 18. Difficulty Progression

Difficulty should increase primarily through **mechanic combinations**, not infinite speed increases.

Example desired progression:

```text
Shots 1–5:
Difficulty 1–2

Shots 6–10:
Difficulty 2–3

Shots 11–20:
Difficulty 3–5

Shots 21–30:
Difficulty 4–6

Shots 31–50:
Difficulty 5–8

50+:
Difficulty 6–10
```

Cap raw values.

Suggested maximum rotor speed should be established through playtesting.

Do not keep increasing rotor speed indefinitely.

Eventually harder courses should come from:

```text
movement
+
offset target
+
multiple obstacles
+
different rotations
```

rather than unreadable speed.

---

# 19. Fairness Rules

The generator must obey explicit rules.

Examples:

Do not combine:

```text
4 blades
+
maximum rotor speed
+
large rotor movement
+
tiny moving target
+
second rotor
```

Do not create:

* overlapping rotors
* target hidden completely behind geometry
* target movement outside readable screen bounds
* impossible opening sizes
* projectile paths with no reasonable success window
* extreme simultaneous movement during early progression

Create a `ChallengeValidator`.

---

# 20. Challenge Validator

At minimum validate:

```text
Obstacle count <= 2

Obstacle Z spacing >= safe minimum

Target remains in playable X/Y bounds

Target radius >= minimum

Rotor movement remains in visible bounds

Blade/opening geometry remains traversable

Difficulty <= requested budget + tolerance
```

Optional but desirable:

Simulate multiple candidate trajectories/timing samples to reject obviously impossible generated challenges.

Do not build a sophisticated AI solver.

A coarse validator is enough for Prototype 0.2.

---

# 21. Environment Progression

Use three environments:

```text
WORKSHOP
↓
ROOFTOP
↓
SPACE
↓
WORKSHOP
↓
...
```

Initial cadence:

```text
8 successful shots per environment
```

Therefore:

```text
1–8
Workshop

9–16
Rooftop

17–24
Space

25–32
Workshop Loop 2

33–40
Rooftop Loop 2

41–48
Space Loop 2
```

Do not reset score between environments.

---

# 22. Workshop Skin

Workshop should be constructed only from procedural primitives.

Allowed scene components:

```text
Floor plane

Side walls

Back structural geometry

Boxes/crates

Cylindrical pipes

Ceiling beams

Simple lights
```

Visual obstacle skin:

```text
INDUSTRIAL FAN
```

Construct from:

```text
Torus/ring
Cylinder hub
Primitive blades
Simple support frame
```

The central gameplay corridor must remain uncluttered.

Workshop should feel:

```text
warm
mechanical
simple
readable
```

Do not pursue realism.

---

# 23. Rooftop Skin

Construct from primitives:

```text
Roof plane

Parapet walls

Box buildings

Box AC units

Cylinder water tanks

Simple antenna geometry

Sky/background
```

Distant skyline should use inexpensive primitive silhouettes.

Obstacle skin:

```text
ROOFTOP TURBINE
```

Use the same `RotorObstacle` mechanics.

Change geometry/material configuration only.

Rooftop should feel:

```text
bright
open
airy
clean
```

Do not create detailed city assets.

---

# 24. Space Skin

Construct from:

```text
Dark background

Procedural star points

Box/cylinder station pieces

Thin rectangular solar panels

Simple antennae

Small floating primitive debris

Optional distant sphere/planet
```

Obstacle skin:

```text
ENERGY ROTOR
```

Construct from:

```text
Outer torus
Inner ring
Radial bars
Center sphere
Simple emissive-style material
Small particles if inexpensive
```

Mechanically this remains a normal rotor.

Space should feel:

```text
dark
minimal
high contrast
slightly futuristic
```

Do not add complex shaders unless already trivial within the renderer.

---

# 25. Environment Architecture

Create a shared environment interface.

Example:

```ts
interface EnvironmentSkin {
  id:
    | "workshop"
    | "rooftop"
    | "space";

  createScene(): void;

  createRotorVisual(
    rotorConfig: RotorConfig
  ): RotorVisual;

  update?(
    dt: number,
    elapsedTime: number
  ): void;

  dispose(): void;
}
```

Gameplay collision must not depend on the environment skin.

Environment decides presentation.

Challenge decides mechanics.

---

# 26. Rotor Visual Architecture

Prefer:

```text
RotorObstacle
├── gameplay transform
├── rotation logic
├── movement logic
├── collision
└── visual adapter
```

Visual adapters:

```text
WorkshopRotorVisual

RooftopRotorVisual

SpaceRotorVisual
```

Do not create:

```text
WorkshopRotorPhysics

RooftopRotorPhysics

SpaceRotorPhysics
```

There should be one rotor gameplay implementation.

---

# 27. Camera-Forward Transition

After a successful target hit, do not immediately snap/reset.

Implement a short forward movement.

Sequence:

```text
TARGET HIT
↓
Target feedback
↓
Score update
↓
Camera begins forward push
↓
Current obstacle passes toward/beyond camera
↓
Next challenge is prepared
↓
Camera settles into standard gameplay framing
↓
New projectile becomes READY
```

Target transition duration:

```text
approximately 0.8–1.4 seconds
```

Tune for responsiveness.

Do not make transitions cinematic or slow.

---

# 28. Important Camera Constraint

The game should create the **illusion of forward travel**.

Do not continuously move the entire game world farther and farther along Z indefinitely.

Use recycling/rebasing.

After transition:

```text
Projectile returns to gameplay origin

Obstacle planes return to standard gameplay depths

Target returns to standard depth
```

The player perceives movement.

The simulation remains numerically stable and simple.

---

# 29. Transition Implementation Strategy

Preferred conceptual approach:

```text
Current Course
      ↓
Successful Hit
      ↓
Animate camera/world forward
      ↓
Hide/recycle old course
      ↓
Load next ChallengeConfig
      ↓
Rebase camera/world
      ↓
READY
```

Avoid maintaining hundreds of old environment chunks.

---

# 30. Environment Transition

Every eighth successful shot, transition to the next environment.

Do not show:

```text
WORKSHOP COMPLETE

NEXT LEVEL
```

Instead use continuous movement.

Example:

### Workshop → Rooftop

As the camera advances:

```text
Workshop opening/door approaches
↓
Camera passes through
↓
Lighting/background changes
↓
Rooftop geometry appears
```

Brief unobtrusive text may appear:

```text
ROOFTOP
```

Then disappear.

---

# 31. Rooftop → Space

Do not attempt realistic travel to space.

Use an arcade transition.

Example:

```text
Camera enters simple tunnel/ring
↓
Background darkens
↓
Stars appear
↓
Space station geometry resolves
```

Keep transition short.

---

# 32. Space → Workshop

Use another simple transition device.

Example:

```text
Energy portal/ring
↓
brief visual wipe
↓
Workshop appears
```

Do not build elaborate cutscenes.

---

# 33. Environment Loading

Avoid expensive scene destruction/recreation during active gameplay if it causes frame drops.

Reuse:

* geometry
* materials
* obstacle components

where practical.

Environment transition must not noticeably freeze.

---

# 34. Endless Run

Prototype 0.2 should no longer stop after eight challenges.

A run continues until:

```text
hearts == 0
```

Progression:

```text
Challenge 1
Challenge 2
...
Challenge N
```

Environment loops indefinitely.

---

# 35. Lives

Preserve:

```text
♥ ♥ ♥
```

Lose one for:

```text
Obstacle collision

Target miss
```

After failure, retry the current challenge unless playtesting proves this frustrating.

Do not advance the course after a failed throw.

At zero:

```text
RUN OVER
```

---

# 36. Run Over Screen

Display:

```text
RUN OVER

SCORE

SHOTS CLEARED

BEST STREAK

BULLSEYES

PERFECTS

ENVIRONMENT REACHED

[ TRY AGAIN ]
```

For Prototype 0.2, local best score persistence is optional.

Do not build accounts/cloud saves.

---

# 37. Scoring

Preserve basic scoring:

```text
HIT       +1

GREAT     +1

BULLSEYE  +2

PERFECT   +3
```

Add streak tracking.

Display:

```text
STREAK 5
```

or equivalent when meaningful.

Prototype 0.2 does not require a complicated multiplier economy.

The purpose is to measure whether players care about accurate shots during longer runs.

---

# 38. Near-Miss Tracking

Add internal tracking for obstacle near misses if straightforward.

When projectile clears a blade within a small threshold:

```text
NEAR MISS
```

This does not need to affect score yet.

Debug/playtesting telemetry should count:

```text
nearMisses
```

This may become important to the eventual scoring system.

---

# 39. HUD

Keep minimal.

Example:

```text
♥ ♥ ♥            37

          x3 STREAK
```

Optional small environment progress:

```text
ROOFTOP • 4/8
```

Do not clutter the aiming area.

---

# 40. Debug Overlay

Extend existing debug mode.

Display:

```text
FPS

Run Seed

Challenge Number

Challenge ID

Template

Difficulty Budget

Environment

Loop Number

Projectile:
X/Y/Z

Obstacle A:
Z
rotation
rotation speed
movement position

Obstacle B:
same values if present

Target:
X/Y
movement state

Last Result

Near Miss
```

Add development controls if convenient:

```text
Next Challenge

Previous/Replay Challenge

Restart Seed

Jump Environment

Toggle Collision Geometry
```

These controls must be development-only.

---

# 41. Run Statistics

Track during each run:

```ts
interface RunStats {
  score: number;

  challengesCleared: number;

  attempts: number;

  rotorHits: number;

  targetMisses: number;

  hits: number;

  greats: number;

  bullseyes: number;

  perfects: number;

  nearMisses: number;

  currentStreak: number;

  bestStreak: number;

  environmentLoops: number;
}
```

No analytics backend is required.

---

# 42. Central Tuning

Extend the existing `gameTuning.ts`.

Add:

```ts
movement: {
  target: {
    maxHorizontalAmplitude: ...,
    maxVerticalAmplitude: ...,
    maxSpeed: ...,
  },

  rotor: {
    maxHorizontalAmplitude: ...,
    maxVerticalAmplitude: ...,
    maxMovementSpeed: ...,
  },
},

difficulty: {
  ...
},

transition: {
  normalDuration: ...,
  environmentDuration: ...,
},

generation: {
  ...
}
```

Do not scatter progression constants across components.

---

# 43. Performance Rules

Continue targeting approximately:

```text
60 FPS
```

Avoid:

* React state updates every animation frame
* new geometry creation every frame
* new materials every challenge when reusable
* excessive particle counts
* expensive dynamic shadows
* unnecessary transparency
* multiple heavy lights
* complex post-processing
* retaining old environment geometry indefinitely

Use pooling/reuse where useful.

---

# 44. Implementation Order

Follow this order.

## Phase 1 — Regression Check

Verify Prototype 0.1.

Record current behavior.

Do not begin architectural changes until the existing game runs correctly.

---

## Phase 2 — Generalize Obstacles

Change single-rotor assumptions into:

```text
obstacles[]
```

Still render only one obstacle initially.

Confirm Prototype 0.1 behavior remains unchanged.

---

## Phase 3 — Dual Rotor

Add second obstacle at approximately:

```text
Z = 9
```

Create one manually authored dual-rotor test challenge.

Verify:

```text
hit first rotor

clear first / hit second

clear both / miss target

clear both / hit target
```

All must work.

---

## Phase 4 — Moving Target

Implement:

```text
horizontal movement
vertical movement
```

Create test challenges.

Verify collision uses actual current target position.

---

## Phase 5 — Moving Rotor

Implement horizontal rotor movement.

Then vertical if straightforward.

Verify rendered and collision transforms remain synchronized.

---

## Phase 6 — ChallengeConfig

Generalize the existing shot configuration into `ChallengeConfig`.

Convert existing useful Prototype 0.1 shots to challenge templates/configurations.

---

## Phase 7 — Challenge Templates

Implement:

```text
BASIC_ROTOR

FAST_ROTOR

REVERSE_ROTOR

PULSE_ROTOR

OFFSET_TARGET

MOVING_TARGET

MOVING_ROTOR

MOVING_ROTOR_OFFSET_TARGET

DUAL_ROTOR

DUAL_COUNTER_ROTATION

DUAL_DIFFERENT_SPEED

DUAL_ROTOR_MOVING_TARGET
```

Do not enable every template at the beginning of a run.

---

## Phase 8 — Difficulty Budget

Implement centralized mechanic costs.

Map challenge number/range to requested difficulty.

Verify progression visually using debug mode.

---

## Phase 9 — Seeded Generator

Implement deterministic challenge selection and bounded parameter variation.

Display seed in debug mode.

Verify restarting the same seed reproduces the same challenge sequence.

---

## Phase 10 — Challenge Validator

Reject configurations violating fairness/safety rules.

Log rejected challenge reason in development mode if useful.

---

## Phase 11 — Endless Run

Remove Prototype 0.1 eight-shot completion condition.

Continue generating challenges until lives reach zero.

---

## Phase 12 — Forward Transition

Implement successful-shot camera/world forward motion.

Ensure normal shot-to-shot transition remains fast.

---

## Phase 13 — Workshop Skin

Polish the existing primitive Workshop enough to establish the target low-poly quality.

Do not add imported assets.

---

## Phase 14 — Rooftop Skin

Add procedural Rooftop.

Add Rooftop Turbine visual adapter.

Do not duplicate rotor gameplay logic.

---

## Phase 15 — Space Skin

Add procedural Space environment.

Add Energy Rotor visual adapter.

Again reuse rotor gameplay.

---

## Phase 16 — Environment Cycling

Implement:

```text
Workshop
↓
Rooftop
↓
Space
↓
Workshop
```

Eight successful shots per environment.

Verify Loop 2 difficulty increases without resetting score.

---

## Phase 17 — Environment Transitions

Add simple procedural transitions between the three themes.

Keep each transition brief.

---

## Phase 18 — Feedback Pass

Improve:

```text
target hits

bullseyes

perfects

rotor collisions

near misses

camera movement

haptics

particles
```

Do not fundamentally alter the validated throwing mechanic.

---

## Phase 19 — Long-Run Testing

Run at least:

```text
50 consecutive generated challenges
```

using debug/testing methods.

Check:

* impossible configurations
* repetitive templates
* visual overlap
* target clipping
* unfair difficulty spikes
* frame-rate degradation
* memory growth
* scene-transition problems

Fix generator rules rather than special-casing individual random seeds whenever possible.

---

# 45. Acceptance Criteria

Prototype 0.2 is complete when all of the following are true.

## Prototype 0.1 Regression

* Existing drag/release interaction still feels substantially the same.
* Trajectory preview still matches projectile behavior.
* Existing rotor collision remains reliable.
* Existing target scoring remains reliable.

## Moving Targets

* Horizontal targets work.
* Vertical targets work.
* Target collision uses current moving position.
* Motion remains predictable.
* Moving targets remain inside playable bounds.

## Moving Rotors

* Rotor assembly can move horizontally.
* Collision geometry moves with visuals.
* Blade rotation continues while rotor translates.
* Movement remains smooth.
* Moving rotor stays within readable bounds.

## Dual Obstacles

* Two rotors can exist at different Z depths.
* Projectile can hit Rotor A.
* Projectile can clear A and hit B.
* Projectile can clear both.
* Different rotation speeds work.
* Counter-rotation works.
* Phase offsets work.
* Collision order is correct.

## Challenge Generation

* Challenges are generated from templates.
* Generation uses bounded values.
* Difficulty budget influences template/parameter selection.
* Same seed reproduces same sequence.
* Validator rejects invalid configurations.
* Early challenges are materially easier than later challenges.
* Difficulty does not rely solely on rotor speed.

## Environments

* Workshop exists using procedural primitives.
* Rooftop exists using procedural primitives.
* Space exists using procedural primitives.
* All three preserve gameplay readability.
* Each has a distinct rotor visual.
* All rotor visuals use the same underlying gameplay mechanics.

## Progression

* Workshop runs for approximately eight successful challenges.
* Game transitions into Rooftop.
* Rooftop transitions into Space.
* Space transitions back into Workshop.
* Score does not reset.
* Difficulty increases on later loops.
* Run continues until hearts reach zero.

## Camera

* Successful hit causes forward movement.
* Transition does not feel like an abrupt scene reset.
* Gameplay coordinate system rebases correctly.
* Long runs do not accumulate enormous world coordinates.
* Environment transitions do not produce noticeable freezes.

## Performance

* Normal gameplay remains smooth.
* Two moving rotors remain smooth.
* Moving target + dual rotor remains smooth.
* Environment transitions do not cause severe frame drops.
* Long runs do not exhibit obvious memory leakage.

## Debugging

* Run seed is visible.
* Challenge ID/template is visible.
* Difficulty is visible.
* Both obstacle states can be inspected.
* Generated challenge can be reproduced.

---

# 46. Playtest Acceptance

After technical acceptance, play the game normally.

Complete multiple runs.

Prototype 0.2 succeeds as a game prototype if:

1. Later shots require meaningfully different decisions from early shots.
2. Moving targets create prediction rather than annoyance.
3. Moving rotors add meaningful difficulty.
4. Dual rotors create interesting timing decisions.
5. Workshop, Rooftop and Space feel different despite shared mechanics.
6. Forward transitions make the run feel continuous.
7. Returning to Workshop on Loop 2 does not feel like simply replaying the beginning.
8. A run lasting several minutes remains engaging.
9. Failure generally feels understandable.
10. The player wants to immediately start another run after losing.

The central validation question is:

> Does the combination system turn the successful Prototype 0.1 mechanic into something capable of sustaining an endless arcade game?

---

# 47. Explicitly Out of Scope

Do **not** implement:

```text
❌ Advertising
❌ AdMob
❌ Rewarded continue
❌ Interstitials

❌ In-app purchases
❌ RevenueCat
❌ Paid ad removal

❌ Currency
❌ Coins
❌ Gems

❌ Store

❌ Unlockable projectiles

❌ Cosmetic inventory

❌ Accounts

❌ Authentication

❌ Cloud saves

❌ Online leaderboard

❌ Game Center

❌ Google Play Games

❌ Achievements

❌ Daily challenges

❌ Missions

❌ Battle pass

❌ Character system

❌ Level-selection map

❌ Story

❌ Additional environments beyond:
   Workshop
   Rooftop
   Space

❌ More than two gameplay obstacles

❌ Complex obstacle types beyond the rotor system

❌ Portals affecting projectile physics

❌ Wind physics

❌ Ricochet puzzles

❌ Different projectile physics by ball type

❌ Production tutorial flow

❌ Production settings screen

❌ Production home screen

❌ Backend

❌ Analytics service

❌ Remote configuration

❌ Downloaded 3D models

❌ Blender dependency

❌ Photorealistic graphics

❌ Complex shaders

❌ General-purpose rigid-body physics engine
```

If something on this list appears useful, document it as a future recommendation.

Do not implement it.

---

# 48. Agent Rules

1. Read `PROTOTYPE-0.1.md` before making changes.
2. Inspect the current working implementation.
3. Preserve tested throwing behavior.
4. Extend existing architecture where reasonable.
5. Avoid large rewrites solely for architectural cleanliness.
6. Keep gameplay deterministic.
7. Keep visual skins separate from gameplay mechanics.
8. Keep difficulty configuration centralized.
9. Keep generation reproducible.
10. Never knowingly generate impossible challenges.
11. Prefer readable gameplay over visual complexity.
12. Keep all graphics procedural.
13. Do not install unnecessary dependencies.
14. Verify Expo compatibility before installing anything.
15. Keep TypeScript errors at zero.
16. Run available lint/typecheck/test commands after meaningful phases.
17. Test behavior, not merely compilation.
18. Preserve and expand debug tooling.
19. Do not begin production monetization or metagame work.
20. Stop at Prototype 0.2.

---

# 49. Agent Final Report

When Prototype 0.2 is complete, report:

```text
IMPLEMENTED
- ...

ARCHITECTURAL CHANGES
- ...

DEPENDENCIES ADDED
- ...

CHALLENGE TEMPLATES
- ...

DIFFICULTY SYSTEM
- ...

ENVIRONMENTS
- Workshop:
- Rooftop:
- Space:

TRANSITIONS
- ...

IMPORTANT FILES
- ...

TUNING VALUES
- ...

HOW TO RUN
- ...

HOW TO ENABLE DEBUG MODE
- ...

HOW TO REPLAY A RUN SEED
- ...

PERFORMANCE NOTES
- ...

KNOWN ISSUES
- ...

DEVIATIONS FROM PROTOTYPE-0.2.md
- ...

PLAYTEST OBSERVATIONS
- ...

RECOMMENDED PROTOTYPE 0.3 ITEMS
- ...
```

Do not implement the recommended Prototype 0.3 items.

---

# 50. Recommended Agent Checkpoints

Do not attempt the entire document as one unreviewed implementation pass.

### Checkpoint A

Complete:

* Prototype 0.1 regression
* obstacle array architecture
* dual rotor
* moving target
* moving rotor

Then stop and verify gameplay.

### Checkpoint B

Complete:

* ChallengeConfig
* templates
* difficulty budget
* seeded generator
* validator
* endless run

Then perform a 50-challenge generation test.

### Checkpoint C

Complete:

* forward camera transition
* Workshop
* Rooftop
* Space
* rotor visual adapters
* environment cycling

Then verify mobile performance.

### Checkpoint D

Complete:

* environment transitions
* feedback improvements
* long-run testing
* tuning

Then stop.

Do not begin Prototype 0.3.

---

# 51. Final Design Principle

Prototype 0.1 proved that a single throw can be enjoyable.

Prototype 0.2 must prove that the system can repeatedly create:

> **“I can make this shot.”**

followed by:

> **“Give me another one.”**

The player should learn the game's visual language and increasingly predict several moving systems at once.

Complexity should come from combining a small number of understandable rules:

**trajectory + timing + movement + depth + accuracy**

—not from adding complicated controls.

If a new feature makes failure harder to understand without making the decision more interesting, simplify or remove it.
