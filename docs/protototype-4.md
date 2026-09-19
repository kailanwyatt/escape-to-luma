# Prototype 0.4 — Obstacle Vocabulary

## Agent Mission

Extend the existing game after Prototype 0.3 by introducing a small set of new obstacle families.

Prototype 0.1 proved:

> Throwing through a moving opening can be satisfying.

Prototype 0.2 proved:

> Existing rotor mechanics can create increasing challenge through movement, targets, and depth.

Prototype 0.3 proved:

> Those challenges can support a score-driven endless run.

Prototype 0.4 must answer:

> Can several visually and mechanically distinct obstacles keep the same core throw interesting over longer runs?

Do NOT redesign:

* aiming
* projectile physics
* scoring
* streaks
* lives
* run structure
* environment progression
* challenge generator architecture

This prototype expands the **obstacle vocabulary**.

---

# 1. Design Principle

Every obstacle must preserve the fundamental interaction:

```text
OBSERVE
↓
PREDICT FUTURE OPENING
↓
AIM
↓
WAIT
↓
RELEASE
↓
PASS THROUGH
↓
HIT TARGET
```

Do not introduce unrelated minigames.

The player should never need new controls.

Everything must work with:

```text
DRAG
AIM
RELEASE
```

---

# 2. New Obstacles

Implement four obstacle families:

```text
1. SLIDING GATE
2. IRIS / SHUTTER
3. PENDULUM
4. MOVING RING
```

Keep the existing:

```text
5. ROTOR
```

Prototype 0.4 therefore ends with five obstacle families.

Do not add additional obstacle families during this task.

---

# 3. Shared Obstacle Architecture

All obstacles should implement the existing/shared gameplay obstacle interface.

Conceptually:

```ts
interface GameplayObstacle {
  id: string;

  type: ObstacleType;

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

  getDebugInfo?(): ObstacleDebugInfo;
}
```

Extend:

```ts
type ObstacleType =
  | "rotor"
  | "slidingGate"
  | "iris"
  | "pendulum"
  | "movingRing";
```

Do not build separate projectile systems for different obstacles.

---

# 4. Collision Principle

Continue using deterministic obstacle-plane crossing.

For an obstacle at:

```text
Z = obstacleZ
```

detect:

```ts
previousZ < obstacleZ &&
currentZ >= obstacleZ
```

Interpolate projectile X/Y at the exact crossing point.

Collision must be evaluated against obstacle geometry at the exact crossing time.

This is particularly important for moving obstacles.

---

# 5. Obstacle 1 — Sliding Gate

## Concept

A barrier contains an opening that moves horizontally.

Example:

```text
████████     ████████
████████     ████████
████████     ████████
         ↑
       OPENING
```

The opening moves:

```text
←────────────→
```

The player predicts where the opening will be when the projectile reaches the gate.

---

# 6. Sliding Gate Behavior

Use deterministic sinusoidal movement:

```ts
openingX =
  baseX +
  Math.sin(
    elapsedTime * speed + phase
  ) * amplitude;
```

Configuration:

```ts
interface SlidingGateConfig {
  type: "slidingGate";

  z: number;

  openingWidth: number;

  openingHeight: number;

  baseX: number;

  amplitude: number;

  speed: number;

  phase?: number;
}
```

Initial safe ranges:

```text
Opening Width:
1.2–2.2

Opening Height:
2.0–3.5

Amplitude:
0.4–1.3

Speed:
0.3–0.8
```

---

# 7. Sliding Gate Difficulty

Difficulty should come from:

```text
smaller opening
+
larger travel
+
slightly faster movement
+
offset target
```

Do not make gates extremely fast.

The player should be able to visually predict them.

---

# 8. Sliding Gate Collision

Treat everything outside the rectangular opening as blocked.

At plane crossing:

```text
projectile center + radius
```

must fit through the opening.

Collision should account for projectile radius.

A ball visually touching the edge should behave consistently with the intended collision rule.

Debug mode must display the true opening collision bounds.

---

# 9. Obstacle 2 — Iris / Shutter

## Concept

A circular opening repeatedly:

```text
OPEN
↓
CLOSE
↓
OPEN
```

The player must time the throw so the ball reaches the iris while the opening is sufficiently large.

This introduces a different prediction problem from the rotor.

Rotor:

> Where will the gap be?

Iris:

> How large will the gap be?

---

