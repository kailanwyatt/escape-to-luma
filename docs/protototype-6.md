# Prototype 0.6 — Production Foundation & Game Feel

## Mission

Prototype 0.6 transitions the project from a functional prototype into a production-quality mobile game foundation.

Previous prototypes established:

* Core throw mechanic
* Predictive timing
* Rotor gameplay
* Moving targets
* Multiple obstacle depths
* Endless runs
* Score and streaks
* Close Calls
* Multiple obstacle families
* Workshop / Rooftop / Space environments
* Challenge generation
* Player XP and levels
* Cosmetic projectile unlocks
* Run themes
* Local persistence

Prototype 0.6 should NOT add another major gameplay system.

The objective is:

> Make the existing game feel polished, readable, responsive, coherent, and ready for repeated mobile play.

---

# 1. First Rule

Before modifying anything:

1. Inspect the entire current project.
2. Read previous prototype specifications.
3. Run the game.
4. Identify existing implementations rather than recreating them.
5. Record current TypeScript/lint errors.
6. Verify the game can complete a full run.
7. Verify local persistence.
8. Verify all current obstacle families.

Do not rewrite functioning architecture simply because another implementation would be cleaner.

---

# 2. Feature Freeze

Prototype 0.6 introduces a temporary feature freeze.

Do NOT add:

* new obstacle families
* new environments
* new currencies
* new progression systems
* new run modes
* multiplayer
* social features
* backend services

The existing game is the product being polished.

---

# 3. Primary Goals

Work on:

```text
GAME FEEL

READABILITY

VISUAL COHERENCE

AUDIO

HAPTICS

CAMERA

TRANSITIONS

ONBOARDING

UI/UX

PERFORMANCE

ACCESSIBILITY

DEVICE RELIABILITY

SAVE RELIABILITY
```

---

# 4. Input Must Feel Excellent

Do a regression pass on:

* high-angle aiming
* low-angle aiming
* horizontal precision
* drag cancellation
* accidental cancellation
* unlimited aim hold
* release detection
* trajectory preview
* trajectory/actual-flight agreement

Do not redesign aiming unless a measurable problem exists.

If a problem is discovered, fix the smallest responsible system.

---

# 5. Shot Responsiveness

Measure the sequence:

```text
TOUCH
↓
AIM
↓
RELEASE
↓
PROJECTILE MOVES
```

There should be no perceptible delay between release and launch.

Avoid unnecessary React state transitions in this path.

Projectile simulation should begin immediately.

---

# 6. Trajectory Readability

Preserve the diagnostic work from earlier prototypes.

The normal player trajectory preview should provide enough information to understand:

* initial direction
* approximate arc
* power

without solving the entire shot.

Keep approximately:

```text
30–40%
```

of the projected path visible unless current playtesting has established a better value.

Debug mode should retain the complete predicted trajectory.

---

# 7. Depth Readability

This remains critical.

The player must visually understand:

```text
BALL
↓
OBSTACLE A
↓
OBSTACLE B
↓
TARGET
```

Review:

* perspective
* obstacle scale
* atmospheric depth
* shadows
* floor/environment reference lines
* target scale
* obstacle overlap
* camera angle

Do not rely on extreme blur or expensive depth-of-field effects.

The objective is spatial understanding.

---

# 8. Obstacle Readability

Every obstacle must clearly communicate its rule through motion.

## Rotor

Player understands:

> Find the rotating opening.

## Sliding Gate

Player understands:

> Predict where the opening will move.

## Iris

Player understands:

> Wait until the opening will be large enough.

## Pendulum

Player understands:

> Wait until the blocker clears the path.

## Moving Ring

Player understands:

> Predict where the opening will be.

No text explanation should be required after the first encounter.

---

# 9. Collision Trust

Revalidate all collision geometry.

For:

```text
Rotor
Sliding Gate
Iris
Pendulum
Moving Ring
Target
```

verify:

```text
VISIBLE GEOMETRY
≈
COLLISION GEOMETRY
```

A player should not repeatedly say:

> That looked like it should have cleared.

Retain development collision visualization.

---

# 10. Target Feedback

Improve the target response.

## HIT

Use:

* small pulse
* small particle burst
* light haptic
* score pop

## GREAT

Use:

* stronger pulse
* slightly stronger particles
* stronger score treatment

## BULLSEYE

Use:

* satisfying target reaction
* stronger particles
* stronger haptic
* brief text

## PERFECT

This should be the strongest successful result.

Use:

* larger target pulse
* stronger particle burst
* strong but appropriate haptic
* distinctive sound
* brief camera emphasis
* optional extremely short time-scale effect

