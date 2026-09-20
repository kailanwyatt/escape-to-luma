# SPARK animation-safe asset manifest

Status values: `fallback`, `graybox-review`, `material-review`,
`animation-review`, `device-review`, `approved`.

Reference images live in `assets/reference/` and are excluded from runtime.
All dimensions below are contracts; code/config remains authoritative.

## Character and effects

- **spark-original** — reference: `spark-profile-approved.png` Original crop; runtime: procedural Three.js nodes, optional GLB shell; scale: collider radius from `GAME_TUNING.projectile.radius`; origin: collider center; children: core, shell, three orbit arcs, glow sprite; materials: core/shell/orbit/glow; collision: `Projectile`; budget: ≤4k tris, ≤4 materials; fallback: current projectile spheres; status: graybox-review; human approval: required.
- **spark-skin-materials** — reference: matching Spark profile crops; runtime: typed material/effect palettes; scale/origin: identical to Original; children: none beyond Original contract; materials: core/shell/orbit/trail palette; collision: Original Spark collider; budget: no added geometry; fallback: catalog Phong colors; status: fallback; human approval: required per skin.
- **spark-trail** — reference: Spark in Action row; runtime: code ribbon/pooled sprites; origin: projectile center, emitted behind velocity; children: trail nodes; materials: additive transparent; collision: none; budget: ≤32 live segments; fallback: current sphere trail; status: fallback; human approval: required.
- **spark-collision-burst** — reference: Collision crop; runtime: transparent sprite sheet or pooled geometry; origin: collision point; children: burst particles; materials: additive; collision: none; budget: ≤24 particles; fallback: current particles; status: fallback; human approval: required.

## Containment and environments

- **containment-vessel** — reference: `world1-opening-board-approved.png` specimen/breach crops; runtime: modular Three.js or GLB; scale: opening must clear Spark collider plus authored margin; origin: vessel floor center; children: frame, glass shell, opening glow; materials: metal/glass/emissive; collision: level/config, not glass art; budget: ≤12k tris; fallback: `ContainmentScene` and procedural workshop; status: graybox-review; human approval: required.
- **containment-crack** — reference: breach crop; runtime: transparent PNG decal/mask; size: 1024 square source with mobile variants; origin: vessel front center; children: separate fracture shards; materials: alpha/emissive mask; collision: none; budget: ≤1 MB compressed; fallback: emissive lines; status: fallback; human approval: required.
- **containment-kit** — reference: World 1 boards; runtime: modular floor/wall/ceiling panels, columns, warning lights, decals and consoles; scale: world units from `GameScene`; origin: module-local lower center; children: lights only; materials: shared metal/emissive atlas; collision: none unless separately configured; budget: ≤25k visible tris, ≤8 shared materials; fallback: current workshop primitives; status: graybox-review; human approval: required.
- **city-rooftop-kit** — reference: `world-strip-approved.png` City/Sky crops; runtime: modular roof panels, vents, antennas and skyline layers; scale: gameplay corridor remains clear ±2m; origin: module base; children: wind cues/antenna lights; materials: shared rooftop/skyline atlas; collision: none; budget: ≤25k visible tris; fallback: current rooftop primitives; status: fallback; human approval: required.
- **world-horizon-plates** — reference: world strip crops; runtime: distant JPG/PNG only; size: 2048×1024 source, 1024 mobile variant; origin: environment horizon; children: none; materials: unlit; collision: none; budget: ≤700 KB each; fallback: procedural sky/stars; status: fallback; human approval: required.

## Gameplay obstacles

