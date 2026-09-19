# Prototype 0.7 — Analytics, Monetization & Release Instrumentation

## Agent Mission

Prototype 0.7 adds the commercial and measurement foundation to the existing mobile arcade game.

Previous prototypes should already provide:

* polished aiming and throwing
* trustworthy trajectory/collision
* multiple obstacle families
* endless generated runs
* Workshop / Rooftop / Space environments
* score
* streaks
* Close Calls
* XP / player levels
* projectile cosmetics
* local persistence
* onboarding
* settings
* audio
* haptics
* accessibility
* stable long-session performance

Do NOT use this milestone to redesign gameplay.

Prototype 0.7 must answer:

> Can we measure how players actually engage with the game and introduce monetization without damaging the fast "one more run" loop?

---

# 1. Core Rule

Monetization must fit around the game.

The game must NOT be redesigned around advertising.

Protect:

```text
AIM
↓
THROW
↓
RESULT
↓
NEXT SHOT
```

Never place an ad between normal successful shots.

Never interrupt active aiming.

Never interrupt projectile flight.

Never interrupt an environment transition.

---

# 2. Inspect Before Implementing

Before changing code:

1. Inspect the existing Expo project.
2. Identify current analytics dependencies.
3. Identify current ad dependencies.
4. Identify current purchase/IAP dependencies.
5. Inspect persistence architecture.
6. Inspect Run Over/restart flow.
7. Inspect settings.
8. Inspect app lifecycle handling.
9. Confirm current Expo SDK compatibility.

Reuse compatible existing packages.

Do not downgrade Expo merely to support an outdated package.

If ads/IAP require a development build or native configuration, document and configure it correctly.

---

# 3. Production vs Development Configuration

Create centralized environment/configuration handling.

Conceptually:

```ts
interface CommercialConfig {
  analyticsEnabled: boolean;

  adsEnabled: boolean;

  rewardedReviveEnabled: boolean;

  interstitialEnabled: boolean;

  purchasesEnabled: boolean;

  useTestAds: boolean;
}
```

Development builds must use test ads.

Never use production ad IDs for routine development testing.

---

# 4. Analytics Philosophy

Do not track everything.

Track events needed to answer specific gameplay/product questions.

Primary questions:

```text
How many runs do players start?

How long are runs?

How many shots are cleared?

Where do players fail?

How often do they immediately retry?

Which obstacle families cause failure?

How often are Bullseye/Perfect achieved?

How often is revive offered?

How often is revive accepted?

How often do players continue after an ad?

How quickly do new players quit?
```

---

# 5. Analytics Service

Create a centralized analytics abstraction.

Example:

```ts
Analytics.track(
  eventName,
  properties
);
```

Gameplay systems should not directly depend on a vendor-specific analytics SDK.

Structure:

```text
src/services/analytics/
  Analytics.ts
  AnalyticsProvider.ts
  analyticsEvents.ts
```

This allows the analytics provider to change later.

---

# 6. Privacy

Do not collect unnecessary personal data.

Do not send:

* names
* email addresses
* exact location
* contact information
* user-generated text
* device identifiers beyond what the chosen SDK legitimately handles

Track gameplay behavior, not identity.

---

# 7. Core Analytics Events

Implement at minimum:

```text
app_open

onboarding_started
onboarding_completed

run_started
run_ended

shot_started
shot_success
shot_failed

obstacle_collision
target_miss

bullseye
perfect
close_call

environment_entered
loop_completed

new_high_score

level_up
projectile_unlocked
projectile_selected

revive_offered
revive_started
revive_completed
revive_failed
revive_declined

interstitial_eligible
interstitial_shown
interstitial_failed
interstitial_dismissed

purchase_started
purchase_completed
purchase_failed
purchase_restored
```

Do not emit duplicate events for the same action.

---

# 8. Run ID

Create a temporary unique ID for each run.

Example:

```ts
runId
```

Include it on relevant gameplay events.

Do not treat this as a user identity.

It exists to associate events from one run.

---

# 9. Run Started

Track:

```ts
{
  runId,
  runTheme,
  startingPlayerLevel,
  previousBestScore
}
```

Do not include unnecessary data.

---

# 10. Shot Success

Track:

```ts
{
  runId,

  shotNumber,

  environment,

  loopNumber,

  obstacleTypes,

  challengeDifficulty,

  result:
    | "HIT"
    | "GREAT"
    | "BULLSEYE"
    | "PERFECT",

  currentStreak
}
```

Do not send per-frame trajectory data.

---

# 11. Shot Failure

Track:

```ts
{
  runId,

  shotNumber,

  environment,

  loopNumber,

  obstacleTypes,

  challengeDifficulty,

  failureType:
    | "OBSTACLE"
    | "TARGET_MISS",

  obstacleTypeIfApplicable,

  heartsRemaining
}
```

This is one of the most important events.

---

# 12. Run End

Track:

```ts
{
  runId,

  score,

  durationSeconds,

  shotsCleared,

  attempts,

  bestStreak,

  bullseyes,

  perfects,

  closeCalls,

  rotorHits,

  targetMisses,

  environmentReached,

  loopReached,

  revived,

  newHighScore
}
```