Do not stop gameplay for a long celebration.

---

# 11. Perfect Slow Motion

Test a subtle effect around:

```text
0.15–0.30 seconds
```

for PERFECT.

If it improves satisfaction, keep it.

If it makes gameplay feel sluggish, remove it.

Do not use slow motion for ordinary HIT.

---

# 12. Close Call Feedback

`CLOSE CALL` should feel dangerous.

Improve with:

* quick sound
* subtle haptic
* brief text
* small projectile trail flare

Do not interrupt flight.

Do not make Close Call more visually important than Bullseye/Perfect.

---

# 13. Failure Feedback

Differentiate:

```text
OBSTACLE COLLISION
```

from:

```text
TARGET MISS
```

Obstacle collision should feel physical.

Use:

* impact sound
* sparks/debris where appropriate
* camera impulse
* projectile deflection
* haptic

Target miss should feel less violent.

Use:

* miss sound
* subtle feedback
* fast reset

The player should immediately understand why the heart was lost.

---

# 14. Camera System

Centralize camera feedback.

Support:

```text
Launch emphasis
Obstacle collision shake
Target hit emphasis
Perfect emphasis
Forward progression
Environment transition
```

Do not allow multiple effects to fight each other.

Use a camera-effects controller or equivalent existing architecture.

---

# 15. Camera Shake Limits

Camera shake must never make aiming harder.

No shake while:

```text
READY
AIMING
```

unless there is an exceptional intentional event.

Shake primarily occurs after:

```text
impact
success
```

and resolves quickly.

---

# 16. Forward Movement

Successful shots should create a sense that the player is advancing deeper into the world.

Sequence:

```text
TARGET HIT
↓
RESULT FEEDBACK
↓
CAMERA/WORLD PUSH FORWARD
↓
OLD COURSE RECYCLED
↓
NEW COURSE REVEALED
↓
READY
```

Target transition duration:

```text
~0.7–1.2 seconds
```

Tune based on device playtesting.

Do not make every shot feel like a separate level loading.

---

# 17. Environment Transitions

Polish:

```text
WORKSHOP
→
ROOFTOP
→
SPACE
→
WORKSHOP
```

Transitions should feel continuous.

Avoid loading-screen presentation where technically unnecessary.

Possible lightweight transitions:

Workshop → Rooftop:

```text
move through workshop opening / elevator / doorway
```

Rooftop → Space:

```text
travel through stylized launch tunnel / energy ring
```

Space → Workshop:

```text
portal / tunnel / rapid environment wipe
```

Keep transitions inexpensive.

---

# 18. Visual Identity

Create one coherent visual language.

Use:

* consistent geometry language
* consistent materials
* consistent UI typography
* consistent particle style
* consistent lighting philosophy
* consistent target language

Do not make Workshop, Rooftop, and Space appear to belong to three unrelated games.

---

# 19. Environment Detail Budget

Continue using lightweight primitives.

## Workshop

Use combinations of:

* beams
* crates
* pipes
* vents
* industrial panels
* lights

## Rooftop

Use:

* simple building silhouettes
* ducts
* vents
* tanks
* antennas
* barriers

## Space

Use:

* structural panels
* energy elements
* simple station geometry
* distant planet/background elements
* rings
* light strips

Do not use asset-heavy photorealistic scenes.

---

# 20. Lighting

Each environment should have recognizable lighting while sharing the game's overall style.

Use inexpensive:

* ambient light
* directional/key light
* emissive materials where useful

Avoid large numbers of dynamic lights.

---

# 21. Projectile Visuals

Review all unlocked projectile cosmetics.

Every projectile must remain easy to track.

Do not allow:

* dark ball against dark environment
* excessive transparency
* huge particle trail
* trail obscuring obstacle opening

Gameplay readability overrides cosmetic appearance.

---

# 22. Projectile Trail

Create a shared trail system.

Allow cosmetic variation through:

* trail width
* texture/style
* particle frequency
* emissive treatment

Keep trail length moderate.

The trail should reinforce:

```text
speed
trajectory
motion
```

not obscure the course.

---

# 23. Audio Pass

Create/organize event-based audio.

Minimum required events:

```text
Aim start
Launch
Close Call
Rotor hit
Gate hit
Iris hit
Pendulum hit
Ring hit
Target miss
Hit
Great
Bullseye
Perfect
Streak threshold
Heart lost
New best
Level up
Unlock
Run over
UI tap
```

Reuse sounds where appropriate.

Do not require unique audio for every minor event.

---

# 24. Audio Architecture