# 10. Iris Behavior

Configuration:

```ts
interface IrisConfig {
  type: "iris";

  z: number;

  minRadius: number;

  maxRadius: number;

  speed: number;

  phase?: number;
}
```

Opening:

```ts
const t =
  (
    Math.sin(
      elapsedTime * speed + phase
    ) + 1
  ) / 2;

openingRadius =
  lerp(
    minRadius,
    maxRadius,
    t
  );
```

Initial values:

```text
Minimum Radius:
0.25–0.60

Maximum Radius:
1.4–2.0

Speed:
0.7–1.4
```

---

# 11. Iris Collision

At the iris plane:

```ts
distance =
  sqrt(
    localX * localX +
    localY * localY
  );
```

Projectile clears when:

```text
distance + projectileRadius
<=
openingRadius
```

Otherwise:

```text
IRIS_HIT
```

Debug mode must show:

```text
Current Opening Radius
Predicted Opening Radius At Arrival
```

---

# 12. Iris Visual

Use simple primitives.

Possible construction:

```text
outer ring
+
6–8 wedge-like shutter pieces
```

If visually animating true shutter blades is unnecessarily complicated, use a simpler ring/aperture representation.

Gameplay readability matters more than mechanical realism.

---

# 13. Obstacle 3 — Pendulum

## Concept

A solid object swings across the projectile path.

Example:

```text
        ●
        |
       /
      /
     █

        ↓

     █
      \
       \
        |
        ●
```

The player must throw through the corridor when the pendulum has moved away.

---

# 14. Pendulum Behavior

Configuration:

```ts
interface PendulumConfig {
  type: "pendulum";

  z: number;

  pivotX: number;

  pivotY: number;

  length: number;

  blockerRadius: number;

  maxAngle: number;

  speed: number;

  phase?: number;
}
```

Angle:

```ts
angle =
  Math.sin(
    elapsedTime * speed + phase
  ) * maxAngle;
```

Calculate blocker position from pivot + length.

---

# 15. Pendulum Difficulty

Difficulty comes from:

```text
larger swing arc
+
larger blocker
+
different speed
+
offset target
```

Do not make the pendulum visually confusing.

The player should immediately understand:

> Don't hit that moving object.

---

# 16. Pendulum Collision

Use an appropriate simplified collision representation.

Preferred:

```text
capsule for arm
+
circle/sphere for blocker
```

or equivalent existing collision primitives.

Do not require a general-purpose physics engine.

The pendulum motion is deterministic.

---

# 17. Obstacle 4 — Moving Ring

## Concept

A circular ring moves through X/Y space.

The projectile must pass through its center opening.

Unlike the sliding gate, the entire opening can move vertically and horizontally.

---

# 18. Moving Ring Behavior

Configuration:

```ts
interface MovingRingConfig {
  type: "movingRing";

  z: number;

  radius: number;

  baseX: number;

  baseY: number;

  movement: {
    type:
      | "horizontal"
      | "vertical"
      | "ellipse";

    amplitudeX: number;

    amplitudeY: number;

    speed: number;

    phase?: number;
  };
}
```

Horizontal:

```ts
x =
  baseX +
  Math.sin(t) * amplitudeX;
```

Vertical:

```ts
y =
  baseY +
  Math.sin(t) * amplitudeY;
```

Ellipse:

```ts
x =
  baseX +
  Math.cos(t) * amplitudeX;

y =
  baseY +
  Math.sin(t) * amplitudeY;
```

---

# 19. Moving Ring Progression

Introduce:

```text
horizontal
↓
vertical
↓
ellipse
```

Do not introduce ellipse immediately.

Safe initial values:

```text
Opening Radius:
1.0–1.7

Horizontal amplitude:
0.3–1.2

Vertical amplitude:
0.2–0.7

Speed:
0.3–0.8
```

---

# 20. Moving Ring Collision

At plane crossing:

```ts
distance =
  distance2D(
    projectileXY,
    ringCenterXY
  );
```

The projectile must fit inside the ring opening.

Account for projectile radius.

Debug mode should show:

```text
Ring current center
Ring predicted center at arrival
Projectile predicted crossing
```

---

# 21. Obstacle Visual Language

The five obstacle families should be immediately distinguishable.

The player should eventually recognize:

```text
Rotor
→ rotating opening

Gate
→ translating opening

Iris
→ changing-size opening

Pendulum
→ sweeping blocker

Ring
→ moving opening
```

