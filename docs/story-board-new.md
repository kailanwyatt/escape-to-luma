# SPARK — ESCAPE TO LUMA
## Complete Storyboard, Campaign & World Implementation Specification

> **Working title:** Spark — Escape to Luma  
> **Status:** Tentative title / pre-production  
> **Platform:** iOS + Android  
> **Technology:** Expo / React Native + existing lightweight 3D stack / Skia where useful  
> **Campaign:** 10 Worlds × 15 Levels = 150 Core Levels  
> **Primary character:** Spark  
> **Destination:** Luma  
> **Core fantasy:** Escape captivity. Follow the signal. Find home.

---

# 1. PURPOSE OF THIS DOCUMENT

This document is the source of truth for the story, campaign structure,
world progression, opening sequence, gameplay presentation, and visual
implementation of **Spark — Escape to Luma**.

The existing prototype has already validated the core mechanic:

1. Drag Spark to aim.
2. Drag distance influences power.
3. Predict obstacle movement.
4. Release Spark.
5. Spark travels through 3D space.
6. Clear one or more moving obstacles.
7. Reach the destination.
8. Receive precision feedback.
9. Continue.

Do NOT replace this mechanic.

The purpose of the campaign is to give that mechanic:

- a character
- motivation
- context
- progression
- environments
- escalating mechanics
- persistent progress
- an ending

The player is no longer throwing a generic ball through obstacles.

The player is helping a living energy entity escape Earth and return home.

---

# 2. TECHNICAL / VISUAL CONSTRAINT

Everything designed for this game must be achievable with the existing
Expo-based project.

We are NOT using:

- Unity
- Unreal Engine
- Godot
- a Blender-heavy production pipeline
- complex cinematic rendering
- large numbers of bespoke 3D models

Prefer:

- primitive 3D geometry
- reusable modular geometry
- simple meshes
- flat / low-complexity materials
- emissive materials
- transparent materials
- texture decals
- generated textures
- transparent VFX sprites
- particles
- light strips
- simple dynamic lighting
- camera animation
- React Native UI overlays
- Skia effects where appropriate
- lightweight procedural effects

A concept render is NOT automatically an implementation target.

When reproducing concept art, ask:

> How can this appearance be approximated using reusable primitives,
> textures, lighting, particles and UI?

---

# 3. GRAPHICS PIPELINE

Do NOT use complete concept renders as gameplay backgrounds.

The game needs real depth because:

- Spark moves through depth
- trajectory matters
- obstacles occupy different Z planes
- gates move
- the camera transitions forward
- levels reuse environments

Instead use:

CONCEPT ART
↓
IDENTIFY REUSABLE ELEMENTS
↓
BUILD PRIMITIVE 3D VERSION
↓
IDENTIFY VISUAL GAPS
↓
CREATE TEXTURES / SPRITES / DECALS
↓
POLISH

Example World 1 reusable environment kit:

- floor panel
- wall panel
- ceiling beam
- structural column
- pipe
- cable
- crate
- equipment cabinet
- console
- warning light
- blue light strip
- red alarm strip
- security door
- rotor frame
- containment frame
- containment cylinder
- hazard stripe
- S-01 decal
- laboratory monitor
- gate frame
- particle emitter

World 1 should NOT require 15 completely different environments.

The same modular kit should create many arrangements.

---

# 4. GAMEPLAY CAMERA — CRITICAL

The validated gameplay camera must remain recognizable.

Camera is:

**BEHIND SPARK, LOOKING FORWARD DOWN THE DEPTH AXIS.**

Spark appears near the lower center of the screen.

Obstacles appear ahead.

The destination appears beyond them.

Approximate composition:

                    DESTINATION
                         ◎

                  OBSTACLE B
                       ◯

                  OBSTACLE A
                       ◯


                       ✦
                     SPARK

                     CAMERA

The player should visually understand:

- Spark's current position
- trajectory
- first obstacle
- deeper obstacles
- destination

Do NOT convert gameplay to:

- side view
- top-down
- isometric
- third-person chase camera
- free camera

Cinematic scenes may use other camera positions.

Gameplay returns to the established camera.

---

# 5. SPARK

Spark is a living energy entity.

Spark is NOT a ball, even though the implementation may continue using
a sphere collider.

Base visual construction can initially be:

sphere
+
emissive core
+
transparent outer shell
+
glow sprite
+
particle trail
+
small energy arcs

Spark communicates personality without dialogue.

Possible behaviors:

## Idle

- gentle pulse
- small floating motion
- subtle energy particles

## Aiming

- slightly compress
- stretch toward intended trajectory
- energy intensifies

## Launch

- rapid flare
- short energy trail
- subtle stretch

## Close Call

- outer shell flickers
- sparks
- small haptic

## Collision

- destabilizes
- fragments briefly
- reforms

## PERFECT

- intense brightness
- strong gate interaction
- satisfying audio/haptic event

Spark should NOT have:

- arms
- legs
- cartoon eyes
- mouth
- spoken dialogue

The player's emotional connection should come from movement and reactions.

---

# 6. THE STORY

Far from Earth, a human deep-space probe encounters an unknown
self-sustaining energy phenomenon.

The probe captures a fragment of it.

The fragment is alive.

Humans do not understand this.

The specimen eventually reaches Earth.

Scientists designate it:

SPECIMEN S-01

The specimen is placed inside an experimental containment facility.

Researchers discover extraordinary properties.

Spark appears capable of producing energy continuously.

The facility begins studying Spark as a potential energy source.

Spark remains trapped.

Then Spark detects something.

A pulse.

Faint.

Impossibly distant.

Familiar.

Home.

The signal is coming from a distant place:

# LUMA

Spark does not initially know exactly where Luma is.

Spark only recognizes the signal.

Something eventually destabilizes the containment vessel.

A tiny breach forms.

Spark has one opportunity.

The player takes control.

---

# 7. CAMPAIGN OBJECTIVE

The campaign objective is simple:

# GET SPARK HOME TO LUMA

The journey:

EARTH
↓
CONTAINMENT FACILITY
↓
CITY
↓
SKY
↓
UPPER ATMOSPHERE
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
LUMA

The player should increasingly feel that they are moving farther from
Earth and closer to something unknown.

---

# 8. OPENING STORYBOARD

The opening should NOT be a long video.

Build it using real-time scenes and existing gameplay assets.

Target duration:

approximately 30–60 seconds before player control.

Allow SKIP after first viewing.

---

# SCENE 1 — APP LAUNCH