This should allow analysis of natural session/run length.

---

# 13. Immediate Retry

Track whether the player starts another run shortly after Run Over.

Do not create a separate complicated system if this can be derived from:

```text
run_ended
↓
run_started
```

with timestamps/session context.

If necessary, add:

```text
retry_started
```

but prefer simpler event design.

---

# 14. Debug Analytics

Development mode should support:

```text
ANALYTICS DEBUG
ON / OFF
```

When enabled, display/log emitted event names and relevant properties.

Do not spam production logs.

---

# 15. Rewarded Revive

Add ONE rewarded revive opportunity per run.

Flow:

```text
FINAL HEART LOST
↓
RUN WOULD END
↓
REVIVE OFFER
↓
WATCH AD TO CONTINUE
```

Options:

```text
[ REVIVE ]

[ END RUN ]
```

Do not offer multiple rewarded revives in Prototype 0.7.

---

# 16. Revive Reward

After successful rewarded ad completion:

```text
+1 HEART
```

Then resume the run.

Recommended:

```text
currentStreak = 0
```

Do not restore the previous streak.

Score remains.

Run progression remains.

Environment remains.

Challenge progression remains.

---

# 17. Revive Challenge Behavior

After revival, retry the challenge that caused the final death.

Do not immediately generate a new challenge.

Flow:

```text
FAIL
↓
0 HEARTS
↓
REVIVE
↓
1 HEART
↓
RESET PROJECTILE
↓
RETRY CURRENT CHALLENGE
```

This makes the reward understandable.

---

# 18. Revive Safety

Only grant the revive after the rewarded-ad SDK confirms the reward/completion callback.

Do not grant reward merely because:

* ad opened
* ad started
* ad partially played
* ad failed

Prevent duplicate reward callbacks from granting multiple hearts.

---

# 19. Revive Failure

If the rewarded ad:

* cannot load
* errors
* is unavailable

do not punish the player.

Return cleanly to the Run Over path.

Show a small message such as:

```text
REVIVE UNAVAILABLE
```

Do not trap the user.

---

# 20. Revive Frequency

Maximum:

```text
1 rewarded revive per run
```

Track:

```ts
hasUsedReviveThisRun
```

Reset at the beginning of each new run.

---

# 21. Interstitial Ads

Interstitial ads must only appear at natural run boundaries.

Potential location:

```text
RUN OVER
↓
INTERSTITIAL
↓
RESULTS / TRY AGAIN
```

or:

```text
RUN OVER
↓
RESULTS
↓
TRY AGAIN
↓
INTERSTITIAL
↓
NEW RUN
```

Choose the flow that produces the least friction after testing.

Do not show interstitials during a run.

---

# 22. Do Not Show Interstitial Every Run

Create an eligibility system.

Initial conservative rule:

```text
Never show after first run.

Never show after onboarding run.

Never show if player just watched rewarded revive ad.

Never show two interstitials on consecutive run endings.

Require minimum time since previous interstitial.

Require minimum completed runs since previous interstitial.
```

Centralize all thresholds.

---

# 23. Initial Interstitial Configuration

Start conservatively.

Example tuning:

```ts
const INTERSTITIAL_CONFIG = {
  minimumRunsBeforeFirstAd: 3,

  minimumRunsBetweenAds: 2,

  minimumSecondsBetweenAds: 180,

  suppressAfterRewardedAd: true
};
```

These are initial test values, not permanent business rules.

Do not hardcode them across components.

---

# 24. Interstitial Eligibility

Create:

```ts
InterstitialPolicy.canShow(context)
```

or equivalent.

The policy should consider:

```text
runsCompleted
runsSinceLastInterstitial
timeSinceLastInterstitial
rewardedAdRecentlyShown
onboardingStatus
adsDisabled
adAvailability
```

Do not scatter eligibility conditions throughout UI code.

---

# 25. Never Interrupt "One More Run"

The restart loop was intentionally designed to be fast.

Measure how interstitials affect:

```text
RUN OVER
↓
TRY AGAIN
↓
NEXT RUN
```

If ads make this loop feel substantially worse, reduce frequency.

Do not optimize ad impressions before validating retention.

---

# 26. Ad-Free Purchase Foundation

Prepare support for:

```text
REMOVE ADS
```

Do not automatically choose a final price in code.

Use product configuration.

Example:

```ts
REMOVE_ADS_PRODUCT_ID
```

The product should disable:

```text
INTERSTITIAL ADS
```

It should NOT disable optional rewarded ads.

A player who owns Remove Ads may still voluntarily use rewarded revive if they choose.

---

# 27. Purchase Architecture

If the project already uses a purchase system, preserve it.

Otherwise create a provider abstraction.

Conceptually:

```text
PurchaseService

getOfferings()
purchaseRemoveAds()
restorePurchases()
hasRemoveAdsEntitlement()
```

Do not spread vendor-specific purchase logic throughout UI components.

---

# 28. Entitlement

Persist/cache:

```text
removeAds
```

but do not rely exclusively on local storage as purchase authority if the chosen purchase provider supports entitlement verification.

Restore purchases must work.

---

