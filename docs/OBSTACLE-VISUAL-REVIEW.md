# Obstacle graphics — implemented visual review

Reviewed 2026-09-23. These are screenshots of the running Expo web game at a 390 × 844 viewport, not concept art or mockups. The graphics are procedural Three.js primitives integrated into the obstacle renderers; there is no separate bitmap sprite pack to import. Existing background assets were retained. No image-generation tool was needed for these code-native visuals.

## Scope and evidence

All 23 current library/story families received visual treatment. Nine affected Journey chapter previews were captured. This pass changes rendering only: no level remaps, state math, collision, prediction, aim, camera, projectile physics, configuration shapes, saves, economy, Boosts or Overcharge changes. Existing unrelated working-tree changes were preserved.

The capture-drone and otherworldly-life treatment is a visual interpretation of existing movement, not new seeking/capture AI. No new obstacle family was invented. Screenshot filenames identify the live level verified in the HUD before capture.

## World → level → obstacle gallery

Placement below is the existing live placement, unchanged by this graphics pass.

| World | Level / screenshot | Family | Implemented graphic |
|---|---|---|---|
| Containment | [L6](visual-review/obstacles-2026-09-23/l006.jpg) | Piston Field | Opaque steel rams, floor sockets, amber travel lamps |
| Lockdown | [L9](visual-review/obstacles-2026-09-23/l009.jpg) | Elevator Blocks | Glass-front capture cages, vertical guide rails |
| Lockdown | [L10](visual-review/obstacles-2026-09-23/l010.jpg) | Reactive Gate | Armored capture doors; coral / amber / cyan state lamps |
| Lockdown | [L13](visual-review/obstacles-2026-09-23/l013.jpg) | Split Shutter | Ribbed industrial bulkheads and bright inner edges |
| Lockdown | [L14](visual-review/obstacles-2026-09-23/l014.jpg) | Clock Hands | Rounded restraint arms and retrieval-drone hub |
| The City | [L17](visual-review/obstacles-2026-09-23/l017.jpg) | Conveyor Gate | Patrolling capture drones, amber visors, metallic shells |
| The Ascent | [L32](visual-review/obstacles-2026-09-23/l032.jpg) | Scissor Gate | Rounded restraint pincers with illuminated traces |
| The Ascent | [L33](visual-review/obstacles-2026-09-23/l033.jpg) | Solar Sail | Blue solar cells; faded cyan clear state |
| The Storm | [L40](visual-review/obstacles-2026-09-23/l040.jpg) | Pulse Ring | Continuous electrical annulus, unobstructed hub |
| Upper Atmosphere | [L47](visual-review/obstacles-2026-09-23/l047.jpg) | Rolling Aperture | Transfer-grid field with genuine moving circular opening |
| Orbital Graveyard | [L70](visual-review/obstacles-2026-09-23/l070.jpg) | Sequential Tunnel | Sealed derelict ports; only active aperture green |
| Orbital Graveyard | [L71](visual-review/obstacles-2026-09-23/l071.jpg) | Moving Safe Zone | Damaged containment field with drifting green safe edge |
| The Moon | [L77](visual-review/obstacles-2026-09-23/l077.jpg) | Orbiting Moons | Luminous unfamiliar life, violet shells and mint cores |
| The Moon | [L78](visual-review/obstacles-2026-09-23/l078.jpg) | Magnetopause Sheath | Continuous violet arc and pale magnetic boundary |
| Far Side | [L85](visual-review/obstacles-2026-09-23/l085.jpg) | Lagrange Null Zone | Subtle nonlethal calm pocket |
| Far Side | [L86](visual-review/obstacles-2026-09-23/l086.jpg) | Corkscrew Tunnel | Continuous transit ring with visible broad gap |
| Asteroid Belt | [L92](visual-review/obstacles-2026-09-23/l092.jpg) | Comet Crossing | Icy luminous core and faint noncollision wake |
| Asteroid Belt | [L93](visual-review/obstacles-2026-09-23/l093.jpg) | Accretion Shredder | Small circling alien scavengers |
| The Drift | [L100](visual-review/obstacles-2026-09-23/l100.jpg) | Speed Field | Transparent current volume and fine flow streaks |
| The Drift | [L101](visual-review/obstacles-2026-09-23/l101.jpg) | Pulsar Radiation Beam | Bright peach radiation band; faint guides while inactive |
| The Null | [L112](visual-review/obstacles-2026-09-23/l112.jpg) | The Null | Dark bounded field with surviving light around its safe hole |
| False Home | [L117](visual-review/obstacles-2026-09-23/l117.jpg) | Teleporting Portal | Green actual aperture, amber next-anchor warning |
| False Home | [L118](visual-review/obstacles-2026-09-23/l118.jpg) | Entry/Exit Portal | Green entry and smaller double cyan destination marker |

## State comparisons

- Reactive Gate: [closed, coral](visual-review/obstacles-2026-09-23/reactive-state-b.jpg) · [warning, amber](visual-review/obstacles-2026-09-23/l010.jpg) · [open, cyan](visual-review/obstacles-2026-09-23/reactive-state-a.jpg). Door panels remain opaque even when the center opens.
- Solar Sail: [solid](visual-review/obstacles-2026-09-23/sail-state-a.jpg) · [clear, translucent cyan](visual-review/obstacles-2026-09-23/sail-state-c.jpg). Rendering follows the current open flag, not a new fold mechanic.
- Pulsar Beam: [inactive](visual-review/obstacles-2026-09-23/pulsar-state-a.jpg) · [active](visual-review/obstacles-2026-09-23/pulsar-state-b.jpg). Its full-width danger band stays visible; the fixed plane is unchanged.
- Teleporting Portal: [current green aperture and amber next-anchor warning](visual-review/obstacles-2026-09-23/l117.jpg). Amber is not a second safe opening.
- Sequential Tunnel: [one green opening, two sealed ports](visual-review/obstacles-2026-09-23/l070.jpg). The visual review caught and fixed a cached-material color bug; a regression assertion now checks each rim against authoritative state.