## Visual

Dark space.

Minimal stars.

Spark slowly appears.

Spark pulses.

Earth may be visible far below or behind.

Temporary logo:

SPARK
ESCAPE TO LUMA

Subtitle optional:

A SMALL SPARK.
A LONG WAY HOME.

Button:

TAP TO BEGIN

## Implementation

Can use:

- dark gradient/background
- particle stars
- Spark real-time object
- subtle camera drift
- React Native title UI

No complex cinematic asset required.

---

# SCENE 2 — DISCOVERY

## Story

Far from Earth, a probe discovers Spark.

## Visual

Simple deep-space probe.

Spark is visible inside or near a small collection chamber.

Text:

FAR FROM EARTH,
SOMETHING WAS FOUND.

Then:

IT WAS DIFFERENT.

IT WAS ALIVE.

## Implementation

Probe should be built from primitive geometry:

- cylinder
- box
- solar panels
- antenna
- collection chamber

Do not build a high-detail spacecraft.

Lighting and silhouette provide most of the effect.

---

# SCENE 3 — SPECIMEN S-01

Transition to Earth laboratory.

Camera is outside Spark's containment vessel.

Spark floats inside.

Monitor:

SPECIMEN S-01

CONTAINMENT: STABLE

ENERGY OUTPUT: EXCEPTIONAL

CLASSIFICATION: UNKNOWN

Optional environmental labeling:

STUDY
CONTAIN
HARNESS

Story implication:

Humans believe Spark is an energy source.

They do not understand that Spark is trying to return home.

---

# SCENE 4 — THE SIGNAL

Laboratory quiets.

Spark pulses.

A faint signal answers.

Lighting subtly responds.

Spark moves toward the direction of the signal.

Text:

THEN IT HEARD SOMETHING.

SOMETHING FAMILIAR.

Audio eventually:

pulse...

pause...

pulse...

This pulse becomes a recurring story motif.

---

# SCENE 5 — CONTAINMENT FAILURE

Electrical instability.

Lights flicker.

Red emergency lights activate.

Containment glass / energy field develops a fracture.

Alarm:

CONTAINMENT FAILURE

SPECIMEN S-01

The opening is small.

Text:

SOMETHING BROKE.

AND SPARK SAW A WAY OUT.

---

# SCENE 6 — CAMERA HANDOFF

This transition is important.

Do NOT cut to an unrelated gameplay environment.

Camera moves from cinematic position toward the established gameplay
position behind Spark.

The player is now INSIDE the containment vessel.

Ahead:

- transparent containment wall
- fractured opening
- laboratory beyond

Spark sits lower center.

Trajectory system becomes available.

Text:

DRAG TO AIM

The cinematic has become gameplay.

---

# 9. WORLD 1 — THE CONTAINMENT

## Levels

1–15

## Story Goal

Escape the research facility.

## Environment

Industrial underground laboratory.

Visual language:

- dark steel
- glass
- pipes
- crates
- machinery
- blue containment lighting
- orange utility lighting
- red emergency lighting
- hazard markings

## Narrative Escalation

World 1 should feel like the facility is reacting to Spark.

Level 1:

accidental opportunity

Levels 2–3:

escape discovered

Levels 4–6:

containment systems activate

Levels 7–10:

security escalates

Levels 11–14:

full lockdown

Level 15:

escape facility

This gives gameplay difficulty a narrative explanation.

---

# LEVEL 1 — THE BREACH

## Objective

Escape the containment vessel.

## Gameplay

Spark begins inside the transparent vessel.

Ahead is a small fractured opening.

No moving obstacle.

Player must aim Spark through the opening.

Tutorial:

DRAG TO AIM

Then:

RELEASE TO LAUNCH

Trajectory preview passes through the fracture.

## Success

Spark passes through.

Electrical discharge.

Alarm intensifies.

Camera moves forward.

Message:

THE BREACH

COMPLETE

## Purpose

Teach:

- drag
- aim
- release
- trajectory
- successful passage

No rotor.

No Jump Gate.

This level exists because Spark is physically escaping its container.

---

# LEVEL 2 — THE LAB

Spark is outside the vessel.

The laboratory corridor stretches ahead.

A large stationary opening exists between pieces of equipment.

Objective:

Launch through the opening.

Teach:

- trajectory
- power
- depth perception

No significant timing challenge yet.

---

# LEVEL 3 — LOCKING DOWN

Security detects Spark.

A large security opening moves slowly.

Teach:

- obstacle movement
- timing

Text:

SECURITY PROTOCOL ACTIVE

The player learns:

The opening must be where Spark WILL arrive,
not where it is at launch time.

---

# LEVEL 4 — FIRST ROTOR

First rotational hazard.

IMPORTANT:

Use a SINGLE rotating containment arm.

Do NOT introduce a 3-blade rotor first.

The arm rotates slowly around a circular frame.

The opening is extremely generous.

Teach:

- rotational timing

Narratively:

The facility activates a containment mechanism.

---

# LEVEL 5 — DOUBLE ROTOR

Add second opposing arm.

Now there are two blockers.

Still relatively slow.

Teach:

- smaller rotational timing window

This visually communicates escalation.

---

# LEVEL 6 — TRIPLE ROTOR

Introduce three-arm rotor.

Player already understands the mechanic.

Teach:

- reading repeated rotational windows

This is the first appearance of what may become the familiar
three-blade rotor.

---

# LEVEL 7 — SPEED UP

Use familiar triple rotor.

Increase speed.

Do NOT introduce another major mechanic simultaneously.

Teach:

- familiar geometry
- changed timing

The player should recognize:

"I know this obstacle, but I need to adjust."

---

# LEVEL 8 — REVERSE

Triple rotor reverses direction.

Clearly communicate reversal.

Possible visual indicator:

- directional lights
- arrows
- startup animation

Teach:

- do not rely on habitual timing

---

# LEVEL 9 — OFFSET

Rotor is no longer perfectly aligned with Spark and destination.

Player must combine:

AIM
+
TIMING

This is an important difficulty transition.

---

# LEVEL 10 — MOVING GATE

Destination moves behind rotor.

Player now predicts:

rotor opening
+
destination position

Do not make both movements excessively fast.

---

# LEVEL 11 — TWO DEPTHS

Two relatively forgiving obstacles exist at different Z positions.

Example:

Rotor A at Z6.

Rotor B at Z9.

Destination at Z12.

Player must clear both with one launch.

Teach:

MULTI-PLANE PREDICTION

This is one of the game's defining mechanics.