Centralize audio playback.

Conceptually:

```ts
AudioManager.play("launch");
AudioManager.play("perfect");
```

or equivalent existing architecture.

Do not scatter direct audio implementation across gameplay components.

---

# 25. Audio Priority

Prevent audio chaos.

Important events should take priority.

Suggested hierarchy:

```text
PERFECT
BULLSEYE
COLLISION
LEVEL UP
CLOSE CALL
UI
```

Do not allow multiple simultaneous sounds to become noise.

---

# 26. Haptics

Centralize haptics.

Suggested hierarchy:

```text
UI TAP
very light

LAUNCH
light

HIT
light

GREAT
medium-light

BULLSEYE
medium

PERFECT
strong

CLOSE CALL
light

COLLISION
medium/strong

LEVEL UP
success pattern
```

Respect platform capability.

Avoid excessive vibration.

---

# 27. HUD Polish

Gameplay HUD should remain minimal.

Primary information:

```text
HEARTS

SCORE

STREAK / MULTIPLIER
```

Avoid permanently showing:

* XP
* player level
* lifetime statistics
* challenge difficulty
* obstacle names

Those belong elsewhere.

---

# 28. HUD Safe Areas

Verify:

* Dynamic Island
* iPhone notch
* Android cutouts
* navigation areas
* varying aspect ratios

No critical UI should touch unsafe areas.

---

# 29. Responsive Layout

Test at multiple common aspect ratios.

Do not assume one phone size.

Gameplay framing should remain consistent.

Obstacle openings and targets must remain usable across screens.

World-space gameplay should not become easier/harder because of screen aspect ratio.

---

# 30. First-Time Onboarding

Build lightweight onboarding.

Do NOT create a long tutorial.

First launch should teach through gameplay.

Suggested sequence:

### Shot 1

Show:

```text
DRAG TO AIM
```

### During drag

Show trajectory.

### Release

Player throws.

### Shot 2

Show:

```text
TIME THE OPENING
```

briefly.

After that:

No persistent tutorial text.

---

# 31. Cancel Teaching

If the aiming system supports returning to the origin to cancel, teach it only if needed.

Potential contextual hint:

```text
RETURN TO START TO CANCEL
```

Do not show this during the very first throw unless playtesting demonstrates it is necessary.

---

# 32. Tutorial Persistence

Persist:

```text
hasCompletedOnboarding
```

Do not replay onboarding every launch.

Development mode should support:

```text
RESET ONBOARDING
```

---

# 33. Home Screen Polish

Preserve Prototype 0.5 functionality.

Recommended hierarchy:

```text
GAME LOGO / TITLE

PLAYER LEVEL + XP

[ PLAY ]

PROJECTILES
STATS

BEST SCORE
```

PLAY must be dominant.

Do not create a cluttered free-to-play dashboard.

---

# 34. Navigation

Keep navigation shallow.

Ideal:

```text
HOME
├── PLAY
├── PROJECTILES
└── STATS
```

Avoid unnecessary nested menus.

---

# 35. Run Start

After pressing PLAY:

```text
RUN THEME
BEST SCORE
TAP TO START
```

or immediately prepare the projectile if current playtesting suggests an even faster start.

Do not add a long countdown.

---

# 36. Run Over Polish

Run Over should emphasize:

```text
SCORE
BEST
SHOTS CLEARED
BEST STREAK
XP
```

Secondary:

```text
Bullseyes
Perfects
Close Calls
```

Primary action:

```text
TRY AGAIN
```

Secondary:

```text
HOME
```

Do not make HOME visually stronger than TRY AGAIN.

---

# 37. New Best

When the player earns a new high score:

```text
NEW BEST
```

should feel meaningful.

Use:

* brief animation
* sound
* haptic
* visual emphasis

Do not use a modal requiring dismissal.

---

# 38. Level Up

Level-up should feel rewarding without interrupting the arcade loop.

If it occurs during gameplay, queue presentation until an appropriate transition or Run Over.

Do not cover an active shot with:

```text
LEVEL UP!
```

---

# 39. Accessibility — Reduce Motion

Respect Reduce Motion where available.

When enabled:

Reduce/disable:

* large camera movement
* strong shake
* unnecessary scale animation
* excessive environment transition movement

Do not remove gameplay-essential obstacle movement.

---

# 40. Accessibility — Haptics

Provide:

```text
HAPTICS
ON / OFF
```

Persist preference.

---

# 41. Accessibility — Audio

Provide:

```text
SOUND EFFECTS
ON / OFF
```

If music exists:

```text
MUSIC
ON / OFF
```

