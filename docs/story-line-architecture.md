# SPARK — Campaign/Product Architecture Upgrade

## Status

Working title:

**SPARK**

This is NOT necessarily the final commercial name.

Do not spend significant time producing final branding assets, logo art, polished character art, or store graphics yet.

Those will be addressed after this implementation.

For now, use:

```text
SPARK
```

as the internal working title.

---

# 1. Mission

Upgrade the existing precision-projectile prototype into the foundation of the actual game.

The existing prototype has validated:

* drag-to-aim
* release-to-launch
* trajectory prediction
* projectile physics
* deterministic obstacle collision
* moving obstacles
* moving targets
* multiple obstacle families
* environments
* scoring
* streaks
* progression experiments
* analytics architecture
* monetization architecture
* rewarded ads
* purchases
* endless runs

Preserve those systems where appropriate.

The game is now changing from:

> Endless precision arcade game about throwing a ball through obstacles.

to:

> A campaign-driven precision adventure about guiding a living energy entity across Earth and space so it can find its way home.

The existing endless game becomes a post-campaign mode called:

# ENDLESS VOYAGE

---

# 2. Critical Rule

DO NOT rewrite validated projectile physics unless necessary.

Preserve:

```text
drag
aim
power
trajectory
launch
gravity
collision
plane crossing
obstacle prediction
target precision
```

The validated gameplay remains the foundation.

This task changes:

```text
GAME STRUCTURE

STORY

PROGRESSION

TARGET PRESENTATION

LEVEL SYSTEM

SAVE SYSTEM

ECONOMY

ENERGY

SHOP

BOOSTS

COSMETICS

MONETIZATION FLOW

WORLD STRUCTURE
```

Do not casually modify the core throw.

---

# 3. Core Fantasy

The player controls a tiny living energy entity.

Working character name:

# SPARK

Spark is NOT simply a ball.

Spark may continue using a spherical collider and similar geometry internally.

Visually and conceptually Spark is alive.

Spark should eventually communicate personality through:

* pulsing
* stretching
* energy trail
* brightness
* vibration
* sound
* reactions

Do not add cartoon eyes, arms, legs, or dialogue.

Placeholder primitive visuals are acceptable for this implementation.

Final character graphics come later.

---

# 4. Story

Long before the game begins, a human deep-space probe encounters an unknown self-sustaining energy phenomenon.

The probe captures it.

The energy is alive.

Humans do not realize this.

The specimen eventually reaches Earth and is transferred to an experimental research facility.

Scientists designate it:

```text
SPECIMEN S-01
```

They discover that it contains an extraordinary amount of self-sustaining energy.

Spark is placed inside a containment system.

Scientists begin studying it as a possible energy source.

Spark can sense something impossibly far away.

A pulse.

Something familiar.

Home.

A containment failure gives Spark an opportunity to escape.

The game begins.

---

# 5. Opening Sequence

Keep the opening short.

Do not build a large cinematic system.

Suggested sequence:

Dark screen.

Small glowing Spark appears inside a containment chamber.

Nearby display:

```text
SPECIMEN S-01

CONTAINMENT: STABLE
```

Spark pulses.

A distant pulse answers.

Lights flicker.

Alarm.

```text
CONTAINMENT FAILURE
```

A mechanical opening becomes visible.

Tutorial:

```text
DRAG TO AIM
```

Player drags.

Trajectory appears.

```text
RELEASE
```

The first launch begins immediately.

Story should be experienced through gameplay.

---

# 6. Campaign Goal

Spark is trying to:

# GET HOME

The campaign follows Spark from:

```text
EARTH
↓
CITY
↓
SKY
↓
ATMOSPHERE
↓
ORBIT
↓
MOON
↓
ASTEROID BELT
↓
NEBULA
↓
ANCIENT NETWORK
↓
HOME
```

The player should always understand that successful levels move Spark closer to home.

---

# 7. Replace Target With Jump Gate

The existing circular target system becomes a:

# JUMP GATE

Do NOT rewrite the underlying precision calculation.

Map existing target zones:

```text
HIT
GREAT
BULLSEYE
PERFECT
```

onto concentric Jump Gate regions.

Conceptually:

```text
OUTER GATE
→ HIT

INNER RING
→ GREAT

INNER CORE
→ BULLSEYE

EXACT CENTER
→ PERFECT
```

The existing target radius calculations can remain.

Change presentation and terminology where appropriate.

---

# 8. Jump Gate Success

On successful gate entry:

Spark enters the gate.

Gate reacts.

Spark disappears into it.

Camera transitions forward.

Next level/environment loads.

PERFECT should produce the strongest visual/audio response.

Use placeholder effects now if necessary.

Do not create final portal graphics yet.

---

# 9. Campaign Size

Architect for:

# 150 CORE LEVELS

organized into:

# 10 WORLDS

with:

```text
15 levels per world
```

Also architect support for:

```text
3 optional Challenge Gates per world
```

for a potential total of:

```text
150 core levels
30 challenge levels
180 playable campaign challenges
```

Do NOT manually author all 180 levels during this task unless specifically requested.

Implement the architecture and enough representative content to validate it.

---

# 10. Recommended Immediate Content Scope

For this upgrade implement:

```text
WORLD 1
15 playable levels

WORLD 2
at least 5 representative playable levels

WORLD 1 → WORLD 2 transition

campaign map/progression

shop/economy systems

energy system

boost system

save system
```

Stub/configure the remaining worlds.

Do not attempt to fully polish 150 levels in one task.

---

# 11. World Definition Model

Create a data-driven world configuration.

Example conceptual interface:

```ts
interface WorldDefinition {
  id: string;
  index: number;
  name: string;
  subtitle?: string;

  firstLevel: number;
  lastLevel: number;

  environmentId: string;

  storyBeat?: string;

  primaryMechanics: string[];

  completionReward?: RewardDefinition[];

  unlockRequirements?: UnlockRequirement[];

  homeSignalStrength?: number;
}
```

Do not hard-code world behavior into screens.

---

# 12. Level Definition

Campaign levels should support authored configuration.

Example conceptual structure:

```ts
interface CampaignLevelDefinition {
  id: string;
  worldId: string;
  levelNumber: number;

  obstacleConfigs: GameplayObstacleConfig[];

  gateConfig: GateConfig;

  environmentConfig?: EnvironmentOverride;

  physicsOverrides?: PhysicsOverride;

  windConfig?: WindConfig;

  gravityConfig?: GravityConfig;

  tutorialHint?: TutorialHint;

  storyBeat?: StoryBeat;

  rewards: LevelRewardDefinition;

  isWorldFinale?: boolean;
}
```

Reuse existing obstacle configuration types wherever possible.

Do not duplicate the obstacle architecture.

---

# 13. Campaign World Structure

Each world follows approximately:

```text
LEVELS 1–5
DISCOVERY

LEVELS 6–10
DEVELOPMENT

LEVELS 11–14
MASTERY

LEVEL 15
WORLD ESCAPE / FINALE
```

This applies within each world's 15-level block.

---

# 14. World 1 — CONTAINMENT

Levels:

```text
1–15
```

Location:

Underground Earth research facility.

Primary mechanic:

# ROTOR

Visual placeholders:

* steel
* glass
* cables
* warning lights
* containment machinery
* emergency lights

Use primitive geometry for now.

---

# 15. World 1 Progression

Levels 1–5:

Teach:

```text
AIM

POWER

TRAJECTORY

TIMING

GATE ENTRY
```

Use forgiving configurations.

---

Levels 6–10:

Introduce:

```text
FASTER ROTOR

OFFSET GATE

MOVING GATE

REVERSE ROTOR
```

---

Levels 11–14:

Combine:

```text
ROTOR + MOVING GATE

SMALLER OPENING

VERTICAL AIMING

MORE DEMANDING TIMING
```

---

Level 15:

# LOCKDOWN

Final facility escape.

Suggested sequence:

```text
ROTOR
↓
SECOND ROTOR / SECURITY MECHANISM
↓
SECURITY DOOR
↓
JUMP GATE
```

Completing Level 15 permanently unlocks:

# WORLD 2 — THE CITY

---

# 16. World 2 — THE CITY

Levels:

```text
16–30
```

Location:

City surrounding the facility.

Visual placeholders:

* rooftops
* ventilation systems
* antennas
* cranes
* distant buildings
* city lights

Primary new obstacle:

# SLIDING GATE

---

# 17. Sliding Gate

Reuse the previously defined obstacle where possible.

Opening moves:

```text
HORIZONTAL

VERTICAL
```

Later:

```text
VARIABLE WIDTH
```

The player predicts where the opening will be when Spark reaches its depth plane.

---

# 18. World 2 Environmental Mechanic

Introduce:

# WIND

Wind may affect Spark's trajectory.

Wind MUST always be communicated visually.

Potential indicators:

* particles
* flags
* clouds
* Spark trail
* subtle directional UI

Do not create invisible random trajectory changes.

Trajectory preview must incorporate wind.

---

# 19. Remaining World Roadmap

Configure/stub the following.

## WORLD 3 — THE SKY

Levels:

```text
31–45
```

New primary obstacle:

```text
MOVING RING
```

Environmental mechanic:

```text
CROSSWIND
```

Finale:

```text
THE STORM
```

---

## WORLD 4 — UPPER ATMOSPHERE

Levels:

```text
46–60
```

New obstacle:

```text
IRIS
```

Mechanic:

```text
GRAVITY REDUCTION
```

Finale:

```text
ESCAPE VELOCITY
```

---

## WORLD 5 — ORBIT

Levels:

```text
61–75
```

New obstacle:

```text
PENDULUM
```

Mechanic:

```text
LOW GRAVITY
```

Finale:

```text
ORBITAL GRAVEYARD
```

---

## WORLD 6 — THE MOON

Levels:

```text
76–90
```

New obstacle:

```text
ORBITER
```

Mechanic:

```text
GRAVITY WELLS
```

Finale:

```text
FAR SIDE
```

---

## WORLD 7 — ASTEROID BELT

Levels:

```text
91–105
```

New obstacle:

```text
DRIFTING BLOCKERS
```

Mechanic:

```text
MULTIPLE ROUTES
```

Finale:

```text
COLLISION COURSE
```

---

## WORLD 8 — THE NEBULA

Levels:

```text
106–120
```

New obstacle:

```text
ENERGY FIELD
```

Mechanic:

```text
PHASE WINDOWS
```

Finale:

```text
FALSE HOME
```

---

## WORLD 9 — THE ANCIENT NETWORK

Levels:

```text
121–135
```

New obstacle:

```text
SHIFTING APERTURE
```

Advanced mechanic:

```text
SYNCHRONIZED SYSTEMS
```

Finale:

```text
THE KEY
```

Spark discovers the actual location of home.

---

## WORLD 10 — HOMEWARD

Levels:

```text
136–150
```

NO major new obstacle family.

Use combinations of everything learned.

Levels 146–149 should visibly approach Spark's home.

Level 150:

# HOME

Final authored sequence.

---

# 20. Final Level

Level 150 should eventually include:

```text
ROTOR + MOVING RING

IRIS + GRAVITY WELL

PENDULUM + PHASE FIELD

SYNCHRONIZED ANCIENT APERTURES
```

Then remove difficulty.

Final shot:

No dangerous obstacle.

Home is visible.

Player aims Spark toward an enormous final gate.

Release.

Spark enters.

Other Sparks appear.

Fade.

```text
HOME
```

Then:

```text
SPARK MADE IT HOME
```

Do not implement final cinematic polish yet.

Architect the state necessary for it.

---

# 21. Campaign Completion

Completing Level 150 sets:

```ts
campaignCompleted = true;
```

Persist permanently.

Unlock:

# ENDLESS VOYAGE

---

# 22. Endless Voyage

Preserve the existing procedural endless-run architecture.

Do NOT delete it.

Move it behind:

```text
ENDLESS VOYAGE
```

which becomes available after campaign completion.

Endless Voyage uses:

* procedural generator
* existing difficulty director
* all unlocked obstacle families
* all environments
* score
* streaks
* three-heart structure
* rewarded Continue
* high scores

Narratively:

Spark has reached home.

Spark and others now explore the ancient gateway network.

The ending remains valid.

---

# 23. Campaign Failure Model

Campaign does NOT use the existing three-heart endless-run system.

Campaign uses:

```text
ATTEMPT
↓
SUCCESS
or
FAIL
```

Failure:

```text
-1 Energy
```

unless:

* Unlimited Energy is active
* Second Chance applies
* another explicit rule prevents consumption

Then player can retry immediately if Energy remains.

---

# 24. Permanent Progress

Campaign progress NEVER resets because of:

* failure
* Energy depletion
* app close
* backgrounding
* device restart
* time away

If player completes Level 82:

```text
LEVEL 83
```

is permanently unlocked.

---

# 25. Save Immediately

After successful completion:

1. calculate result
2. grant first-time rewards
3. update best performance
4. unlock next level
5. persist save
6. begin transition

Save BEFORE relying on visual transition completion.

A crash during the transition must not erase the completed level.

---

# 26. Save Model

Create versioned persistence.

Conceptual:

```ts
interface PlayerSave {
  saveVersion: number;

  highestUnlockedLevel: number;
  completedLevels: Record<string, LevelProgress>;

  unlockedWorldIds: string[];

  campaignCompleted: boolean;

  shards: number;

  currentEnergy: number;
  energyUpdatedAt: number;

  ownedSparkIds: string[];
  equippedSparkId: string;

  ownedTrailIds: string[];
  equippedTrailId?: string;

  boostInventory: Record<string, number>;

  activeEntitlements: EntitlementState;

  challengeProgress: Record<string, ChallengeProgress>;

  stats: PlayerStats;

  settings: PlayerSettings;
}
```

Adapt to current project architecture.

Do not duplicate existing save infrastructure unnecessarily.

---

# 27. Save Migration

Existing prototype saves may exist.

Add migration.

Do not crash when encountering:

* old save
* partial save
* corrupt field
* missing field

Use safe defaults.

Document migration behavior.

---

# 28. Campaign Map

Replace endless-first home flow with a Journey interface.

The map should communicate:

```text
EARTH
↓
CITY
↓
SKY
↓
ATMOSPHERE
↓
ORBIT
↓
MOON
↓
ASTEROID BELT
↓
NEBULA
↓
ANCIENT NETWORK
↓
UNKNOWN
```

Before World 9 completion, final destination should be:

```text
UNKNOWN
```

After discovering The Key:

```text
HOME
```

No final graphics required.

Create a clean functional UI.

---

# 29. Journey Progress

Show:

```text
JOURNEY HOME

83 / 150
```

and current location.

Example:

```text
WORLD 6
THE MOON

LEVEL 83
```

Player should always understand how far through the campaign they are.

---

# 30. Returning Player

On subsequent launch, prioritize:

```text
CONTINUE JOURNEY
```

Example:

```text
WORLD 6 — THE MOON

LEVEL 83

[ CONTINUE JOURNEY ]
```

Do NOT require replaying earlier content.

---

# 31. Completed Levels

Players may replay completed levels.

Store best result:

```text
CLEAR

GREAT

BULLSEYE

PERFECT
```

A completed level never becomes incomplete.

---

# 32. Score

Score represents:

# SKILL

Score is NOT currency.

Starting configurable values:

```text
CLEAR       +100

GREAT       +150

BULLSEYE    +250

PERFECT     +400

CLOSE CALL   +50
```

Integrate existing streak logic where appropriate.

Centralize values.

---

# 33. Score Uses

Score supports:

* level best
* world score
* total career score
* personal records
* Endless Voyage
* future leaderboards
* achievements

Score cannot be spent.

---

# 34. Soft Currency

Introduce:

# SHARDS

Working final terminology:

```text
SHARDS
```

Do not call them Spark Coins in UI.

Shards represent collectible/usable energy fragments.

---

# 35. Shard Rewards

Initial placeholder tuning:

```text
FIRST LEVEL CLEAR
+5

GREAT
+2 bonus

BULLSEYE
+4 bonus

PERFECT
+8 bonus

WORLD COMPLETE
+50

CHALLENGE GATE
+20
```

These values MUST be centrally configurable.

---

# 36. Prevent Easy Farming

Do not repeatedly grant first-clear rewards.

Track per-level reward state.

Example:

Player first clears Level 12 with GREAT.

Grant:

```text
CLEAR REWARD
GREAT REWARD
```

Later achieves PERFECT.

Grant only previously unearned:

```text
BULLSEYE/PERFECT PERFORMANCE REWARDS
```