---

# LEVEL 12 — COUNTER ROTATION

Two rotors.

Different depth planes.

Opposite rotation directions.

Keep speeds reasonable.

Difficulty comes from prediction rather than raw speed.

---

# LEVEL 13 — SECURITY SEQUENCE

Combine:

rotor
+
sliding security barrier

The player must understand two different movement patterns.

---

# LEVEL 14 — FULL LOCKDOWN

Facility is fully responding.

Use a carefully authored combination of previously learned systems.

Do NOT introduce new mechanic.

This is World 1 mastery.

---

# LEVEL 15 — ESCAPE

## Story

Spark reaches an experimental device at the edge of the facility.

This is the first major Jump Gate.

Humans were experimenting with technology recovered from the original
deep-space probe.

Spark recognizes something about it.

The home signal resonates with the device.

## Gameplay

Final World 1 sequence.

Potential:

single familiar rotor
↓
security gate
↓
multi-plane rotor
↓
Jump Gate

Do not make it unfair.

## Success

Spark enters Jump Gate.

Facility disappears.

Silence.

Then:

WORLD 1 COMPLETE

THE CONTAINMENT

SPARK HAS ESCAPED.

But Spark is not home.

Transition to World 2.

---

# 10. JUMP GATES

Jump Gates replace generic bullseye targets for most later gameplay.

Underlying precision system remains unchanged.

Zones:

OUTER GATE
= HIT / CLEAR

INNER RING
= GREAT

INNER CORE
= BULLSEYE

EXACT CENTER
= PERFECT

Do not rewrite validated target mathematics unnecessarily.

The gate provides narrative meaning for reaching the target.

---

# 11. WORLD 2 — THE CITY

## Levels

16–30

## Story

Spark emerges in the city surrounding the research facility.

The first Jump Gate did not take Spark home.

It moved Spark.

But the signal is stronger.

Spark continues.

## Visual Language

- rooftops
- ventilation systems
- antennas
- cranes
- building silhouettes
- neon
- aircraft warning lights
- security infrastructure

Use reusable low-complexity geometry.

Do not attempt a fully simulated city.

Distant city can use:

- silhouettes
- layered geometry
- fog
- emissive windows
- parallax backgrounds

---

## Primary New Obstacle

SLIDING GATE

Opening translates horizontally or vertically.

Progression:

slow horizontal
↓
faster horizontal
↓
vertical
↓
offset
↓
combined with rotor

---

## Environmental Mechanic

WIND

Wind affects trajectory.

Wind MUST be visually communicated.

Possible cues:

- particles
- flags
- cloud movement
- Spark trail
- directional streaks

Trajectory preview must include wind.

Never apply invisible random wind.

---

## World 2 Level Arc

16–18:
Introduce sliding gate.

19–21:
Vertical movement and offset destinations.

22–24:
Introduce light wind.

25–27:
Combine wind + familiar rotor/gate systems.

28–29:
Security pursuit sequences.

30:
World finale.

---

# LEVEL 30 — SKYBREAK

Spark reaches highest structures.

Security systems are still trying to intercept Spark.

Final launch sends Spark upward through a powerful Jump Gate.

Transition:

city
↓
clouds

World 3 begins.

---

# 12. WORLD 3 — THE SKY

## Levels

31–45

## Story

Spark rises above the city.

Earth begins opening beneath it.

Human structures become less dominant.

## Visuals

- clouds
- blue sky
- sunset variations
- aircraft silhouettes
- weather
- distant city below

---

## New Obstacle

MOVING RING

The entire safe opening moves.

Patterns:

- horizontal
- vertical
- diagonal
- circular
- elliptical

The prediction changes from:

"Where will the blocker be?"

to:

"Where will the safe opening be?"

---

## Environmental Mechanic

CROSSWIND

More significant than World 2 wind.

Still deterministic.

Still visually readable.

---

## Progression

31–33:
Basic moving ring.

34–36:
Vertical / diagonal ring.

37–39:
Circular / elliptical motion.

40–42:
Crosswind.

43–44:
Moving ring + rotor/gate combinations.

45:
Storm finale.

---

# LEVEL 45 — THE STORM

Spark enters major storm system.

Use:

- clouds
- rain particles
- lightning flashes
- moving rings
- wind

Do NOT simulate complex fluid weather.

Use visual effects.

Final Jump Gate appears above storm.

Spark exits into upper atmosphere.

---

# 13. WORLD 4 — UPPER ATMOSPHERE

## Levels

46–60

## Story

Earth's curvature becomes visible.

Spark is truly leaving the planet.

The home signal becomes clearer.

## Visuals

- thin atmosphere
- blue atmospheric rim
- aurora
- satellites
- Earth curvature
- darkening sky

---

## New Obstacle

IRIS

Circular aperture opens and closes.

Player predicts:

How open will the aperture be when Spark arrives?

Progression:

slow iris
↓
faster iris
↓
smaller maximum opening
↓
offset iris
↓
iris + moving systems

---

## Environmental Mechanic

GRAVITY REDUCTION

Gravity gradually becomes weaker.

Do NOT suddenly change physics dramatically.

Introduce progressively.

Trajectory preview always reflects actual physics.

---

# LEVEL 60 — ESCAPE VELOCITY

Final atmospheric sequence.

Earth fills part of background.

Spark crosses final defense / orbital structures.

Final gate sends Spark beyond atmosphere.

World completion moment:

EARTH IS NOW BEHIND SPARK.

---

# 14. WORLD 5 — ORBIT

## Levels

61–75

## Story

Spark has escaped Earth.

But Luma remains unimaginably distant.

The signal continues.

## Visuals

- Earth below
- satellites
- station fragments
- solar panels
- orbital debris
- black space

---

## New Obstacle

PENDULUM / SWEEPING BLOCKER

Examples:

- satellite arm
- solar panel
- broken antenna
- mechanical boom

The prediction becomes:

Where will the blocker sweep?

This should feel distinct from a rotor.

---

## Mechanics

LOW GRAVITY

Trajectory becomes flatter.

Power becomes more important.

---

## Progression

61–63:
basic sweeping blocker

64–66:
larger arcs

67–69:
moving debris

70–72:
multi-plane orbital hazards

73–74:
combined orbital systems

75:
orbital graveyard finale

---

# LEVEL 75 — ORBITAL GRAVEYARD

Dense abandoned orbital infrastructure.

Potential sequence:

moving ring
↓
sweeping solar panel
↓
rotor
↓
iris
↓
Jump Gate