Persist preferences.

---

# 42. Accessibility — Contrast

Check:

* trajectory dots
* projectile
* target
* obstacle opening
* HUD
* result text

against every environment.

Critical gameplay information must remain visible.

---

# 43. Pause / Background Behavior

When app backgrounds:

```text
PAUSE SIMULATION
```

Do not allow:

* projectile to continue
* obstacle timing to continue unfairly
* player to return to an already-failed shot

On resume:

Return safely.

If currently aiming:

Cancel the aim rather than automatically firing.

---

# 44. Interruption Safety

Handle:

* phone call
* notification interruption
* app background
* screen lock
* orientation attempt

without accidental launch or corrupted run state.

---

# 45. Portrait Lock

Keep portrait orientation.

Verify orientation remains locked on:

* iOS
* Android

unless existing architecture intentionally supports otherwise.

---

# 46. Performance

Target:

```text
60 FPS
```

on reasonable modern devices.

Profile:

* Workshop
* Rooftop
* Space
* dual obstacles
* particles
* projectile trails
* environment transitions

Look for:

* unnecessary allocations
* React state updates per frame
* recreated geometry
* recreated materials
* particle leaks
* audio leaks
* timer leaks
* listener leaks

---

# 47. Object Reuse

Where appropriate, reuse:

* projectile objects
* particles
* obstacle geometry
* target objects
* materials

Avoid unnecessary allocation every challenge.

Do not overengineer an elaborate pooling framework if existing performance is already stable.

---

# 48. Long-Session Stability

Run development testing for:

```text
100+ challenges
```

Check:

* memory
* FPS
* audio
* haptics
* obstacle recycling
* environment recycling
* score
* streak
* XP
* save state
* camera
* particles

There should be no progressive slowdown.

---

# 49. Save Reliability

Test persistence by:

1. Play.
2. Earn XP.
3. Unlock projectile.
4. Select projectile.
5. Set new high score.
6. Close app.
7. Relaunch.

Verify all intended persistent data survives.

---

# 50. Corrupt Save Handling

If save data cannot be parsed:

Do not crash the app.

Recover safely using default data where necessary.

Log development warning.

Do not silently overwrite valid data merely because one optional field is absent.

Use existing save migration infrastructure.

---

# 51. Settings

Create minimal Settings.

Include:

```text
SOUND EFFECTS

MUSIC
only if music exists

HAPTICS

REDUCE MOTION
if manually supported in addition to system preference
```

Do not create dozens of settings.

---

# 52. Debug Separation

Production UI must not expose:

* collision geometry
* FPS
* challenge ID
* generator seed
* difficulty cost
* trajectory crossing markers
* predicted collision result
* obstacle timing data

Debug mode retains these.

Ensure release builds can disable development overlays cleanly.

---

# 53. Error Logging

Centralize important development warnings for:

* invalid challenge
* impossible obstacle configuration
* missing audio asset
* unknown projectile cosmetic
* corrupted save
* missing environment visual
* invalid obstacle type

Do not spam logs every frame.

---

# 54. Challenge Validation Regression

Run existing challenge validation against every supported obstacle family.

Test generated challenges at multiple difficulty bands.

Example:

```text
Difficulty 1
Difficulty 3
Difficulty 5
Difficulty 7
Difficulty 10
```

Inspect representative challenges manually.

---

# 55. 100-Challenge Automated/Development Run

Generate at least:

```text
100 challenges
```

using the existing generator.

Check:

* valid obstacle count
* legal combinations
* safe target bounds
* safe movement bounds
* opening sizes
* difficulty budgets
* environment cycling

This does not replace human playtesting.

---

# 56. Human Playtest Runs

Perform at least:

```text
10 normal runs
```

where possible.

Record:

```text
Run duration
Score
Shots cleared
Failure cause
Environment reached
Best streak
Restart behavior
```

The purpose is not balancing from a tiny sample.

The purpose is identifying obvious friction.

---

# 57. Friction Log

During testing, create:

```text
docs/PROTOTYPE-0.6-PLAYTEST.md
```

Record issues under:

```text
CONTROLS

READABILITY

COLLISION TRUST

DIFFICULTY

FEEDBACK

UI

AUDIO

PERFORMANCE

PROGRESSION

REPETITION
```

Do not automatically fix every subjective issue.

Record observations.

---

# 58. Game Feel Review

Specifically evaluate whether the game feels satisfying at these moments:

```text
Picking up the ball / starting aim

Adjusting aim

Waiting for opening

Release

Passing close to obstacle

Clearing obstacle

Target hit

Bullseye

Perfect

Collision

Heart loss

New best

Run over

Restart
```

