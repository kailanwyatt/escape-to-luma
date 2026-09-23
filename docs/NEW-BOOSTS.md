# New Boosts — Phase Shield and Time Lock

## Position in the existing system

Extend the current campaign Boost inventory—`guidance`, `slowField`, `secondChance`, `portalBloom`, and reserved `hyperjump`—with two attempt consumables. Boosts are selected on Level Ready, are attempt-local, and are separate from equipped Spark passives and Overcharge. Costs, inventory caps, loadout/equip limit, duration and grant quantities are central configuration, not UI literals.

| Boost | Intended effect | Consumption and clear feedback |
|---|---|---|
| **Phase Shield** (recommended player-facing rename; legacy/spec name: Phase Spark) | One collision pass/forgiveness during one attempt. | A visible shell arms at launch/defined activation; the first eligible obstacle collision consumes it, plays a distinct break/phase effect, then normal collision rules resume. A miss, target failure, out-of-bounds condition, or non-eligible scripted failure must be explicitly classified rather than silently forgiven. |
| **Time Lock** | Freeze obstacle progression for a short period after launch; starting tuning target ~1–1.5 seconds. Spark continues moving. | Consumed once when the shot starts. HUD and world effect display remaining lock time; obstacles resume cleanly from their frozen state. |

## Time Lock deterministic clock contract

Time Lock freezes **obstacle time**, not projectile time. Define one `obstacleTime(shotTime, lockDuration)` (for example `max(0, shotTime - lockDuration)` for a launch-start freeze) and use it for rendering, collision, trajectory simulation, debug ghosts and all obstacle state queries. This preserves the current Slow Field concept—obstacle `dt` scaling—but do not stack effects through scattered per-render multipliers; compose them in one authoritative clock policy.

Edge rules must be authored and tested:

- Moving targets and portals: target behavior follows its documented clock; a Teleporting Portal must use the same authoritative state when it is designated an obstacle. Entry/Exit mapping must not disagree between preview and runtime.
- Phase fields and hazards: their dangerous/open state uses obstacle time, so Time Lock visibly freezes the phase.
- Force/speed zones: physical projectile forces continue only if their design says they are world forces; obstacle animation/state freezes. Label exceptions in config and preview them.
- Existing fixed-frame lasers remain fixed at Z and beams only move X/Y; Time Lock freezes their beam/pulse state, not the projectile's Z progress.
- Do not activate Time Lock later than launch without a separately designed input/UI; this version is launch-triggered to remain predictable.

## Inventory, acquisition and fairness

- Source boosts through gameplay rewards, Shards, and optional store bundles. Never make a difficult core level require a paid Boost; Original Spark with no Boosts remains a valid clear path.
- Start with the existing loadout limit until playtests justify a change. Enforce inventory availability and chosen-slot limit before launch; consume only at the documented moment, once, and persist the resulting inventory update safely.
- Keep Second Chance distinct: it handles its existing retry/forgiveness rule, whereas Phase Shield negates one eligible collision in the current flight. Define interaction priority once (recommended: active Phase Shield resolves the first eligible collision; Second Chance remains available afterward if its conditions are met) and show it in debug state.
- **Naming:** Plasma Spark's persistent passive is **Phase Charge**. Avoid presenting a consumable with the nearly identical “Phase Spark” label. Use **Phase Shield** / **One-Pass Shield** consistently; if product naming must retain Phase Spark, prefix it “Boost:”.

## Responsibilities

### CURSOR

Own boost types/save migration, inventory/loadout state, clock composition, collision/prediction parity, prototypes, functional UI, debug readouts and deterministic tests. Do not replace existing projectile/camera physics.

### CODEX

Own shell, freeze, consumption and HUD effects; terminology, final UX/copy, visual readability and performance refinement after mechanics are validated. Do not duplicate the state/collision implementation.