according to the final reward hierarchy.

Do not let players farm Level 1 infinitely for full Shards.

---

# 37. Economy Config

Create or extend:

```text
src/config/economy.ts
```

Centralize:

```ts
maxEnergy
energyRegenMinutes

levelClearShards
greatBonusShards
bullseyeBonusShards
perfectBonusShards

worldCompletionShards
challengeGateShards

skinCosts
trailCosts

boostCosts

rewardedAdEnergyAmount
```

No scattered economy numbers.

---

# 38. Energy

Campaign uses:

# ENERGY

Initial development tuning:

```text
MAX ENERGY
15

REGENERATION
1 Energy / 10 minutes
```

These are NOT final commercial values.

They exist for testing.

---

# 39. Energy Consumption

Recommended rule:

```text
SUCCESS
→ no Energy consumed

FAILURE
→ -1 Energy
```

This means skilled players can continue playing.

Repeated failures eventually create a break.

---

# 40. Energy Regeneration

Energy regenerates while:

* playing
* in menus
* app backgrounded
* app closed

Persist:

```text
energyUpdatedAt
```

On load/resume calculate regenerated Energy.

Never exceed max Energy unless a specific reward system intentionally allows overfill.

---

# 41. Energy UI

Campaign HUD/menu should show something like:

```text
⚡ 12 / 15
```

When below maximum, optionally show:

```text
NEXT +1
08:42
```

Do not overwhelm active gameplay with economy UI.

---

# 42. Out of Energy

When Energy reaches zero:

```text
SPARK NEEDS TO RECHARGE
```

Show:

```text
NEXT ENERGY
09:42

[ WATCH AD ]
+1 ENERGY

[ UNLIMITED ENERGY — 24 HOURS ]
localized price

[ UNLIMITED ENERGY — 7 DAYS ]
localized price

[ COME BACK LATER ]
```

Never trap the player.

---

# 43. Rewarded Energy

Add optional rewarded-ad flow.

Default:

```text
WATCH AD
→ +1 Energy
```

Make reward configurable.

Use existing ad service abstraction.

Do not directly integrate ad-provider calls into UI components.

---

# 44. Unlimited Energy

Support timed purchases:

```text
UNLIMITED ENERGY — 24 HOURS

UNLIMITED ENERGY — 7 DAYS
```

While active:

```text
∞ ENERGY
```

Campaign failures consume no Energy.

---

# 45. Unlimited Energy Entitlement

Persist:

```text
unlimitedEnergyExpiresAt
```

Display remaining time.

Do not implement paid duration as a fragile foreground timer.

Use timestamps.

Integrate storefront entitlement/transaction state correctly.

---

# 46. Store Pricing

Do NOT hard-code:

```text
$0.99
$2.99
```

into production UI.

UI must display localized storefront price.

Development mocks may use placeholder values clearly identified as mocks.

---

# 47. Shop

Add:

# SHOP

Initial categories:

```text
SPARKS

BOOSTS

ENERGY

PREMIUM
```

Do not build an excessively complicated storefront.

---

# 48. Sparks / Skins

Spark skins are cosmetic.

All use identical:

```text
PHYSICS

COLLIDER

GAMEPLAY
```

Initial placeholder catalog:

```text
ORIGINAL

NEON

SOLAR

FROST

STORM

PLASMA

LUNAR

METEOR

NEBULA

VOID

ANCIENT

ORIGIN
```

Do not create final high-quality assets yet.

Use configurable placeholder materials/effects.

---

# 49. Skin Acquisition Types

Support:

```ts
type SkinAcquisition =
  | "default"
  | "shards"
  | "world_completion"
  | "mastery"
  | "premium";
```

Examples:

```text
NEON
500 Shards
```

```text
SOLAR
1,000 Shards
```

```text
LUNAR
Complete World 6
```

```text
ANCIENT
Mastery reward
```

```text
PRISM
Premium
```

Values are placeholders.

---

# 50. Spark Selection

Create functional customization screen.

Show:

```text
owned

locked

selected

cost

unlock requirement
```

Allow player to equip any owned Spark.

Persist selection.

---

# 51. Trails

Architect optional cosmetic trails.

Initial placeholders:

```text
STANDARD

STARDUST

LIGHTNING

FIRE

FROST

VOID
```

Do not prioritize final trail artwork during this task.

---

# 52. Boost System

Create reusable boost architecture.

Initial gameplay boosts:

```text
GUIDANCE

SLOW FIELD

SECOND CHANCE
```

Architect:

```text
HYPERJUMP
```

but it does not need to be enabled immediately if gameplay implementation requires additional testing.

---

# 53. Guidance

# GUIDANCE

Normal gameplay uses existing trajectory-preview rules.

Guidance provides enhanced prediction.

Potential implementation:

```text
FULL TRAJECTORY
```

including obstacle crossing points.

It must NOT:

* auto-aim
* snap to gate
* choose launch timing
* guarantee success

The player still performs the shot.

---

# 54. Slow Field

# SLOW FIELD

For one attempt:

```text
OBSTACLE MOTION MULTIPLIER
≈ 0.60
```

Make configurable.

Spark's trajectory/physics remain predictable.

Visual effect should clearly communicate slowed surrounding time.

Placeholder effect acceptable.

---

# 55. Second Chance

# SECOND CHANCE

If Spark fails during an attempt:

* do not consume Energy
* consume one Second Chance
* reset level for immediate retry

It does NOT automatically clear the level.

---

# 56. Hyperjump

Architect future:

# HYPERJUMP

Fantasy:

Spark becomes extremely fast.

Desired perceived result:

```text
SPARK FLARES
↓
WORLD SLOWS
↓
SPARK TRAVERSES HAZARD
↓
NORMAL TIME RETURNS
```

Prefer slowing obstacle simulation rather than drastically changing Spark's trajectory equations.

Do not enable until tested for fairness.

---

# 57. Boost Inventory

Persist quantities.

Example:

```ts
boostInventory = {
  guidance: 3,
  slowField: 2,
  secondChance: 1,
};
```

Boosts can be obtained through:

* Shards
* world rewards
* challenge rewards
* future purchases

---

# 58. Buying Boosts With Shards

Placeholder:

```text
GUIDANCE
100 Shards

SLOW FIELD
150 Shards

SECOND CHANCE
200 Shards
```

Central config only.

---

# 59. Pre-Level Boost Selection

Before a level, allow optional selection.

Example:

```text
LEVEL 57

BEST: GREAT

BOOSTS

[ ] Guidance
[ ] Slow Field
[ ] Second Chance

[ PLAY ]
```

Do not force this screen to become cumbersome.

If UX becomes slow, integrate boost selection into level preview.

---

# 60. Contextual Boost Assistance

Track repeated failures on current level.

After a configurable threshold, e.g.:

```text
5 failures
```

optionally surface:

```text
NEED A HAND?

USE SLOW FIELD
```

If player owns one:

```text
[ USE ]
```

If not:

```text
150 SHARDS
```

Do NOT immediately demand money.

---

# 61. Shop Purchase Priority

The commercial hierarchy should be:

```text
1. TIMED UNLIMITED ENERGY

2. COSMETICS

3. OPTIONAL BOOSTS

4. REWARDED ADS

5. OPTIONAL CURRENCY PACKS

6. REMOVE ADS
```

Do not optimize the game around constant purchase prompts.

---

# 62. Premium Sparks

Support direct-purchase cosmetic Spark forms.

Potential examples:

```text
GALAXY

PRISM

BLACK HOLE

PIXEL
```

These are placeholders.

Premium Sparks have:

```text
NO GAMEPLAY ADVANTAGE
```

---

# 63. Shard Packs

Architect optional purchases:

```text
SMALL SHARD PACK

MEDIUM SHARD PACK

LARGE SHARD PACK
```

Do not finalize quantities or prices yet.

Need economy data first.

---

# 64. Remove Ads

Preserve/support:

```text
REMOVE ADS
```

Permanent entitlement.

Removes forced interstitials.

Does NOT remove optional rewarded ads.

---

# 65. Forced Ads

Be conservative.

Never show forced ads:

```text
DURING AIM

DURING FLIGHT

AFTER EVERY FAILURE

BETWEEN RAPID RETRIES
```

Potential natural boundaries:

```text
OCCASIONAL LEVEL COMPLETION

WORLD TRANSITION
```

Use existing centralized InterstitialPolicy.

---

# 66. Do Not Stack Monetization

If a player:

* just watched a rewarded ad
* just bought Unlimited Energy
* just completed a purchase

do not immediately show an interstitial.

Centralize suppression logic.

---

# 67. Campaign Replay

Completed campaign levels may be replayed.

Consider replay:

```text
NO ENERGY COST
```

for 1.0 testing.

Do not grant repeatable full Shard rewards.

Replay exists for:

* score
* PERFECT
* mastery
* enjoyment

---

# 68. Challenge Gates

Architect three optional Challenge Gates per world.

Potential modifiers:

```text
NO TRAJECTORY PREVIEW

PERFECT REQUIRED

MULTI-OBSTACLE SHOT

EXTREME TIMING
```

Do not make Challenge Gates mandatory for story completion.

Rewards may include:

* Shards
* boosts
* cosmetics
* mastery progress

---

# 69. World Completion Rewards

Each world should provide a meaningful reward.

Example future mapping:

```text
WORLD 1
Reactor Spark

WORLD 2
Neon Spark

WORLD 3
Storm Spark

WORLD 4
Aurora Spark

WORLD 5
Solar Spark

WORLD 6
Lunar Spark

WORLD 7
Meteor Spark

WORLD 8
Nebula Spark

WORLD 9
Ancient Spark

WORLD 10
Origin Spark
```

Use placeholder visuals.

---

# 70. Story Presentation

Avoid dialogue-heavy presentation.

Use:

* environmental changes
* short title cards
* alarms
* Spark pulse
* home signal
* portal behavior
* background progression
* sound
* music hooks

Story beats should be brief.

---

# 71. Home Signal

Architect a recurring:

# HOME SIGNAL

It may eventually be represented by:

* audio pulse
* visual pulse
* UI indicator
* environmental response

World progression increases signal strength.

Example conceptual values:

```text
WORLD 1
faint

WORLD 4
detectable

WORLD 8
strong

WORLD 9
located

WORLD 10
home
```

Do not spend time creating final audio yet.

---

# 72. Distance From Earth

World transitions may display distance.

Examples:

```text
12 KM FROM EARTH
```

then:

```text
384,000 KM FROM EARTH
```

eventually:

```text
LIGHT YEARS FROM EARTH
```

Store these as authored world/story metadata.

Do not generate nonsense random distances.

---

# 73. Level Completion Screen

Keep it fast.

Example:

```text
LEVEL 42

BULLSEYE

SCORE
+250

SHARDS
+9

BEST
BULLSEYE

[ NEXT ]
```

If Energy was not consumed:

No need to emphasize it.

---

# 74. World Completion Screen

Example:

```text
WORLD 4 COMPLETE

UPPER ATMOSPHERE

60 / 150

+50 SHARDS

AURORA SPARK UNLOCKED

NEXT:
ORBIT
```

