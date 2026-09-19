# Prototype 0.2 — Aiming Controls Patch

## Agent Mission

Update the existing aiming controls to solve three playtesting problems:

1. The player cannot cancel an aim once dragging begins.
2. The player needs to be able to hold an aim indefinitely while waiting for moving obstacles/targets.
3. Horizontal aiming is too sensitive for accurately leading moving targets.

This is a **control-system patch only**.

Do not modify:

* Challenge generator
* Challenge templates
* Difficulty budgets
* Target movement speeds
* Rotor movement speeds
* Environment progression
* Projectile physics unless specifically required below
* Existing generated challenge sequence

The purpose is to determine whether the current difficulty is caused by the challenge design or insufficient aiming control.

---

# 1. Desired Interaction

The aiming loop should become:

```text
READY
  ↓
Touch projectile
  ↓
AIMING
  ↓
Drag
  ↓
Adjust aim
  ↓
Hold as long as desired
  ↓
Either:

RELEASE → THROW

or

RETURN TO CANCEL ZONE → RELEASE → CANCEL
```

There must never be an automatic throw caused by holding too long.

---

# 2. Unlimited Aim Hold

Once the player enters:

```text
AIMING
```

remain in that state until one of these events occurs:

```text
VALID RELEASE
CANCEL
APP INTERRUPTION
```

Do not:

* auto-fire
* timeout aiming
* automatically cancel after a delay
* reset aim while the finger remains down

While aiming:

* rotor continues moving
* target continues moving
* other active environmental motion continues
* trajectory preview continues updating
* player may continue adjusting aim

This allows:

```text
Aim
↓
Watch rotor
↓
Watch target
↓
Fine-tune
↓
Wait
↓
Release at desired moment
```

---

# 3. Aim Cancellation

The player must be able to abandon the current aim without throwing.

Use the projectile's original touch/start position as the primary cancel zone.

When aiming begins:

```ts
aimStartScreenPosition = {
  x: touchX,
  y: touchY,
};
```

Calculate current drag distance:

```ts
const dx =
  currentX - aimStartScreenPosition.x;

const dy =
  currentY - aimStartScreenPosition.y;

const distance =
  Math.sqrt(dx * dx + dy * dy);
```

Define:

```ts
CANCEL_RADIUS
```

in screen-independent units or normalized screen coordinates.

Do not hard-code a value that behaves radically differently across device sizes.

---

# 4. Cancel Behavior

If the player's finger returns sufficiently close to the original aim start:

```text
distance <= CANCEL_RADIUS
```

enter:

```text
AIM_CANCEL_READY
```

This can either be a substate or a flag within `AIMING`.

Example:

```ts
isCancelReady = true;
```

If the player releases while:

```ts
isCancelReady === true
```

do not launch.

Instead:

```text
AIMING
↓
CANCEL
↓
READY
```

Reset:

* trajectory preview
* drag state
* power
* aim vector
* temporary UI feedback

Projectile remains at its starting position.

No heart is lost.

No attempt is counted.

No challenge state changes.

---

# 5. Cancel Dead Zone

A player initially touching the projectile must not immediately see:

```text
CANCEL
```

Before a meaningful drag occurs, treat the interaction as:

```text
AIM_PENDING
```

or equivalent.

Recommended behavior:

```text
Touch ball
↓
small finger movement
↓
nothing committed yet
↓
cross minimum drag threshold
↓
AIMING becomes active
```

Define:

```ts
MIN_AIM_DRAG
```

Only after exceeding `MIN_AIM_DRAG` should returning to the start position activate cancellation.

Conceptually:

```ts
hasEnteredAim =
  maxDragDistance >= MIN_AIM_DRAG;
```

Then:

```ts
isCancelReady =
  hasEnteredAim &&
  currentDistance <= CANCEL_RADIUS;
```

---

# 6. Cancel Hysteresis

Avoid rapid flickering between:

```text
AIM
CANCEL
AIM
CANCEL
```

near the boundary.

Use two thresholds.

Example:

```ts
CANCEL_ENTER_RADIUS = 0.045;
CANCEL_EXIT_RADIUS = 0.060;
```

Normalized values are illustrative.

Behavior:

```text
Not cancelling:
enter cancel mode at <= ENTER radius

Already cancelling:
remain cancelling until >= EXIT radius
```