Do not require text labels during normal gameplay.

The motion itself should communicate the rule.

---

# 22. Environment Skins

Each obstacle should visually fit:

```text
WORKSHOP
ROOFTOP
SPACE
```

But gameplay remains shared.

Example:

## Sliding Gate

Workshop:

```text
metal workshop door
```

Rooftop:

```text
ventilation barrier
```

Space:

```text
energy barrier
```

## Iris

Workshop:

```text
mechanical aperture
```

Rooftop:

```text
large ventilation shutter
```

Space:

```text
energy iris
```

## Pendulum

Workshop:

```text
swinging industrial weight
```

Rooftop:

```text
swinging sign/crane weight
```

Space:

```text
oscillating energy arm
```

## Ring

Workshop:

```text
metal hoop
```

Rooftop:

```text
vent/turbine ring
```

Space:

```text
energy ring
```

Use primitives.

Do not import large 3D asset packs.

---

# 23. Visual Adapter Architecture

Prefer:

```text
SlidingGateObstacle
├── WorkshopGateVisual
├── RooftopGateVisual
└── SpaceGateVisual
```

and equivalent for each family.

Do not duplicate gameplay behavior per environment.

---

# 24. Challenge Templates

Extend the existing challenge-template system.

Add:

```text
BASIC_GATE

MOVING_GATE

GATE_OFFSET_TARGET

BASIC_IRIS

FAST_IRIS

IRIS_OFFSET_TARGET

BASIC_PENDULUM

WIDE_PENDULUM

PENDULUM_OFFSET_TARGET

BASIC_RING

VERTICAL_RING

ELLIPTICAL_RING

RING_OFFSET_TARGET
```

Initially, keep these as single-obstacle challenges.

---

# 25. Introduction Order

New obstacle families must be introduced independently.

Recommended run progression:

```text
Rotor already known

↓
Sliding Gate

↓
Iris

↓
Pendulum

↓
Moving Ring

↓
Mixed obstacle courses
```

Do not introduce a new obstacle for the first time as part of a dual-obstacle challenge.

---

# 26. Teaching Without Tutorials

First encounter with each obstacle should be easy enough for the player to understand through motion.

Example:

First gate:

```text
large opening
slow movement
large target
```

First iris:

```text
large maximum opening
slow open/close
stationary target
```

First pendulum:

```text
slow swing
small blocker
large target
```

First moving ring:

```text
large ring
slow horizontal movement
large target
```

Do not show instructional modal screens.

---

# 27. Mixed Obstacle Courses

Only after standalone obstacle validation should mixed courses be enabled.

Prototype 0.4 should support combinations such as:

```text
Rotor
→ Gate
→ Target
```

```text
Gate
→ Rotor
→ Target
```

```text
Rotor
→ Iris
→ Target
```

```text
Ring
→ Rotor
→ Target
```

```text
Pendulum
→ Rotor
→ Target
```

Maximum:

```text
2 gameplay obstacles
```

Do not increase this limit.

---

# 28. Combination Restrictions

Do not permit every possible pair automatically.

Create an explicit legal-combination table.

Initial allowed combinations:

```text
Rotor + Rotor

Rotor + Gate

Gate + Rotor

Rotor + Iris

Iris + Rotor

Rotor + Ring

Ring + Rotor

Pendulum + Rotor
```

Initially avoid:

```text
Iris + Iris

Pendulum + Pendulum

Ring + Ring

Gate + Gate

Moving Ring + Moving Gate

Pendulum + Moving Ring
```

These can be evaluated later.

---

# 29. Challenge Generator

Extend the existing generator.

Do NOT rewrite it.

Add new templates to the current system.

Each obstacle family receives a difficulty cost.

Suggested starting costs:

```text
Basic Rotor            +1

Sliding Gate           +2

Iris                    +2

Pendulum                +2

Moving Ring             +2

Second obstacle         +3

Fast movement           +1

Small opening           +1

Offset target           +1

Moving target           +2
```

These are tuning values.

Centralize them.

---

# 30. Generator Safety

Continue using:

```text
ChallengeValidator
```

Extend validation for new obstacles.

Validate:

### Gate

```text
minimum opening dimensions
movement remains on screen
```

### Iris

```text
maximum opening can actually fit projectile
minimum/maximum radius valid
```

### Pendulum

