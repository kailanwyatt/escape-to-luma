> Current graphics update: the five remaining obstacle families and six later-world environment kits now have procedural implementations. See [World and obstacle graphics](WORLD-AND-OBSTACLE-ART.md) for status, validation and remaining device review. Earlier backlog entries below are superseded where noted in that document.

> Continuation: original opening score, safe timeline transport, soft procedural Spark halo, twelve reusable fracture shards, point-cloud stars, signal/alarm lighting and segmented Jump Gate housing are implemented. See the production board continuation record and `assets/sfx/OPENING-PROVENANCE.md`. Audio is a first synthesized pass; visual/audio device acceptance remains pending.

> Production status update: see [World 1 production board](WORLD1-PRODUCTION-BOARD.md) for current implementation and outstanding review. The 35-second opening now uses procedural 3D; the five story images are optional references. The crack-escape room illustration is not a 3D backdrop or collision surface. Existing “fallback” labels below describe implementation history, not a requirement to replace procedural geometry. New probe, vessel and shared lab modules are implemented first passes, awaiting visual/device acceptance. No generated texture, audio or model is implied complete by these specifications.

# SPARK animation-safe asset manifest

Current override: see [Graphics finish pass](GRAPHICS-FINISH-PASS.md) for the implemented Sky/Moon kits, shared blocker details, Luma growth and world portal housings. Their status is `device-review`; older fallback labels for these families are superseded.

Status values: `fallback`, `graybox-review`, `material-review`,
`animation-review`, `device-review`, `approved`.

Reference images live in `assets/reference/` and are excluded from runtime.
All dimensions below are contracts; code/config remains authoritative.

## Character and effects

- **spark-original** — reference: `spark-profile-approved.png`; runtime: procedural Three.js + portrait `assets/art/sparks/spark-original.png`; status: animation-review; human approval: required.
- **spark-reactor** — World 1 completion; portrait `assets/art/sparks/spark-reactor.png` + reactor visualProfile; status: material-review; human approval: required.
- **spark-neon** — World 2 completion; portrait `assets/art/sparks/spark-neon.png` + neon visualProfile; status: material-review; human approval: required.
- **spark-skin-materials** — reference: matching Spark profile crops; runtime: typed material/effect palettes via `visualProfile`; status: material-review; human approval: required per skin.
- **spark-trail** — reference: Spark in Action row; runtime: code ribbon/pooled sprites; prefers spark trail fields when equipped; status: animation-review; human approval: required.
- **spark-collision-burst** — reference: Collision crop; runtime: transparent sprite sheet or pooled geometry; status: fallback; human approval: required.

## Story UI

- **story-01..05** — runtime: `assets/art/story/story-0N-*.png` wired through `assetRegistry` boot group + `ContainmentScene` variants; status: material-review; human approval: required.

## Containment and environments

- **containment-vessel** — reference: `world1-opening-board-approved.png`; runtime: procedural vessel + breach ring in workshop kit; status: animation-review; human approval: required.
- **containment-crack** — runtime: emissive crack shards on glass gate + RN crack overlay on story breach/mission; status: animation-review; human approval: required.
- **containment-crack-escape** — runtime: `assets/art/world1/containment-crack-escape.png` (inside vessel looking out through fracture into lab); wired as workshop horizon plate + L1 HUD thumb via `world1.crackEscape`; status: material-review; human approval: required.
- **containment-kit** — runtime: upgraded workshop corridor (cyan/amber pylons, pulsing lamps, vessel silhouette, escape plate); status: animation-review; human approval: required.
- **city-rooftop-kit** — reference: `world-strip-approved.png` City/Sky crops; runtime: modular roof panels, vents, antennas and skyline layers; scale: gameplay corridor remains clear ±2m; origin: module base; children: wind cues/antenna lights; materials: shared rooftop/skyline atlas; collision: none; budget: ≤25k visible tris; fallback: current rooftop primitives; status: fallback; human approval: required.
- **world-horizon-plates** — reference: world strip crops; runtime: distant JPG/PNG only; size: 2048×1024 source, 1024 mobile variant; origin: environment horizon; children: none; materials: unlit; collision: none; budget: ≤700 KB each; fallback: procedural sky/stars; status: fallback; human approval: required.

