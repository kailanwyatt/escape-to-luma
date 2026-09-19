# Prototype 0.6 Playtest

Observations from code-path review, generator simulation, and device-unavailable local verification. Not a substitute for on-device arcade sessions.

## CONTROLS

- Drag-aim, cancel hysteresis, and launch path are unchanged from the validated 0.5 systems.
- Release still writes velocity and starts integration in the same function; HUD emit happens after the projectile is already moving.
- Cancel is taught only after the first throw, and only when the finger is in the cancel radius.
- High/low/horizontal aim exponents were left in place; no aiming redesign.

## READABILITY

- Player trajectory remains ~35% of the flight. Debug mode stretches the same dots to 100% and keeps the existing full-path overlay.
- Shared trail is short and pooled. Void Ball was lightened (purple + bright trail) so it does not disappear in Space.
- Workshop/Rooftop/Space now share floor reference stripes or light strips plus one key/fill/ambient lighting setup.
- HUD in production shows hearts, score, streak, and a quiet environment label. Shot index and debug names stay behind the debug toggle.

## COLLISION TRUST

- Collision functions were not rewritten. Debug collision visualization remains and is `__DEV__`-gated from the production HUD.
- 120 generated challenges (seed 20260919): 0 validator failures, legal combinations, min target radius respected.
- Known leftover: a fully shut iris at r=0.3 can still be a near-miss because the ball radius is 0.22. Visible vs collision still match; the opening is simply large enough.

## DIFFICULTY

- Opening shots stay single-obstacle and easy.
- Dual-obstacle templates appear in the higher difficulty bands (~7–10).
- Environment cycle over 120 shots: 40 workshop / 40 rooftop / 40 space.

## FEEDBACK

- HIT / GREAT / BULLSEYE / PERFECT now scale pulse, particles, haptics, and audio.
- PERFECT keeps a 0.20s time-scale dip. Ordinary HIT does not.
- Close Call is a short chirp, light haptic, text, and trail flare during flight.
- Obstacle hits use impact audio (pitch-varied collision sample), sparks, camera impulse, and deflection.
- Target miss is quieter and uses the faster miss reset.

## UI

- Safe-area padding on HUD, home, and settings.
- PLAY remains the dominant home action. SETTINGS is a tertiary text link.
- Run Over keeps TRY AGAIN as the primary button; bullseyes/perfects/close calls are secondary type.
- Onboarding: shot 1 `DRAG TO AIM`, shot 2 `TIME THE OPENING`, then persisted off.

## AUDIO

- Central `AudioManager` with expo-audio players and a priority filter (Perfect > collision > level-up > close call > UI).
- Procedural WAV set covers the required event list; obstacle families share one collision sample.
- Sound can be muted in Settings; missing assets warn once.

## PERFORMANCE

- Trails and particles use fixed pools.
- HUD is still event-emitted, not per frame.
- No on-device 60 FPS capture this pass (no simulator attached). 120-challenge generation completed without generator errors.

## PROGRESSION

- XP, levels, unlocks, and save v1 fields still migrate into save version 2.
- New fields: `settings`, `hasCompletedOnboarding`. Corrupt JSON loads defaults and logs once; it does not rewrite storage until the next successful save.

## REPETITION

- Run themes and environment weighting from 0.5 are unchanged.
- After several simulated ~30-shot runs, the arcade loop (throw → clear → forward push → TRY AGAIN) is still the retention path. Polish does not add new content variety.