```text
motion remains readable
blocker doesn't permanently cover corridor
```

### Ring

```text
opening large enough
movement remains in playable bounds
```

---

# 31. Timing Solver / Diagnostic

Do not build a sophisticated gameplay AI.

However, because obstacle combinations are becoming more complex, add or extend development diagnostics to estimate whether a challenge has plausible timing windows.

At minimum calculate:

```text
Projectile estimated arrival time at each obstacle

Obstacle state at those times
```

Use existing trajectory/depth diagnostics.

Do not expose perfect timing to normal players.

---

# 32. Debug Prediction

Debug mode should support:

```text
Predicted projectile crossing point

Predicted obstacle state at arrival

Predicted clear/hit result
```

for all five obstacle families.

This is essential for distinguishing:

```text
PLAYER ERROR
```

from:

```text
COLLISION / SIMULATION ERROR
```

---

# 33. Close Calls

Extend Prototype 0.3 Close Call detection to new obstacles where geometrically meaningful.

Examples:

```text
Gate edge

Iris edge

Pendulum blocker

Ring edge
```

Maximum:

```text
one Close Call per obstacle crossing
```

Do not allow repeated bonuses from one obstacle.

---

# 34. Scoring

Do not redesign Prototype 0.3 scoring.

Preserve:

```text
HIT
GREAT
BULLSEYE
PERFECT

Streak

Multiplier

Close Call
```

New obstacles should feed into the same scoring/run system.

---

# 35. Run Progression

Prototype 0.4 should gradually unlock obstacle vocabulary during a run.

Suggested:

```text
Shots 1–5
Rotor only

Shots 6–10
Rotor + Gate challenges

Shots 11–15
Introduce Iris

Shots 16–20
Introduce Pendulum

Shots 21–25
Introduce Moving Ring

Shots 26–35
All single obstacle families

Shots 36+
Validated mixed courses
```

Do not interpret these as rigid production progression.

This is for Prototype 0.4 testing.

---

# 36. Variety Director

Prevent repetitive obstacle selection.

Track recent obstacle families.

Avoid sequences such as:

```text
Rotor
Rotor
Rotor
Rotor
Rotor
```

once multiple families are available.

Maintain something like:

```ts
recentObstacleTypes: ObstacleType[];
```

Apply a temporary selection penalty to recently used types.

Do not make obstacle selection completely deterministic.

---

# 37. Repetition Rule

Once all families are unlocked, attempt to avoid the same primary obstacle family more than:

```text
2 times consecutively
```

unless no valid alternative exists for the current difficulty budget.

This is a soft rule.

Do not generate an unfair challenge simply to achieve variety.

Fairness overrides variety.

---

# 38. Difficulty Rule

Never equate:

```text
more obstacle types
```

with:

```text
maximum complexity simultaneously
```

A late-game challenge does not need:

```text
moving gate
+
fast iris
+
moving target
+
tiny target
```

Prototype 0.4 still allows only two obstacle planes.

Difficulty should remain understandable.

---

# 39. Environment Progression

Preserve:

```text
WORKSHOP
↓
ROOFTOP
↓
SPACE
↓
WORKSHOP
```

Do not add environments.

Environment transitions must continue working regardless of obstacle family.

---

# 40. Performance

Target approximately:

```text
60 FPS
```

New obstacles should primarily use:

* simple geometry
* deterministic transforms
* lightweight collision
* shared materials where possible

Avoid:

* full physics engine
* complex mesh colliders
* expensive shaders
* excessive dynamic lighting
* large imported models

---

# 41. Development Test Mode

Create:

```text
OBSTACLE_TEST
```

development mode if useful.

Allow direct selection:

```text
Rotor

Gate

Iris

Pendulum

Ring
```

Then allow:

```text
Single obstacle

Dual obstacle
```

This should make tuning possible without playing through a full run.

---

# 42. Authored Validation Course

Before enabling new obstacles broadly in generation, create a small internal authored sequence:

```text
1  Basic Gate
2  Gate + Offset Target

3  Basic Iris
4  Iris + Offset Target

5  Basic Pendulum
6  Pendulum + Offset Target

7  Basic Ring
8  Vertical Ring

9  Rotor + Gate
10 Gate + Rotor

11 Rotor + Iris
12 Iris + Rotor

13 Rotor + Ring
14 Ring + Rotor

15 Pendulum + Rotor
```

This is not production content.

