# Cursor handoff: obstacle placement and recapture story

Status: story presentation updated; obstacle remaps and drone/creature graphics are pending. This document supersedes earlier isolation slots in MECHANICS-FOLLOW-UP.md and the “City elevators” suggestion in NEW-OBSTACLES.md / REFACTORED-WORLDS.md. Live campaign remains 150 levels across 20 chapter bands.

## Story now in game

Escape the vessel → evade facility recapture → retrieval patrols across City and Ascent → storm obscures pursuit → leave human retrieval behind → unfamiliar life drawn to Spark → The Null feeds on light → False Home relay → Ancient Network / Machine → true coordinates → Homeward → Luma reunion.

Updated English story catalog, chapter subtitles, chapter entry/exit presentation. Existing scene acknowledgement IDs remain stable. The Null exit now approaches the beacon; False Home exit discovers the relay. Homeward approaches Luma; only Luma ends with reunion/Endless copy. These are narrative changes, not new enemy AI. Not every hazard is alive or a captor.

## Required isolation remaps

Keep each destination level's ID, rewards, save progress and finale flags. Move the family lesson/config together using LibraryEncounters-style remaps. Do not renumber levels, move chapter boundaries, or migrate saves for this task. Retire the old remap at its former slot so underlying authored content returns. Preserve the existing family tuning unless a separate mechanics issue is resolved and tested.

| Family / current type | Old level / world | Destination | Visual identity / short lesson body |
|---|---|---|---|
| Piston Field / pistonField | 13 Lockdown | Containment L6 | Steel rams: “The chamber’s pumping machinery leaves a route out.” |
| Elevator Blocks / elevatorBlocks | 19 City | Lockdown L9 | Freight lifts carrying containment cages: “The escape shaft still carries its captive cargo.” |
| Reactive Gate / reactiveGate | 20 City | Lockdown L10 | Capture checkpoint: “Security doors are channeling Spark back toward containment.” |
| Split Shutter / splitShutter | 14 Lockdown | Lockdown L13 | Paired bulkheads: “The final barriers seal behind the escaped specimen.” |
| Clock Hands / clockHands | 35 Ascent | Lockdown L14 | Capture unit with rotating restraint arms: “A retrieval unit sweeps the passage to the surface.” |
| Conveyor Gate / conveyorGate | 34 Ascent | City L17 | Patrol drones following fixed routes: “Retrieval drones are searching the rooftops.” |
| Scissor Gate / scissorGate | 26 City | Ascent L32 | Capture drone pincers: “A retrieval unit guards the climb above the city.” |
| Solar Sail / solarSail | 31 Ascent | Ascent L33 | Rooftop solar hardware: “Solar panels turn above the last rooftops.” |
| Pulse Ring / pulseRing | 36 Ascent | Storm L40 | Electrical weather: “A ring of charged air spreads through the storm.” |
| Rolling Aperture / rollingAperture | 37 Ascent | Upper Atmosphere L47 | Thin transfer opening: “At the edge of the atmosphere, a drifting opening offers passage.” |
| Sequential Tunnel / sequentialTunnel | 18 City | Orbital Graveyard L70 | Derelict access ports: “An abandoned bulkhead still cycles its access ports.” |
| Moving Safe Zone / movingSafeZone | 23 City | Orbital Graveyard L71 | Damaged containment field: “Something was once held inside this field. A clear pocket still drifts through it.” |
| Orbiting Moons / orbitingMoons | 17 City | Moon L77 | Small alien organisms: “Small lights circle nearby, drawn to Spark’s glow.” |
| Magnetopause / magnetopause | 32 Ascent | Moon L78 | Charged sheath: “A charged arc turns across the lunar passage.” |
| Lagrange Null / lagrangeNull | 33 Ascent | Far Side L85 | Calm pocket: “Beyond the Moon, a quiet pocket interrupts the glow.” |
| Corkscrew Tunnel / corkscrewTunnel | 21 City | Far Side L86 | Forgotten transit mouth: “A forgotten transit ring turns in the darkness.” |
| Comet Crossing / cometCrossing | 25 City | Asteroid Belt L92 | Icy natural body: “An icy traveler crosses Spark’s path.” |
| Accretion Shredder / accretionShredder | 27 City | Asteroid Belt L93 | Luminous scavengers: “Drawn to Spark’s light, small creatures spiral through the debris.” |
| Speed Field / speedField | 28 City | Drift L100 | Visible current: “A luminous current carries Spark faster.” |
| Pulsar Beam / pulsarBeam | 29 City | Drift L101 | Stellar pulse: “A distant star sends pulses across the route.” |
| The Null / theNull | 40 Storm | The Null L112 | Light-feeding presence: “The darkness presses against a remaining opening of light.” |
| Teleporting Portal / teleportPortal | 38 Ascent | False Home L117 | Unstable relay anchors: “The familiar beacon shifts between relay anchors.” |
| Entry / Exit Portal / entryExitPortal | 39 Storm | False Home L118 | Paired relay: “The beacon leads onward. This is not home.” |