Spark jumps beyond Earth orbit.

---

# 15. WORLD 6 — THE MOON

## Levels

76–90

## Story

Spark emerges near the Moon.

Earth appears distant.

The signal clearly points beyond the solar system.

## Visuals

- lunar surface
- craters
- distant Earth
- abandoned machinery
- stark shadows
- black sky

---

## New Obstacle

ORBITER

A blocker revolves around the safe opening.

Possible forms:

single orbiter
dual orbiters
counter-orbiters

The player predicts when the blocker moves away.

---

## New Mechanic

GRAVITY WELL

Localized gravity influences Spark's trajectory.

Gravity wells MUST be visible.

Potential visual:

- subtle distortion
- glowing gravitational node
- particle orbit

Trajectory preview must account for it.

This introduces controlled curved trajectories.

---

# LEVEL 90 — FAR SIDE

Spark crosses the Moon.

Earth disappears.

For the first time:

there is no Earth visible behind Spark.

The signal points into deep space.

Spark takes first major interplanetary jump.

---

# 16. WORLD 7 — ASTEROID BELT

## Levels

91–105

## Story

Human technology largely disappears.

Spark is now navigating natural space hazards.

## Visuals

- asteroids
- dust
- distant sun
- rock fragments
- metallic remnants
- large depth scale

---

## New Obstacle

DRIFTING BLOCKERS

Objects move across trajectory.

Unlike previous obstacles, there may be multiple viable routes.

The player can choose:

ABOVE

BELOW

LEFT

RIGHT

---

## New Mechanic

MULTIPLE ROUTES

Some levels have:

SAFE ROUTE

and

PRECISION ROUTE

Safe route:

- larger opening
- less direct

Precision route:

- narrow
- aligns better with gate center
- higher scoring opportunity

Do not make optional precision route mandatory.

---

# LEVEL 105 — COLLISION COURSE

Multiple large asteroids cross different depth planes.

One launch.

Several future positions must be predicted.

This should feel like a major mastery milestone.

---

# 17. WORLD 8 — THE NEBULA

## Levels

106–120

## Story

Spark enters a region whose energy resembles the signal from Luma.

Spark reacts strongly.

For a moment, it may seem like home.

It isn't.

## Visuals

- purple / blue energy clouds
- stars
- luminous particles
- crystal-like formations
- electrical energy
- unusual color palette

Keep geometry simple.

Atmosphere comes from particles, gradients and lighting.

---

## New Obstacle

ENERGY FIELD

A dangerous plane with a moving safe opening.

Potential behavior:

- opening moves
- opening expands/contracts
- field pulses

---

## New Mechanic

PHASE WINDOWS

Barrier alternates between:

SOLID

and

PHASED

Spark can cross while phased.

State must be visually obvious.

No invisible timing rules.

---

# LEVEL 120 — FALSE HOME

Spark reaches a huge energy structure.

Signal becomes overwhelming.

Spark enters.

Silence.

Spark emerges somewhere unfamiliar.

It was not Luma.

It was a relay.

But it reveals something important:

the route to Luma.

---

# 18. WORLD 9 — THE ANCIENT NETWORK

## Levels

121–135

## Story

Spark discovers the Jump Gate network is ancient.

Humans did not invent it.

They discovered fragments.

Spark's species appears connected to it.

## Visuals

- ancient geometric machinery
- floating structures
- large rings
- dark metallic surfaces
- gold / cyan energy
- impossible-looking but geometrically simple structures

Use primitives creatively.

Large scale can come from repetition and perspective.

---

## New Obstacle

SHIFTING APERTURE

Safe opening changes between known positions.

Example:

LEFT
↓
CENTER
↓
RIGHT
↓
CENTER

Pattern is deterministic.

Player recognizes sequence.

---

## Advanced Mechanic

SYNCHRONIZED SYSTEMS

Multiple obstacles have relationships.

Examples:

Rotor opens while Iris closes.

Ring reaches center when phase field activates.

Pendulum clears left route while right route closes.

Difficulty comes from understanding the system.

Not simply faster movement.

---

# LEVEL 135 — THE KEY

Spark reaches central ancient mechanism.

Spark's energy activates it.

A star map appears.

The home signal resolves.

For the first time:

LUMA is identified.

Journey map changes:

UNKNOWN

to:

LUMA

Spark knows where home is.

---

# 19. WORLD 10 — HOMEWARD

## Levels

136–150

## Rule

NO major new obstacle family.

World 10 tests everything learned.

The player should feel mastery.

---

## Visual Progression

### Levels 136–140

Deep space.

Existing mechanics combined.

### Levels 141–145

Spark enters Luma's star system.

Colors begin changing.

Distant structures appear.

### Levels 146–149

Approach Luma.

Other energy entities may be visible far away.

Environment increasingly resembles Spark.

Home signal becomes musical and visual.

### Level 150

HOME.

---

# 20. LEVEL 150 — HOME

This is an authored finale.

Do not procedurally generate it.

## Stage 1

Rotor + Moving Ring.

Callback to early mechanics.

## Stage 2

Iris + Gravity Well.

## Stage 3

Pendulum + Phase Field.

## Stage 4

Ancient synchronized apertures.

Then:

silence.

Difficulty stops.

Spark floats.

Far ahead:

Luma.

A massive field of energy.

Structures and thousands of lights.

Other beings like Spark.

A final enormous gate opens.

There is no dangerous obstacle.

Player aims.

Trajectory points toward home.

Player releases.

Spark accelerates.

Camera follows.

Other Sparks approach.

Screen fills with light.

Text:

HOME

Then:

SPARK MADE IT HOME.

---

# 21. LUMA

Do not fully define Luma visually yet.

Official graphics phase will determine final design.

Conceptually Luma should feel:

- alive
- luminous
- peaceful
- alien
- connected to Spark
- dramatically different from Earth

Avoid making it simply:

"Earth but purple."

Luma should visually explain why Spark looks the way Spark does.

---

# 22. ENDING

After arrival:

SPARK MADE IT HOME

Display campaign statistics:

TOTAL LAUNCHES

LEVELS COMPLETED

PERFECTS

BULLSEYES

CLOSE CALLS

CHALLENGE GATES

TOTAL SHARDS

Then:

THE JOURNEY IS OVER.

THE FLIGHT DOESN'T HAVE TO BE.

Unlock:

# ENDLESS VOYAGE

---

# 23. ENDLESS VOYAGE

Do NOT delete existing endless systems.

They become post-campaign content.

