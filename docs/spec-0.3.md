# Prototype 0.2 — 30-Shot Authored Test Run

## Agent Mission

Add a fixed 30-shot playtest sequence to the existing Prototype 0.2 game.

The purpose is to validate:

* difficulty progression
* moving targets
* moving rotors
* reversing rotors
* pulsing rotors
* dual-depth obstacles
* mechanic combinations
* fairness
* long-run engagement

This is a **playtest mode only**.

Do not modify the existing:

* `ChallengeGenerator`
* generator probabilities
* difficulty budget
* `ChallengeValidator`
* seeded generation
* environment progression
* projectile physics
* aiming controls

The authored run should bypass challenge generation when enabled.

---

# 1. Run Mode

Add a development configuration:

```ts
export type RunMode =
  | "GENERATED"
  | "AUTHORED_30";
```

Central configuration:

```ts
runMode: "AUTHORED_30"
```

When:

```text
AUTHORED_30
```

load challenges sequentially from:

```text
authored30ShotRun.ts
```

When:

```text
GENERATED
```

preserve existing behavior exactly.

---

# 2. Important Failure Behavior

For this playtest mode, a failed shot must **retry the same shot number**.

Example:

```text
Shot 14
↓
Rotor collision
↓
Lose heart
↓
Retry Shot 14
```

Do not advance to Shot 15 after failure.

This is necessary so each authored challenge is actually tested.

For development testing, optionally support:

```text
Unlimited Hearts: ON/OFF
```

Default normal playtest:

```text
3 hearts
```

Development mode may enable unlimited hearts to inspect all 30 challenges without restarting.

---

# 3. Shared Gameplay Values

Unless a shot overrides them:

```ts
const DEFAULTS = {
  rotorZ: 6,
  secondRotorZ: 9,

  rotorCenterX: 0,
  rotorCenterY: 3,

  targetZ: 12,
  targetX: 0,
  targetY: 3,

  targetRadius: 1.0,
};
```

Use existing Prototype 0.2 tuning where it differs from these illustrative values.

Do not regress currently tuned gameplay merely to match exact numbers in this document.

---

# 4. Difficulty Philosophy

The progression must follow:

```text
LEARN
↓
REINFORCE
↓
INTRODUCE ONE NEW VARIABLE
↓
REINFORCE
↓
COMBINE
↓
INTRODUCE NEXT VARIABLE
```

Do not make difficulty primarily about speed.

Difficulty should increasingly come from:

```text
timing
+
aim
+
movement
+
prediction
+
depth
```

---

# PHASE A — FOUNDATION

## Shots 1–5

Goal:

Confirm that the finalized aiming controls still work well against straightforward challenges.

No moving targets.

No moving rotors.

No dual rotors.

---

# Shot 1 — Warm-Up

```ts
{
  id: "A01",

  obstacles: [
    {
      z: 6,
      bladeCount: 2,
      rotationSpeed: 0.50,
      direction: 1
    }
  ],

  target: {
    x: 0,
    y: 3,
    radius: 1.20
  }
}
```

Purpose:

Immediate easy success.

Expected:

Player should almost always understand the shot.

---

# Shot 2 — Three Blades

```ts
{
  id: "A02",

  obstacles: [
    {
      z: 6,
      bladeCount: 3,
      rotationSpeed: 0.60,
      direction: 1
    }
  ],

  target: {
    x: 0,
    y: 3,
    radius: 1.10
  }
}
```

Purpose:

Basic timing.

---

# Shot 3 — Aim Left

```ts
{
  id: "A03",

  obstacles: [
    {
      z: 6,
      bladeCount: 3,
      rotationSpeed: 0.65,
      direction: 1
    }
  ],

  target: {
    x: -0.75,
    y: 3.20,
    radius: 1.05
  }
}
```

Purpose:

Horizontal precision.

This is particularly important after the aiming-control changes.

---

# Shot 4 — Aim High Right

