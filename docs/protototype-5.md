# Prototype 0.5 — Progression & Run Variety

## Agent Mission

Prototype 0.5 should turn the validated endless arcade prototype into a game with meaningful short-term progression and replay variety.

Do NOT add more core obstacle families.

Existing gameplay should already include validated versions of:

* Rotor
* Sliding Gate
* Iris
* Pendulum
* Moving Ring
* Moving Targets
* Multiple obstacle depths
* Workshop
* Rooftop
* Space
* Score
* Streaks
* Close Calls
* Personal bests
* Endless runs

Prototype 0.5 must answer:

> Does giving players milestones, unlocks, and changing run structure make them want to return beyond simply chasing a high score?

---

# 1. Core Principle

Do not change:

```text
DRAG
↓
AIM
↓
WAIT
↓
RELEASE
↓
CLEAR OBSTACLE
↓
HIT TARGET
```

Prototype 0.5 is a progression layer around the validated gameplay.

---

# 2. Add Player Progress

Create local player progression:

```ts
interface PlayerProgress {
  totalXP: number;
  playerLevel: number;

  totalRuns: number;
  totalShotsCleared: number;

  totalBullseyes: number;
  totalPerfects: number;
  totalCloseCalls: number;

  highestScore: number;
  longestRun: number;
  bestStreak: number;

  unlockedProjectileIds: string[];
}
```

Persist locally.

No account/backend yet.

---

# 3. XP

Award XP after runs.

Suggested:

```text
Challenge Cleared     +5 XP
Great                 +1 XP
Bullseye              +2 XP
Perfect               +4 XP
Close Call            +1 XP
Environment Completed +10 XP
```

Do not award XP continuously with large intrusive animations.

Calculate during the run.

Present total earned at Run Over.

Example:

```text
RUN OVER

SCORE
2,850

SHOTS CLEARED
42

+286 XP
```

---

# 4. Player Levels

Use a simple level curve.

Do not create hundreds of levels yet.

Prototype target:

```text
Levels 1–20
```

Use a centralized XP curve.

Example:

```ts
XP_REQUIRED = [
  0,
  100,
  225,
  375,
  550,
  750,
  975,
  1225,
  1500,
  1800,
  ...
];
```

Exact values should be centralized and easy to tune.

---

# 5. Level-Up

When XP crosses a level threshold:

```text
LEVEL UP

LEVEL 6
```

Do not interrupt active projectile gameplay.

Prefer showing level-up:

* during forward transition
* after a successful challenge
* or on Run Over

Never block a shot with a modal.

---

# 6. Projectile Cosmetics

Introduce cosmetic projectile unlocks.

Important:

All projectiles must have identical:

* radius
* mass assumptions
* velocity
* gravity
* collision
* trajectory
* gameplay behavior

Cosmetics must NOT affect gameplay.

---

# 7. Initial Projectile Set

Create approximately 8 lightweight projectile styles.

Use procedural/simple materials.

Examples:

```text
Classic Ball
Steel Ball
Neon Ball
Fireball
Ice Ball
Plasma Ball
Gold Ball
Void Ball
```

These do not require complex imported assets.

Use:

* material differences
* trails
* particles
* simple glow/emissive appearance

where inexpensive.

---

# 8. Unlock Schedule

Example:

```text
Level 1
Classic Ball

Level 3
Steel Ball

Level 5
Neon Ball

Level 7
Fireball

Level 9
Ice Ball

Level 12
Plasma Ball

Level 15
Gold Ball

Level 20
Void Ball
```

Do not add currency.

Unlock through player level only.

---

# 9. Projectile Selection

Create a simple projectile selection screen.

Display:

```text
PROJECTILES

● Classic
✓ SELECTED

● Steel
UNLOCK LEVEL 3

● Neon
UNLOCK LEVEL 5
```

Locked items should clearly show their requirement.

No purchase buttons.

No store yet.

---

# 10. Milestones

Add run milestones.

Examples:

```text
10 Shots
25 Shots
50 Shots
75 Shots
100 Shots
```

During a run, briefly display:

```text
50 SHOTS CLEARED
```

Use subtle celebration:

* haptic
* particles
* brief text

Do not interrupt gameplay.

---

# 11. Skill Milestones

Track milestone achievements internally.

Examples:

```text
FIRST BULLSEYE

FIRST PERFECT

5 PERFECTS IN ONE RUN

10-STREAK

25-STREAK

10 CLOSE CALLS

CLEAR WORKSHOP

CLEAR ROOFTOP

CLEAR SPACE

COMPLETE FIRST LOOP

REACH LOOP 3
```

For Prototype 0.5, these are milestone records.

Do not integrate platform achievements yet.

---

# 12. Run Variety

Runs should not always begin with exactly the same sequence.

Use the existing generator and variety director.

Create several opening profiles.

Example:

```text
PROFILE A
Rotor-heavy opening

PROFILE B
Gate-heavy opening

PROFILE C
Mixed precision opening
```

All profiles should remain easy at the beginning.

Do not randomly begin with difficult dual-obstacle challenges.

---

# 13. Run Themes