This produces a stable cancel interaction.

---

# 7. Cancel Feedback

When cancel becomes active:

* fade or hide trajectory dots
* slightly return projectile visual toward neutral
* display small `CANCEL` text near projectile
* optionally reduce aim-guide opacity
* trigger one light haptic when entering cancel state

Do not continuously trigger haptics while inside the cancel zone.

Example:

```text
       ●

     CANCEL
```

Keep feedback subtle.

Do not add a large modal or button.

---

# 8. Cancel Exit

If the player moves outside the cancel exit radius before releasing:

```text
CANCEL READY
↓
AIMING
```

Trajectory preview should immediately return.

The player can continue aiming normally.

Therefore this should work:

```text
Drag
↓
Change mind
↓
Return toward ball
↓
CANCEL appears
↓
Change mind again
↓
Drag outward
↓
Trajectory returns
↓
Release
↓
Throw
```

---

# 9. Optional Bottom Cancel Zone

Do not implement this unless the primary return-to-origin cancel interaction proves awkward on actual mobile hardware.

Reserve support for a future secondary cancel gesture:

```text
drag toward bottom screen edge
```

Prototype patch should first test the simpler return-to-origin system.

---

# 10. Horizontal Precision Problem

Current horizontal input is too sensitive for moving-target interception.

Do not change challenge configurations to compensate.

Instead apply a nonlinear response curve to horizontal aim input.

Current conceptual behavior:

```ts
aimX = -normalizedX;
```

Replace the direct mapping with a precision curve.

---

# 11. Horizontal Precision Curve

Start with:

```ts
const rawX = clamp(
  -normalizedX / MAX_HORIZONTAL_DRAG,
  -1,
  1
);

const sign = Math.sign(rawX);

const magnitude = Math.abs(rawX);

const curvedMagnitude =
  Math.pow(magnitude, HORIZONTAL_AIM_EXPONENT);

const aimX =
  sign * curvedMagnitude;
```

Initial:

```ts
HORIZONTAL_AIM_EXPONENT = 1.35;
```

This means small horizontal finger movements produce smaller aim changes.

Large movements can still reach the full aiming range.

---

# 12. Why the Curve Exists

Do not reduce the total horizontal aiming range.

The player should still be able to make large-angle shots.

We need:

```text
Small finger adjustment
        ↓
Very small trajectory adjustment
```

while preserving:

```text
Large finger adjustment
        ↓
Full horizontal aiming range
```

This creates precision without removing capability.

---

# 13. Precision Curve Tuning

Centralize:

```ts
horizontalAimExponent: 1.35
```

Test at least:

```text
1.20
1.35
1.50
```

Do not exceed approximately:

```text
1.75
```

without a specific reason.

Too much curvature will make the center feel unresponsive.

Default to:

```text
1.35
```

for the first playtest.

---

# 14. Vertical Aim

Do not apply the same curve to vertical aim automatically.

Preserve existing vertical behavior unless testing identifies a problem.

The current reported issue is specifically horizontal precision against moving targets.

Avoid changing multiple input dimensions simultaneously.

---

# 15. Power

Do not redesign the existing power mechanic as part of this patch.

Preserve existing:

```text
drag distance → power
```

behavior.

However, horizontal precision transformation must not accidentally reduce maximum available power.

Power should continue to derive from the appropriate raw drag magnitude rather than the curved horizontal aiming output.

For example:

```ts
const rawDragDistance =
  Math.sqrt(
    normalizedX * normalizedX +
    normalizedY * normalizedY
  );

power =
  calculatePower(rawDragDistance);
```

Do not calculate power from:

```text
curved aimX
```

---

# 16. Trajectory Prediction

Trajectory preview must use the final transformed aiming values.

Pipeline should be:

```text
Raw Touch Input
↓
Normalize
↓
Horizontal Precision Curve
↓
Aim Vector
↓
Power Calculation
↓
Launch Velocity
↓
Trajectory Prediction
```

The projectile must then launch using the exact same:

```text
Aim Vector
Power
Launch Velocity
```

used by trajectory prediction.

Do not create separate trajectory and launch calculations.

---

# 17. Live Fine Adjustment

While holding:

```text
AIMING
```