```ts
{
  id: "A04",

  obstacles: [
    {
      z: 6,
      bladeCount: 3,
      rotationSpeed: 0.70,
      direction: -1
    }
  ],

  target: {
    x: 0.75,
    y: 3.55,
    radius: 1.05
  }
}
```

Purpose:

Validate:

* right aiming
* higher trajectory
* counter-clockwise timing

This is a regression test for the previously reported inability to aim sufficiently high.

---

# Shot 5 — Four Blades

```ts
{
  id: "A05",

  obstacles: [
    {
      z: 6,
      bladeCount: 4,
      rotationSpeed: 0.65,
      direction: 1
    }
  ],

  target: {
    x: -0.30,
    y: 3.10,
    radius: 1.00
  }
}
```

Purpose:

Reduce timing window without excessive speed.

---

# PHASE B — MOVING TARGETS

## Shots 6–10

Introduce target movement.

Rotor remains predictable.

The player should learn:

> Aim where the target will be.

---

# Shot 6 — First Moving Target

```ts
{
  id: "B06",

  obstacles: [
    {
      z: 6,
      bladeCount: 2,
      rotationSpeed: 0.50,
      direction: 1
    }
  ],

  target: {
    x: 0,
    y: 3,
    radius: 1.15,

    movement: {
      type: "horizontal",
      amplitude: 0.45,
      speed: 0.40
    }
  }
}
```

Purpose:

Gentle introduction.

This should feel easy.

---

# Shot 7 — Wider Travel

```ts
{
  id: "B07",

  obstacles: [
    {
      z: 6,
      bladeCount: 2,
      rotationSpeed: 0.55,
      direction: -1
    }
  ],

  target: {
    x: 0,
    y: 3,
    radius: 1.10,

    movement: {
      type: "horizontal",
      amplitude: 0.75,
      speed: 0.45
    }
  }
}
```

Purpose:

Require stronger target leading without making it fast.

---

# Shot 8 — Three Blades + Moving Target

```ts
{
  id: "B08",

  obstacles: [
    {
      z: 6,
      bladeCount: 3,
      rotationSpeed: 0.60,
      direction: 1
    }
  ],

  target: {
    x: 0,
    y: 3,
    radius: 1.05,

    movement: {
      type: "horizontal",
      amplitude: 0.65,
      speed: 0.50
    }
  }
}
```

Purpose:

Combine basic rotor timing with target leading.

---

# Shot 9 — Vertical Target

```ts
{
  id: "B09",

  obstacles: [
    {
      z: 6,
      bladeCount: 3,
      rotationSpeed: 0.60,
      direction: -1
    }
  ],

  target: {
    x: 0.25,
    y: 3,
    radius: 1.05,

    movement: {
      type: "vertical",
      amplitude: 0.40,
      speed: 0.45
    }
  }
}
```

Purpose:

Validate vertical aiming against movement.

Do not make this target small.

---

# Shot 10 — Target Prediction Test

```ts
{
  id: "B10",

  obstacles: [
    {
      z: 6,
      bladeCount: 3,
      rotationSpeed: 0.70,
      direction: 1
    }
  ],

  target: {
    x: 0,
    y: 3,
    radius: 1.00,

    movement: {
      type: "horizontal",
      amplitude: 0.90,
      speed: 0.55
    }
  }
}
```

Purpose:

First meaningful target-leading challenge.

Should be challenging but readable.

---

# PHASE C — MOVING ROTORS

## Shots 11–15

Targets become mostly stationary again.

Introduce translation of the rotor itself.

The player learns:

> The opening itself can move through space.

---

# Shot 11 — First Moving Rotor

```ts
{
  id: "C11",

  obstacles: [
    {
      z: 6,
      bladeCount: 2,
      rotationSpeed: 0.50,
      direction: 1,

      movement: {
        type: "horizontal",
        amplitude: 0.35,
        speed: 0.35
      }
    }
  ],

  target: {
    x: 0,
    y: 3,
    radius: 1.15
  }
}
```

