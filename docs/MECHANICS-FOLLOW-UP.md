# Mechanics Follow-Up Tracker

Progress board for work after the foundational Spark design-update pass
(`NEW-DESIGN-UPDATES-INDEX.md`). Cursor owns mechanics, data, functional UI,
debug tooling and tests. Codex owns polish/graphics afterward.

**Rule:** Original Spark with no Boosts must clear every authored level. Preserve
validated aim, camera, collision and prediction unless a tested change is required.

| Status | Meaning |
|--------|---------|
| `done` | Landed with deterministic tests |
| `in_progress` | Actively wiring |
| `next` | Immediate priority |
| `queued` | Planned; do not start until prior items stabilize |
| `blocked` | Waiting on content/decision |

---

## 1. Speed Field → flight + prediction

**Status:** `done`

| Item | Status | Notes |
|------|--------|-------|
| Deterministic zone state / multiplier | `done` | `SpeedFieldState.ts` |
| Non-lethal collision (no hit) | `done` | Library obstacle |
| Shared multiplier in `integrateMotion` / `simulateToZ` / `predictShot` | `done` | `physics.ts` `speedFields` + flight/preview wiring |
| `ProjectileSystem` + Game force wiring | `done` | `syncSpeedFields` / `predictionForces` |
| Debug readout of active multiplier | `queued` | Show on mechanic/debug line |
| Tests: inside/outside parity flight vs predict | `done` | `tests/physics.test.ts` |

**Acceptance:** Crossing a Speed Field changes arrival time/position identically in
runtime and prediction; no hidden acceleration outside the marked volume.

---

## 2. Author first levels with new families

**Status:** `done` (recapture placement — see CURSOR-OBSTACLE-STORY-PLACEMENT.md)

| Family | Level | World |
|--------|------:|-------|
| Piston Field | 6 | Containment |
| Elevator Blocks | 9 | Lockdown |
| Reactive Gate | 10 | Lockdown |
| Split Shutter | 13 | Lockdown |
| Clock Hands | 14 | Lockdown |
| Patrol Drones (conveyorGate) | 17 | City |
| Capture Pincers (scissorGate) | 32 | Ascent |
| Solar Sail | 33 | Ascent |
| Pulse Ring | 40 | Storm |
| Rolling Aperture | 47 | Upper Atmosphere |
| Sequential Tunnel | 70 | Orbital Graveyard |
| Moving Safe Zone | 71 | Orbital Graveyard |
| Orbiting Lights (orbitingMoons) | 77 | Moon |
| Magnetopause | 78 | Moon |
| Lagrange Null | 85 | Far Side |
| Corkscrew Tunnel | 86 | Far Side |
| Comet Crossing | 92 | Asteroid Belt |
| Accretion Shredder | 93 | Asteroid Belt |
| Speed Field | 100 | Drift |
| Pulsar Beam | 101 | Drift |
| The Null | 112 | The Null |
| Teleporting Portal | 117 | False Home |
| Entry / Exit Portal | 118 | False Home |

Teleport collision now uses the current anchor until swap; amber ghost telegraphs the next. Solar Sail collision matches the rotated panel (OBB) and clears at `openAngle`. Lagrange Null cancels wind/wells in flight + prediction (L85 isolation well demo). Entry/Exit warps chain through predictShot / corridor / preview. Luma L147–L149 are ceremonial single soft irises (L150 empty finale).

---

## 3. Remaining obstacle prototypes

**Status:** `done`

All NEW-OBSTACLES families have config/state/collision/slot + isolation remaps.
Codex owns visual polish after playtest.

---

## 4. Modest Spark passives in runtime

**Status:** `done`

| Spark | Passive | Runtime hook | Status |
|-------|---------|--------------|--------|
| Original | Pure Focus | baseline | `done` |
| Neon | Future Sight | denser / longer prediction (`setClarity`) | `done` |
| Aurora | Guiding Light | `SafeOpeningMarker` on authored opening | `done` |
| Solar | Energy Harvest | first-clear shard bonus only | `done` |
| Lunar | Gravity Sense | enhanced gravity-well rings | `done` |
| Frost | Cold Field | local obstacle-clock scale | `done` |
| Plasma / Nebula | phase windows | presentation flags | `done` |
| Ancient | sync cues | presentation flag | `done` |
| Origin | resonance | mild clarity | `done` |
| Storm | Limited Forgiveness | prototype off until balance | `blocked` |

**Acceptance:** Unequipping or unknown Spark IDs behave as Original. No collider /
launch / target rule changes.

---

## 5. Overcharge UX polish (functional)

**Status:** `done`

| Item | Status |
|------|--------|
| HUD compact countdown while `∞` | `done` |
| Out-of-Energy contextual Overcharge offer (easy decline) | `done` |
| Active-details / Extend returns to duration select | `done` |
| Foreground reconcile of store vs cached expiry | `done` |

---

## 6. 20-world content remap (save v6)

**Status:** `done` (live WORLDS flipped)

| Item | Status |
|------|--------|
| Target chapter catalog + legacy map | `done` | `refactoredWorlds.ts`, `worldMigration.ts` |
| Mapping uses authored level IDs (`w1-01`, …) | `done` |
| Dual-layout `normalizeSave` / `SAVE_VERSION` bump | `done` | v6 + `contentEpoch` |
| Flip live `WORLDS` to 20 chapters | `done` | `applyWorldBands` over 150 levels |
| Expand unlocks from `highestUnlockedLevel` | `done` | save migration + scaffolding |

---

## Working order (this board)

1. ~~Finish §1 Speed Field physics/prediction parity + tests.~~
2. ~~Author §2 isolation remaps for every new family.~~
3. ~~Expand §3 library including story-heavy families.~~
4. ~~Turn on §4 presentation/economy passives.~~
5. ~~Complete §5 Overcharge HUD / zero-energy CTA.~~
6. ~~Flip live WORLDS to 20 chapters + save unlock expansion.~~

**Next:** Playtest isolation remaps + ceremonial Luma; Codex polish.

---

## Debug / QA checklist (per mechanic)

- [ ] Pure state fn deterministic at fixed time
- [ ] `predictState` / `evaluateAt` / `testProjectileCrossing` parity
- [ ] Time Lock + Slow Field share `obstacleClock` policy
- [ ] Original / no Boosts clear path
- [ ] Debug overlay or `mechanicDebug` line readable
- [ ] Vitest coverage beside the module

---

## Changelog

| Date | Change |
|------|--------|
| 2026-09-23 | Board created; foundations already landed (migration plan, six obstacle families, Phase Shield / Time Lock, Spark ability model, Overcharge grant/UI). |
| 2026-09-23 | §1 Speed Field flight/prediction parity + tests. §2 isolation remaps on L13/19/35/36/49/98 via `LibraryEncounters.ts`. |
| 2026-09-23 | §3 six more families (L14/20/34/37/50/71). §4 runtime passives. §5 Overcharge HUD/CTA. §6 save v6 dual-layout scaffolding. |
| 2026-09-23 | Remaining story families (moons→Null) + all isolation remaps L13–L40. Live WORLDS flipped to 20 chapters. |
| 2026-09-23 | Solar Sail OBB/`openAngle`, Lagrange force cancel + L85 well demo, Entry/Exit warp parity, Luma ceremonial L147–149. |
