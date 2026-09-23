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

**Status:** `done` (isolation remaps — all families)

Introduce each family **in isolation** before combining. Prefer the existing
`applyNewEncounters`-style remap (preserve level IDs / saves) over rewriting
authored packs.

| Family | Level slot | Status |
|--------|------------|--------|
| Piston Field | L13 | `done` |
| Split Shutter | L14 | `done` |
| Orbiting Moons | L17 | `done` |
| Sequential Tunnel | L18 | `done` |
| Elevator Blocks | L19 | `done` |
| Reactive Gate | L20 | `done` |
| Corkscrew Tunnel | L21 | `done` |
| Moving Safe Zone | L23 | `done` |
| Comet Crossing | L25 | `done` |
| Scissor Gate | L26 | `done` |
| Accretion Shredder | L27 | `done` |
| Speed Field | L28 | `done` |
| Pulsar Beam | L29 | `done` |
| Solar Sail | L31 | `done` |
| Magnetopause | L32 | `done` |
| Lagrange Null | L33 | `done` |
| Conveyor Gate | L34 | `done` |
| Clock Hands | L35 | `done` |
| Pulse Ring | L36 | `done` |
| Rolling Aperture | L37 | `done` |
| Teleporting Portal | L38 | `done` |
| Entry / Exit Portal | L39 | `done` |
| The Null | L40 | `done` |

Implemented in `LibraryEncounters.ts` + `StoryLibraryState` / `StoryLibraryObstacle`.

**Acceptance:** Each remap has a tutorial hint, clears with Original, corridor
validation passes, and OBSTACLE_TEST / campaign audit stay green.

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

**Next:** Playtest each isolation remap (L13–L40), then Codex polish.

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
