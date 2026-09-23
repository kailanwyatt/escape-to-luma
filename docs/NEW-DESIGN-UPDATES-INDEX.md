# Spark — Escape to Luma: New Design Updates

These focused target-design specs take precedence over older conflicting campaign, obstacle and economy documentation. They do **not** mean the current 10-world / 150-level implementation has already changed; `CAMPAIGN-ARCHITECTURE.md`, `WORLD-PROGRESSION.md`, `ECONOMY.md`, `MONETIZATION.md`, `SAVE-SCHEMA.md`, `SPARKS-UI.md`, and source types remain the current-state reference until Cursor implements a tested migration.

- [Refactored Worlds](REFACTORED-WORLDS.md) — 20 short chapters, narrative spine, pacing and migration guardrails.
- [New Obstacles](NEW-OBSTACLES.md) — deterministic primitive-geometry obstacle library and prediction/collision requirements.
- [Spark Collection Abilities](SPARK-COLLECTION-ABILITIES.md) — persistent strategic Spark specializations, fair acquisition and equip model.
- [Overcharge](OVERCHARGE.md) — paid 2h/24h/7d unlimited-Energy entitlement and safe storefront/UI flow.
- [New Boosts](NEW-BOOSTS.md) — Phase Shield (formerly proposed Phase Spark) and Time Lock alongside the current Boost system.
- [Mechanics Follow-Up Tracker](MECHANICS-FOLLOW-UP.md) — ordered progress board for Speed Field wiring, first authored remaps, remaining families, passives, Overcharge UX, and the 20-world save epoch.

## What changed

New documents were added rather than overwriting production-history docs because the existing docs accurately document a playable 10-world build and its save contracts. Each new spec names the relevant existing source and specifies a safe forward migration. If a conflict remains, use these documents for **future design direction** and the cited current documents/code for **present behavior**.

## Shared responsibility boundary

**CURSOR:** mechanics/prototypes, data/state/save migrations, functional UI, story wiring, debug tooling and tests—implementation first.

**CODEX:** refinement, final UI/UX, graphics/assets/effects, visual readability, story copy/presentation, responsive/performance cleanup after mechanics work.

Neither should duplicate the other's work or replace validated gameplay, camera, collision, prediction or physics unnecessarily.