It is a mechanical validation course.

---

# 43. Validation Question Per Obstacle

After each obstacle family ask:

### Gate

> Can I intentionally predict where the opening will be?

### Iris

> Can I intentionally predict when the opening will be large enough?

### Pendulum

> Can I intentionally predict when the path will be clear?

### Ring

> Can I intentionally predict where the opening will move?

If the answer is:

> I just throw until it works.

the mechanic has failed validation.

Do not add it to generated runs until corrected.

---

# 44. Important Readability Rule

Prototype 0.2 exposed potential depth-perception and future-state readability problems.

Do not repeat that mistake.

Every obstacle must communicate:

```text
WHERE IT IS

HOW IT MOVES

WHERE THE OPENING IS

WHAT WILL BLOCK THE BALL
```

through its visuals.

Collision geometry should closely correspond to visible geometry.

---

# 45. Failure Feedback

When the projectile collides, the player should visually understand what caused failure.

Development mode should identify:

```text
ROTOR HIT

GATE HIT

IRIS HIT

PENDULUM HIT

RING HIT

TARGET MISS
```

Normal gameplay does not need verbose labels if the collision is visually obvious.

---

# 46. Implementation Order

Follow this order.

## Phase 1 — Regression

Verify Prototype 0.3:

* aiming
* trajectory
* rotor
* target
* scoring
* streak
* Close Call
* lives
* run over
* restart
* persistence
* environments
* generator

Do not proceed if major existing systems are broken.

---

## Phase 2 — Shared Obstacle Contract

Ensure obstacle architecture can support multiple obstacle types without rotor-specific assumptions.

Do not rewrite working systems unnecessarily.

---

## Phase 3 — Sliding Gate

Implement.

Test standalone.

Add debug geometry.

Add Close Call.

Do not proceed until reliable.

---

## Phase 4 — Iris

Implement.

Test standalone.

Add predicted opening radius debug information.

Do not proceed until reliable.

---

## Phase 5 — Pendulum

Implement.

Test deterministic movement and collision.

Do not use a physics engine.

---

## Phase 6 — Moving Ring

Implement:

```text
horizontal
vertical
ellipse
```

Test collision carefully.

---

## Phase 7 — Authored Validation

Implement/run the 15-shot validation course.

Do not enable generator integration yet.

---

## Phase 8 — Environment Visuals

Create lightweight visual adapters for:

```text
Workshop
Rooftop
Space
```

Reuse gameplay behavior.

---

## Phase 9 — Generator Integration

Add validated obstacle templates to existing generator.

Do not rewrite generator.

---

## Phase 10 — Combination Rules

Implement explicit legal combination table.

Maximum two obstacles.

---

## Phase 11 — Difficulty Costs

Add obstacle difficulty values to existing difficulty budget.

---

## Phase 12 — Variety Director

Add recent-obstacle tracking and repetition avoidance.

---

## Phase 13 — Long Run

Test:

```text
50+ challenges
```

Inspect:

* repetition
* impossible combinations
* difficulty spikes
* depth readability
* collision discrepancies
* performance
* memory
* scoring
* Close Calls

---

# 47. Acceptance Criteria

Prototype 0.4 is technically complete when:

## Sliding Gate

* moves predictably
* opening collision works
* projectile radius is considered
* Close Call works
* visual and collision geometry correspond

## Iris

* opens/closes predictably
* collision uses current radius
* projectile radius is considered
* debug predicted radius works
* Close Call works

## Pendulum

* deterministic swing works
* collision matches visible blocker
* no physics engine required
* Close Call works

## Moving Ring

* horizontal movement works
* vertical movement works
* elliptical movement works
* collision follows current ring position
* Close Call works

## Integration

* existing Rotor still works
* all obstacles use shared projectile system
* all obstacles work with scoring
* all obstacles work with streaks
* all obstacles work with lives
* all obstacles work with Run Over
* all obstacles work across environments
* all obstacles support debugging
* generator can select validated templates
* invalid combinations are rejected
* maximum obstacle count remains two
* environment loop remains functional
* fast restart remains functional
* local bests remain functional

---

# 48. Gameplay Acceptance

Do not judge Prototype 0.4 only by technical completion.

Play several runs.

Determine:

1. Does each obstacle create a different prediction problem?
2. Can each obstacle be understood without instructions?
3. Do failures usually feel deserved?
4. Can I i