# 29. Purchase UI

Add a minimal monetization section to Settings or Home.

Example:

```text
REMOVE ADS

Enjoy uninterrupted runs.

[ REMOVE ADS ]

[ RESTORE PURCHASES ]
```

Do not build a full store yet.

---

# 30. Rewarded Ads and Remove Ads

Be explicit:

```text
REMOVE ADS
=
removes forced interstitial advertising
```

It does NOT remove:

```text
optional rewarded revive
```

because rewarded ads are voluntarily initiated by the player.

---

# 31. Ad Loading

Preload ads where appropriate.

Do not wait until Run Over to begin every ad load if the SDK supports safe preloading.

However:

* do not consume excessive resources
* do not load repeatedly every frame
* do not create duplicate ad instances

Centralize ad lifecycle management.

---

# 32. Ad Service

Create something conceptually similar to:

```text
src/services/ads/
  AdService.ts
  RewardedAdController.ts
  InterstitialAdController.ts
  InterstitialPolicy.ts
```

UI should request actions from the service rather than directly operating the SDK.

---

# 33. Ad State

Handle:

```text
IDLE
LOADING
READY
SHOWING
FAILED
```

Prevent double taps from opening multiple ads.

Disable relevant buttons while an ad is already showing/loading where appropriate.

---

# 34. App Lifecycle During Ads

Ads may background or interrupt the game.

Ensure:

* simulation remains paused
* projectile does not move
* rotor timing does not advance unfairly
* no accidental launch occurs
* audio resumes correctly
* run state remains intact

This must work for both rewarded and interstitial ads.

---

# 35. Audio Around Ads

When full-screen ad begins:

```text
pause/mute game audio
```

When returning:

```text
restore according to user settings
```

Do not accidentally enable audio if the player had disabled it.

---

# 36. Analytics + Ads

Track:

```text
ad requested
ad available
ad shown
ad completed
ad dismissed
ad failed
```

Do not count:

```text
requested
```

as:

```text
shown
```

Keep the distinction accurate.

---

# 37. Monetization Metrics

The analytics implementation should make it possible to calculate later:

```text
Runs per player/session

Average run duration

Median run duration

Shots per run

Retry rate

Revive offer rate

Revive acceptance rate

Rewarded completion rate

Interstitials per session

Run-start rate after interstitial

Run-start rate without interstitial

Retention proxies available from chosen analytics provider
```

Do not build a complicated in-game analytics dashboard.

---

# 38. Consent / Privacy Requirements

Inspect the requirements of the selected:

* analytics provider
* advertising provider
* target platforms
* app distribution configuration

Implement required consent/privacy hooks correctly.

Do not invent legal language.

Document anything requiring App Store / Play Console configuration.

---

# 39. Tracking Permission

If the chosen advertising implementation uses tracking that requires platform permission, isolate that behavior appropriately.

Do not request intrusive permissions immediately on first launch without a justified flow.

Prefer contextual permission handling where applicable.

Document exactly what is implemented.

---

# 40. First Session Protection

Do not aggressively monetize a brand-new player.

During:

```text
ONBOARDING
```

and the first meaningful gameplay experience:

No forced interstitial.

Let the player understand the game first.

---

# 41. New Player Ad Rule

At minimum:

```text
Run 1
NO INTERSTITIAL

Run 2
NO INTERSTITIAL
```

Earliest eligibility:

```text
after Run 3
```

subject to the central ad policy.

Rewarded revive can be available earlier because it is optional, but consider whether it complicates onboarding.

---

# 42. Development Ad Controls

Debug mode should support:

```text
ADS ENABLED
ON/OFF

USE TEST ADS
ON/OFF

FORCE REWARDED READY

FORCE REWARDED FAILURE

FORCE INTERSTITIAL READY

FORCE INTERSTITIAL FAILURE

RESET AD COUNTERS

SET REMOVE ADS ENTITLEMENT
```

These must not be exposed in production UI.

---

# 43. Test Matrix

Test at minimum:

### Rewarded

```text
Rewarded available
Rewarded unavailable
Rewarded completes
Rewarded closes early
Reward callback fires once
Reward callback attempts duplicate
App backgrounds during rewarded
```

### Interstitial

```text
Eligible
Not eligible
Unavailable
Show success
Show failure
Dismiss
App backgrounds
```

### Purchase

```text
Purchase success
Purchase cancel
Purchase failure
Restore success
Restore no entitlement
Already owns entitlement
```

---

# 44. Offline Behavior

The game must remain playable offline.

If ads cannot load:

```text
PLAY GAME NORMALLY
```

If analytics cannot send:

Do not block gameplay.

If purchase offerings cannot load:

Display graceful unavailable state.

Core gameplay must never require network connectivity.

---

# 45. No Ad Failure Punishment

Never do:

```text
Ad failed
↓
player loses reward opportunity AND cannot continue normally
```

Instead:

```text
Ad failed
↓
return safely
```

For revive:

If the run has already ended and rewarded revive fails, continue to Run Over normally.

---

# 46. Session Instrumentation

Create a lightweight session identifier if the analytics provider does not already handle sessions appropriately.

Do not create a user account.

Track en
