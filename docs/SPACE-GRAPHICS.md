# Orbital environment graphics

The shared space environment now uses a service platform with inset lighting, modular equipment housings, diagonal trusses, radiator detail and solar-cell arrays. Distant arrays preserve recognizable station silhouettes in portrait framing. Deck and equipment reuse the existing small procedural metal textures. Hardware uses material-based instancing.

A deterministic starfield and a procedurally shaded sphere provide a curved Earth horizon, cloud bands, ocean/land variation and a thin atmospheric shell. Earth is largest in Upper Atmosphere, recedes in Orbit, becomes a small distant globe at the Moon, and is hidden beyond that. The continents are stylized procedural shapes, not a geographic Earth map. Later worlds still share the orbital hardware; their unique environment packs remain future work.

The space iris now has a metal housing, eight shutter sectors, amber actuator markers and an illuminated aperture. Its visible inner radius matches the existing collision radius. The old aperture mesh displayed an opening 1.4 times larger than the configured radius. No timing, level difficulty values or physics were changed.

## Files

- `src/environment/SpaceScene.ts`: environment geometry/materials.
- `src/environment/EnvironmentManager.ts`: environment and near-Earth presentation.
- `src/game/Game.ts`: passes the existing campaign world to presentation.
- `src/obstacles/OrbitalIrisVisual.ts`, `ObstacleVisuals.ts`: shutter and visual routing.
- `tests/orbital-iris.test.ts`: visible/collision boundary agreement and buffer reuse.
- `dev/space-gallery.ts`, `.html`, `scripts/serve-space-gallery.cjs`: local visual review at port 8786. Uses the gameplay camera and obstacle classes; not a replacement for playing the complete app.

## Review

Run `node scripts/serve-space-gallery.cjs` for the local scene. Portrait and landscape were inspected in the browser. Typecheck, gameplay tests and campaign audit are the automated checks. Native GPU performance, thermal behavior and device color/contrast require iPhone review. No Expo builds or submissions are part of this work.

## Paired door clarity

The rear space gate now uses a metallic pressure door with tracks, motor housings, rollers and an amber opening, distinct from the cyan iris. Four non-overlapping slabs replace the old coplanar panel overlap. Visible bounds and existing movement/collision remain aligned. An independently acknowledged paired-obstacle story at Level 57 (or the next unread encounter with this pair in Upper Atmosphere) explains the circular shutter, amber rectangle and blue portal. The local review includes Level 57.

Additional files: `src/obstacles/OrbitalGateVisual.ts`, `src/campaign/StoryMoments.ts`, `tests/orbital-gate.test.ts`.