the player must be able to make very small finger movements and see the trajectory update smoothly.

Do not quantize aim into coarse increments.

Do not snap horizontal aim to preset positions.

Do not introduce target auto-aim.

The player remains responsible for the shot.

---

# 18. Moving Target Behavior During Aim

Do not freeze the target while aiming.

Do not freeze the rotor while aiming.

Do not slow them automatically.

During an unlimited aim hold:

```text
Rotor continues rotating
Target continues moving
Moving rotor continues moving
```

This is essential.

The player's skill is deciding:

> When should I release?

Unlimited aim hold provides control without removing timing.

---

# 19. Touch Release Rules

On pointer/touch release:

### Case A — Aim never exceeded minimum threshold

```text
No throw
Return READY
```

### Case B — Cancel ready

```text
No throw
Return READY
```

### Case C — Valid aim

```text
Launch projectile
Enter PROJECTILE_ACTIVE
```

### Case D — Gesture interrupted by OS/app state

Safely cancel.

Do not launch accidentally.

---

# 20. App Interruption Safety

If any of the following occurs during aiming:

* app backgrounds
* touch is interrupted
* gesture handler cancels
* view loses interaction
* operating system cancels gesture

perform:

```text
SAFE CANCEL
```

Never interpret an interrupted gesture as a throw.

---

# 21. State Machine

Update the existing state handling.

Preferred high-level states remain:

```text
READY
AIMING
PROJECTILE_ACTIVE
RESULT
RESETTING
```

Cancellation can remain internal to `AIMING`.

Example:

```ts
interface AimState {
  hasEnteredAim: boolean;
  isCancelReady: boolean;
  maxDragDistance: number;
}
```

Avoid creating unnecessary global game states for every gesture detail.

---

# 22. Central Tuning

Add aiming values to the existing central tuning configuration.

Example:

```ts
aiming: {
  minAimDrag: 0.025,

  cancelEnterRadius: 0.045,

  cancelExitRadius: 0.060,

  horizontalAimExponent: 1.35,

  maxHorizontalDrag: 0.30,
}
```

These numbers are starting values.

Use normalized/device-independent units.

Tune on an actual phone.

---

# 23. Debug Overlay

Extend debug mode with:

```text
AIM STATE

Raw Drag X
Raw Drag Y

Normalized X
Normalized Y

Curved Aim X
Aim Y

Power

Max Drag Distance

Has Entered Aim

Cancel Ready

Horizontal Exponent
```

This should make control tuning straightforward.

---

# 24. Development Visualization

When debug mode is enabled, optionally render:

```text
Aim start point

Minimum aim radius

Cancel enter radius

Cancel exit radius

Current touch point
```

These should be development-only.

This will make cancel tuning substantially easier.

---

# 25. Challenge Generator Constraint

Do not modify:

```text
ChallengeGenerator
ChallengeValidator
DifficultyBudget
Challenge templates
Generated seeds
Target movement configuration
Rotor movement configuration
```

The same challenges that felt difficult before this patch should be tested again afterward.

We need an A/B comparison.

If the same challenge becomes enjoyable after improved aiming, the problem was control precision.

If it remains frustrating, challenge tuning can be addressed separately.

---

# 26. Implementation Order

## Phase 1 — Preserve Baseline

Run current Prototype 0.2.

Identify one moving-target challenge that currently feels difficult to aim.

Record:

```text
Run seed
Challenge ID
Challenge number
```

Use it as the primary control test.

---

## Phase 2 — Unlimited Hold

Verify there is no aim timeout or auto-fire.

Make aim duration unlimited.

Test holding for at least:

```text
10 seconds
```

while rotor and target continue moving.

Release should still throw normally.

---

## Phase 3 — Minimum Drag

Add:

```text
MIN_AIM_DRAG
```

Prevent tiny accidental touches/releases from firing.

---

## Phase 4 — Cancel

Implement:

```text
drag outward
↓
return to origin
↓
CANCEL
↓
release
↓
READY
```

Verify no heart or attempt is consumed.

---

## Phase 5 — Cancel Hysteresis

Implement separate enter/exit thresholds.

Verify cancel indicator does not flicker near boundary.

---

## Phase 6 — Cancel Feedback

Add:

```text
CANCEL text
trajectory fade/hide
single light haptic
```