Every important action should have an appropriate response.

---

# 59. Restart Test

Repeatedly test:

```text
RUN OVER
↓
TRY AGAIN
↓
READY
```

Target:

```text
~1 second
```

or as close as practical without instability.

This remains one of the most important retention interactions.

---

# 60. Do Not Add Monetization Yet

Do NOT implement:

```text
AdMob

Interstitial ads

Rewarded ads

Banner ads

IAP

RevenueCat

Paid cosmetics

Remove Ads purchase
```

Prototype 0.6 should collect enough manual run-duration information to inform monetization placement later.

Do not guess ad frequency yet.

---

# 61. Do Not Add Content Bloat

Do NOT add:

```text
new obstacle families

new environments

50 cosmetics

daily missions

quests

events

story

characters

bosses
```

Polish what exists.

---

# 62. Definition of Done

Prototype 0.6 is complete when:

### Controls

* aiming is reliable
* high/low angles work
* cancellation is reliable
* trajectory matches actual launch

### Gameplay

* every obstacle is readable
* collision feels trustworthy
* dual-depth challenges remain understandable
* targets feel accurate

### Feedback

* launch feels responsive
* collisions feel physical
* hits feel satisfying
* Perfect feels special
* Close Call feels dangerous
* New Best feels rewarding

### Run

* continuous progression works
* environment transitions work
* scoring works
* streak works
* XP works
* Run Over works
* restart is fast

### Production

* onboarding works
* settings work
* safe areas work
* background/resume works
* persistence works
* corrupted-save handling exists
* debug UI can be disabled

### Performance

* no obvious progressive slowdown
* 100+ challenge session remains stable
* reasonable target devices approach 60 FPS

---

# 63. Explicitly Out of Scope

Do NOT implement:

```text
❌ New gameplay mechanic
❌ New obstacle family
❌ New environment
❌ New progression system
❌ Currency
❌ Shop
❌ Ads
❌ IAP
❌ RevenueCat
❌ Online leaderboard
❌ Accounts
❌ Backend
❌ Cloud save
❌ Daily challenge
❌ Missions
❌ Push notifications
❌ Multiplayer
❌ Social system
```

Mention worthwhile ideas in the final report only.

---

# 64. Implementation Order

Follow this order.

## Phase 1

Regression audit.

## Phase 2

Controls + trajectory + collision trust.

## Phase 3

Depth and obstacle readability.

## Phase 4

Target/impact/Perfect/Close Call game feel.

## Phase 5

Camera and forward transitions.

## Phase 6

Environment visual coherence.

## Phase 7

Audio.

## Phase 8

Haptics.

## Phase 9

HUD and UI polish.

## Phase 10

Onboarding.

## Phase 11

Settings/accessibility.

## Phase 12

Background/interruption handling.

## Phase 13

Persistence robustness.

## Phase 14

Performance profiling.

## Phase 15

100+ challenge stability test.

## Phase 16

10-run manual playtest.

## Phase 17

Document remaining friction.

STOP.

---

# 65. Final Agent Report

When complete report:

```text
IMPLEMENTED
- ...

FILES ADDED
- ...

FILES MODIFIED
- ...

CONTROL REGRESSION
- ...

TRAJECTORY ACCURACY
- ...

COLLISION TRUST
- ...

DEPTH READABILITY
- ...

GAME FEEL CHANGES
- ...

CAMERA
- ...

AUDIO
- ...

HAPTICS
- ...

UI/UX
- ...

ONBOARDING
- ...

ACCESSIBILITY
- ...

BACKGROUND/RESUME
- ...

PERSISTENCE
- ...

PERFORMANCE
- ...

100+ CHALLENGE TEST
- ...

10-RUN PLAYTEST
- ...

OBSERVED RUN LENGTHS
- ...

KNOWN ISSUES
- ...

DEVIATIONS FROM SPEC
- ...

RECOMMENDED NEXT STEPS
- ...
```

Do not implement the recommended next steps.

---

# 66. Central Question

At the end of Prototype 0.6, stop evaluating the game as a technical prototype.

Ask:

> If this exact build appeared in the App Store today, ignoring the absence of monetization, would the controls, feedback, presentation, and replay loop feel like a finished mobile arcade game?

If the answer is no because of:

* controls
* unclear depth
* questionable collisions
* weak feedback
* repetition
* poor transitions
* confusing UI

fix those issues before adding commercial systems.

Prototype 0.6 should leave us with a game worth monetizing, rather than adding monetization to a prototype.