- **rotor-workshop** — reference: `obstacle-guide-approved.png` rotating arm/triple rotor; runtime: procedural nodes or GLB parts; scale: ring/hub/blade lengths from `GAME_TUNING.rotor`; origin: hub center; children: static outer frame, hub, one reusable arm instanced 1–3 times; materials: frame/hub/blade/emissive warning; collision: `RotorObstacle`/`evaluateRotorCollision`; budget: ≤8k tris, ≤4 materials; fallback: `RotorVisuals`; status: graybox-review; human approval: required.
- **sliding-gate** — reference: obstacle guide sliding gate/narrow passage; runtime: modular nodes; scale: opening width/height from `SlidingGateConfig`; origin: configured opening center; children: left/right/top/bottom panels translated independently; materials: frame/panel/emissive; collision: `SlidingGateObstacle`; budget: ≤8k tris; fallback: `createGateVisual`; status: graybox-review; human approval: required.
- **iris-aperture** — reference: obstacle guide iris/moving ring; runtime: procedural or GLB petals; scale: opening radius from `IrisConfig`; origin: aperture center; children: static ring, individually pivoted petals, emissive opening; materials: frame/petals/emissive; collision: `IrisObstacle`; budget: ≤10k tris; fallback: `createIrisVisual`; status: graybox-review; human approval: required.
- **shifting-aperture** — reference: obstacle guide moving ring/iris; runtime: iris contract plus translated parent; scale: `ShiftingApertureConfig`; origin: aperture center; children: petals and glow; materials: frame/emissive; collision: `ShiftingApertureObstacle`; budget: ≤10k tris; fallback: procedural aperture; status: fallback; human approval: required.
- **pendulum** — reference: obstacle guide pendulum; runtime: modular Three.js/GLB; scale: length/radius from config; origin: pivot housing center; children: arm and bob; materials: housing/arm/bob/emissive; collision: `PendulumObstacle`; budget: ≤6k tris; fallback: procedural pendulum; status: fallback; human approval: required.
- **moving-ring** — reference: obstacle guide moving destination/static ring; runtime: modular ring; scale: radius from config; origin: ring center; children: ring segments and non-colliding motion ghosts; materials: frame/emissive; collision: `MovingRingObstacle`; budget: ≤6k tris; fallback: procedural ring; status: fallback; human approval: required.
- **orbiter** — reference: obstacle guide orbiter; runtime: procedural ring plus independent bodies; scale: orbit/blocker radii from config; origin: orbit center; children: orbiting bodies and separate path VFX; materials: frame/body/emissive; collision: `OrbiterObstacle`; budget: ≤8k tris; fallback: procedural orbiter; status: fallback; human approval: required.
- **drifting-blocker** — reference: obstacle guide drifting blocker; runtime: 3 reusable debris variants; scale: blocker radius from config; origin: body center; children: none; materials: rock/emissive fissure; collision: `DriftingBlockerObstacle`; budget: ≤4k tris each; fallback: procedural blocker; status: fallback; human approval: required.
- **laser-grid** — reference: obstacle guide laser grid; runtime: procedural beam quads plus emitter parts; scale: beam/opening dimensions from `LaserGridConfig`; origin: grid center; children: emitter posts/caps, beam quads; materials: metal/red emissive; collision: `LaserGridObstacle`; budget: ≤4k emitter tris, ≤12 beams; fallback: current beam meshes; status: graybox-review; human approval: required.
- **phase-field** — reference: obstacle guide phase/energy fields; runtime: frame plus transparent shader plane; scale: field radius from config; origin: field center; children: frame and VFX plane; materials: metal/field shader; collision: `PhaseFieldObstacle`; budget: ≤5k tris, one transparent plane; fallback: procedural field; status: fallback; human approval: required.

## Destination and UI

- **jump-gate** — reference: obstacle guide final gate and campaign boards; runtime: modular procedural geometry; scale: every ring exactly matches CLEAR/GREAT/BULLSEYE/PERFECT scoring radii; origin: target center; children: frame, scoring rings, portal plane, particles; materials: frame/cyan emissive/portal; collision: `Target` and `TargetScoring`; budget: ≤10k tris; fallback: current concentric target; status: graybox-review; human approval: required.
- **wordmark** — reference: all approved boards; runtime: transparent SVG plus PNG 1x/2x/3x; size: 1200×300 master; origin: visual center; children: mark and subtitle may separate; materials: n/a; collision: none; budget: ≤150 KB SVG; fallback: `BrandHero` text; status: fallback; human approval: required.
- **ui-energy** — reference: World 1 HUD boards; runtime: transparent PNG/SVG filled and empty; size: 64 square master; origin: center; children: none; materials: n/a; collision: none; budget: ≤20 KB each; fallback: text glyph; status: fallback; human approval: required.
- **ui-shard** — reference: Spark profile currency dots and UI boards; runtime: transparent PNG/SVG; size: 64 square master; origin: center; children: none; materials: n/a; collision: none; budget: ≤20 KB; fallback: diamond glyph; status: fallback; human approval: required.
- **ui-hearts** — reference: existing Endless HUD role; runtime: transparent PNG/SVG full/empty; size: 64 square master; origin: center; children: none; materials: n/a; collision: none; budget: ≤20 KB each; fallback: heart glyph; status: fallback; human approval: required.
- **spark-portraits** — reference: Spark Forms row; runtime: 512 transparent PNG with 256 variant; origin: center; children: none; materials: n/a; collision: none; budget: ≤250 KB each; fallback: procedural color swatch; status: fallback; human approval: required per portrait.
- **journey-nodes** — reference: world strip and campaign board; runtime: SVG/PNG locked/open/complete states; size: 128 square master; origin: center; children: state badge; materials: n/a; collision: none; budget: ≤30 KB each; fallback: styled RN nodes; status: fallback; human approval: required.
- **wind-cues** — reference: obstacle guide wind zone; runtime: pooled lines/sprites; scale/direction from `windX`; origin: environment-local; children: streak particles; materials: additive transparent; collision: none; budget: ≤40 particles; fallback: HUD WIND label; status: fallback; human approval: required.
- **gravity-well-cues** — reference: obstacle guide gravity well; runtime: procedural rings and distortion-safe particles; scale: radius from gravity-well config; origin: well center; children: rings/particles; materials: transparent emissive; collision: none; budget: ≤5 rings and 24 particles per well; fallback: procedural ring; status: fallback; human approval: required.

## Review gates

Every family advances independently:

1. **Silhouette/graybox** — verify real pivots, child separation, opening dimensions and throw-axis readability.
2. **Material/color** — verify approved palette and readability in dark and bright environments.
3. **Animation in engine** — code drives transforms; verify reversal, pulse and movement bounds.
4. **Collision/prediction** — compare visible edges to debug collision and trajectory.
5. **Small-device/performance** — verify on the smallest supported iPhone with Reduce Motion both ways.
6. **Human approval** — update status to `approved`; only then replace the procedural fallback.

Do not batch-produce skins before Original Spark, Jump Gate and the complete
Containment rotor/gate/environment family pass all six gates.
