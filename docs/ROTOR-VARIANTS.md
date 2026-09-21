# Rotor visual variants

Ten appearances use the same `RotorObstacle` simulation, collision and prediction. `RotorConfig.visualVariant` is optional. `WORLD_ROTOR_VARIANTS` supplies defaults using actual campaign world IDs; explicit per-level overrides win. Endless mode falls back by environment. No rotor encounters were added to worlds that currently lack them.

| World | Variant | Treatment |
|---|---|---|
| Containment | containmentSecurity | Existing machined security sweep and amber inserts |
| City | cityVentilation | Silver blades, raised seams, yellow industrial bands |
| Sky | skyTurbine | Light turbine blades and red safety tips |
| Atmosphere | atmosphereAntenna | Segmented instrument strips, sparse tracking boundary |
| Orbit | orbitSolarArray | Blue solar cells with gold grid and edge frame |
| Moon | moonMiningDrill | Arm collars and yellow/black excavation modules |
| Asteroid | asteroidWreckage | Asymmetric truss detailing, damaged modules and fragmented ring detail |
| Nebula | nebulaEnergy | Translucent violet arms with crossed energy filaments |
| Network | ancientMechanism | Gold geometric marks and dark ceremonial frame |
| Homeward | lumaEnergy | Cyan/white/violet arms and luminous core |

The illustrated broad propellers/solar arrays are narrowed to the existing arm collider. Every arm uses the same full rectangular collision silhouette. Depth details do not add collision. A faint boundary remains even for wreckage and satellite variants because the authoritative ring still collides. No independent visual rotation clock or per-frame mesh rebuilding. The stationary housing counter-rotates against the one authoritative parent angle.

## Local visual review

Run `node scripts/serve-rotor-gallery.cjs` from the project, then open http://localhost:8784. This serves a separate development gallery bound to localhost; it is not imported into Expo or the production UI. Uses existing esbuild solely for this local web preview, with generated output in a temporary directory. No Expo builds/exports/submissions.

Controls: all worlds or individual view, 1/2/3 arms, both directions, three speeds, near/far Z planes, silhouette mode. Camera position, look-at and FOV come directly from game tuning. The gallery isolates the rotor with neutral lighting; world environment composition is not reproduced. One WebGL renderer uses scissored viewports and actual RotorObstacle instances.

Validation: typecheck, 79 tests and all 150 campaign levels pass. Tests cover all 30 variant/count silhouettes, both directions and depths, collision/prediction equivalence, world defaults/overrides and variant replacement disposal. Browser visual and silhouette checks are separate from native performance: iPhone frame timing and in-world contrast remain to be reviewed. No claim of matching the concept sheet's offline lighting or rendering quality.
