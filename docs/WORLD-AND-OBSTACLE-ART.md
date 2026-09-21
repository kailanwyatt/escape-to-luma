# World and obstacle graphics pass

## Implemented environments

| World | Runtime scenery |
|---|---|
| Sky | Suspended service deck, cloud banks, weather masts and direction vanes; no rooftop buildings |
| Moon | Grey terrain, crater rims, scattered rocks, abandoned habitat/dish and distant Earth |
| Asteroid Belt | Layered fractured rock, salvaged walkway and broken structural pieces |
| Nebula | Crystal formations and distant shaded cloud volumes |
| Ancient Network | Monumental columns, gold inscriptions and a distant segmented arch/key landmark |
| Homeward / Luma | Branching luminous structures, glowing banks, canopy and distant living lights |

World selection uses the existing campaign world ID. Environment IDs used by gameplay remain unchanged. Only one additional journey kit is retained; changing worlds disposes the previous kit, and retries reuse it. Existing Containment, City and near-Earth space sets remain available. Materials and geometry are local procedural assets; no downloads, new dependencies or external asset licenses are required.

These are distinct first-pass stylized 3D kits, not the final cinematic art shown in reference images. Moon's distant Earth and the cloud shapes remain simplified. Further surface-detail/atmosphere work can build on these kits without replacing gameplay.

## Obstacle language

- Pendulum: a visible suspension arm and mechanical counterweight with amber face.
- Orbiter: an amber-eyed drone; actual orbital movement remains authoritative.
- Debris: a faceted round rock body replaces the square card, matching the circular collision envelope more closely.
- Phase field: translucent red surface plus an X while active; filled surface and X disappear when open. The thin boundary is an energy indicator, not physical hardware. Existing partial-edge collision behavior is unchanged.
- Shifting aperture: amber-edged moving shutter with a genuinely clear center. Its sector geometry updates in place instead of allocating a replacement every frame. Aperture radius follows the same state used by collision.

Current instructional text explains these appearances. Existing acknowledged introductions are not replayed solely for an art update.

## Validation

Typecheck, 102 tests, the 150-level campaign audit and 450 real-input prediction checks pass. New tests cover world replacement, aperture buffer/radius consistency, field open/closed visibility and circular blocker bodies. Local visual review includes all six new kits plus paired pendulum/ring, drones, debris/ring, fields, apertures and final hazards. Phone framing was reviewed for drones and paired apertures. Browser rendering checks do not establish native performance or human difficulty.

Run `node scripts/serve-space-gallery.cjs` and open localhost:8786. Select a world/level and pause motion to inspect. This local review uses the actual EnvironmentManager and obstacle classes; it does not change saved progress. Native frame rate, heat and contrast remain iPhone playtest items. No Expo builds/exports or submissions were run.

## Files

- `src/environment/JourneyWorldScene.ts`, `EnvironmentManager.ts`
- `src/obstacles/ReadableBlockerVisual.ts`, `ObstacleVisuals.ts`, `OrbiterObstacle.ts`, `DriftingBlockerObstacle.ts`, `PhaseFieldObstacle.ts`, `ShiftingApertureObstacle.ts`
- `src/campaign/StoryMoments.ts`
- `dev/space-gallery.ts`, `dev/space-gallery.html`
- `tests/world-readability.test.ts`
