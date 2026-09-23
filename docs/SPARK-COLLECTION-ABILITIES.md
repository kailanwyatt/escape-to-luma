# Spark Collection Abilities

## Product decision

`SPARK_CATALOG` currently defines visual-only `SparkDefinition` entries and `CampaignSave` already stores `ownedSparkIds` / `equippedSparkId`. Evolve a Spark from cosmetic-only to a **persistent strategic specialization** while preserving its existing visual identity and **identical base collider, launch physics, and target rules**. Every level must be completable with Original; no Spark is required, including premium forms.

This is distinct from a consumable Boost (selected per attempt and spent) and Overcharge (a timed unlimited-Energy entitlement). A Spark's passive should be modest, legible, and useful in particular situations rather than an automatic clear.

| Spark | Passive specialization (target design) | Notes |
|---|---|---|
| Original | Pure Focus — neutral baseline / clearest prediction. | Starting Spark; reference balance. |
| Neon | Future Sight — slightly clearer future-state/arrival visualization. | Presentation aid, no geometry change. |
| Solar | Energy Harvest — modest extra eligible first-clear energy/shard value, capped/configured. | Never turns replay farming into a source. |
| Frost | Cold Field — a small, predictable local slow/readability window. | Must share obstacle clock with simulation. |
| Storm | Limited Forgiveness — concept: narrowly scoped, visibly armed mistake protection. | Prototype and balance before commitment. |
| Aurora | Guiding Light — highlights the authored safe opening/route. | Not aim assist or auto-steer. |
| Plasma | Phase Charge — passive, limited phase interaction. | Do not call it “Phase Spark”; see Boost spec. |
| Lunar | Gravity Sense — visualizes declared gravity/force vectors. | No force reduction. |
| Meteor | Momentum — clearer speed/arrival feedback, optionally bounded launch-read benefit. | No base velocity advantage unless broadly balanced. |
| Nebula | Phase Sense — improves phase-field window readability. | Does not change open windows. |
| Ancient | Network Sense — displays synchronization/order cues. | Best acquired as mastery/world challenge. |
| Origin | Resonance — final-route/story resonance feedback. | World-end/reunion reward, not stronger physics. |

Existing catalog appearances such as Reactor, Void and Prism remain valid. Give them cosmetics-only status initially or define a similarly bounded passive only after a written balance decision; do not invent effects solely to fill every card.

## Acquisition and equip

- Original is owned and equipped from the start. Use existing `SkinAcquisition` patterns: Shards for selected regular forms, world completion/challenge rewards for journey-linked forms, mastery for Ancient, and premium only where the storefront/product is valid.
- A paid or shard Spark may be a preference, never a progression gate. No purchased Spark may be required to clear a level, earn a core story beat, or access Endless Voyage.
- Collection card should show visual preview, passive in one plain sentence, acquisition, owned/locked state and an explicit Equip action. Equip outside a shot; changing mid-attempt is prohibited. Level Ready can show the equipped passive and a “change collection” route.
- Keep `equippedSparkId` as the durable selection. Add an optional, versioned `passiveId`/definition lookup rather than persisting transient cooldown/shot state. Attempt-local passive state belongs to the active campaign run, not `CampaignSave`.
- Keep prices, caps and effect strength in config; do not hardcode them into UI. Existing `SPARK_CATALOG` shard costs/acquisition labels require product review when passives become valuable.

## Fairness and implementation

Use a small `ability` discriminant in `SparkDefinition` (or a catalog keyed by Spark ID), a pure evaluator for attempt-local state, and one effect path shared by runtime, prediction and debug. Passive effects must fail safely to Original behavior. Analytics should distinguish equipped Spark from Boost use without treating either as proof of skill.

Rename the consumable **Phase Spark** to **Phase Shield** (recommended) or **One-Pass Shield** in player-facing UI; reserve “Phase Charge” for Plasma's passive. If the original boost name remains, always qualify it as “Boost: Phase Spark.”

## Responsibilities

### CURSOR

Own the typed catalog/save migration, passive prototypes, state handling, functional collection/Level Ready wiring, debug tools and tests. Preserve established collider/aim/camera/physics and do not duplicate visual polish.

### CODEX

Own card hierarchy, visual distinction, effect readability, final copy and responsive/performance refinement after effects validate. Do not redesign the underlying passive state machine or replace tested gameplay systems.