Each run may receive a lightweight modifier/theme.

Prototype 0.5 supports only simple modifiers.

Examples:

```text
PRECISION RUN

Targets trend slightly smaller.
```

```text
TIMING RUN

More rotor/iris challenges.
```

```text
MOTION RUN

More moving-ring/gate challenges.
```

```text
CLASSIC RUN

Balanced obstacle distribution.
```

These modify generator weighting.

They do NOT change fundamental physics.

---

# 14. Run Theme Selection

For Prototype 0.5:

Choose the theme automatically at run start.

Example:

```text
MOTION RUN
```

briefly appears.

Do not make players navigate a complicated pre-run menu.

Default distribution should favor:

```text
CLASSIC RUN
```

---

# 15. Theme Safety

Run themes may influence:

```text
obstacle weighting
target weighting
movement weighting
```

They may NOT bypass:

```text
ChallengeValidator
difficulty budget
combination restrictions
```

Fairness remains authoritative.

---

# 16. Environment Identity

Give each environment slightly different challenge weighting.

Example:

## Workshop

Favor:

```text
Rotor
Gate
Pendulum
```

## Rooftop

Favor:

```text
Rotor
Moving Ring
Pendulum
```

## Space

Favor:

```text
Iris
Moving Ring
Rotor
```

Do not make obstacle families exclusive.

The player should still encounter variety everywhere.

---

# 17. Environment Progress

Track lifetime environment statistics:

```text
Workshop Clears
Rooftop Clears
Space Clears
```

Do not add environment leveling yet.

---

# 18. Run Start

Create a lightweight run-start state.

Example:

```text
CLASSIC RUN

BEST
4,850

TAP TO START
```

Do not create a long menu sequence.

From app launch to gameplay should remain fast.

---

# 19. Home Screen

Prototype 0.5 may introduce a minimal home screen.

Required:

```text
GAME TITLE

LEVEL 7
420 / 550 XP

[ PLAY ]

PROJECTILES

BEST 4,850
```

Optional:

```text
STATS
```

Do not add:

```text
SHOP
DAILY
EVENTS
MISSIONS
```

yet.

---

# 20. Stats Screen

Create a simple local statistics screen.

Display:

```text
RUNS
124

BEST SCORE
8,420

LONGEST RUN
67

BEST STREAK
23

BULLSEYES
318

PERFECTS
74

CLOSE CALLS
441

SHOTS CLEARED
2,840
```

Keep it functional.

Do not overdesign.

---

# 21. Run Over Upgrade

Extend the existing Run Over screen.

Example:

```text
RUN OVER

SCORE
3,820

BEST
5,120

SHOTS
46

BEST STREAK
17

+242 XP

LEVEL 8
████████░░
720 / 900

[ TRY AGAIN ]

HOME
```

`TRY AGAIN` remains the primary action.

---

# 22. Unlock Presentation

If the run causes a new cosmetic unlock:

```text
NEW PROJECTILE

NEON BALL

UNLOCKED
```

Show after Run Over statistics.

Keep it brief.

Do not force the player into the projectile-selection screen.

---

# 23. Persistent Data

Persist locally:

```ts
interface PersistentGameData {
  playerProgress: PlayerProgress;

  selectedProjectileId: string;

  personalBests: PersonalBests;

  milestoneRecords: MilestoneRecords;

  lifetimeStats: LifetimeStats;
}
```

Use versioned persistence.

Example:

```ts
{
  saveVersion: 1,
  ...
}
```

---

# 24. Save Migration

Create basic migration infrastructure now.

Example:

```ts
migrateSaveData(
  oldVersion,
  data
)
```

Do not overengineer.

The objective is preventing future updates from destroying local progress.

---

# 25. Development Reset

Debug mode should support:

```text
RESET PROGRESS

SET PLAYER LEVEL

ADD XP

UNLOCK ALL PROJECTILES

LOCK ALL PROJECTILES
```

Development only.

Require deliberate confirmation for full reset.

---

# 26. Existing Scoring

Do not redesign Prototype 0.3 scoring.

Preserve:

```text
Hit
Great
Bullseye
Perfect
Close Call
Streak
Multiplier
```

XP is separate from score.

Score answers:

> How good was this run?

XP answers:

> How much overall progress have I made?

Do not combine them.

---

# 27. No Pay-to-Win

All cosmetic projectiles must behave identically.

Do not add:

```text
+5% speed

larger collision radius

extra heart

slower rotor

better aim
```

to cosmetics.

---

# 28. Session Goals

Prototype 0.5 should provide three simultaneous motivations:

### Immediate

```text
Make this shot.
```

### Run

```text
Beat my high score.
```

### Long Term

```text
Reach the next level/unlock.
```

If progression overwhelms the actual throwing mechanic, simplify it.

---

# 29. Playtest Questions

After implementation evaluate:

### XP

Does gaining XP provide enough reason to complete another run?

### Levels

Does the next level feel reachable?

### Unlocks

Do cosmetic unlocks feel desirable without affecting gameplay?

### Run Variety

Do different run themes noticeably change the run?

### Environment Weighting

Do environments develop some identity?