Keep subtle.

---

## Phase 7 — Horizontal Precision

Add nonlinear horizontal response.

Start:

```text
exponent = 1.35
```

Do not alter vertical response.

---

## Phase 8 — Prediction Synchronization

Verify trajectory predictor and actual projectile use identical transformed aim values.

---

## Phase 9 — Interruption Safety

Test gesture cancellation/app interruption.

No interruption should accidentally fire the projectile.

---

## Phase 10 — Device Testing

Test the previously difficult moving-target challenge.

Compare:

```text
Before patch
vs
After patch
```

Do not change the challenge itself.

---

# 27. Acceptance Criteria

Patch is complete when:

### Cancellation

* Player can begin aiming.
* Player can return toward the original touch point.
* CANCEL state becomes visually apparent.
* Releasing in cancel state does not fire.
* Cancelled shot consumes no heart.
* Cancelled shot does not increment attempts.
* Cancelled shot does not change challenge.
* Player returns immediately to READY.
* Player can cancel repeatedly without state corruption.

### Cancel Recovery

* Player can enter cancel state.
* Player can drag outward again.
* Cancel state exits.
* Trajectory returns.
* Player can subsequently throw normally.

### Unlimited Hold

* Player can hold aim for at least 10 seconds.
* No auto-fire occurs.
* No timeout occurs.
* Rotor continues moving.
* Target continues moving.
* Moving rotor continues moving.
* Aim can still be adjusted after a long hold.
* Release after a long hold behaves normally.

### Horizontal Precision

* Small horizontal finger movements create visibly finer trajectory changes than before.
* Full horizontal aiming range remains available.
* Horizontal control does not feel dead near center.
* Vertical control remains substantially unchanged.
* Maximum power remains available.

### Trajectory

* Preview uses transformed horizontal aim.
* Actual projectile matches preview.
* No discrepancy is introduced by the precision curve.

### Safety

* Tiny accidental tap does not fire.
* Cancelled gesture does not fire.
* Interrupted gesture does not fire.
* App backgrounding during aim does not fire.

### Regression

* Stationary target challenges still work.
* Moving target challenges still work.
* Moving rotor challenges still work.
* Dual-rotor challenges still work.
* Challenge generator produces the same configurations as before.
* Run seeds remain reproducible.
* Existing projectile physics remains substantially unchanged.

---

# 28. Playtest

After implementation, replay the exact moving-target challenge identified before the patch.

Test this sequence deliberately:

```text
Aim left
↓
Hold
↓
Target changes position
↓
Adjust slightly right
↓
Decide timing is bad
↓
Return to cancel
↓
Release
↓
Start again
↓
Aim
↓
Hold
↓
Fine-adjust
↓
Wait for rotor opening
↓
Release
```

This sequence should feel natural.

The important test is not simply whether the player can complete the challenge.

Ask:

> Can I express the shot I intend to make without fighting the controls?

If yes, preserve these controls and continue Prototype 0.2.

If no, stop further difficulty expansion and tune the input system again.

---

# 29. Explicitly Out of Scope

Do not implement as part of this patch:

```text
❌ Auto aim
❌ Aim assist toward target
❌ Target snapping
❌ Target freezing
❌ Rotor freezing
❌ Slow motion while aiming
❌ Automatic release
❌ Aim timer
❌ Challenge difficulty changes
❌ Slower generated targets
❌ Larger generated targets
❌ Easier rotors
❌ Challenge generator changes
❌ New obstacle types
❌ New environments
❌ Monetization
❌ Cosmetics
❌ Progression systems
```

This patch is exclusively about giving the player better control over an intended shot.

---

# 30. Agent Final Report

When complete, report:

```text
IMPLEMENTED
- ...

FILES CHANGED
- ...

AIMING TUNING VALUES
- ...

CANCEL IMPLEMENTATION
- ...

HORIZONTAL PRECISION IMPLEMENTATION
- ...

TRAJECTORY/PREDICTION CHANGES
- ...

REGRESSION TESTS
- ...

MOVING TARGET TEST
- ...

KNOWN ISSUES
- ...

DEVIATIONS FROM SPEC
- ...
```

Do not continue implementing unrelated Prototype 0.2 features after this patch.

Stop for playtesting.
