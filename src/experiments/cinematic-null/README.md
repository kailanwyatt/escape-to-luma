# The Null cinematic study

Run the existing asset-review server and open `/null`.

This standalone Three.js study has a 36-second sequence, individual looping
studies, Current / Redesigned / Compare modes, a comparison divider, portrait
framing, a scrubber and reduced motion. Both versions use one camera and clock.
The current reference imports the production Null Lash, The Null, Null presence,
chapter dressing and nebula backdrop. It is art shown through a review camera,
not a recording of the complete game renderer or HUD.

The redesign adds a procedural nebula, eclipsed body and corona, inward-moving
starlight, instanced debris, a continuous deformed lash, and a sculpted annulus
around a real open passage. Its aperture uses `theNullSafeAtTime` unchanged.
The lash uses the authored timing, with an art-only continuous recovery curve.
Its curled silhouette is a concept and requires collision review before use in
gameplay. No production imports this directory; rewards, saves and levels are
untouched. The reference scene's backdrop loader is installed only by the demo.

Quality scales drawing resolution, with a lower fill budget in comparison mode.
Hidden tabs stop time progression and rendering. Reduced motion freezes camera,
particles and sculpture poses. Disposal releases both renderers and their passes.

The approved design is now integrated through `CinematicNullArt`,
`NullPresenceArt`, and `GameplayCinematicGrade`. The production lash shares its
curve with collision sampling and fixes the recovery discontinuity. Production
continues to avoid imports from this experiment directory. The original study
remains available as development history.