Then transition.

---

# 75. Energy Exhaustion Is NOT Progress Loss

If player runs out at:

```text
LEVEL 117
```

they remain at:

```text
LEVEL 117
```

Forever until completed.

They may:

* wait
* watch rewarded ad
* activate Unlimited Energy
* use available systems

Never send them backward.

---

# 76. Returning After Break

If player leaves for a week:

On return:

```text
WELCOME BACK
```

Show:

```text
WORLD 8
THE NEBULA

LEVEL 117

ENERGY
15 / 15

[ CONTINUE JOURNEY ]
```

Do not guilt the player.

Do not reset streak-dependent campaign progress.

---

# 77. Home Screen — Campaign Phase

Functional hierarchy:

```text
SPARK

JOURNEY HOME
83 / 150

[ CONTINUE ]

[ JOURNEY ]

[ SPARKS ]

[ SHOP ]

[ STATS ]

[ SETTINGS ]
```

Final visual design comes later.

---

# 78. Home Screen — Post Campaign

After completing Level 150:

```text
SPARK

HOME REACHED

[ ENDLESS VOYAGE ]

[ REPLAY JOURNEY ]

[ CHALLENGES ]

[ SPARKS ]

[ SHOP ]

[ STATS ]

[ SETTINGS ]
```

---

# 79. Navigation

Create clean navigation architecture for:

```text
HOME

JOURNEY

LEVEL

SPARKS

SHOP

STATS

SETTINGS

ENDLESS VOYAGE
```

Do not overcomplicate with excessive nested navigation.

---

# 80. Statistics

Preserve/expand statistics.

Campaign:

```text
levels completed

worlds completed

total attempts

failures

perfects

bullseyes

greats

close calls

shards earned

boosts used
```

Endless:

```text
best score

longest run

best streak

perfects

bullseyes
```

---

# 81. Analytics

Extend existing analytics abstraction.

Track campaign events:

```text
campaign_started

world_entered

world_completed

level_started

level_failed

level_completed

level_replayed

precision_result

shards_earned

shards_spent

energy_spent

energy_regenerated

energy_empty

rewarded_energy_offered

rewarded_energy_started

rewarded_energy_completed

unlimited_energy_viewed

unlimited_energy_purchased

boost_selected

boost_used

boost_purchased_shards

skin_viewed

skin_unlocked

skin_purchased_shards

skin_purchased_money

skin_equipped

campaign_completed

endless_voyage_unlocked
```

No per-frame telemetry.

---

# 82. Important Analytics Properties

For level events include where appropriate:

```text
worldId

levelNumber

attemptNumber

obstacleTypes

boostUsed

energyBefore

energyAfter

result

score

failureReason
```

Avoid sensitive or unnecessary data.

---

# 83. Economy Telemetry

We need to eventually answer:

```text
Which levels cause repeated failure?

When do players run out of Energy?

Do they leave or continue?

Which boosts are useful?

Are Shards earned too quickly?

Are Shards earned too slowly?

Do players care about Spark customization?

Where do players stop progressing?
```

Implement telemetry accordingly.

---

# 84. Development Economy Overrides

Add dev-only controls:

```text
ADD SHARDS

SET SHARDS

SET ENERGY

EMPTY ENERGY

FULL ENERGY

ENABLE UNLIMITED ENERGY

EXPIRE UNLIMITED ENERGY

ADD BOOSTS

UNLOCK SPARKS

RESET CAMPAIGN

SET CURRENT LEVEL

COMPLETE WORLD

COMPLETE CAMPAIGN
```

Never expose these in production.

---

# 85. Campaign Debug Controls

Add:

```text
JUMP TO LEVEL

JUMP TO WORLD

RESET LEVEL RESULT

FORCE PERFECT

FORCE FAILURE

SHOW COLLIDERS

SHOW TRAJECTORY DATA
```

Preserve existing useful physics diagnostics.

---

# 86. Development Purchase Provider

If real storefront products are not configured yet:

Use the existing provider abstraction and create safe mock products.

Do not block implementation because final store IDs/prices are unavailable.

Clearly mark:

```text
MOCK PURCHASE
```

in development builds.

---

# 87. Architecture

Prefer feature separation such as:

```text
src/
  campaign/
    worlds/
    levels/
    progression/
    story/

  gameplay/
    projectile/
    obstacles/
    gate/
    physics/

  economy/
    shards/
    energy/
    rewards/

  boosts/

  customization/
    sparks/
    trails/

  shop/

  endless/

  monetization/
    ads/
    purchases/
    entitlements/

  persistence/

  analytics/

  config/
    gameplay.ts
    economy.ts
    commercial.ts
```

Adapt to current repository.

Do not restructure working files solely to match this example.

---

# 88. Preserve Existing Obstacle Work

Existing obstacle implementations should be reused.

Known families include:

```text
ROTOR

SLIDING GATE

IRIS

PENDULUM

MOVING RING
```

Future campaign obstacles should extend the same common obstacle architecture.

Do not create campaign-specific collision systems.

---

# 89. Future Obstacle Rule

Every obstacle must create a different prediction problem.

Examples:

```text
ROTOR
Where will the opening rotate?

SLIDING GATE
Where will the opening translate?

IRIS
How open will it be?

PENDULUM
Where will the blocker swing?

MOVING RING
Where will the safe opening move?

GRAVITY WELL
How will my trajectory curve?

PHASE FIELD
When will the plane become passable?
```

Do not add obstacles that are merely visual reskins.

---

# 90. Fairness

