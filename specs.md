# Prototype 0.1 — Moving Aperture Arcade Game

## Agent Mission

Build a playable portrait-oriented Expo prototype for a mobile physics/precision arcade game.

The player drags and releases a ball toward a target located behind a rotating obstacle. The player must predict where the opening between the rotating blades will be when the ball reaches the obstacle.

Core loop:

**Aim → Time → Throw → Clear Rotor → Hit Target → Next Shot**

Prototype 0.1 exists only to validate whether this interaction is satisfying.

Do not expand the project into a complete game.

---

# 1. Technology

Build this as an Expo application targeting:

* iOS
* Android
* portrait orientation

Use TypeScript.

Use the project's current stable Expo-compatible packages whenever possible.

For rendering, use a lightweight 3D solution compatible with the current Expo SDK and development build.

Preferred architecture:

* Expo
* React Native
* TypeScript
* Three.js-compatible 3D rendering
* Expo-compatible gesture handling
* Expo Haptics
* requestAnimationFrame/game loop

Before adding dependencies, verify they are compatible with the Expo SDK currently installed in the project.

Do not downgrade Expo merely to support an old rendering library.

If a package requires native configuration unavailable in Expo Go, configure an Expo development build instead of compromising the game architecture.

---

# 2. Graphics Constraint

All gameplay graphics must initially be generated from primitives.

Allowed:

* Sphere
* Box
* Plane
* Cylinder
* Torus/ring
* Simple procedural geometry
* Basic materials
* Basic lights
* Simple particles

Do not use:

* downloaded 3D models
* Blender assets
* AI-generated scene backgrounds
* photorealistic textures
* expensive post-processing

The prototype should resemble a clean low-poly arcade game.

The important visual hierarchy is:

1. Projectile
2. Moving opening
3. Target
4. Environment

---

# 3. Orientation

Lock the application to portrait.

Design primarily around common phone aspect ratios.

Gameplay must remain usable across different portrait dimensions.

Do not position gameplay using hard-coded screen pixels where normalized/device-independent positioning is appropriate.

---

# 4. World Coordinate System

Use:

```text
X = horizontal
Y = vertical
Z = depth
```

Direction:

```text
-X = left
+X = right

-Y = down
+Y = up

-Z = toward player
+Z = toward target
```

World origin:

```text
(0, 0, 0)
```

Primary gameplay depth:

```text
Projectile: Z = 0

Rotor: Z = 6

Future second obstacle: Z = 9

Target: Z = 12
```

Keep the world intentionally shallow.

This is not an explorable 3D environment.

---

# 5. Camera

Use a fixed perspective camera.

Initial tuning:

```ts
position = {
  x: 0,
  y: 3.2,
  z: -8.5,
};

lookAt = {
  x: 0,
  y: 2.5,
  z: 6,
};

fov = 45;
```

The camera must not support:

* player rotation
* pinch zoom
* pan
* free camera movement

Gameplay framing should roughly be:

```text
┌────────────────────────┐
│ ♥ ♥ ♥       SCORE 3    │
│                        │
│          ◎             │
│        TARGET          │
│                        │
│       \  |  /          │
│     ---  ●  ---        │
│       /  |  \          │
│        ROTOR           │
│                        │
│          •             │
│         •              │
│        •               │
│                        │
│          ●             │
│         BALL           │
│                        │
│      DRAG TO AIM       │
└────────────────────────┘
```

Ball, rotor and target must all be readable simultaneously.

---

# 6. Project Structure

Create or adapt toward:

```text
src/
├── game/
│   ├── Game.ts
│   ├── GameState.ts
│   ├── RunManager.ts
│   ├── ShotManager.ts
│   └── gameTuning.ts
│
├── scene/
│   ├── GameScene.ts
│   ├── CameraController.ts
│   ├── Lighting.ts
│   └── PrototypeEnvironment.ts
│
├── projectile/
│   ├── Projectile.ts
│   ├── ProjectileSystem.ts
│   ├── AimSystem.ts
│   └── TrajectoryPredictor.ts
│
├── obstacles/
│   ├── RotorObstacle.ts
│   ├── RotorGeometry.ts
│   └── ObstacleCollision.ts
│
├── target/
│   ├── Target.ts
│   ├── TargetCollision.ts
│   └── TargetScoring.ts
│
├── config/
│   ├── ShotConfig.ts
│   └── prototypeShots.ts
│
├── feedback/
│   ├── Haptics.ts
│   ├── CameraShake.ts
│   └── Particles.ts
│
├── ui/
│   ├── HUD.tsx
│   ├── ResultFeedback.tsx
│   └── DebugOverlay.tsx
│
└── utils/
```

Adapt naming where required by the selected rendering library.

Maintain separation between:

* rendering
* physics/game simulation
* configuration
* React Native UI
* feedback

Do not place the core game simulation inside React render cycles.

---

# 7. Game State

Implement an explicit state machine:

```text
READY
  ↓
AIMING
  ↓
PROJECTILE_ACTIVE
  ↓
RESULT
  ↓
RESETTING
  ↓
READY
```

Also support:

```text
RUN_OVER
PROTOTYPE_COMPLETE
```

Only one projectile may be active.

Input must be disabled during:

```text
PROJECTILE_ACTIVE
RESULT
RESETTING
```

---

# 8. Projectile

Use a sphere.

Initial configuration:

```ts
radius = 0.28;

startPosition = {
  x: 0,
  y: 0.6,
  z: 0,
};
```

Use deterministic arcade projectile physics.

Do not add a general-purpose rigid-body physics engine unless absolutely necessary.

Simulation:

```ts
velocity.y -= gravity * dt;

position.x += velocity.x * dt;
position.y += velocity.y * dt;
position.z += velocity.z * dt;
```

Initial tuning:

```ts
gravity = 3.5;

minForwardVelocity = 7;
maxForwardVelocity = 11;

maxHorizontalVelocity = 4;
maxVerticalVelocity = 5;
```

Use delta time.

Clamp unusually large frame deltas to prevent simulation explosions after application stalls/background transitions.

---

# 9. Touch Input

Interaction:

**Touch/drag from ball → pull → release**

The drag direction determines aim.

Drag distance determines power.

Record pointer/touch start.

During drag:

```ts
deltaX = currentX - startX;
deltaY = currentY - startY;
```

Normalize:

```ts
normalizedX = deltaX / screenWidth;
normalizedY = deltaY / screenHeight;
```

Convert drag into aim:

```ts
aimX = -normalizedX;
aimY = normalizedY;
```

Calculate:

```ts
dragDistance = Math.sqrt(
  normalizedX * normalizedX +
  normalizedY * normalizedY
);
```

Power:

```ts
power = clamp(
  dragDistance / MAX_DRAG,
  0,
  1
);
```

Launch:

```ts
velocity.x =
  aimX * MAX_HORIZONTAL_VELOCITY;

velocity.y =
  BASE_VERTICAL_VELOCITY +
  aimY * MAX_VERTICAL_VELOCITY;

velocity.z =
  lerp(
    MIN_FORWARD_VELOCITY,
    MAX_FORWARD_VELOCITY,
    power
  );
```

Tune this based on device testing.

The interaction must feel more important than mathematical realism.

---

# 10. Aim Trajectory

While aiming, display approximately:

```text
6–9 dots
```

showing only the first approximately:

```text
30–40%
```

of the predicted trajectory.

Do not show a complete path through the rotor to the target.

Prediction must use the exact same physics constants as the actual projectile.

Prediction:

```ts
x =
  start.x +
  velocity.x * t;

y =
  start.y +
  velocity.y * t -
  0.5 * gravity * t * t;

z =
  start.z +
  velocity.z * t;
```

The visual prediction and actual projectile path should closely match.

---

# 11. Rotor

The first obstacle is a procedural ventilation-style rotor.

Construct from:

```text
Outer ring
Center hub
2–4 blades
```

Initial dimensions:

```ts
center = {
  x: 0,
  y: 3,
  z: 6,
};

outerRadius = 2.0;

hubRadius = 0.38;

bladeLength = 1.55;

bladeWidth = 0.38;

bladeDepth = 0.15;
```

Parent all blades under one rotor transform.

Rotation:

```ts
rotation +=
  speed *
  direction *
  dt;
```

Direction:

```ts
1 = clockwise
-1 = counter-clockwise
```

The rotor must visually rotate smoothly at 60 FPS.

---

# 12. Collision Model

Do not use generic rigid-body collision for Prototype 0.1.

Use deterministic gameplay-plane collision.

Track:

```ts
previousZ;
currentZ;
```

Rotor crossing occurs when:

```ts
previousZ < rotorZ &&
currentZ >= rotorZ
```

Interpolate the projectile position at exactly:

```text
Z = rotorZ
```

Perform rotor collision using that interpolated X/Y position.

This prevents fast projectiles from tunneling through thin blades.

---

# 13. Rotor Collision

Convert projectile position into rotor-local coordinates.

Treat each blade as a rotated rectangle or capsule.

For each blade:

1. Transform projectile center into blade-local space.
2. Find closest point on blade.
3. Measure distance to projectile center.
4. Include projectile radius.
5. Register collision when overlap occurs.

Also test:

* center hub
* outer rotor frame

Possible result:

```text
ROTOR_HIT
```

or:

```text
ROTOR_CLEAR
```

The projectile must physically fit through visible openings.

Collision geometry should approximately correspond to rendered geometry.

---

# 14. Rotor Hit Feedback

On collision:

* trigger medium haptic
* spawn small procedural sparks
* apply subtle camera shake
* trigger placeholder impact audio hook
* visually ricochet projectile

Fake ricochet is acceptable.

Example:

```ts
velocity.z = -2;
velocity.y += 1.5;
velocity.x += impactDirection * 2;
```

After approximately:

```text
0.7–1.0 seconds
```

reset the shot.

Remove one heart.

---

# 15. Target

Place target at:

```ts
z = 12;
```

Default center:

```ts
x = 0;
y = 3;
```

Default radius:

```ts
radius = 1.0;
```

Construct target from primitive concentric circles/rings.

The target must remain visually readable behind the rotor.

Target positions will change between ShotConfigs.

---

# 16. Target Collision

Detect target plane crossing:

```ts
previousZ < targetZ &&
currentZ >= targetZ
```

Interpolate X/Y at the exact target Z plane.

Calculate:

```ts
dx = projectileX - targetX;
dy = projectileY - targetY;

distance = Math.sqrt(
  dx * dx +
  dy * dy
);
```

Initial zones:

```text
MISS
distance > 1.00

HIT
distance <= 1.00

GREAT
distance <= 0.70

BULLSEYE
distance <= 0.40

PERFECT
distance <= 0.18
```

Make radii configurable.

---

# 17. Target Feedback

## HIT

* small target pulse
* small particle burst
* light haptic

## GREAT

* stronger target pulse
* slightly larger particles

## BULLSEYE

Display:

```text
BULLSEYE +2
```

Use:

* larger particles
* stronger haptic
* noticeable target reaction

## PERFECT

Display:

```text
PERFECT +3
```

Use:

* large but inexpensive particle burst
* strong haptic
* target pulse
* approximately 0.2–0.3 second dramatic slowdown if implementation remains simple

Do not introduce expensive post-processing.

---

# 18. Lives

Start each run with:

```text
♥ ♥ ♥
```

Lose one heart for:

```text
Rotor collision
Target miss
```

Successful target hit does not consume a heart.

At zero hearts:

```text
RUN OVER
```

Display:

```text
Score
Shot Reached
Bullseyes
Perfects

TRY AGAIN
```

Try Again resets to Shot 1.

---

# 19. Score

Use:

```text
HIT       +1
GREAT     +1
BULLSEYE  +2
PERFECT   +3
```

Track internally:

```text
score
shotsAttempted
shotsCompleted
rotorHits
targetMisses
bullseyes
perfects
currentStreak
```