Purpose:

Gentle introduction.

---

# Shot 12 — Wider Rotor Movement

```ts
{
  id: "C12",

  obstacles: [
    {
      z: 6,
      bladeCount: 3,
      rotationSpeed: 0.55,
      direction: 1,

      movement: {
        type: "horizontal",
        amplitude: 0.60,
        speed: 0.40
      }
    }
  ],

  target: {
    x: 0,
    y: 3,
    radius: 1.10
  }
}
```

---

# Shot 13 — Moving Rotor + Offset Target

```ts
{
  id: "C13",

  obstacles: [
    {
      z: 6,
      bladeCount: 3,
      rotationSpeed: 0.60,
      direction: -1,

      movement: {
        type: "horizontal",
        amplitude: 0.55,
        speed: 0.45
      }
    }
  ],

  target: {
    x: 0.65,
    y: 3.15,
    radius: 1.05
  }
}
```

Purpose:

Player must find a path through moving opening toward an offset destination.

---

# Shot 14 — Moving Rotor + Smaller Target

```ts
{
  id: "C14",

  obstacles: [
    {
      z: 6,
      bladeCount: 3,
      rotationSpeed: 0.65,
      direction: 1,

      movement: {
        type: "horizontal",
        amplitude: 0.65,
        speed: 0.50
      }
    }
  ],

  target: {
    x: -0.45,
    y: 3.25,
    radius: 0.90
  }
}
```

---

# Shot 15 — Both Move

```ts
{
  id: "C15",

  obstacles: [
    {
      z: 6,
      bladeCount: 3,
      rotationSpeed: 0.60,
      direction: 1,

      movement: {
        type: "horizontal",
        amplitude: 0.50,
        speed: 0.40
      }
    }
  ],

  target: {
    x: 0,
    y: 3,
    radius: 1.00,

    movement: {
      type: "horizontal",
      amplitude: 0.60,
      speed: 0.40,
      phase: 3.14159
    }
  }
}
```

Purpose:

Rotor and target move opposite each other.

This is the first major combination test.

Do not increase speed beyond these moderate values.

---

# PHASE D — ROTOR BEHAVIOR

## Shots 16–20

Now introduce changing rotor behavior.

Avoid introducing dual-depth obstacles yet.

---

# Shot 16 — Reverse Rotor

```ts
{
  id: "D16",

  obstacles: [
    {
      z: 6,
      bladeCount: 3,
      rotationSpeed: 0.70,
      direction: 1,
      reverseInterval: 3.0
    }
  ],

  target: {
    x: 0,
    y: 3,
    radius: 1.05
  }
}
```

Purpose:

Teach reversal independently.

---

# Shot 17 — Pulse Rotor

```ts
{
  id: "D17",

  obstacles: [
    {
      z: 6,
      bladeCount: 3,
      rotationSpeed: 0.60,
      direction: 1,

      speedPulse: {
        amplitude: 0.22,
        frequency: 0.55
      }
    }
  ],

  target: {
    x: -0.35,
    y: 3.10,
    radius: 1.00
  }
}
```

Purpose:

Speed variation should be visible, not deceptive.

---

# Shot 18 — Reverse + Offset

```ts
{
  id: "D18",

  obstacles: [
    {
      z: 6,
      bladeCount: 3,
      rotationSpeed: 0.75,
      direction: -1,
      reverseInterval: 2.8
    }
  ],

  target: {
    x: 0.75,
    y: 3.30,
    radius: 0.95
  }
}
```

---

# Shot 19 — Pulse + Moving Target

```ts
{
  id: "D19",

  obstacles: [
    {
      z: 6,
      bladeCount: 3,
      rotationSpeed: 0.60,
      direction: 1,

      speedPulse: {
        amplitude: 0.20,
        frequency: 0.50
      }
    }
  ],

  target: {
    x: 0,
    y: 3,
    radius: 1.00,

    movement: {
      type: "horizontal",
      amplitude: 0.55,
      speed: 0.40
    }
  }
}
```