Boosts must NEVER become necessary because a level is unfair.

Every campaign level must be completable:

```text
WITHOUT BOOST

WITHOUT PURCHASE

WITHOUT AD
```

using normal controls.

---

# 91. Monetization Rule

Players purchase:

```text
MORE PLAY TIME

CUSTOMIZATION

CONVENIENCE

OPTIONAL ASSISTANCE
```

Players do NOT purchase:

```text
CAMPAIGN PROGRESS
```

---

# 92. Desired Failure Emotion

Target:

```text
I ALMOST HAD IT.

I KNOW WHAT I DID WRONG.

ONE MORE TRY.
```

Avoid:

```text
THE GAME CHEATED.

THIS IS IMPOSSIBLE WITHOUT A BOOST.
```

---

# 93. Energy Balance Warning

Do not treat:

```text
15 Energy
1 / 10 minutes
```

as final.

These are test values.

Instrument them.

We need to observe:

```text
average failures per level

energy exhaustion rate

session duration

return rate after exhaustion
```

before commercial tuning.

---

# 94. Unlimited Energy Product Warning

Support:

```text
24 HOURS

7 DAYS
```

architecturally.

Do not assume final price.

Use store-provided localized pricing.

---

# 95. Boost Balance Warning

Boosts should make difficult shots easier without converting gameplay into:

```text
PRESS BOOST
→ AUTOMATIC WIN
```

The player should still:

```text
AIM

PREDICT

RELEASE
```

---

# 96. Graphics Scope

DO NOT create final production graphics during this task.

Use:

* primitives
* placeholder materials
* simple effects
* current environments
* temporary icons

We will separately determine:

```text
OFFICIAL GAME NAME

SPARK CHARACTER DESIGN

LOGO

APP ICON

WORLD ART DIRECTION

PORTAL DESIGN

SHOP ART

FINAL UI
```

after the architecture is functioning.

---

# 97. Naming Scope

Continue using:

```text
SPARK
```

internally.

Do NOT:

* rename bundle identifier
* rename package
* purchase domains
* change store metadata
* create permanent identifiers around SPARK

until official naming is complete.

---

# 98. Implementation Priority

Implement in this order.

## Phase A — Campaign Foundation

```text
world definitions
level definitions
campaign progression
permanent checkpoints
save migration
Jump Gate target conversion
World 1
World 2 partial
```

---

## Phase B — Economy

```text
Shards
rewards
reward tracking
Energy
regeneration
out-of-Energy state
```

---

## Phase C — Shop

```text
Spark catalog
Shard purchases
Spark selection
boost inventory
shop UI
```

---

## Phase D — Boosts

```text
Guidance
Slow Field
Second Chance
```

---

## Phase E — Monetization Integration

```text
rewarded Energy
Unlimited Energy entitlement
Remove Ads
premium Spark support
Shard pack support
```

Use mocks where production products are unavailable.

---

## Phase F — Endless Migration

Move existing endless game into:

```text
ENDLESS VOYAGE
```

Gate behind campaign completion in normal production flow.

Allow dev override.

---

## Phase G — Analytics / QA

```text
campaign telemetry
economy telemetry
purchase telemetry
save validation
offline validation
energy time validation
```

---

# 99. Required Vertical Slice

Before scaling to 150 levels, demonstrate:

```text
NEW PLAYER
↓
OPENING
↓
WORLD 1
↓
15 LEVELS
↓
SHARDS EARNED
↓
ENERGY LOST ON FAILURES
↓
SHOP ACCESS
↓
SPARK CUSTOMIZATION
↓
BOOST PURCHASE
↓
BOOST USE
↓
WORLD 1 FINALE
↓
WORLD 2 UNLOCK
↓
SAVE
↓
CLOSE APP
↓
REOPEN
↓
CONTINUE FROM WORLD 2
```

This is the primary acceptance flow.

---

# 100. Secondary Acceptance Flow

Test Energy exhaustion:

```text
ENERGY = 1
↓
FAIL
↓
ENERGY = 0
↓
OUT OF ENERGY
↓
REWARDED AD
↓
+ENERGY
↓
RETRY
```

Then test:

```text
ENERGY = 0
↓
ACTIVATE MOCK 24H UNLIMITED ENERGY
↓
∞ ENERGY
↓
FAIL REPEATEDLY
↓
NO ENERGY CONSUMPTION
↓
CLOSE APP
↓
REOPEN
↓
ENTITLEMENT STILL ACTIVE
```

---

# 101. Shop Acceptance Flow

Test:

```text
EARN SHARDS
↓
OPEN SHOP
↓
VIEW SPARK
↓
BUY WITH SHARDS
↓
SHARD BALANCE DECREASES
↓
SPARK OWNED
↓
EQUIP
↓
ENTER LEVEL
↓
NEW SPARK APPEARS
↓
PHYSICS UNCHANGED
```

---

# 102. Boost Acceptance Flow

Test:

```text
BUY SLOW FIELD WITH SHARDS
↓
SELECT BEFORE LEVEL
↓
START LEVEL
↓
BOOST ACTIVE
↓
OBSTACLES SLOWED
↓
ATTEMPT ENDS
↓
BOOST CONSUMED
```

Verify same level remains completable without it.

---

# 103. Persistence Acceptance Flow

Reach:

```text
WORLD 2
LEVEL 18
```

Have:

```text
742 Shards

8 / 15 Energy

2 Guidance

1 Slow Field

Neon Spark equipped
```

Close application completely.

Reopen.

Everything must restore correctly.

Campaign must resume at:

```text
WORLD 2
LEVEL 18
```

---

# 104. Offline Acceptance Flow