Narrative:

Spark is home.

Spark and others now explore the ancient network.

Endless Voyage uses:

- procedural challenge generator
- all obstacle families
- all environments
- score
- streak
- three-heart system
- rewarded Continue
- high scores
- cosmetics

Campaign ending remains canon.

Endless mode does NOT recapture Spark.

---

# 24. CAMPAIGN PROGRESSION

Campaign:

10 Worlds

15 Levels per World

150 Core Levels

Potential:

3 optional Challenge Gates per world

30 Optional Challenges

180 total authored/structured challenges.

Do NOT implement all 180 immediately.

---

# 25. WORLD SUMMARY

| World | Levels | Location | Main New Concept |
|---|---:|---|---|
| 1 | 1–15 | The Containment | Rotational timing |
| 2 | 16–30 | The City | Sliding gates + wind |
| 3 | 31–45 | The Sky | Moving rings + crosswind |
| 4 | 46–60 | Upper Atmosphere | Iris + reduced gravity |
| 5 | 61–75 | Orbit | Sweeping blockers |
| 6 | 76–90 | The Moon | Orbiters + gravity wells |
| 7 | 91–105 | Asteroid Belt | Drifting blockers + route choice |
| 8 | 106–120 | The Nebula | Energy fields + phase timing |
| 9 | 121–135 | Ancient Network | Pattern + synchronization |
| 10 | 136–150 | Homeward | Mastery |

---

# 26. WORLD DESIGN RHYTHM

Each world approximately follows:

LEVELS 1–3
INTRODUCE

LEVELS 4–6
PRACTICE

LEVELS 7–10
VARY

LEVELS 11–14
COMBINE / MASTER

LEVEL 15
FINALE

Do not increase difficulty every single level.

Use rhythm.

Example:

EASY
↓
MEDIUM
↓
MEDIUM
↓
HARD
↓
RELIEF
↓
MEDIUM
↓
HARD
↓
SPECTACLE
↓
HARD
↓
FINALE

---

# 27. DIFFICULTY PHILOSOPHY

Difficulty comes from:

- prediction
- trajectory
- timing
- depth
- combinations
- precision
- route choice

Do NOT primarily use:

FASTER = HARDER

Speed is only one variable.

Later levels should demand understanding.

---

# 28. ONE NEW IDEA AT A TIME

Do NOT introduce simultaneously:

NEW OBSTACLE
+
NEW PHYSICS
+
NEW TARGET MOVEMENT

unless intentionally creating a late-game mastery level.

Normal teaching pattern:

SHOW
↓
PRACTICE
↓
VARY
↓
COMBINE
↓
MASTER

---

# 29. FAIRNESS

Every level must be completable:

WITHOUT PURCHASE

WITHOUT BOOST

WITHOUT AD

WITHOUT PREMIUM SKIN

Boosts make levels easier.

They never make an impossible level possible.

---

# 30. TRAJECTORY TRUST

The game depends heavily on player trust.

Trajectory preview and actual flight must share:

- launch position
- launch velocity
- gravity
- wind
- gravity wells
- power transformation
- timing
- obstacle plane locations

Never display a trajectory that does not accurately represent Spark.

---

# 31. COLLISION TRUST

Visual geometry should closely match collision geometry.

If Spark appears to clear an obstacle, Spark should clear it.

If Spark collides, player should understand why.

Preserve existing diagnostics:

- predicted plane crossing
- actual crossing
- obstacle state at crossing
- target distance
- collision radius
- trajectory debug

---

# 32. CAMPAIGN SAVE SYSTEM

Progress saves permanently.

If player completes Level 83:

Level 84 is unlocked permanently.

Closing the app does NOT reset progress.

Failure does NOT send player backward.

Energy depletion does NOT send player backward.

Returning months later does NOT send player backward.

---

# 33. SAVE TIMING

On level completion:

1. calculate result
2. grant rewards
3. update best result
4. unlock next level
5. SAVE
6. transition

Save before cinematic transition completes.

---

# 34. RETURNING PLAYER

Example:

WELCOME BACK

WORLD 6
THE MOON

LEVEL 83

[ CONTINUE JOURNEY ]

Energy regenerates while away.

---

# 35. JOURNEY MAP

Do NOT use a Candy Crush path.

Use a journey visualization.

EARTH

THE CONTAINMENT
↓
THE CITY
↓
THE SKY
↓
UPPER ATMOSPHERE
↓
ORBIT
↓
THE MOON
↓
ASTEROID BELT
↓
THE NEBULA
↓
ANCIENT NETWORK
↓
UNKNOWN

After World 9:

UNKNOWN

becomes:

LUMA

---

# 36. SCORE

Score represents skill.

Score is NOT currency.

Example configurable values:

CLEAR       +100

GREAT       +150

BULLSEYE    +250

PERFECT     +400

CLOSE CALL   +50

Score supports:

- level best
- world best
- career score
- Endless Voyage
- future leaderboards

Score cannot be spent.

---

# 37. SHARDS

Soft currency:

# SHARDS

Shards represent usable energy fragments.

Earn through play.

Example placeholder economy:

FIRST CLEAR
+5

GREAT
+2

BULLSEYE
+4

PERFECT
+8

WORLD COMPLETE
+50

CHALLENGE GATE
+20

Values must remain configurable.

---

# 38. SHARD FARMING

First-time performance rewards should be tracked.

Do not allow:

Level 1
↓
repeat infinitely
↓
farm full rewards

If player improves from GREAT to PERFECT later, grant only previously
unearned performance reward.

---

# 39. ENERGY

Campaign uses Energy.

Initial TEST configuration:

MAX ENERGY:

15

REGENERATION:

1 / 10 minutes

These values are NOT final.

---

# 40. ENERGY RULE

Recommended:

SUCCESS
→ no Energy consumed

FAILURE
→ -1 Energy

This lets skilled players continue.

Repeated failure creates a session boundary.

---

# 41. ENERGY EXHAUSTION

At zero:

SPARK NEEDS TO RECHARGE

Show:

NEXT ENERGY
09:42

WATCH AD
+1 ENERGY

UNLIMITED ENERGY
24 HOURS

UNLIMITED ENERGY
7 DAYS

COME BACK LATER

Campaign progress remains saved.

---

# 42. UNLIMITED ENERGY

Support:

24-HOUR UNLIMITED ENERGY

7-DAY UNLIMITED ENERGY

While active:

∞ ENERGY

Failures consume no Energy.

Persist entitlement expiration timestamp.