---

# Shot 20 — Moving Reverse Rotor

```ts
{
  id: "D20",

  obstacles: [
    {
      z: 6,
      bladeCount: 3,
      rotationSpeed: 0.65,
      direction: 1,
      reverseInterval: 3.0,

      movement: {
        type: "horizontal",
        amplitude: 0.45,
        speed: 0.35
      }
    }
  ],

  target: {
    x: -0.40,
    y: 3.15,
    radius: 0.95
  }
}
```

Purpose:

Final single-obstacle mastery test.

If this feels unfair, do not proceed by simply slowing everything.

Determine which combination is causing poor readability.

---

# PHASE E — DUAL DEPTH

## Shots 21–25

Introduce the second obstacle plane.

Keep both rotors relatively easy initially.

---

# Shot 21 — First Dual Rotor

```ts
{
  id: "E21",

  obstacles: [
    {
      z: 6,
      bladeCount: 2,
      rotationSpeed: 0.45,
      direction: 1,
      phase: 0
    },

    {
      z: 9,
      bladeCount: 2,
      rotationSpeed: 0.40,
      direction: 1,
      phase: 0.75
    }
  ],

  target: {
    x: 0,
    y: 3,
    radius: 1.15
  }
}
```

Purpose:

Understand depth.

This should not be a difficulty spike.

---

# Shot 22 — Counter Rotation

```ts
{
  id: "E22",

  obstacles: [
    {
      z: 6,
      bladeCount: 2,
      rotationSpeed: 0.50,
      direction: 1
    },

    {
      z: 9,
      bladeCount: 2,
      rotationSpeed: 0.45,
      direction: -1,
      phase: 1.2
    }
  ],

  target: {
    x: 0,
    y: 3,
    radius: 1.10
  }
}
```

Purpose:

First genuine two-future-state prediction.

---

# Shot 23 — Different Blade Counts

```ts
{
  id: "E23",

  obstacles: [
    {
      z: 6,
      bladeCount: 3,
      rotationSpeed: 0.50,
      direction: 1
    },

    {
      z: 9,
      bladeCount: 2,
      rotationSpeed: 0.55,
      direction: -1,
      phase: 0.8
    }
  ],

  target: {
    x: -0.35,
    y: 3.10,
    radius: 1.05
  }
}
```

---

# Shot 24 — Dual Rotor + Aim

```ts
{
  id: "E24",

  obstacles: [
    {
      z: 6,
      bladeCount: 3,
      rotationSpeed: 0.55,
      direction: -1
    },

    {
      z: 9,
      bladeCount: 3,
      rotationSpeed: 0.45,
      direction: 1,
      phase: 1.4
    }
  ],

  target: {
    x: 0.60,
    y: 3.30,
    radius: 1.00
  }
}
```

---

# Shot 25 — Dual Rotor Accuracy

```ts
{
  id: "E25",

  obstacles: [
    {
      z: 6,
      bladeCount: 3,
      rotationSpeed: 0.60,
      direction: 1
    },

    {
      z: 9,
      bladeCount: 2,
      rotationSpeed: 0.55,
      direction: -1,
      phase: 1.0
    }
  ],

  target: {
    x: -0.55,
    y: 3.25,
    radius: 0.90
  }
}
```

Purpose:

Complete dual rotors and still land an accurate shot.

---

# PHASE F — COMBINATIONS

## Shots 26–30

Combine learned mechanics.

Do not introduce any new mechanic.

These shots should feel demanding because the player has to use skills learned during Shots 1–25.

---

# Shot 26 — Dual Rotor + Moving Target

