You are working on the existing mobile arcade game project.

Prototype 0.1 validated the core throw mechanic.

Prototype 0.2 added and validated combinations of:

* rotating obstacles
* moving rotors
* moving targets
* reversing/pulsing rotors
* dual-depth rotors
* Workshop/Rooftop/Space environments
* forward progression
* challenge generation
* authored 30-shot testing

The next milestone is:

# PROTOTYPE 0.3 — RUN & RETENTION

The objective is NOT to add more obstacle mechanics.

The objective is to determine whether the existing gameplay can create:

> "One more run."

Before changing anything, inspect the current project, existing specs, game architecture, scoring, challenge system, run state, environment system, and local persistence.

Preserve the current aiming, projectile, collision, challenge, and environment behavior unless a change is specifically required below.

---

# 1. Core Run

The game should now operate as a continuous arcade run.

Flow:

```text
START RUN
↓
Challenge
↓
Successful shot
↓
Score
↓
Forward transition
↓
Next challenge
↓
...
↓
Lose all hearts
↓
RUN OVER
↓
Results
↓
TRY AGAIN
```

There should be no level-complete screen between normal shots.

The player starts with:

```text
♥ ♥ ♥
```

A rotor collision or target miss removes one heart.

A successful shot preserves hearts.

At zero hearts:

```text
RUN_OVER
```

Do not automatically restart.

---

# 2. Fast Restart

The restart loop is extremely important.

From:

```text
TRY AGAIN
```

to:

```text
first projectile READY
```

should feel nearly immediate.

Target approximately:

```text
< 1.5 seconds
```

Prefer closer to:

```text
~1 second
```

if technically practical.

Do not replay:

* tutorials
* long environment transitions
* intro cinematics
* unnecessary loading screens

A player who fails should be able to immediately attempt another run.

---

# 3. Scoring System

Keep scoring understandable.

Base result:

```text
HIT       +100
GREAT     +125
BULLSEYE  +175
PERFECT   +250
```

Centralize these values.

Do not scatter them through UI components.

---

# 4. Streak System

Add:

```text
CURRENT STREAK
BEST STREAK
```

Every successful target hit increases:

```text
currentStreak += 1
```

Any failure resets:

```text
currentStreak = 0
```

A failure means:

```text
Rotor collision
or
Target miss
```

---

# 5. Streak Multiplier

Use a restrained multiplier system.

Start with:

```text
Streak 0–2:
x1.0

Streak 3–5:
x1.25

Streak 6–9:
x1.5

Streak 10–14:
x1.75

Streak 15+:
x2.0
```

Cap:

```text
x2.0
```

Do not create huge exponential scores.

Score calculation:

```ts
scoreAward =
  Math.round(
    baseScore *
    streakMultiplier
  );
```

Clearly define whether the newly successful shot increments streak before or after determining multiplier.

Choose one behavior and use it consistently.

Recommended:

1. determine shot result
2. increment streak
3. calculate multiplier from new streak
4. award score

---

# 6. Streak Feedback

Do not constantly display large combo animations.

Use subtle feedback.

Examples:

```text
STREAK 4
x1.25
```

At meaningful thresholds:

```text
3
6
10
15
```

show a brief stronger effect.

Examples:

```text
x1.5 STREAK
```

Use:

* small scale animation
* haptic
* brief text
* particles if inexpensive

Do not obscure gameplay.

---

# 7. Accuracy Feedback

Preserve:

```text
HIT
GREAT
BULLSEYE
PERFECT
```

Improve presentation slightly if needed.

The player should immediately understand:

```text
how accurate was that shot?
```

A PERFECT should feel substantially better than a basic HIT.

But do not turn this into a large cinematic interruption.

---

# 8. Near Miss / Close Call

Use the existing rotor collision geometry to detect when the projectile passes unusually close to a blade without colliding.

Create:

```text
CLOSE CALL
```

or:

```text
NEAR MISS
```

Choose one terminology and use it consistently.

Recommended:

```text
CLOSE CALL
```

Do not award a large score bonus yet.

Initial:

```text
Close Call Bonus:
+25
```

Maximum one Close Call bonus per obstacle crossing.

