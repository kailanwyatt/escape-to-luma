# SPARK local QA matrix

This checklist validates a working game build. Distribution, Expo builds,
Apple credentials and store submission are owner-controlled and intentionally
outside this checklist.

## Automated before device testing

- [ ] `npm run quality`
- [ ] `npx expo-doctor`
- [ ] `npm run build:web`
- [ ] Campaign audit reports 150 levels, 10 worlds and 10 obstacle families.

## Save and progression

- [ ] Fresh install hydrates before play controls become active.
- [ ] Rapidly tap Play; only one level starts.
- [ ] Force-quit immediately after a clear; reward and unlock persist once.
- [ ] Replay every world finale; no duplicate world reward or Spark unlock.
- [ ] Complete level 30; level 31 opens normally.
- [ ] Complete level 150; HOME completion appears and replay remains available.
- [ ] Load an older save, malformed nested values and a corrupt primary with valid backup.
- [ ] Simulate a failed write; diagnostics contain the failure.
- [ ] Play offline.

## Gameplay and first session

- [ ] Opening runs title → specimen → signal → failure → gameplay handoff.
- [ ] Skip works at every opening beat.
- [ ] Level 1 teaches drag; Level 2 teaches power; Level 3 is understandable without coaching.
- [ ] Levels 1–5 hide boosts.
- [ ] Tutorials do not obscure Spark, first obstacle or Jump Gate.
- [ ] Slow Field visuals, runtime collision and prediction stay synchronized.
- [ ] Manually clear Worlds 1–2 without boosts.
- [ ] Smoke-test every later obstacle family and each world finale.

## Lifecycle and accessibility

- [ ] Pause, restart and Home work from READY, AIMING and after failure.
- [ ] Background during aim, flight and results; foreground resumes safely.
- [ ] Sound off stays silent after foregrounding.
- [ ] System and in-app Reduce Motion stop decorative pulse/orbit/wind motion.
- [ ] VoiceOver labels opening Skip, play controls, settings and level actions.
- [ ] Test text/layout at default and large accessibility text.

## Device coverage

- [ ] Small notched iPhone portrait safe areas.
- [ ] Current baseline iPhone at 60 Hz.
- [ ] ProMotion iPhone at 120 Hz.
- [ ] Low Power Mode / 30 Hz stress pass.
- [ ] Twenty-minute Worlds 1–2 soak.

## Performance budgets

- [ ] Gameplay median ≥55 fps on baseline device; no repeated frame-time spikes during obstacle swaps.
- [ ] No sustained memory growth across 30 level swaps.
- [ ] Menu screens pause the GL render loop.
- [ ] Returning to play recreates audio/render activity without duplicate loops.
- [ ] App background pauses audio and GL work.
- [ ] Transparent VFX remain readable without filling the gameplay corridor.

## Visual acceptance

- [ ] Branded icon and splash render without clipping.
- [ ] Original Spark reads as layered living energy, not a plain ball.
- [ ] Jump Gate visible rings match scoring thresholds.
- [ ] Rotor, gate and laser openings match collision debug shapes.
- [ ] Wind and gravity wells are always visible when active.
- [ ] Containment and Rooftop remain distinct on a small screen.
- [ ] Procedural fallback appears for every unavailable authored asset.