```ts
{
  id: "F26",

  obstacles: [
    {
      z: 6,
      bladeCount: 2,
      rotationSpeed: 0.55,
      direction: 1
    },

    {
      z: 9,
      bladeCount: 2,
      rotationSpeed: 0.50,
      direction: -1,
      phase: 1.0
    }
  ],

  target: {
    x: 0,
    y: 3,
    radius: 1.00,

    movement: {
      type: "horizontal",
      amplitude: 0.45,
      speed: 0.35
    }
  }
}
```

Purpose:

First full depth + target prediction test.

---

# Shot 27 — Moving Front Rotor

```ts
{
  id: "F27",

  obstacles: [
    {
      z: 6,
      bladeCount: 2,
      rotationSpeed: 0.55,
      direction: 1,

      movement: {
        type: "horizontal",
        amplitude: 0.35,
        speed: 0.35
      }
    },

    {
      z: 9,
      bladeCount: 2,
      rotationSpeed: 0.50,
      direction: -1,
      phase: 0.9
    }
  ],

  target: {
    x: 0.40,
    y: 3.15,
    radius: 1.00
  }
}
```

---

# Shot 28 — Moving Rear Rotor

```ts
{
  id: "F28",

  obstacles: [
    {
      z: 6,
      bladeCount: 3,
      rotationSpeed: 0.55,
      direction: -1
    },

    {
      z: 9,
      bladeCount: 2,
      rotationSpeed: 0.50,
      direction: 1,
      phase: 1.2,

      movement: {
        type: "horizontal",
        amplitude: 0.40,
        speed: 0.35
      }
    }
  ],

  target: {
    x: -0.45,
    y: 3.20,
    radius: 0.95
  }
}
```

Purpose:

The later obstacle is moving, requiring longer-horizon prediction.

---

# Shot 29 — Counter Rotation + Moving Target

```ts
{
  id: "F29",

  obstacles: [
    {
      z: 6,
      bladeCount: 3,
      rotationSpeed: 0.55,
      direction: 1
    },

    {
      z: 9,
      bladeCount: 2,
      rotationSpeed: 0.60,
      direction: -1,
      phase: 1.3
    }
  ],

  target: {
    x: 0,
    y: 3,
    radius: 0.90,

    movement: {
      type: "horizontal",
      amplitude: 0.50,
      speed: 0.40
    }
  }
}
```

Purpose:

High challenge without excessive raw speed.

---

# Shot 30 — Prototype 0.2 Mastery Shot

```ts
{
  id: "F30",

  obstacles: [
    {
      z: 6,
      bladeCount: 3,
      rotationSpeed: 0.60,
      direction: 1,

      movement: {
        type: "horizontal",
        amplitude: 0.30,
        speed: 0.30
      }
    },

    {
      z: 9,
      bladeCount: 2,
      rotationSpeed: 0.55,
      direction: -1,
      phase: 1.1
    }
  ],

  target: {
    x: 0,
    y: 3.15,
    radius: 0.90,

    movement: {
      type: "horizontal",
      amplitude: 0.40,
      speed: 0.35,
      phase: 2.0
    }
  }
}
```

Purpose:

Final mastery test.

Requires:

* horizontal aiming
* vertical aiming
* timing
* moving-opening prediction
* dual-depth prediction
* moving-target prediction

It should be difficult.

It should **not** feel chaotic.

---

# 5. Environment Assignment

Use the existing Prototype 0.2 environment system.

Assign:

```text
Shots 1–10
WORKSHOP

Shots 11–20
ROOFTOP

Shots 21–30
SPACE
```

This intentionally differs from the normal eight-shot environment cadence.

For this authored playtest only, the environment boundaries align with mechanic phases.

Do not change normal generated-run environment cadence.

---

# 6. Environment Transitions

After:

```text
Shot 10
```

transition:

```text
WORKSHOP → ROOFTOP
```

After:

```text
Shot 20
```

transition:

```text
ROOFTOP → SPACE
```

After Shot 30:

Do not loop.

Display the test results screen.

---

# 7. Completion Screen

After Shot 30:

```text
GAUNTLET COMPLETE

SCORE

ATTEMPTS

ROTOR HITS

TARGET MISSES

BULLSEYES

PERFECTS

NEAR MISSES

BEST STREAK
```

Also calculate:

```text
FIRST-TRY CLEARS
```

This is particularly useful.

A challenge completed without losing a heart/retrying counts as:

```text
FIRST TRY
```

Display:

```text
FIRST-TRY CLEARS
23 / 30
```

---

# 8. Per-Shot Statistics

For `AUTHORED_30`, track:

```ts
interface AuthoredShotStats {
  challengeId: string;

  attempts: number;

  rotorAHits: number;

  rotorBHits: number;

  targetMisses: number;

  successfulResult:
    | "HIT"
    | "GREAT"
    | "BULLSEYE"
    | "PERFECT"
    | null;

  firstTryClear: boolean;

  totalTimeSpent: number;
}
```

Keep this local/in-memory.

No analytics service.

---

# 9. Development Results

In debug/development mode, completion should output a useful summary.

Example:

```text
A01  1 attempt
A02  1 attempt
A03  2 attempts
A04  1 attempt
A05  1 attempt

B06  1 attempt
B07  2 attempts
B08  3 attempts
B09  1 attempt
B10  4 attempts

...

F30  5 attempts
```

This will expose difficulty spikes.

---

# 10. Difficulty Spike Detection

For development purposes, highlight any challenge requiring:

```text
4+ attempts
```

Example:

```text
⚠ B10 — 4 attempts
⚠ D20 — 6 attempts
```

Do not automatically modify those challenges.

We need human playtesting to determine whether the challenge is:

```text
appropriately difficult

or

unfair/frustrating
```

---

# 11. Failure Classification

After a failure, development mode may optionally provide small debug information:

```text
FAILED

ROTOR A
```

or:

```text
FAILED

ROTOR B
```

or:

```text
FAILED

TARGET MISS
```

This should not become production UI yet.

It exists to identify where difficulty comes from.

---

# 12. Playtest Questions

During the 30-shot run, evaluate:

## Controls

Can I consistently aim where I intend?

Can I aim sufficiently high and low?

Does cancel work when intentionally used?

Does cancel activate unintentionally?

Can I make fine horizontal adjustments?

---

## Moving Targets

Do I understand where I need to lead the target?

Does failure feel predictable?

Do moving targets create skill rather than frustration?

---

## Moving Rotors

Can I understand the opening's motion?

Can I predict where the opening will be?

Does translation + rotation remain readable?

---

## Dual Rotors

Can I visually distinguish Rotor A from Rotor B?

Can I understand their relative depths?

Does clearing both feel satisfying?

Can I intentionally plan a shot through both?

---

## Difficulty

Ask after every failure:

> Did I make a mistake, or did the game feel unfair?

The desired answer should overwhelmingly be:

> I made a mistake.

---

# 13. Tuning Rule

Do not react to every failed attempt by making the game easier.

A challenging shot is acceptable.

A shot needs adjustment when:

* failure reason is difficult to understand
* controls cannot express the intended shot
* geometry appears passable but collision says otherwise
* target movement is visually misleading
* rotor depth cannot be understood
* timing window is effectively nonexistent
* success feels accidental rather than intentional

---

# 14. Important Dual-Rotor Test

Pay special attention to Shots:

```text
21–30
```

This is the largest design question in Prototype 0.2.

We need to determine whether:

```text
Ball
↓
Rotor A
↓
Rotor B
↓
Target
```

creates satisfying prediction.

If players cannot meaningfully predict both rotors and instead simply throw repeatedly until lucky, dual rotors need redesign.

Do not interpret eventual success as proof the mechanic works.

Success should feel **intentional**.

---

# 15. Debug Controls

In development mode support:

```text
Previous Shot

Restart Shot

Next Shot

Jump to Shot

Unlimited Hearts

Restart Gauntlet
```

Jump-to-shot is important.

Do not require replaying 20 challenges merely to tune Shot 21.

---

# 16. Acceptance Criteria

The authored run is implemented correctly when:

* `AUTHORED_30` can be enabled without modifying generator logic.
* Generated mode remains unchanged.
* All 30 challenges load sequentially.
* Failure retries the current challenge.
* Success advances exactly one challenge.
* Shots 1–10 use Workshop.
* Shots 11–20 use Rooftop.
* Shots 21–30 use Space.
* Moving targets work.
* Moving rotors work.
* Reverse rotors work.
* Pulse rotors work.
* Dual rotors work.
* Counter-rotating rotors work.
* Moving rear rotor works.
* Target collision remains accurate.
* Rotor collision remains accurate.
* Per-shot attempts are recorded.
* First-try clears are recorded.
* Failure source is recorded.
* Completion screen appears after Shot 30.
* Generator code/configuration has not been altered.
* Existing generated mode still works.

---

# 17. Explicitly Out of Scope

Do not use this task to add:

```text
❌ New obstacle types

❌ Gates

❌ Shutters

❌ Iris obstacles

❌ Pendulums

❌ Wind

❌ Portals

❌ Ricochets

❌ Power-ups

❌ Coins

❌ Cosmetics

❌ Store

❌ Ads

❌ Revives

❌ IAP

❌ Leaderboards

❌ Achievements

❌ Daily challenges

❌ Generator modifications

❌ Difficulty-budget modifications

❌ Production analytics
```

Do not redesign the aiming system as part of this task unless required to fix an obvious regression.

---

# 18. Agent Implementation Order

## Phase 1

Add:

```text
RunMode
AUTHORED_30
```

Verify generated mode remains unchanged.

## Phase 2

Create:

```text
authored30ShotRun.ts
```

Implement Shots 1–10.

Test.

## Phase 3

Implement Shots 11–20.

Test moving rotor/reversal/pulse behavior.

## Phase 4

Implement Shots 21–30.

Test dual-depth collision carefully.

## Phase 5

Add per-shot statistics.

## Phase 6

Add development navigation:

```text
previous
restart
next
jump
unlimited hearts
```

## Phase 7

Add Gauntlet Complete results.

## Phase 8

Run all 30 challenges.

Typecheck/lint/test.

Do not begin another feature.

---

# 19. Agent Final Report

When complete report:

```text
IMPLEMENTED
- ...

FILES ADDED
- ...

FILES MODIFIED
- ...

RUN MODE TOGGLE
- ...

30-SHOT CONFIG LOCATION
- ...

DEVELOPMENT CONTROLS
- ...

STATISTICS TRACKED
- ...

HOW TO START AUTHORED_30
- ...

HOW TO RETURN TO GENERATED MODE
- ...

TYPECHECK/LINT STATUS
- ...

KNOWN ISSUES
- ...

DEVIATIONS FROM SPEC
- ...
```

Stop after implementation.

Do not tune individual challenges based solely on automated testing.

Human playtesting is required.

---

# 20. What We Are Looking For

This gauntlet is not intended to prove that all 30 challenges can technically be completed.

It is intended to expose the point where the game stops being:

> **skillful**

and starts becoming:

> **awkward, unreadable, repetitive, or lucky.**

Pay particular attention to the transitions:

```text
5 → 6
stationary target → moving target

10 → 11
moving target → moving rotor

15 → 16
movement → changing rotor behavior

20 → 21
single depth → dual depth

25 → 26
dual depth → combined prediction
```

Those are the five major difficulty gates.

The most important section is **Shots 21–30**.

If those shots feel deliberate and satisfying, the game has a strong foundation for endless challenge generation.

If they feel like guessing, do not add more difficulty.

Fix the readability and prediction problem first.
