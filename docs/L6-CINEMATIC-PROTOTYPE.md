# L6 cinematic piston — one-model checkpoint

## Approved materials-and-lighting follow-up

The user approved the construction for this next pass. The single prototype now has mesh-attached procedural surface variation: rough graphite armor, chipped bevel highlights, longitudinal brushed steel and oil-darkened sliding ends. A cooler key / warm side reflection map increases material contrast without changing the scene's lights. The amber lens has a bright optical core and darker edges instead of uniform orange fill.

A soft transparent contact-occlusion patch sits below the collision floor beneath the socket. This is a local shading approximation, **not** a new physical object or a real-time cast-shadow system. No global shadow maps, postprocessing, new lights or camera changes were introduced. The three comparison pistons are unchanged.

- [Updated material detail](visual-review/l6-cinematic-prototype/materials-detail.jpg)
- [Updated phone-sized gameplay](visual-review/l6-cinematic-prototype/materials-gameplay.jpg)
- 13 focused tests pass, including new checks for contact shading placement and texture disposal. In-browser shader compilation produced no reported errors. Typecheck still has only the two previously reported campaign union errors.
- Native GPU cost has not been measured. Procedural finish noise adds fragment-shader work; the full array has deliberately not been expanded yet. Floor/environment artwork and real cast shadows remain outside this one-model pass.

This follow-up modifies only CinematicPistonArt.ts, its test, this report, and adds the two new screenshots. The earlier checkpoint below is retained as history, and its screenshot links are not overwritten.

## Previous construction checkpoint

This is the first in-engine model following approval of the cinematic concept, not a claim that the concept's final quality has been reached. The other three pistons and facility lighting remain unchanged for comparison.

## Implemented

- One piston (second from the right in the gameplay view) uses actual bevelled geometry, a shallow convex brushed-steel face, layered armor, sliding sleeves, bolts, a recessed amber lens and a below-floor socket.
- Lit metallic materials use a local procedural reflection texture and fine surface grain. No scene-wide lighting, renderer, camera or gameplay changes.
- The full opaque rectangular body still matches the authoritative lane width, floor and tip. All visible mechanical details stay within that X/Y silhouette except the explicitly below-floor socket. Extra Z depth is visual, not a new collision volume.
- Geometry, textures and materials are created once and disposed with the obstacle; animation consumes the same lane state as the existing art.
- Temporary look-development selection uses L6's existing z=5.8, four-lane signature, lane index 1. It is not a schema addition or a final general-purpose art-selection API. Other configs sharing that exact signature would also receive the prototype.

## Evidence

- [Gameplay comparison](visual-review/l6-cinematic-prototype/gameplay.jpg)
- [Actual rendered detail](visual-review/l6-cinematic-prototype/detail.jpg): a higher-resolution crop using the same gameplay camera, not concept art and not a separate perspective camera.
- 12 focused tests passed. The new test samples a full movement cycle and verifies floor/top/width bounds, detail bounds, retained geometry and disposal.
- Typecheck still reports the two pre-existing LevelComposition.ts centerX/centerY union errors. No new type errors were reported.
- Browser-only visual review. No physical-device performance or Original/no-Boost clearance certification.

## Remaining before the full array

The current result is cleaner and less weathered than the approved target. The target also includes richer local shadows, a substantially more detailed floor and scene-wide atmospheric lighting. Those have not been recreated by this one-model checkpoint. Review the actual model before extending its treatment to the other three rams. Do not mistake a rendered concept for achievable, measured mobile runtime quality.

Files: src/obstacles/CinematicPistonArt.ts (new), src/obstacles/LibraryPriorityArt.ts (prototype integration), tests/cinematic-piston-art.test.ts (new), this report and its two screenshots. Existing unrelated work was preserved. No collision, physics, timing, prediction, save, economy or level configuration changes.