Do not implement multipliers yet.

---

# 20. Shot Configuration

Gameplay progression must be data-driven.

Create:

```ts
interface ShotConfig {
  id: number;

  rotor: {
    bladeCount: number;
    rotationSpeed: number;
    direction: 1 | -1;

    speedPulse?: {
      amplitude: number;
      frequency: number;
    };

    reverseInterval?: number;
  };

  target: {
    x: number;
    y: number;
    radius: number;
  };
}
```

Do not create eight separate hard-coded gameplay implementations.

---

# 21. Prototype Shots

## Shot 1

Purpose:

Teach throwing.

```ts
{
  id: 1,
  rotor: {
    bladeCount: 2,
    rotationSpeed: 0.55,
    direction: 1
  },
  target: {
    x: 0,
    y: 3,
    radius: 1.2
  }
}
```

---

## Shot 2

Purpose:

Basic timing.

```ts
{
  id: 2,
  rotor: {
    bladeCount: 3,
    rotationSpeed: 0.65,
    direction: 1
  },
  target: {
    x: 0,
    y: 3,
    radius: 1.1
  }
}
```

---

## Shot 3

Purpose:

Projectile travel-time prediction.

```ts
{
  id: 3,
  rotor: {
    bladeCount: 3,
    rotationSpeed: 0.9,
    direction: 1
  },
  target: {
    x: 0,
    y: 3,
    radius: 1.05
  }
}
```

---

## Shot 4

Purpose:

Introduce directional aiming.

```ts
{
  id: 4,
  rotor: {
    bladeCount: 3,
    rotationSpeed: 0.8,
    direction: 1
  },
  target: {
    x: -0.8,
    y: 3.15,
    radius: 1.0
  }
}
```

---

## Shot 5

Purpose:

Aim right and reverse rotational prediction.

```ts
{
  id: 5,
  rotor: {
    bladeCount: 3,
    rotationSpeed: 0.9,
    direction: -1
  },
  target: {
    x: 0.9,
    y: 2.8,
    radius: 0.95
  }
}
```

---

## Shot 6

Purpose:

Reduce available openings.

```ts
{
  id: 6,
  rotor: {
    bladeCount: 4,
    rotationSpeed: 0.8,
    direction: 1
  },
  target: {
    x: -0.4,
    y: 3.25,
    radius: 0.9
  }
}
```

---

## Shot 7

Purpose:

Introduce readable variable speed.

```ts
{
  id: 7,
  rotor: {
    bladeCount: 3,
    rotationSpeed: 0.65,
    direction: 1,
    speedPulse: {
      amplitude: 0.35,
      frequency: 0.7
    }
  },
  target: {
    x: 0.5,
    y: 3.1,
    radius: 0.9
  }
}
```

Calculate:

```ts
currentSpeed =
  baseSpeed +
  Math.sin(
    elapsedTime *
    frequency *
    Math.PI *
    2
  ) * amplitude;
```

---

## Shot 8

Purpose:

Final Prototype 0.1 challenge.

```ts
{
  id: 8,
  rotor: {
    bladeCount: 3,
    rotationSpeed: 0.9,
    direction: 1,
    reverseInterval: 2.5
  },
  target: {
    x: -0.6,
    y: 2.9,
    radius: 0.85
  }
}
```

Do not instantly reverse.

Ease through zero:

```text
+0.9
+0.5
+0.2
0
-0.2
-0.5
-0.9
```

The reversal should remain visually predictable.

---

# 22. Shot Progression

On successful target hit:

```text
Target Hit
    ↓
Feedback
    ↓
Update Score
    ↓
~0.5–1 second pause
    ↓
Load Next ShotConfig
    ↓
Reset Projectile
    ↓
READY
```

After Shot 8:

```text
PROTOTYPE COMPLETE
```

Display:

```text
Score

Bullseyes
Perfects
Rotor Hits
Target Misses

PLAY AGAIN
```

Play Again starts Shot 1.

Do not implement endless mode yet.

---