L1–L5 and all chapter finales are excluded. L6 replaces an early rotor lesson: audit subsequent teaching so no prerequisite is lost. Destinations are early within their existing chapter bands. No new family introductions in Network/Machine/Signal/Homeward/Luma; reuse learned patterns there.

## Teaching and composition requirements

- Update LIBRARY_LESSONS name/body/hint together at destination keys. Keep machine-facing type IDs stable even if the card says “Patrol Drones.” Copy above describes intended art; land creature/drone-specific lesson labels with matching graphics, not against generic boxes.
- Current level lesson copy intentionally remains in place until these remaps land. Chapter narrative already establishes pursuit. Do not describe City L17 as lunar life while it still contains the old prototype.
- Hint for patrol drones: “Watch their patrol rhythm. Cross where the gap will be when Spark arrives.” Other hints must likewise describe actual arrival state, not aim-time appearance.
- storyForLevel currently gives ENCOUNTER_LESSONS priority over LIBRARY_LESSONS. Check overlapping destinations and scene suppression; ensure the displayed lesson matches the final composed obstacle. Audit combination lessons (especially L101), returned city shutter lessons, and SCENES after removing old remaps.
- Preserve underlying authored content where safe. Review full composed levels, not only raw packs. Library remaps inherit target depth/radius and clear forces; moving a family can therefore alter the complete shot even with unchanged obstacle config.
- Each of the 23 families must occur once in isolation before combinations of that family. Scan the final campaign for first appearances and duplicate isolation introductions. Update tests/library-encounters.test.ts and the follow-up tracker to the final slots.
- Keep save/story acknowledgement IDs stable; document that previously seen level-based cards will not automatically replay. Do not change save schema to force a replay.

## Cursor mechanics decisions before approval of playability

1. ~~Teleporting Portal: warning currently returns the next anchor and collision uses it~~ → collision stays on current anchor; amber ghost telegraphs next.
2. Sequential Tunnel is currently side-by-side apertures at one Z plane. Corkscrew isolation is one rotating mouth. Preserve truthful single-plane lessons; multi-depth traversal is a separate mechanics change.
3. ~~Solar Sail AABB vs rotate~~ → closed collision uses the same rotated OBB as the mesh; `openAngle` clears the corridor.
4. ~~Lagrange Null force demo~~ → `integrateMotion` cancels wind/wells inside the pocket; L85 isolation includes a side well.
5. The Null currently has an oscillating safe opening, not persistent consumed routes or a pull/chase. Retain escape language without claiming those mechanics exist. Actual chase/consumption belongs to Cursor, not visual fakery.
6. ~~Entry/Exit full-shot warp parity~~ → runtime clear warps; `predictShot` / corridor / trajectory preview chain the same exit.
7. Original/no-Boost clearability needs a full trajectory reaching the target at a valid launch time. A clear center-point sample is insufficient. Do not silently change camera, aim, collision or tuning to make a remap pass.
8. ~~Luma L148–L149 hostile additions~~ → L147–L149 are ceremonial single soft irises; L150 remains empty; EncounterProgression no longer rewrites 148.

## Graphics handoff — CODEX

After placements and mechanics are validated: steel, glass and amber lamps in the facility; rooftop patrol units and capture pincers outside; thin emissive space openings; alien bodies with visible solid cores. Use existing primitive geometry. Drone eyes/limbs and creature glow may suggest intent but cannot introduce homing, tracking or reactions absent from the state model.

Make continuous dangerous bands visibly continuous; depict circular safe holes as holes rather than solid square markers. Beam art must cover its collision extent across the playable corridor. Match warning/open/closed to authoritative state. Decorative trails/rails remain visibly secondary and non-colliding. Existing lasers retain fixed Z frames and X/Y beam movement only.

Journey accents/motifs should reflect each chapter: amber Lockdown, rooftop City, cloud Ascent, storm pulses, derelict Graveyard ports, sparse Drift, interrupted light for The Null, repeated anchors for False Home, welcoming Luma. Final art remains Codex-owned.

## Delivery checklist — CURSOR

Story-copy pass validation: typecheck and diff whitespace checks pass. The two existing story suites currently pass 4/8 tests. Remaining failures expose old 10-world assumptions (City labelled WORLD 2, L9 expected to have no chapter-entry card, L120 expected to depart Nebula rather than False Home) plus a minimum body-length assertion on a short exit. Reconcile these against the live 20-chapter bands while updating story wiring; do not restore old world bands just to satisfy the tests.

- Implement remaps, truthful lesson wiring, debug tooling and relevant deterministic/full-shot tests.
- Run typecheck, relevant encounter/story tests and campaign audit; distinguish stale test assumptions from actual defects.
- Report final World → Level → Obstacle list, original/save ID preservation, first-introduction ordering, and outstanding mechanics issues.
- Preserve economy, Boosts, Overcharge, save schema, validated physics and camera. Coordinate mechanics corrections explicitly; do not duplicate Codex graphics work.