For dual rotors, a projectile could theoretically receive one per rotor.

Prevent repeated frame-by-frame bonus awards.

---

# 9. Close Call Detection

Use collision geometry rather than visual guessing.

When the projectile crosses the rotor plane successfully, determine the minimum clearance from:

```text
projectile surface
```

to:

```text
nearest blade/hub/frame collision surface
```

If:

```text
clearance > collision threshold
```

but:

```text
clearance <= CLOSE_CALL_THRESHOLD
```

record:

```text
CLOSE_CALL
```

Centralize:

```ts
closeCallThreshold
```

Add debug visualization/value.

---

# 10. Close Call Feedback

Use:

```text
CLOSE CALL +25
```

with:

* small text
* light haptic
* brief particle/trail enhancement if inexpensive

Do not interrupt projectile flight.

This should make narrowly surviving a rotor feel exciting.

---

# 11. Run Statistics

Track:

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

  closeCalls: number;

  currentStreak: number;

  bestStreak: number;

  environmentsCompleted: number;

  loopsCompleted: number;
}
```

Use the current architecture where equivalent fields already exist.

Do not duplicate state unnecessarily.

---

# 12. Persistent Personal Bests

Use local device persistence.

Do NOT add:

* accounts
* backend
* cloud saves

Persist:

```text
BEST SCORE

LONGEST RUN

BEST STREAK

MOST BULLSEYES IN RUN

MOST PERFECTS IN RUN

FURTHEST LOOP
```

Use the existing Expo-compatible local persistence solution if one already exists.

If none exists, choose the smallest appropriate Expo-compatible solution.

Do not introduce a backend.

---

# 13. Personal Best Detection

During a run, detect when the player surpasses:

```text
BEST SCORE
```

At the moment it happens, optionally show:

```text
NEW BEST
```

briefly.

Do not interrupt gameplay.

At Run Over, clearly identify new records.

Example:

```text
SCORE
2,340

NEW BEST
```

---

# 14. HUD

Keep gameplay HUD minimal.

Suggested layout:

```text
♥ ♥ ♥                 1,840

              x1.5
           STREAK 8
```

Do not permanently display every statistic.

The player primarily needs:

```text
Lives
Score
Current streak/multiplier
```

Environment progress may remain if already implemented and unobtrusive.

---

# 15. Successful Shot Flow

Successful shot should feel like:

```text
Ball hits target
↓
HIT/GREAT/BULLSEYE/PERFECT
↓
Score increases
↓
Streak increases
↓
Target feedback
↓
Forward camera transition
↓
Next challenge
```

Keep this fast.

The player should not spend several seconds waiting after every successful shot.

---

# 16. Failure Flow

Failure:

```text
Rotor collision
or
Target miss
```

should:

1. provide clear failure feedback
2. remove one heart
3. reset streak
4. keep score
5. retry/continue according to existing run behavior

If hearts remain:

```text
reset projectile
↓
READY
```

If hearts reach zero:

```text
RUN_OVER
```

---

# 17. Run Over Screen

Create a clean results screen.

Required:

```text
RUN OVER

SCORE
1,840

BEST
2,120

SHOTS CLEARED
37

BEST STREAK
14

BULLSEYES
6

PERFECTS
2

CLOSE CALLS
8

[ TRY AGAIN ]
```

If a record was broken:

```text
NEW BEST
```

or equivalent should be obvious.

Do not overload the screen with every debug statistic.

---

# 18. Try Again

`TRY AGAIN` must:

* reset run score
* restore three hearts
* reset streak
* reset run statistics
* reset challenge progression
* establish a new run seed if generated mode uses seeds
* return to starting environment
* prepare first challenge
* prepare projectile
* enter READY

Persistent personal bests must remain.

---

# 19. Difficulty Director

Use the EXISTING validated challenge generator.

Do not rewrite it.

Add or adapt a lightweight run difficulty director that determines the requested challenge difficulty based on:

```text
challengesCleared
+
loop
```

Do not base difficulty on player failure/success adaptation yet.

We want predictable progression.

Suggested conceptual curve:

```text
Shots 1–5
Difficulty 1–2

Shots 6–10
Difficulty 2–3