## Gameplay obstacles

- **rotor-workshop** — runtime: amber-emissive rim/hub workshop fan; status: animation-review; human approval: required.
- **sliding-gate** — runtime: containmentGlass translucent panels + crack emissive; status: animation-review; human approval: required.
- **iris-aperture** — reference: obstacle guide iris/moving ring; runtime: procedural or GLB petals; scale: opening radius from `IrisConfig`; origin: aperture center; children: static ring, individually pivoted petals, emissive opening; materials: frame/petals/emissive; collision: `IrisObstacle`; budget: ≤10k tris; fallback: `createIrisVisual`; status: graybox-review; human approval: required.
- **shifting-aperture** — reference: obstacle guide moving ring/iris; runtime: iris contract plus translated parent; scale: `ShiftingApertureConfig`; origin: aperture center; children: petals and glow; materials: frame/emissive; collision: `ShiftingApertureObstacle`; budget: ≤10k tris; fallback: procedural aperture; status: fallback; human approval: required.
- **pendulum** — reference: obstacle guide pendulum; runtime: modular Three.js/GLB; scale: length/radius from config; origin: pivot housing center; children: arm and bob; materials: housing/arm/bob/emissive; collision: `PendulumObstacle`; budget: ≤6k tris; fallback: procedural pendulum; status: fallback; human approval: required.
- **moving-ring** — reference: obstacle guide moving destination/static ring; runtime: modular ring; scale: radius from config; origin: ring center; children: ring segments and non-colliding motion ghosts; materials: frame/emissive; collision: `MovingRingObstacle`; budget: ≤6k tris; fallback: procedural ring; status: fallback; human approval: required.
- **orbiter** — reference: obstacle guide orbiter; runtime: procedural ring plus independent bodies; scale: orbit/blocker radii from config; origin: orbit center; children: orbiting bodies and separate path VFX; materials: frame/body/emissive; collision: `OrbiterObstacle`; budget: ≤8k tris; fallback: procedural orbiter; status: fallback; human approval: required.
- **drifting-blocker** — reference: obstacle guide drifting blocker; runtime: 3 reusable debris variants; scale: blocker radius from config; origin: body center; children: none; materials: rock/emissive fissure; collision: `DriftingBlockerObstacle`; budget: ≤4k tris each; fallback: procedural blocker; status: fallback; human approval: required.
- **laser-grid** — runtime: two fixed pylons + planar beams with planar motion glow; status: animation-review; human approval: required.
- **phase-field** — reference: obstacle guide phase/energy fields; runtime: frame plus transparent shader plane; scale: field radius from config; origin: field center; children: frame and VFX plane; materials: metal/field shader; collision: `PhaseFieldObstacle`; budget: ≤5k tris, one transparent plane; fallback: procedural field; status: fallback; human approval: required.

## Destination and UI

- **jump-gate** — runtime: brighter cyan portal/frame; status: animation-review; human approval: required.
- **wordmark** — reference: all approved boards; runtime: transparent SVG plus PNG 1x/2x/3x; size: 1200×300 master; origin: visual center; children: mark and subtitle may separate; materials: n/a; collision: none; budget: ≤150 KB SVG; fallback: `BrandHero` text; status: fallback; human approval: required.
- **app-icon** — runtime: `assets/icon.png` (1024 Expo/iOS), `assets/android-icon.png`, adaptive FG/BG/mono 1024, favicon 48/32/16, splash-icon; masters in `assets/brand/app-icon-*.png`; status: material-review; human approval: required.
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