### Home Screen

Can I get from launch to gameplay quickly?

### Run Over

Does TRY AGAIN remain the obvious action?

### Replay

After several runs, do I want:

```text
another score attempt
```

and/or:

```text
the next unlock
```

---

# 30. Do Not Fake Retention

Do not add artificial retention mechanics yet.

Do NOT implement:

```text
energy systems

lives regenerating over time

forced waiting

daily login streaks

loot boxes

random reward chests

limited-time offers
```

We are testing whether the actual game supports progression.

---

# 31. Implementation Order

## Phase 1 — Regression

Verify Prototype 0.4.

Do not proceed with broken gameplay.

## Phase 2 — Persistent Player Progress

Add:

```text
XP
Level
Lifetime statistics
Save versioning
```

## Phase 3 — XP

Award XP correctly after gameplay events.

## Phase 4 — Level System

Implement levels 1–20.

## Phase 5 — Projectile Cosmetics

Implement eight cosmetic projectiles.

Verify identical gameplay physics.

## Phase 6 — Projectile Selection

Add selection UI and persistence.

## Phase 7 — Milestones

Implement local milestone tracking.

## Phase 8 — Run Profiles

Add:

```text
Classic
Precision
Timing
Motion
```

using generator weights.

## Phase 9 — Environment Weighting

Add environment-specific weighting without exclusivity.

## Phase 10 — Home Screen

Implement minimal navigation.

## Phase 11 — Stats

Add local stats screen.

## Phase 12 — Run Over

Integrate XP/level/unlocks.

## Phase 13 — Development Controls

Add progress-testing controls.

## Phase 14 — Long Playtest

Test:

```text
10+ runs
```

and enough development simulation to verify progression through at least:

```text
Level 10
```

---

# 32. Acceptance Criteria

Prototype 0.5 is technically complete when:

* XP is awarded correctly.
* XP persists across app restarts.
* Player levels calculate correctly.
* Level-ups work.
* Eight projectile cosmetics exist.
* Projectile cosmetics have identical gameplay behavior.
* Unlock requirements work.
* Selected projectile persists.
* Lifetime statistics persist.
* Personal bests remain intact.
* Milestones are tracked.
* Run themes influence challenge weighting.
* ChallengeValidator remains authoritative.
* Environment weighting works.
* Minimal home screen works.
* PLAY starts quickly.
* Stats screen works.
* Run Over displays XP.
* New unlocks display correctly.
* TRY AGAIN remains fast.
* Save version exists.
* Development progress controls work.
* Existing scoring/streaks remain correct.
* Existing obstacle families remain correct.
* Existing environment transitions remain correct.
* Typecheck/lint/tests pass.

---

# 33. Explicitly Out of Scope

Do NOT implement:

```text
❌ Ads
❌ AdMob
❌ Rewarded ads
❌ Interstitials

❌ IAP
❌ RevenueCat

❌ Coins
❌ Gems
❌ Purchasable currency

❌ Store

❌ Paid cosmetics

❌ Rewarded revive

❌ Daily rewards

❌ Daily challenge

❌ Missions

❌ Battle pass

❌ Online leaderboard

❌ Game Center

❌ Google Play Games

❌ Accounts

❌ Authentication

❌ Backend

❌ Cloud saves

❌ Push notifications

❌ Social sharing

❌ Friends

❌ Additional obstacle families

❌ Additional environments

❌ Gameplay advantages from cosmetics

❌ Energy systems

❌ Timers restricting play
```

---

# 34. Stop Condition

After:

* progression works
* cosmetics work
* run themes work
* home/stats work
* persistence works
* at least 10 manual runs are tested

STOP.

Do not implement monetization.

Do not begin Prototype 0.6 automatically.

---

# 35. Final Agent Report

Report:

```text
IMPLEMENTED
- ...

FILES ADDED
- ...

FILES MODIFIED
- ...

XP SYSTEM
- ...

LEVEL CURVE
- ...

PROJECTILE COSMETICS
- ...

UNLOCK SCHEDULE
- ...

PERSISTENCE
- ...

SAVE VERSIONING
- ...

RUN THEMES
- ...

ENVIRONMENT WEIGHTING
- ...

HOME SCREEN
- ...

STATS
- ...

RUN OVER CHANGES
- ...

DEVELOPMENT CONTROLS
- ...

10-RUN PLAYTEST
- ...

TYPECHECK/LINT/TEST STATUS
- ...

KNOWN ISSUES
- ...

DEVIATIONS FROM SPEC
- ...

PLAYTEST OBSERVATIONS
- ...

RECOMMENDED PROTOTYPE 0.6 ITEMS
- ...
```

Do not implement the Prototype 0.6 recommendations.

---

# 36. Central Prototype 0.5 Question

Prototype 0.5 succeeds if the player now has three reasons to continue:

```text
SHOT
"Can I make this?"

RUN
"Can I beat my score?"

PROGRESSION
"Can I reach the next unlock?"
```

Progression should strengthen the core game.

It should not compensate for a weak core game.

If players only continue because an XP bar is filling, Prototype 0.5 has not solved the underlying retention problem.