Do not depend on foreground timer.

Use storefront localized prices.

---

# 43. SHOP

Initial sections:

SPARKS

BOOSTS

ENERGY

PREMIUM

Keep store understandable.

Do not build an MMO economy.

---

# 44. SPARK CUSTOMIZATION

All skins have identical:

- collider
- physics
- launch behavior
- gameplay

Potential forms:

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

Some can be:

- Shard purchases
- world rewards
- mastery rewards
- premium purchases

---

# 45. WORLD SKIN REWARDS

Potential:

World 1 → Reactor Spark

World 2 → Neon Spark

World 3 → Storm Spark

World 4 → Aurora Spark

World 5 → Solar Spark

World 6 → Lunar Spark

World 7 → Meteor Spark

World 8 → Nebula Spark

World 9 → Ancient Spark

World 10 → Origin Spark

Use placeholders until official art phase.

---

# 46. TRAILS

Optional cosmetic category:

STANDARD

STARDUST

LIGHTNING

FIRE

FROST

VOID

Trails provide shop inventory without gameplay advantage.

---

# 47. BOOSTS

Launch boost set:

GUIDANCE

SLOW FIELD

SECOND CHANCE

Architect later:

HYPERJUMP

---

# 48. GUIDANCE

Provides enhanced trajectory information.

Potential:

full trajectory
+
plane crossing indicators

Does NOT:

- aim automatically
- snap to gate
- guarantee success

Player still aims and releases.

---

# 49. SLOW FIELD

For one attempt:

obstacle simulation speed approximately:

0.60×

Configurable.

Spark physics remain predictable.

Visually:

Spark emits energy.

Environment slows.

Player receives larger timing window.

---

# 50. SECOND CHANCE

On failure:

- consume Second Chance
- do not consume Energy
- immediately retry

Does NOT clear level.

---

# 51. HYPERJUMP

Future boost.

Fantasy:

Spark becomes extremely fast.

Implementation should probably slow obstacle simulation temporarily
rather than radically increasing Spark velocity.

Reason:

Do not destroy trajectory consistency.

Presentation:

Spark flares
↓
world slows
↓
Spark traverses obstacle region
↓
normal time resumes

Do not enable until tested.

---

# 52. BOOST PURCHASES

Boosts may be purchased using Shards.

Placeholder values:

GUIDANCE
100 Shards

SLOW FIELD
150 Shards

SECOND CHANCE
200 Shards

Central configuration only.

---

# 53. CONTEXTUAL HELP

After repeated failures, e.g. 5:

NEED A HAND?

USE SLOW FIELD

If owned:

[ USE ]

If not:

150 SHARDS

Do NOT immediately demand money.

---

# 54. MONETIZATION PRINCIPLE

Players purchase:

MORE TIME TO PLAY

CUSTOMIZATION

CONVENIENCE

OPTIONAL ASSISTANCE

Players do NOT purchase:

CAMPAIGN PROGRESS

---

# 55. MONETIZATION PRIORITY

Primary:

1. Timed Unlimited Energy
2. Spark cosmetics
3. Optional boosts
4. Rewarded Energy ads
5. Optional Shard packs
6. Remove Ads

Avoid excessive monetization surfaces.

---

# 56. ADS

Never show forced ads:

- during aiming
- during flight
- after every failure
- between rapid retries
- during story moment
- immediately after purchase
- immediately after rewarded ad

Potential natural boundaries:

- occasional level completion
- world transition

Use centralized interstitial policy.

---

# 57. REMOVE ADS

Permanent purchase.

Removes:

FORCED INTERSTITIALS

Does not remove:

OPTIONAL REWARDED ADS

because player intentionally selects those for a reward.

---

# 58. REPLAY

Completed campaign levels can be replayed.

Recommended:

no Energy cost for replay.

Reasons:

- improve score
- chase PERFECT
- mastery
- practice

Do not grant repeatable full Shard rewards.

---

# 59. CHALLENGE GATES

Three optional Challenge Gates per world can eventually exist.

Examples:

NO TRAJECTORY PREVIEW

PERFECT REQUIRED

MULTI-OBSTACLE SHOT

EXTREME TIMING

Challenges never gate story completion.

Potential rewards:

- Shards
- boosts
- skins
- trails

---

# 60. STORY PRESENTATION

Avoid long dialogue.

Use:

- environment
- lighting
- alarms
- Spark reactions
- camera
- portal behavior
- short title cards
- home signal
- sound
- music

The player should understand:

I WAS CAPTURED.

I ESCAPED.

I'M LEAVING EARTH.

SOMETHING IS CALLING ME.

I'M FOLLOWING IT.

THE GATES ARE CONNECTED.

I FOUND THE ROUTE.

THAT'S LUMA.

I'M ALMOST HOME.

I MADE IT.

without reading paragraphs during gameplay.

---

# 61. HOME SIGNAL

Recurring motif.

World 1:

faint pulse

World 2:

occasional response

World 3:

clearer

World 4:

directional

World 5:

recognizable pattern

World 6:

strong

World 7:

persistent

World 8:

almost overwhelming

World 9:

decoded / located

World 10:

becomes part of music

At Luma:

thousands of Sparks answer.

---

# 62. MUSIC

Eventually:

## Containment

mechanical
tense
restrained

## City

urgent
electronic

## Sky

open
lighter

## Atmosphere

expansive

## Orbit

sparse
isolated

## Moon

quiet
lonely

## Asteroid Belt

rhythmic
dangerous

## Nebula

ethereal

## Ancient Network

mysterious
patterned

## Homeward

home-signal motif becomes melodic

## Luma

full resolution of theme

Do not build final soundtrack in this implementation phase.

---

# 63. STORY SCENES SHOULD REUSE GAMEPLAY ASSETS

Do NOT create separate cinematic environments unnecessarily.

Example World 1:

Specimen scene uses same containment vessel.

Signal scene uses same vessel.

Failure scene uses same vessel.

Level 1 uses same vessel.

Only change:

- camera
- lighting
- effects
- text
- Spark animation

This makes the opening achievable in Expo.

---

# 64. CAMERA TRANSITIONS

Use simple camera interpolation.

Examples:

cinematic external vessel
↓
move closer
↓
move through / around vessel
↓
settle behind Spark
↓
gameplay

World completion:

gate entry
↓
flash / tunnel
↓
camera resolves into next environment

No complex cutscene engine required.

---

# 65. WORLD TRANSITIONS

World transitions should provide spectacle without excessive geometry.

Examples:

Containment → City