Disable network.

Verify:

```text
campaign loads

levels play

save works

Shards work

Energy regeneration works

owned cosmetics work

boost inventory works
```

Expected unavailable:

```text
rewarded ads

new purchases

analytics delivery
```

Unavailable external services must not block gameplay.

---

# 105. Do Not Build Yet

Do NOT add during this task:

```text
FINAL NAME

FINAL CHARACTER ART

FINAL WORLD ART

FINAL LOGO

STORE SCREENSHOTS

LEADERBOARDS

SOCIAL FEATURES

FRIENDS

PVP

BATTLE PASS

DAILY LOGIN STREAK

LOOT BOXES

RANDOM PAID REWARDS

CRAFTING

MULTIPLE CURRENCIES

SUBSCRIPTION

GUILDS

ACHIEVEMENTS SYSTEM
```

Keep the economy understandable.

---

# 106. Product Loop

The campaign loop should now be:

```text
OPEN GAME
↓
CONTINUE JOURNEY
↓
ATTEMPT LEVEL
↓
FAIL
→ RETRY
or
SUCCESS
↓
EARN SCORE / SHARDS
↓
SAVE CHECKPOINT
↓
NEXT LEVEL
↓
NEW MECHANICS
↓
NEW WORLD
↓
GET CLOSER TO HOME
```

Supporting loop:

```text
EARN SHARDS
↓
CUSTOMIZE SPARK
or
BUY BOOST
↓
CONTINUE JOURNEY
```

Energy loop:

```text
REPEATED FAILURE
↓
ENERGY EMPTY
↓
WAIT
or
REWARDED AD
or
UNLIMITED ENERGY
↓
CONTINUE
```

---

# 107. Emotional Goal

The player should not primarily think:

> I need to complete Level 84.

They should think:

> I need to get Spark home.

Level numbers provide structure.

The journey provides motivation.

---

# 108. Commercial Goal

The ideal purchase motivation is:

> I don't want to stop playing yet.

not:

> The game is forcing me to pay.

Unlimited Energy is therefore most valuable when the player is already engaged.

Do not manufacture frustration specifically to trigger it.

---

# 109. Final Product Identity

Even with placeholder graphics, all architecture should now reflect:

> Spark is alive.

> Spark was captured.

> Spark escaped.

> Spark is following a signal.

> Spark is traveling away from Earth.

> Spark is trying to get home.

Every major system should support that premise.

---

# 110. Deliverables

When implementation is complete, produce:

```text
docs/CAMPAIGN-ARCHITECTURE.md

docs/ECONOMY.md

docs/MONETIZATION.md

docs/WORLD-PROGRESSION.md

docs/SAVE-SCHEMA.md

docs/IMPLEMENTATION-REPORT.md
```

Document actual implementation, not merely this specification.

---

# 111. Implementation Report

`IMPLEMENTATION-REPORT.md` must include:

```text
SUMMARY
- ...

FILES CREATED
- ...

FILES MODIFIED
- ...

CAMPAIGN ARCHITECTURE
- ...

WORLD SYSTEM
- ...

LEVEL SYSTEM
- ...

WORLD 1 LEVELS
- ...

WORLD 2 SAMPLE LEVELS
- ...

JUMP GATE
- ...

CAMPAIGN SAVE / CHECKPOINTS
- ...

SAVE MIGRATION
- ...

SCORE
- ...

SHARDS
- ...

ENERGY
- ...

ENERGY REGENERATION
- ...

UNLIMITED ENERGY
- ...

REWARDED ENERGY
- ...

SHOP
- ...

SPARK CUSTOMIZATION
- ...

BOOSTS
- ...

GUIDANCE
- ...

SLOW FIELD
- ...

SECOND CHANCE
- ...

MONETIZATION
- ...

ENDLESS VOYAGE MIGRATION
- ...

ANALYTICS
- ...

OFFLINE BEHAVIOR
- ...

DEV TOOLS
- ...

TESTS
- ...

PERFORMANCE
- ...

KNOWN ISSUES
- ...

PLACEHOLDER SYSTEMS
- ...

MANUAL CONFIGURATION REQUIRED
- ...

RECOMMENDED NEXT STEP
- ...
```

---

# 112. Stop Condition

Once the vertical slice works:

STOP.

Do not proceed to:

* final branding
* final graphics
* remaining 130 levels
* additional monetization systems
* new currencies
* additional boosts
* new game modes

until the vertical slice has been reviewed.

The next human/design phase will determine:

```text
OFFICIAL GAME NAME

SPARK'S FINAL CHARACTER DESIGN

VISUAL STYLE

WORLD ART DIRECTION

LOGO

APP ICON

PORTAL / JUMP GATE DESIGN

SHOP VISUAL DESIGN

FINAL UI LANGUAGE
```

Then production content can scale.

---

# 113. Final Instruction

Treat the existing prototype as validated gameplay technology.

Do not throw it away.

Build the campaign/product layer around it.

The objective of this task is to prove that the prototype can now support:

> a persistent journey,

> a reason to care about the projectile,

> a destination,

> a meaningful progression system,

> customization,

> an understandable economy,

> fair monetization,

> and a reason to come back tomorrow.

At the end of the vertical slice, a tester should be able to:

1. meet Spark,
2. understand that Spark is escaping,
3. play through Containment,
4. earn Shards,
5. fail and consume Energy,
6. buy/equip a cosmetic Spark,
7. buy/use a boost,
8. complete World 1,
9. reach The City,
10. close the app,
11. return later,
12. continue exactly where they left off.

If that works and feels coherent, the prototype has successfully become the foundation of the real game.
