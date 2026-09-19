# Rewarded Continue — Replace Rewarded Revive Specification

Rename the feature from:

```text
REWARDED REVIVE
```

to:

```text
REWARDED CONTINUE
```

The terminology should communicate that the player is continuing the current endless run rather than restarting or reviving a character.

---

## Core Flow

When the player loses their final heart:

```text
FINAL HEART LOST
↓
PAUSE RUN
↓
CONTINUE?
```

Display:

```text
KEEP GOING?

Watch an ad to continue this run.

[ CONTINUE ]

[ END RUN ]
```

The run must remain intact while this screen is displayed.

Preserve:

* score
* shots cleared
* environment
* loop number
* challenge progression
* XP earned during run
* current run statistics
* run seed

Do not generate a new run.

---

## Successful Continue

If the player chooses CONTINUE and successfully completes the rewarded ad:

```text
REWARDED AD COMPLETE
↓
RESTORE 1 HEART
↓
RESET CURRENT STREAK
↓
RETRY CURRENT CHALLENGE
↓
READY
```

Restore:

```text
♥
```

Do NOT restore all three hearts.

The player continues with exactly:

```text
1 heart
```

unless later playtesting explicitly justifies another value.

---

## Retry Same Challenge

The challenge responsible for Game Over must remain.

Example:

```text
Shot 37
↓
Hit Iris
↓
Final heart lost
↓
Continue
↓
Watch rewarded ad
↓
Shot 37 again
```

Do not skip the challenge that defeated the player.

Otherwise rewarded continuation becomes a way of bypassing difficult challenges.

---

## Streak

On continue:

```ts
currentStreak = 0;
```

The score remains intact.

The player therefore preserves the run but does not preserve the failed streak.

---

## One Continue Per Run

For Prototype 0.7:

```text
MAX REWARDED CONTINUES PER RUN = 1
```

Track:

```ts
hasUsedRewardedContinue: boolean;
```

After it has been used:

```text
FINAL HEART LOST
↓
GAME OVER
```

Do not show another Continue offer.

---

## Why Continue Is Limited

Do not implement unlimited rewarded continues.

The high-score system depends on Game Over having meaning.

Unlimited continues would allow:

```text
Ad
↓
Continue
↓
Ad
↓
Continue
↓
Ad
↓
Continue
```

which would make score increasingly correlated with willingness to watch ads rather than gameplay skill.

Prototype 0.7 should preserve competitive integrity even without online leaderboards.

---

## Continue Availability

Only display the rewarded Continue option if:

```text
rewarded ad is available
AND
continue has not already been used
AND
rewarded continues are enabled
```

If the ad is unavailable:

Proceed normally to:

```text
GAME OVER
```

Do not display a Continue button that cannot function.

---

## Ad Loading

Preload the rewarded ad during the run where supported.

Do not wait until Game Over to begin loading if that creates a long delay.

The Continue screen should normally know immediately whether continuation is available.

---

## Continue Screen Timing

Do NOT use a countdown.

The player may decide whether the run is valuable enough to continue.

This is especially important when the player has achieved:

* a high score
* a long streak earlier in the run
* a deep loop
* a personal-best attempt

---

## New Best Runs

Do not make rewarded continuation mandatory just because the player has a new best.

The choice remains:

```text
CONTINUE

or

END RUN
```

---

## Analytics

Track:

```text
continue_offered
continue_selected
continue_ad_started
continue_ad_completed
continue_ad_failed
continue_declined
```

Include:

```ts
{
  runId,
  score,
  shotsCleared,
  loopNumber,
  environment,
  previousBestScore
}
```

This will eventually let us determine whether players value continuing longer runs more than short ones.

---

## Important Analytics Distinction

Track whether the final run used a rewarded continue:

```ts
usedRewardedContinue: boolean;
```

This is important when evaluating:

```text
average run length

average score

high scores

difficulty

retention
```

A 70-shot natural run and a 70-shot run that required a continue should not be indistinguishable in analytics.

---

## High Scores

For Prototype 0.7, allow continued runs to count toward local high scores.

However, record:

```text
BEST SCORE
```

and optionally internally track:

```text
BEST NO-CONTINUE SCORE
```

Do not necessarily show both to the player yet.

This gives us flexibility if competitive leaderboards are added later.

---

## Remove Ads Purchase

Owning:

```text
REMOVE ADS
```

does NOT automatically grant free continues.

Remove Ads removes forced interstitial advertising.

Rewarded Continue remains an optional rewarded-ad mechanic.

Do not silently turn Remove Ads into unlimited continuation.

If a future paid/no-ad continuation system is desired, treat that as a separate product-design decision.

---

## Interaction With Interstitials

This rule is mandatory:

If the player watches a rewarded Continue ad:

```text
DO NOT SHOW AN INTERSTITIAL
```

when that same run eventually ends.

The player has already watched an advertisement during that run.

Set:

```ts
suppressInterstitialForCurrentRun = true;
```

This prevents:

```text
Rewarded ad
↓
continue
↓
die
↓
interstitial ad
```

which would be excessive.

---

## Run Over

If the player declines Continue:

```text
END RUN
↓
RUN OVER
```

If the player already used Continue:

```text
FINAL HEART LOST
↓
RUN OVER
```

If rewarded ad is unavailable:

```text
FINAL HEART LOST
↓
RUN OVER
```

---

## Debug Controls

Add development controls:

```text
REWARDED CONTINUE READY

REWARDED CONTINUE UNAVAILABLE

FORCE CONTINUE AD SUCCESS

FORCE CONTINUE AD FAILURE

RESET CONTINUE USED

SET CONTINUES USED
```

---

## Acceptance Criteria

Rewarded Continue is correct when:

* it appears only after the final heart is lost
* it appears only when a rewarded ad is available
* it can be used once per run
* successful ad completion restores exactly one heart
* score is preserved
* run progression is preserved
* environment is preserved
* run seed is preserved
* current challenge is retried
* streak resets
* failed ads do not grant continuation
* duplicate callbacks cannot grant multiple hearts
* declining proceeds to Game Over
* second death after Continue proceeds to Game Over
* rewarded Continue suppresses an interstitial at the end of that run
* analytics distinguish continued and non-continued runs

---

# Do Not Implement Yet

Do not add:

```text
❌ Unlimited continues

❌ Multiple ads per death

❌ Continue currency

❌ Continue tokens

❌ Gems to continue

❌ Paid extra hearts

❌ Increasing ad requirements

❌ "Watch 2 ads to continue"

❌ Countdown pressure

❌ Fake unavailable buttons

❌ Skip-the-current-challenge reward
```

Start with the cleanest possible model:

```text
3 HEARTS
↓
FINAL DEATH
↓
ONE OPTIONAL REWARDED CONTINUE
↓
1 HEART
↓
SECOND FINAL DEATH
↓
GAME OVER
```

This is the behavior to test in Prototype 0.7.