gate flash
↓
city skyline appears

City → Sky

camera rises
↓
cloud layer

Sky → Atmosphere

clouds thin
↓
Earth curvature

Atmosphere → Orbit

blue fades
↓
black space

Orbit → Moon

Moon grows in frame

Moon → Asteroids

rock fields appear

Asteroids → Nebula

color and particles increase

Nebula → Ancient Network

geometry emerges from energy cloud

Ancient Network → Homeward

star map / Luma coordinate

Homeward → Luma

final gate

---

# 66. VISUAL IMPLEMENTATION PER WORLD

Each world should be created from a modular kit.

Do NOT create 15 bespoke high-detail scenes.

Target approximately:

15–30 reusable environment components per world.

Examples:

## Containment

industrial panels and machinery

## City

building blocks, vents, antennas, signs

## Sky

cloud layers, floating structures, aircraft silhouettes

## Atmosphere

orbital frames, aurora planes, satellites

## Orbit

solar panels, debris, station modules

## Moon

rocks, lunar structures, equipment

## Asteroids

rock variants, dust, fragments

## Nebula

crystals, energy planes, particles

## Ancient Network

rings, blocks, pillars, geometric machines

## Luma

final art direction TBD

---

# 67. DATA-DRIVEN WORLD DEFINITIONS

Use data configuration.

Conceptual:

```ts
interface WorldDefinition {
  id: string;
  index: number;
  name: string;

  firstLevel: number;
  lastLevel: number;

  environmentId: string;

  storyBeat?: string;

  primaryMechanics: string[];

  completionRewards?: RewardDefinition[];

  homeSignalStrength?: number;

  distanceFromEarth?: string;
}

Do not hard-code world logic into UI.

68. DATA-DRIVEN LEVEL DEFINITIONS

Conceptual:

interface CampaignLevelDefinition {
  id: string;

  worldId: string;
  levelNumber: number;

  title: string;

  obstacleConfigs: GameplayObstacleConfig[];

  gateConfig?: GateConfig;

  environmentOverrides?: EnvironmentOverride;

  physicsOverrides?: PhysicsOverride;

  windConfig?: WindConfig;

  gravityConfig?: GravityConfig;

  tutorialHint?: TutorialHint;

  storyBeat?: StoryBeat;

  rewards: LevelRewardDefinition;

  isWorldFinale?: boolean;
}

Reuse existing gameplay types where possible.

69. STORY BEAT SYSTEM

Keep lightweight.

Conceptual:

interface StoryBeat {
  id: string;

  trigger:
    | "before_level"
    | "after_level"
    | "world_start"
    | "world_complete";

  text?: string[];

  cameraPreset?: string;

  lightingPreset?: string;

  duration?: number;

  skippable?: boolean;
}

Avoid building a complex cinematic scripting engine.

70. CAMPAIGN STATE

Need at least:

interface CampaignState {
  highestUnlockedLevel: number;
  completedLevels: Record<string, LevelProgress>;

  unlockedWorldIds: string[];

  campaignCompleted: boolean;

  currentWorldId: string;
}

Integrate with existing save system.

71. PERSISTENT PLAYER STATE

Persist:

campaign progression
best level results
score records
Shards
Energy
Energy timestamp
owned Spark skins
equipped Spark
owned trails
equipped trail
boost inventory
purchases
Unlimited Energy expiration
challenge progress
campaign completion
Endless Voyage unlock
statistics
settings

Use versioned saves.

72. OFFLINE

Campaign must work offline.

Offline should support:

campaign
levels
saves
Shards
Energy regeneration
owned cosmetics
boosts

Expected unavailable offline:

new purchases
rewarded ads
immediate analytics delivery

External failures must not block gameplay.

73. FIRST IMPLEMENTATION TARGET

DO NOT build 150 finished levels immediately.

Build a vertical slice.

Required:

OPENING
↓
WORLD 1
↓
15 LEVELS
↓
WORLD 1 FINALE
↓
WORLD 2 UNLOCK
↓
WORLD 2 SAMPLE LEVELS

Also validate:

story
checkpoints
Shards
Energy
shop
Spark customization
boosts
save/restore
74. WORLD 1 ACCEPTANCE FLOW

Tester should be able to:

Launch app.
See Spark title screen.
Begin story.
See discovery.
See Specimen S-01 containment.
See home signal.
See containment failure.
Transition directly into gameplay.
Play The Breach.
Escape vessel.
Progress through laboratory.
Encounter single rotor.
Encounter double rotor.
Encounter triple rotor.
Encounter faster rotor.
Encounter reverse rotor.
Encounter offset challenge.
Encounter multi-depth challenges.
Reach full lockdown.
Enter first Jump Gate.
Complete World 1.
Unlock World 2.
Close app.
Reopen.
Continue from World 2.
75. WORLD 1 ROTOR PROGRESSION — LOCKED DESIGN

Do NOT revert to introducing a 3-blade rotor immediately.

Correct progression:

Level 1
The Breach
No rotor

Level 2
The Lab
Stationary opening

Level 3
Locking Down
Slow moving security opening

Level 4
First Rotor
ONE rotating arm

Level 5
Double Rotor
TWO opposing arms

Level 6
Triple Rotor
THREE arms

Level 7
Speed Up
Three arms, faster

Level 8
Reverse
Three arms, opposite rotation

Level 9
Offset
Aim + rotor timing

Level 10
Moving Gate
Rotor + moving destination

Level 11
Two Depths
Two obstacle planes

Level 12
Counter Rotation
Opposing rotation at depth

Level 13
Security Sequence
Rotor + sliding barrier

Level 14
Full Lockdown
Mastery combination

Level 15
Escape
Facility finale + Jump Gate

This progression is intentional.

76. DO NOT OVERBUILD GRAPHICS YET

Current objective:

make the storyboard FUNCTION.

Use temporary:

primitives
colors
basic emissive materials
temporary decals
placeholder particles
simple text

Do not delay implementation waiting for:

final Spark design
final logo
final textures
final portal art
final environment art
final music
final SFX

Those come after the vertical slice works.

77. FINAL ART PHASE

After functional vertical slice review, we will separately establish:

Official game name
Final Spark character design
Luma visual identity
Logo
App icon
UI visual system
Jump Gate visual design
Containment environment kit
City environment kit
Remaining world art direction
Spark skins
Trails
Shop graphics
Store screenshots

Do not lock temporary art into architecture.

78. TENTATIVE BRANDING

Current working name:

SPARK — ESCAPE TO LUMA

This is tentative.

Use for internal UI if necessary.

Do NOT yet:

rename permanent bundle IDs
buy domains
create permanent product identifiers
create final store listing
bake name into save format

until naming review is complete.

79. FINAL PLAYER JOURNEY

Narrative:

CAPTURED
↓
AWAKEN
↓
HEAR SIGNAL
↓
ESCAPE VESSEL
↓
ESCAPE FACILITY
↓
LEAVE CITY
↓
LEAVE EARTH
↓
FOLLOW SIGNAL
↓
DISCOVER GATE NETWORK
↓
FIND LUMA
↓
RETURN HOME

Mechanical:

AIM
↓
LAUNCH
↓
TIME
↓
INTERCEPT
↓
PREDICT
↓
HANDLE DEPTH
↓
HANDLE PHYSICS
↓
CHOOSE ROUTES
↓
SYNCHRONIZE
↓
MASTER

Progression:

CLEAR LEVEL
↓
SAVE CHECKPOINT
↓
EARN SCORE
↓
EARN SHARDS
↓
CUSTOMIZE SPARK
↓
UNLOCK WORLD
↓
GET CLOSER TO LUMA

80. CORE DESIGN QUESTION

Every new obstacle or mechanic must answer:

What new prediction is the player making?

Rotor:

Where will the blocker/opening rotate?

Sliding Gate:

Where will the opening translate?

Moving Ring:

Where will the safe opening be?

Iris:

How open will it be?

Pendulum:

Where will the blocker swing?

Orbiter:

When will the blocker move away?

Gravity Well:

How will Spark's path curve?

Drifting Blocker:

Which route will remain safe?

Phase Field:

When will the barrier become passable?

Synchronized Systems:

When do multiple systems align?

If a new obstacle cannot answer this differently from an existing one,
it probably should not be added.

81. CORE PRODUCT PRINCIPLE

The game should work on four levels simultaneously.

Immediate

Can I make this shot?

Skill

Can I get BULLSEYE or PERFECT?

Progression

What is in the next level/world?

Emotional

Can I get Spark home?

The campaign succeeds when all four motivations reinforce one another.

82. EMOTIONAL TARGET

When the player fails:

I ALMOST HAD IT.

I KNOW WHAT I DID WRONG.

ONE MORE TRY.

When the player runs out of Energy:

I DON'T WANT TO STOP YET.

This is where optional Unlimited Energy can have value.

Never intentionally create:

THE GAME CHEATED.

or:

I HAVE TO PAY TO PASS THIS.

83. FINAL ENDING PRINCIPLE

Do not undermine the ending.

Spark reaches Luma.

Spark is home.

The campaign is complete.

Endless Voyage happens AFTER home.

Future expansions should be new journeys, not:

"Actually Spark wasn't home after all."

Possible future expansions:

THE LOST GATES

THE VOID

THE MACHINE WORLD

THE CRYSTAL SYSTEM

THE BLACK STAR

Spark can leave Luma voluntarily to explore.

84. CURSOR IMPLEMENTATION ORDER
PHASE 1 — Story Framework

Implement:

launch/title
StoryBeat model
opening sequence
camera presets
skip logic
transition into gameplay
PHASE 2 — Level 1

Implement:

THE BREACH

including:

containment vessel
fractured opening
tutorial
camera handoff
escape
PHASE 3 — World 1

Implement all 15 World 1 levels using the locked progression.

PHASE 4 — World Completion

Implement:

first Jump Gate
World 1 completion
World 2 unlock
checkpoint save
PHASE 5 — World 2 Vertical Slice

Implement first 3–5 representative City levels.

PHASE 6 — Campaign Infrastructure

Validate:

map
progress
replay
save
restore
PHASE 7 — Economy Integration

Validate:

Score
Shards
Energy
regeneration
PHASE 8 — Shop

Validate:

Spark skins
equip
Shard purchase
boosts
PHASE 9 — Monetization Mocks

Validate:

rewarded Energy
Unlimited Energy
Remove Ads
premium cosmetic support
PHASE 10 — Review

STOP.

Do not automatically build Worlds 3–10.

Review the vertical slice first.

85. REQUIRED DEVELOPMENT DOCUMENTATION

After implementation update/create:

docs/CAMPAIGN-ARCHITECTURE.md

docs/WORLD-PROGRESSION.md

docs/STORY-SYSTEM.md

docs/ECONOMY.md

docs/MONETIZATION.md

docs/SAVE-SCHEMA.md

docs/IMPLEMENTATION-REPORT.md

Document what was ACTUALLY implemented.

86. IMPLEMENTATION REPORT

Include:

SUMMARY
FILES CREATED
FILES MODIFIED
STORY SYSTEM
OPENING SEQUENCE
CAMERA SYSTEM
THE BREACH
WORLD 1 LEVELS
ROTOR PROGRESSION
WORLD 1 FINALE
JUMP GATE
WORLD 2 SAMPLE
CAMPAIGN PROGRESSION
CHECKPOINTS
SAVE SYSTEM
SAVE MIGRATION
SCORE
SHARDS
ENERGY
SHOP
SPARK CUSTOMIZATION
BOOSTS
MONETIZATION
ENDLESS VOYAGE
ANALYTICS
OFFLINE BEHAVIOR
PERFORMANCE
DEV TOOLS
TESTS
KNOWN ISSUES
PLACEHOLDERS
MANUAL CONFIGURATION REQUIRED
RECOMMENDED NEXT STEP
87. STOP CONDITION

Stop development after the vertical slice proves:

STORY
+
GAMEPLAY
+
WORLD PROGRESSION
+
CHECKPOINTS
+
ECONOMY
+
SHOP
+
CUSTOMIZATION
+
BOOSTS

work together.

Do not add features simply because they are possible.

The next stage after this implementation is:

VISUAL PRODUCTION

That stage will establish the final appearance of:

Spark
Luma
Jump Gates
World 1
UI
skins
effects
logo
app icon
88. FINAL INSTRUCTION TO CURSOR

Preserve the validated gameplay.

Do not rebuild the game around the storyboard.

Build the STORY and CAMPAIGN around the validated game.

Everything should reinforce one simple premise:

Spark is alive.

Spark was captured.

Spark heard Luma calling.

Spark found a way out.

The player must guide Spark through an increasingly dangerous journey
across Earth and space.

Every successful launch brings Spark one step closer to home.

The first shot escapes a tiny containment vessel.

The final shot reaches Luma.

Everything between those two shots is the journey.