Shots 11–20
Difficulty 3–5

Shots 21–30
Difficulty 4–6

Shots 31–50
Difficulty 5–8

Shots 51+
Difficulty 6–10
```

Use existing difficulty-budget architecture where possible.

Do not create duplicate difficulty systems.

---

# 20. Difficulty Caps

Do not infinitely increase:

```text
rotor speed
target speed
movement amplitude
blade count
```

Once safe caps are reached, difficulty should come primarily from validated combinations.

Do not generate impossible-looking challenges merely because the run is long.

ChallengeValidator remains authoritative.

---

# 21. Environment Loop

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

Environment changes should represent run progress.

Do not reset:

```text
Score
Streak
Hearts
Run statistics
```

when environment changes.

---

# 22. Loop Number

Track:

```text
loopNumber
```

Example:

```text
Workshop — Loop 1
Rooftop — Loop 1
Space — Loop 1

Workshop — Loop 2
...
```

Do not necessarily show "Loop 2" prominently to the player.

It is primarily useful for progression and statistics.

---

# 23. Audio/Haptic Hooks

Ensure events exist for:

```text
Throw

Rotor collision

Target miss

Hit

Great

Bullseye

Perfect

Close Call

Streak threshold

Heart lost

New best

Run over
```

Use existing audio architecture.

Placeholder sound hooks are acceptable if audio assets are not ready.

Use haptics appropriately.

Do not create excessive vibration.

---

# 24. Debug Mode

Extend debug overlay with:

```text
RUN SCORE

CURRENT STREAK

MULTIPLIER

BEST STREAK

CHALLENGES CLEARED

LOOP

ENVIRONMENT

CURRENT DIFFICULTY

CLOSE CALL CLEARANCE

RUN SEED

PERSONAL BEST
```

Keep existing trajectory/collision diagnostics.

Do not remove debugging created during Prototype 0.2.

---

# 25. Development Controls

Preserve useful development controls such as:

```text
Restart challenge

Next challenge

Jump environment

Unlimited hearts

Collision visualization
```

Add:

```text
Force Run Over

Reset Local Bests
```

`Reset Local Bests` must be development-only and require deliberate activation.

---

# 26. Telemetry for Manual Playtesting

No external analytics service.

At the end of a run, make these values available in debug mode/log output:

```text
Run duration

Score

Challenges cleared

Attempts

Rotor hits

Target misses

Hits

Greats

Bullseyes

Perfects

Close calls

Best streak

Loop reached

Environment reached

Run seed
```

This is for manual Prototype 0.3 evaluation.

---

# 27. Primary Playtest Questions

Do not judge Prototype 0.3 merely by whether it compiles.

After implementation, play multiple runs.

Evaluate:

### Restart

After losing, do I immediately want to press TRY AGAIN?

### Score

Do I care about beating my previous score?

### Streak

Does maintaining a streak create useful tension?

### Accuracy

Do Bullseyes and Perfects feel valuable?

### Close Calls

Does barely clearing a rotor feel exciting rather than random?

### Difficulty

Does the run gradually become harder without an obvious unfair spike?

### Duration

How long do typical runs naturally last?

Record actual run durations.

### Failure

Can I usually explain why I failed?

### Repetition

At what shot count does the current obstacle vocabulary begin feeling repetitive?

This is especially important for deciding Prototype 0.4.

---

# 28. Prototype 0.3 Success Condition

The most important test is:

> After losing a run, do I voluntarily start another one because I believe I can beat my previous result?

If not, do not solve that by immediately adding:

```text
coins
skins
ads
daily rewards
```

Determine whether the problem is:

```text
scoring
difficulty progression
feedback
challenge variety
run length
controls
or
core repetition
```

first.

---

# 29. Explicitly Out of Scope

Do NOT implement:

```text
❌ New obstacle types

❌ Sliding gates
❌ Iris/shutter
❌ Pendulum
❌ Moving rings

❌ Coins
❌ Gems
❌ Currency

❌ Store

❌ Projectile skins

❌ Unlock system

❌ XP

❌ Player levels

❌ Daily rewards

❌ Daily challenge

❌ Missions

❌ Achievements

