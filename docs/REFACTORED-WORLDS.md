# Refactored Worlds — Escape to Luma

## Status and scope

This is the **target campaign specification**, superseding the conflicting 10-world / 150-level layout in `CAMPAIGN-ARCHITECTURE.md`, `WORLD-PROGRESSION.md`, and `src/campaign/worlds.ts`. Those sources describe the current playable build and remain useful implementation reference until a deliberate migration lands. Do not silently relabel existing IDs or invalidate saves.

Twenty worlds means **shorter chapters**, not automatically 300 levels: begin planning around **8–10 levels per world** (roughly 160–200 core levels), then tune the exact total through playtests. Luma is deliberately brief and celebratory, not a final hostile marathon.

| # | Chapter | Story / environment purpose | Obstacle focus | Progression role | Starting count |
|---:|---|---|---|---|---:|
| 1 | Containment | Spark breaks out of the research vessel. | Existing rotors, laser grids, piston field. | Aim and readable timing. | 8–10 |
| 2 | Lockdown | The facility responds and seals routes. | Reactive gates, shutters, clock hands. | Combine two known reads. | 8–10 |
| 3 | The City | Spark follows the signal through streets and rooftops. | Elevator blocks, conveyor gates, sweepers. | Lateral movement and route selection. | 8–10 |
| 4 | The Ascent | Towers give way to open sky. | Moving rings, scissor gates, wind. | Long-distance spatial prediction. | 8–10 |
| 5 | The Storm | Spark crosses a violent weather system. | Crosswinds, pulse rings, reactive gates. | Introduce field timing without surprise. | 8–10 |
| 6 | Upper Atmosphere | Air thins; Earth begins to fall away. | Iris/rolling apertures, solar sail shutters. | Teach precision through changing openings. | 8–10 |
| 7 | Orbit | Human orbital infrastructure becomes the route out. | Pendulums, debris, clock hands. | Low-gravity timing. | 8–10 |
| 8 | Orbital Graveyard | Wreckage blocks the route beyond Earth. | Sequential tunnels, moving safe zones. | Read a multi-depth sequence. | 8–10 |
| 9 | The Moon | Spark uses lunar gravity to pursue the signal. | Orbiting moons, gravity wells, magnetopause sheath. | Curve awareness and indirect routes. | 8–10 |
| 10 | Far Side | Earth disappears; deep space is now unavoidable. | Lagrange null zones, corkscrew tunnels. | Commit to long, quiet precision. | 8–10 |
| 11 | Asteroid Belt | Natural hazards replace engineered defenses. | Comet crossings, accretion shredder, route choice. | Density management. | 8–10 |
| 12 | The Drift | Sparse deep space makes momentum and timing visible. | Speed fields, moving safe zones, long shots. | Master prediction with few landmarks. | 8–10 |
| 13 | The Nebula | The signal intensifies through luminous gas. | Phase fields, rolling apertures, pulse rings. | Read phase and false-light cues. | 8–10 |
| 14 | The Null | A light-eating presence consumes the safe routes. | The Null escape encounter, collapsing illumination. | Pressure without combat; escape it. | 8–10 |
| 15 | False Home | A familiar-looking beacon proves to be a relay. | Teleporting portal, entry/exit portals, reactive gates. | Verify destinations rather than chase a glow. | 8–10 |
| 16 | Ancient Network | An old transit lattice decodes the relay. | Synchronized apertures, network tunnels. | Pattern literacy. | 8–10 |
| 17 | The Machine | The network's mechanism must be traversed, not fought. | Pistons, clock hands, conveyors, shutters. | Controlled system complexity. | 8–10 |
| 18 | The Signal | The true Luma coordinates resolve. | Teleport chains, pulse beams, sequential routes. | Synthesis and story confirmation. | 8–10 |
| 19 | Homeward | Spark follows the real coordinates across the last distance. | Curated combinations of mastered families. | Finale mastery; no new hidden rule. | 8–10 |
| 20 | Luma | Spark reunites with its luminous home. | Minimal ceremonial gates; no hostile gauntlet. | Closure, rewards, Endless Voyage unlock. | 3–5 |

## Narrative spine

Capture/escape → leave Earth → deep space → Nebula → The Null's light-eating encounter → False Home relay → Ancient Network → true Luma coordinates → Homeward → Luma reunion and Endless Voyage unlock. World transitions should communicate one clear discovery; do not turn every chapter into a lore dump.

## Migration guardrails

- Keep the current `WorldDefinition`, `WORLDS`, `highestUnlockedLevel`, `unlockedWorldIds`, completion rewards, and level IDs working until a versioned save/content migration is designed and tested.
- Retain legacy current-world terminology where needed for migration mapping: present `sky` can split into The Ascent/The Storm; present `atmosphere`, `orbit`, `moon`, `asteroid`, `nebula`, `network`, and `homeward` map forward by authored-content decision, not name matching alone.
- Original Spark must clear every authored level. New worlds may introduce a mechanic in isolation before combining it.

## Responsibilities

### CURSOR

Own mechanics prototypes, world/level data, state and save migrations, basic functional UI, story wiring, debug tools and tests. Implement first; preserve validated projectile aim, camera, collision, prediction and physics unless a tested change is required.

### CODEX

Own polish/refinement, final UI/UX, graphics/assets/effects, visual readability, story copy/presentation, and responsive/performance cleanup after mechanics work. Do not duplicate Cursor's mechanics work or replace validated gameplay/camera/physics.
