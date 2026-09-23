# New Obstacles — implementation specification

## Platform contract

This library extends the current `ObstacleConfig` / `ObstacleSlot` model; it does not replace existing rotor, `slidingGate`, iris, pendulum, moving ring, orbiter, drifting blocker, phase field, shifting aperture, laser grid, or formation families. Implement with React Native + Expo + the existing Three.js presentation: primitive geometry; X/Y/Z transforms; rotation, scale and opacity; deterministic math/state machines. No Unity, Godot, Unreal, complex meshes, or physics-engine dependency.

For every family, one deterministic state function of level/shot time drives **render, trajectory prediction, and collision**. Use a fixed seed/configuration, explicit phases and Z planes. Existing laser rule remains: a laser grid has a fixed Z-plane/frame; individual beams move only in X/Y.

| Family | Visual and deterministic behavior | Player prediction / collision contract | Expo / Three approach | World fit |
|---|---|---|---|---|
| Piston Field | Repeating blocks extend/retract on phase offsets. | Read which lane is open at arrival; collide against piston rectangles at arrival time. | Boxes, sinusoid or bounded state machine. | Containment, Machine |
| Corkscrew Tunnel | Ring segments rotate as a helical opening. | Predict the rotating gap across depth; sample each fixed Z segment. | Torus-like primitive segments / boxes, angle per segment. | Far Side, Network |
| Rolling Aperture | A circular iris opening rolls on X/Y while radius cycles. | Aim at its center/radius at arrival; disk-minus-hole test. | Extend shifting aperture state. | Upper Atmosphere, Nebula |
| Speed Field | Translucent plane/volume with marked speed multiplier. | Preview must integrate the same multiplier after crossing; no hidden acceleration. | Plane/ring + deterministic zone crossing. | Drift, Homeward |
| Shockwave / Pulse Ring | Expanding luminous ring cycles outward then resets. | Pass through center or time arrival between dangerous radii. | Line/ring scale/opacity state. | Storm, Nebula |
| Reactive Gate | Gate changes open/closed from a clearly telegraphed condition/time. | Condition and countdown visible before launch; collision uses resulting gate state. | Sliding-gate state machine with warning. | Lockdown, Storm |
| Clock Hands | One/two long rotating arms around a hub. | Read angular gap at fixed plane; capsule/segment collision. | Existing rotor/pendulum primitives. | Lockdown, Orbit, Machine |
| Scissor Gate | Two bars pivot together/apart. | Predict aperture width at arrival; bars must share one state. | Paired boxes rotated around hinges. | Ascent, Machine |
| Split Shutter | Two shutter halves part, meet, or swap lanes. | Read the gap center and opening time. | `slidingGate` variant with paired panels. | Lockdown, Upper Atmosphere |
| Elevator Blocks | Platforms move vertically in timed columns. | Choose a lane at the actual crossing time; AABB/sphere collision. | Box transforms with phase offsets. | City |
| Conveyor Gate | Repeating blockers translate laterally and wrap. | Pattern repeats identically; no random respawn. | Formation-style X offset modulo period. | City, Machine |
| Orbiting Moons | Spheres orbit a fixed gravity/body center. | Read orbital positions and any declared force; circle/sphere collision at arrival. | Extend `orbiter`; optional existing force field. | Moon |
| Comet Crossing | Bright compact blocker crosses diagonally on a loop. | Path, speed and re-entry are visible; collision at plane crossing. | Sphere + linear/looped X/Y transform. | Asteroid Belt, Drift |
| Sequential / Rotating Tunnel | Multiple fixed-Z apertures open in ordered phase. | Preview samples each plane, not just first opening. | Array of iris/rotating panels under shared sequence index. | Graveyard, Signal |
| Moving Safe Zone | Dangerous field with a single drifting safe hole. | Hole position is shown and evaluated at arrival. | Phase-field visual with inverse circle test. | Graveyard, Drift |
| Accretion Shredder | Inward-spiraling debris leaves a timed central path. | Predict debris arcs; generous silhouette/clear lane. | Small instanced primitives with analytic polar positions. | Asteroid Belt |
| Pulsar Radiation Beam | Periodic wide beam sweeps or pulses across fixed plane. | Telegraph charge, active interval, and X/Y sweep; beam collision only at its fixed Z. | Laser-grid derivative, emissive lines/planes. | Signal, Homeward |
| Solar Sail Shutter | Broad panel rotates/opens like a solar array. | Read its sweep and opening; use panel collision at plane. | Boxes/planes on hinge. | Upper Atmosphere, Orbit |
| Magnetopause Sheath | Curved luminous boundary has cyclic openings/deflection zones. | Boundary/open gap and any force are explicit; shared field time. | Arc/ring primitives + declared force zone. | Moon, Far Side |
| Lagrange Null Zone | Calm dark null pocket cancels declared force effects. | Preview and simulation disable the same listed force inside. | Transparent boundary + force-state predicate. | Far Side |
| Teleporting Portal | Portal shifts among **fixed X/Y anchors at fixed Z**: warning → destabilize → materialize. | Sequence is deterministic; collide/enter based on its X/Y at Spark's *actual arrival time*, never launch-time position. | Reuse portal primitives, anchor array, discrete state machine. | False Home, Signal |
| Entry / Exit Portal | Paired, labelled endpoints transport Spark to an authored next position/state. | Entry and exit mapping is fixed, previewable, and collision-safe; no ambiguous destination. | Paired portal state + deterministic projectile handoff. | False Home, Network |
| The Null | Black geometry/void consumes illuminated safe routes; later it exerts readable pull/chase behavior. | Escape encounter, not combat: routes darken before removal; pull/chase is visibly signaled and uses same force state in preview/collision. Spark escapes; it is never killed. | Layered primitive silhouettes, opacity/light state, analytic safe-route and force states. | The Null |

## Authoring and safety rules

- Add a discriminated config/type, state evaluator, collision evaluator, render adapter, predictor coverage, validation bounds, debug-state readout and deterministic tests together.
- Avoid random obstacle timing after launch. If variance is wanted, choose the seed during level load and expose it to prediction/debug.
- Keep collision geometry slightly simpler than the visual but never smaller than the dangerous visual read. Ensure clear openings respect Spark radius plus an authored safety margin.
- Portal position, Time Lock state, force fields, phase fields and Speed Fields must all use the same authoritative simulation clock.

## Responsibilities

### CURSOR

Own config/state/collision/prototype implementation, level data, save migration when needed, functional UI/story wiring, debug overlays and tests. Do not replace validated aim, camera or projectile physics wholesale.

### CODEX

Own visual hierarchy, primitive art treatment, effects, clear telegraphs, final UI/copy and responsive/performance polish after the state/collision contract is proven. Do not duplicate mechanics or alter validated camera/physics without evidence.
