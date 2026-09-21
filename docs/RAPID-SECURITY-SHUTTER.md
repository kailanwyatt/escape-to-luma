# Rapid security shutter

City L16–30 now use an authored shutter progression. L16 combines the world introduction with the new timing cues; later lesson cards introduce vertical shutters, double pulses, paired crossings, fakeouts and asymmetry. Other worlds retain their existing gate behavior.

Progression: L16 forgiving introduction; L17–20 narrower/shorter windows; L21–22 vertical shutters and wind; L23 double pulse; L24 vertical timing; L25 rotor + shutter; L26 two horizontal shutters; L27 horizontal + vertical shutters; L28 taught fakeout + rotor; L29 asymmetry; L30 rotor + double-pulse escape. `CityShutterProgression.ts` applies this after generic campaign balancing so the authored patterns remain intact.

The shared gateStateAtTime function drives panel bounds, exact interpolated crossing-time collision and future trajectory evaluation. The encounter clock supplies the starting phase; the subsequent sequence is deterministic. Defaults: closed .45s, opening .35s, open .70s, warning .20s, slam .20s. Opening uses ease-out cubic; closing uses ease-in cubic.

Configuration lives on SlidingGateConfig.movementMode and .shutter. Supported patterns: standard, quickWindow, longTease, doublePulse, fakeout, asymmetric. Vertical shutters share the same behavior. maxOpeningWidth controls travel-axis aperture size; vertical defaults to openingHeight. Timing values and minimum opening are configurable. Asymmetric delays the right side by .08s. Other world visual variant names are reserved; only the City industrial presentation is finished.

Fixed housings cover retracted thin panels. Chevrons switch direction. Warning is amber; closing is red with a short impact afterglow. No camera shake, flashing strobe or additional haptics are introduced. Existing gate-hit and geometric close-call feedback is retained. onShutterEvent exposes phase-entry audio hooks; no new audio assets or haptic wiring are included. Hooks fire on observed transitions, not every frame; skipped phases during large clock jumps do not replay a backlog of sounds.

Local developer review at localhost:8786 includes pattern selection, vertical toggle, pause, phase stepping and live state/opening/time-until-slam readout. The existing trajectory diagnostics provide predicted crossing and clear/blocked feedback. Developer controls do not alter campaign definitions or saved progress.

Validation: timing/easing, exact collision vs future prediction, closed blocking, close calls, fixed housing and panel bounds, pattern bounds, event repetition, legacy compatibility; full quality checks and campaign input simulation. Automated input search validates reachable examples, not human difficulty or native-device performance. Human difficulty and native performance still need device playtesting. Current validation: 116 tests, 150-level audit and 450 sampled input checks pass.