## Journey previews

- [Lockdown](visual-review/obstacles-2026-09-23/journey-lockdown.jpg)
- [The City](visual-review/obstacles-2026-09-23/journey-city.jpg)
- [The Ascent](visual-review/obstacles-2026-09-23/journey-ascent.jpg)
- [The Storm](visual-review/obstacles-2026-09-23/journey-storm.jpg)
- [Orbital Graveyard](visual-review/obstacles-2026-09-23/journey-graveyard.jpg)
- [The Drift](visual-review/obstacles-2026-09-23/journey-drift.jpg)
- [The Null](visual-review/obstacles-2026-09-23/journey-null.jpg)
- [False Home](visual-review/obstacles-2026-09-23/journey-relay.jpg)
- [Luma](visual-review/obstacles-2026-09-23/journey-luma.jpg)

Motifs: containment panels, amber patrol drones, weather rings, derelict ports, drifting currents, surviving light, relay anchors, and a gentle reunion constellation. Existing Journey controls, progression and navigation remain intact.

## Verification and limits

- 42 tests passed across library-world-art, library-priority-art, library-encounters, new-obstacles and story-library.
- New visual tests cover finite transforms/vertices, geometry reuse and disposal, portal aperture ray passage, next-anchor warning visibility, sequential rim colors, sail clear-state and radiation visibility. First-four tests also check ram bounds, gate state/gap and annulus radii.
- All 23 live isolation scenes were visually inspected in Chrome at 390 × 844; nine Journey previews and selected timed states were also inspected. Browser error log was empty at review completion.
- Project typecheck remains blocked by existing LevelComposition.ts lines 41–42: centerX/centerY access on the broad ObstacleConfig union. This pass did not modify that file.
- This is visual smoke testing, not a full gameplay-clearance certification. No throws, purchases, Boost use or save resets were performed. Screenshots use the user's existing equipped Spark. Original-without-Boosts clearance and native iOS/Android frame time still need device/play testing.
- Per-frame rendering reuses geometry/materials. The 128-segment fields update vertex buffers; practical native performance is not established by unit tests. Plane barriers use a 40-unit outer radius to cover the visible corridor while leaving the current collision rules unchanged.

## CURSOR handoffs — do not silently alter mechanics

1. L32 Scissor Gate hint says “open diamond below,” but current state produces two crossing arms. Decide whether to align teaching copy to the validated crossed-arm mechanic or separately implement/revalidate a true hinged diamond. This art follows the current capsules.
2. L33 Solar Sail hint says “nearly edge-on,” but current state rotates in XY and disables collision at its open threshold. The visual fades at that threshold. A true 3D fold would require an explicit mechanics/prediction review; it is not implemented here.
3. The Null currently renders the existing oscillating safe-hole encounter. Light consumption, pursuit and escape choreography remain mechanics/story work, not new behavior supplied by this art.
4. Resolve the two existing LevelComposition typing errors. Revalidate Original/no-Boost clears after any future timing or placement change.
5. Journey accessibility labels still say “of 15” even for shorter live chapters; visible chapter counts are correct. This predates the art pass.

## Remaining CODEX refinement candidates

Far Side still inherits the Moon background with Earth visible, and The Drift inherits asteroid dressing. Those pre-existing atmosphere choices need a separate chapter-background pass. They were not changed while validating obstacle silhouettes. Wide-screen and physical-device visual/performance acceptance remain outstanding. Teaching-copy refinements should follow Cursor's decisions above, without suggesting mechanics that do not exist.

## Files changed by this graphics work

Created:

- src/obstacles/LibraryPriorityArt.ts — first-four procedural visuals (begun in the earlier pass, refined here).
- src/obstacles/LibraryWorldArt.ts — remaining 19 family visual adapters.
- src/ui/JourneyMotif.tsx — reusable primitive chapter motifs.
- tests/library-priority-art.test.ts — first-four rendering checks.
- tests/library-world-art.test.ts — remaining-family rendering/state checks.
- docs/OBSTACLE-VISUAL-REVIEW.md — this review and gallery.
- docs/visual-review/obstacles-2026-09-23/*.jpg — 43 actual browser captures, including four earlier comparison snapshots and extra timing samples.

Updated:

- src/obstacles/LibraryObstacle.ts — delegates rendering to the visual kits; existing mechanics retained.
- src/obstacles/StoryLibraryObstacle.ts — delegates rendering to the visual kit; existing mechanics retained.
- src/ui/JourneyScreen.tsx — draws motif over the existing preview background.
- src/ui/journeyPresentation.ts — chapter accents and motif selection.
- docs/OBSTACLE-POLISH-PASS-1.md — points to this expanded, browser-reviewed pass.

Other dirty files are not claimed as part of this visual implementation. Do not revert or overwrite Cursor's mechanics work when integrating these files.

## Ownership

CURSOR owns mechanics/prototype/data/state/save migrations/basic functional UI/story wiring, debug tooling and gameplay tests. CODEX owns these visual renderers, materials, silhouettes, truthful state cues, final UI presentation, graphics, story-copy refinement and subsequent responsive/performance cleanup. Neither agent should replace validated gameplay/camera/physics or duplicate the other's work.
