> Current graphics update: the five remaining obstacle families and six later-world environment kits now have procedural implementations. See [World and obstacle graphics](WORLD-AND-OBSTACLE-ART.md) for status, validation and remaining device review. Earlier backlog entries below are superseded where noted in that document.

# Obstacle graphics production board

Reviewed 20 September 2026 against the current runtime code and 150-level campaign catalog. This is a code-based inventory, not a claim that every level has been visually playtested. Counts are levels using a family; combinations count in multiple rows. No builds, exports or publishing.

## Updated designs awaiting device review

- **Moving ring / airborne security gate:** first L31, 26 levels. Metal annular frame, four radial stabilizer pods, cyan exhaust and soft amber rim glow. Clear center matches the authored opening radius. The full-screen grid and tint were removed at user request; collision still requires passing through the opening. Uses existing movement and prediction. No new assets or dependencies. Visual review: isolated rooftop scene with the gameplay camera, portal and moving gate; full native gameplay/performance review pending. Source: `src/obstacles/AirborneGateVisual.ts`.
- **Rotor / security sweep barrier:** first L4, 23 levels. Fixed machined casing, motor hub, full-width moving arms and amber inserts. Level 4 browser gameplay reviewed. Native performance and later-world variants pending. Source: `src/obstacles/RotorVisuals.ts`.

## Remaining families, recommended production order

| Order | Family / first appearance / usage | Current graphics and issue | Proposed recognizable object | Required work and acceptance |
|---|---|---|---|---|
| 1 | Sliding gate / L1 specialized glass; standard gates follow / 26 levels including glass | Flat rectangular panels with border strips; updated metal material but limited construction | Motorized security bulkhead | Panel thickness, tracks, recessed seams, actuator housings, warning lamps. Keep all four visible aperture edges aligned with collision through the entire movement. Preserve the specialized L1 glass. |
| 2 | Iris / L46 / 22 levels | Eight narrow rectangular spokes leave apparently open gaps; aperture torus starts at radius 1.4 and is then multiplied by the collision radius | Pressure-seal diaphragm | Overlapping shutter leaves, outer pressure housing, pivots and actuator teeth. Actual visible hole must equal collision radius at minimum, maximum and intermediate openings. No fake safe gaps. |
| 3 | Shifting aperture / L121 / 18 levels | Flat annular rim and a dark disc covering the safe hole; rim geometry is rebuilt every update | Ancient translating lock | Layered mechanical housing, sliding carriage, segmented aperture and glyph indicators. Clear safe center; blocked region visibly covered. Reuse buffers/transforms instead of allocating geometry each frame. |
| 4 | Drifting blocker / L91 / 17 levels | Plain square slab with circular collision, so corners misrepresent the hazard | Rounded fractured asteroid / damaged machinery core | Three reusable rounded silhouettes, facets, seams and restrained debris. Match projected collision radius; decorative fragments cannot suggest additional collision. |
| 5 | Laser grid / L8 / 5 levels | Readable moving beams and fixed posts, but simple flat beam surfaces and sparse hardware | Scanning security curtain | Detailed pylons, emitter lenses, moving carriage/rail connections, warning indicators, bounded beam glow. Preserve exact activation timing, motion and predictive collision; distinguish off state by shape/intensity as well as color. |
| 6 | Pendulum / L61 / 17 levels | Small spherical pivot, cylinder arm and sphere/box weight | Station maintenance counterweight | Anchored motor pivot, articulated suspension, rounded weight, hazard bands. Review which parts actually collide before adding solid-looking supports; rooftop box silhouette currently differs from circular weight collision. |
| 7 | Orbiter / L76 / 19 levels | Single featureless sphere | Patrol drone / orbital sentry | Armored spherical body, lens, inset panels and small thrusters. Subtle non-solid path cue. Retain the spherical collision outline; do not add a solid central assembly without matching collision. |
| 8 | Phase field / L106 / 22 levels | Flat disc switches cyan/red and opacity | Pulsed energy membrane | Edge emitters, patterned membrane, unmistakable open/blocked states and transition warning tied to the actual cycle. Frame must not imply permanent collision where the current rules allow passage. |

## Shared graphics and scene follow-ups

- **Containment glass:** already has fracture geometry and a real hole. Review reflections, edge contrast, loose fragments and story-to-gameplay handoff on device. Do not replace it with a flat room image.
- **Jump Gate destination:** already has mechanical frame, energy arcs, interior depth and entry feedback. Needs later-world material variants and contrast checks behind every obstacle. Keep blue destination distinct from amber security barriers.
- **Wind:** long streaks replaced with 12 soft dust motes and four short curved wisps. A HUD arrow shows screen-space wind direction. Reduced motion hides the particles while keeping the arrow. Device visibility review pending.
- **Gravity wells:** review existing rings against actual force radius and direction; propose a localized energy distortion with particles following the pull. This is an environmental effect, not an extra solid obstacle.
- **World 3 Sky:** still uses the shared rooftop environment. It needs cloud layers, suspended infrastructure and stronger altitude cues. Obstacle art alone will not make it read as a finished Sky world.
- **Audio:** add short mechanical/field identities, preserving timing and settings. Record provenance for sourced audio.

## Working contract for each family

1. Build one representative design in the existing Three.js renderer, from the gameplay camera first.
2. Show safe openings and solid boundaries at their true collision sizes throughout the full motion cycle.
3. Validate minimum/maximum configured size, paired obstacles, and small phone visibility; retain destination contrast.
4. Use existing clocks, pooled/shared resources and explicit disposal. No per-frame geometry creation. Respect pause and reduced motion.
5. Check prediction, retry, randomized load and transitions; run typecheck, relevant tests and campaign audit.
6. Review on iPhone Expo Go before declaring performance or polish complete. No Expo builds or submissions.