# 23. Prototype Environment

Create a minimal low-poly Workshop.

Use approximately:

```text
Floor plane

2 side walls

3–5 ceiling beams

4–6 box-shaped crates

optional cylinders/pipes

simple background wall/opening
```

Lighting:

```text
Ambient light
+
one directional/key light
```

Keep the center corridor clear.

The environment should frame the gameplay rather than compete with it.

---

# 24. HUD

Keep UI minimal.

Top:

```text
♥ ♥ ♥          SCORE 4
```

Optional:

```text
SHOT 3 / 8
```

During initial onboarding only:

```text
DRAG TO AIM
RELEASE TO THROW
```

Do not create a large tutorial modal.

The game should teach primarily through interaction.

---

# 25. Debug Mode

Implement a development-only debug overlay.

It should be easily toggled.

Display:

```text
FPS

Shot ID
Game State

Projectile
X
Y
Z

Velocity
X
Y
Z

Rotor Angle
Rotor Speed

Aim X
Aim Y
Power

Last Result
```

Optional visual debug geometry:

```text
Projectile collision radius
Blade collision bounds
Rotor plane
Target plane
Target hit radius
```

This is important for agent-assisted development.

Do not remove debug capabilities when polishing the prototype; simply disable them for normal play.

---

# 26. Central Tuning

Create:

```text
src/game/gameTuning.ts
```

Use something similar to:

```ts
export const GAME_TUNING = {
  gravity: 3.5,

  projectile: {
    radius: 0.28,
    minForwardVelocity: 7,
    maxForwardVelocity: 11,
    maxHorizontalVelocity: 4,
    maxVerticalVelocity: 5,
  },

  rotor: {
    z: 6,
    radius: 2,
    hubRadius: 0.38,
    bladeLength: 1.55,
    bladeWidth: 0.38,
    bladeDepth: 0.15,
  },

  target: {
    z: 12,
  },

  camera: {
    position: [0, 3.2, -8.5],
    lookAt: [0, 2.5, 6],
    fov: 45,
  },

  timing: {
    resultDelay: 700,
    resetDelay: 300,
  },
};
```

Avoid magic numbers elsewhere.

---

# 27. Performance

Target:

```text
60 FPS
```

on a reasonably modern iOS/Android phone.

Avoid:

* unnecessary object creation per frame
* excessive React state updates during animation
* high-poly meshes
* expensive shadows
* large particle systems
* complex post-processing
* unnecessary physics packages

The render/game loop should own frequently changing transform data rather than pushing every frame through React state.

Pause or safely suspend the game loop when the application backgrounds.

---

# 28. Implementation Order

Follow this order.

## Phase 1 — Bootstrap

Create/verify Expo project.

Configure:

* TypeScript
* portrait orientation
* selected 3D rendering solution
* development build if necessary

Render one primitive sphere successfully on iOS/Android.

Stop and fix rendering/toolchain issues before implementing gameplay.

---

## Phase 2 — Static Gameplay Scene

Render:

```text
Ball
Rotor
Target
Camera
Basic lighting
```

No gameplay yet.

Verify correct portrait framing.

---

## Phase 3 — Rotor

Implement:

* 2–4 blades
* rotation
* configurable speed
* configurable direction

Verify stable animation.

---

## Phase 4 — Aim

Implement:

```text
touch
drag
power
aim
trajectory dots
```

No projectile launch yet.

Verify trajectory responds correctly.

---

## Phase 5 — Projectile

Implement launch.

Verify:

```text
drag
release
flight
```

Trajectory preview must match actual flight.

---

## Phase 6 — Rotor Collision

Implement plane crossing and blade collision.

Test intentionally:

```text
direct blade hit
hub hit
frame hit
clean gap
very close gap
```

Do not proceed until collision feels trustworthy.

---

## Phase 7 — Target

Implement:

```text
MISS
HIT
GREAT
BULLSEYE
PERFECT
```

Verify offset targets work.

---

## Phase 8 — State Machine

Implement:

```text
READY
AIMING
PROJECTILE_ACTIVE
RESULT
RESETTING
```

Prevent duplicate throws.

---

## Phase 9 — Shots 1–8

Add `prototypeShots.ts`.

Verify every challenge loads from configuration.

---

## Phase 10 — Lives and Run State

Implement:

```text
3 hearts
run over
prototype complete
restart
```

---

## Phase 11 — Feedback

Add:

```text
haptics
particles
camera shake
ricochet
target pulse
result text
```

Keep effects inexpensive.

---

## Phase 12 — Workshop Skin

Only now add:

```text
floor
walls
beams
crates
simple lighting improvements
```

Do not change gameplay mechanics while decorating the scene unless testing identifies a genuine gameplay issue.

---

# 29. Explicitly Out of Scope

Do not implement:

* endless mode
* Rooftop
* Space
* additional worlds
* procedural challenge generation
* ads
* IAP
* RevenueCat
* authentication
* backend
* analytics SDK
* store
* cosmetics
* unlockable balls
* achievements
* leaderboard
* daily challenges
* level map
* complicated menu system
* imported 3D assets
* realistic physics simulation

Prototype 0.1 validates one thing:

**Is throwing through a moving opening fun?**

---

# 30. Acceptance Criteria

Prototype 0.1 is complete only when:

* App runs on a physical portrait mobile device.
* Player can drag the ball and release to throw.
* Drag direction affects aim.
* Drag distance affects power.
* Trajectory dots update while aiming.
* Actual flight closely follows trajectory prediction.
* Rotor rotates smoothly.
* 2-, 3- and 4-blade configurations work.
* Ball can visibly pass through rotor openings.
* Ball collides correctly with blades.
* Ball collides correctly with hub.
* Ball collides correctly with outer frame.
* Near misses behave consistently.
* Ball continues toward target after clearing rotor.
* Ball can clear rotor and still miss target.
* Offset targets require actual aiming.
* HIT detection works.
* BULLSEYE detection works.
* PERFECT detection works.
* Rotor impact has clear feedback.
* Target hit has clear feedback.
* Perfect feels noticeably better than a normal hit.
* Three-heart system works.
* Shots 1–8 load sequentially from data.
* Run Over works.
* Prototype Complete works.
* Play Again works.
* Debug mode exposes useful simulation state.
* Major tuning variables are centralized.
* Gameplay remains smooth on target hardware.

---

# 31. Agent Rules

While implementing this specification:

1. Inspect the existing project before changing architecture.
2. Reuse compatible existing dependencies where sensible.
3. Verify current Expo compatibility before installing packages.
4. Do not downgrade Expo without explicit approval.
5. Do not replace working project infrastructure unnecessarily.
6. Keep TypeScript errors at zero.
7. Run lint/typecheck after meaningful implementation stages.
8. Test actual behavior rather than assuming compilation means gameplay works.
9. Keep gameplay values configurable.
10. Do not expand scope beyond this document.
11. If a technical limitation requires deviating from the specification, document the reason and choose the simplest maintainable alternative.
12. Prefer deterministic, understandable game code over clever abstractions.
13. Preserve debug tooling.
14. Do not spend time polishing art before the core shot is playable.
15. Optimize for a prototype that can be tuned rapidly.

---

# 32. Final Agent Deliverable

When implementation is complete, report:

```text
IMPLEMENTED
- ...

DEPENDENCIES ADDED
- ...

IMPORTANT FILES
- ...

TUNING VALUES
- ...

HOW TO RUN
- ...

HOW TO ENABLE DEBUG MODE
- ...

KNOWN ISSUES
- ...

DEVIATIONS FROM SPEC
- ...

RECOMMENDED PLAYTEST QUESTIONS
- ...
```

Do not begin Prototype 0.2 automatically.

Prototype 0.1 must first be played and evaluated.

## Primary Validation Question

After a player understands the controls:

> Does successfully predicting the moving opening, throwing through it, and hitting the target create enough satisfaction that the player immediately wants another attempt?

Everything in Prototype 0.1 should serve that question.