❌ Leaderboards

❌ Game Center

❌ Google Play Games

❌ Accounts

❌ Authentication

❌ Backend

❌ Cloud saves

❌ Ads

❌ AdMob

❌ Interstitials

❌ Rewarded revive

❌ IAP

❌ RevenueCat

❌ Battle pass

❌ Additional environments

❌ Story mode

❌ Characters

❌ Major aiming redesign

❌ Major projectile physics redesign

❌ Challenge-generator rewrite
```

Prototype 0.3 is about proving the **run**, not building the commercial game.

---

# 30. Implementation Order

Follow this order.

## Phase 1 — Inspect

Read existing Prototype 0.1/0.2 specs and current implementation.

Run the game.

Verify existing gameplay before changing it.

---

## Phase 2 — Run State

Establish clean:

```text
START
PLAYING
RUN_OVER
RESTART
```

behavior.

Verify three-heart lifecycle.

---

## Phase 3 — Base Scoring

Implement:

```text
HIT
GREAT
BULLSEYE
PERFECT
```

score values.

---

## Phase 4 — Streak

Implement:

```text
currentStreak
bestStreak
multiplier
```

and failure reset.

---

## Phase 5 — Close Call

Implement geometric close-call detection.

Debug it before adding scoring/feedback.

---

## Phase 6 — Run Statistics

Centralize run statistics.

---

## Phase 7 — Local Bests

Persist personal best values locally.

Verify app restart preserves them.

---

## Phase 8 — Run Over

Build results screen.

---

## Phase 9 — Fast Restart

Optimize:

```text
TRY AGAIN → READY
```

until it feels immediate.

---

## Phase 10 — Difficulty Director

Connect run depth to the existing challenge difficulty system.

Do not rewrite generation.

---

## Phase 11 — HUD/Feedback

Add minimal score/streak/multiplier feedback.

---

## Phase 12 — Long-Run Test

Play/test at least:

```text
3–5 complete runs
```

and one development run of:

```text
50+ challenges
```

Verify:

* no impossible challenge spike
* no score corruption
* no streak corruption
* no persistence errors
* no memory/performance degradation
* environment looping works
* restart works repeatedly

---

# 31. Acceptance Criteria

Prototype 0.3 is technically complete when:

* Runs start with three hearts.
* Score begins at zero.
* Successful shots award correct base score.
* Streak increments correctly.
* Multiplier thresholds work.
* Failure resets streak.
* Close Calls are geometrically detected.
* Close Call cannot award repeatedly for one crossing.
* Run ends at zero hearts.
* Run Over displays correct statistics.
* Personal bests persist locally.
* New best detection works.
* TRY AGAIN fully resets run state.
* Restart is fast.
* Difficulty progresses using existing generator architecture.
* Workshop/Rooftop/Space continue looping.
* Environment transitions do not reset run state.
* Debug mode exposes required run values.
* Existing aiming behavior is preserved.
* Existing collision behavior is preserved.
* Existing challenge generation remains functional.
* TypeScript/typecheck passes.
* Existing lint/tests pass where available.

---

# 32. Stop Condition

After completing Prototype 0.3:

STOP.

Do not begin:

```text
Prototype 0.4
new obstacles
progression
cosmetics
monetization
```

Report findings first.

---

# 33. Final Agent Report

Report:

```text
IMPLEMENTED
- ...

FILES ADDED
- ...

FILES MODIFIED
- ...

SCORING SYSTEM
- ...

STREAK SYSTEM
- ...

CLOSE CALL IMPLEMENTATION
- ...

RUN STATE
- ...

LOCAL PERSISTENCE
- ...

DIFFICULTY PROGRESSION
- ...

RESTART TIME
- ...

HOW TO RESET PERSONAL BESTS IN DEV
- ...

TYPECHECK/LINT/TEST STATUS
- ...

KNOWN ISSUES
- ...

DEVIATIONS FROM SPEC
- ...

MANUAL PLAYTEST RESULTS
- ...

AVERAGE OBSERVED RUN LENGTH
- ...

RECOMMENDED PROTOTYPE 0.4 ITEMS
- ...
```

Do not implement the Prototype 0.4 recommendations.
