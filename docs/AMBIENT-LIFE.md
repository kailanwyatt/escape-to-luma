# Ambient life

The decorative layer follows the existing game clock and never participates in collision or scoring.

- Sky cloud banks and Nebula volumes drift slowly.
- Space worlds have sparse, gently twinkling stars and occasional distant comets. Luma omits comets.
- Industrial locations have gently pulsing beacons and small maintenance craft outside the flight lane.
- Nebula and Ancient Network have drifting energy motes; Luma has distant living lights.

Reduced Motion fixes clouds and actors in place, keeps lights steady and hides comets. Pause and frozen story/results states stop the animation clock. Objects are reused across retries and disposed when worlds change; no runtime image downloads or new dependencies are required.

Implementation: `src/environment/AmbientLife.ts`, integrated through `EnvironmentManager.ts`; cloud markers live in `JourneyWorldScene.ts`. Local review is available through `dev/space-gallery.ts`. These are decorative animated actors, not interactive NPCs. Native device performance remains to be measured.

Validation: ambient tests cover frame-rate independence, zero-time freeze, Reduced Motion, bounded object counts, reuse and world switching.

City skyline windows use instanced colors. Each window follows a staggered seeded 18–46-second schedule, fading for two seconds between lit and dark states. Updates are capped at 10 Hz and freeze with the world clock; Reduced Motion keeps a static window pattern. No new textures or dependencies.
