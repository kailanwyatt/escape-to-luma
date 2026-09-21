# Opening and first-three-level benchmark

## Changes in this pass

Capture approach now eases into docking before the 9.6-second closure cue. Shutters close by 11.1 seconds; a short dark fade fully covers the space-to-laboratory location cut at 12 seconds and clears by 12.85. The original 35-second sequence and handoff remain intact. Reduced motion uses stationary probe staging and retains the restrained location fade.

The opening has explicit Pause and Skip controls. Scene taps no longer skip the story. Paused gameplay rejects aiming input. Resume restores sound settings before the first resumed frame. Restart now handles active campaign attempts and opening replay, without restarting a completed/rewarded result. Retry resets the obstacle clock along with geometry so the first resumed frame cannot jump ahead in the old movement cycle.

Phone layout is retained before GL initialization and applied when the Game attaches. This prevents a phone from inadvertently using the default 390 × 844 touch mapping. Standard gates now use the same steel palette as the laboratory and have visible borders on their actual collision opening. Level 3 movement changes from amplitude .24 / speed .24 to .5 / .65, with opening size unchanged, so the first moving obstacle is visibly moving.

## Automated verification

`npm run quality`: typecheck, 47 tests and the 150-level campaign audit passed.

New tests exercise actual AimSystem, ProjectileSystem, obstacle crossing and target scoring for levels 1–3 at 30/60/120 FPS, launch waits 0/3/6 seconds, and five pull lengths. Each combination retains at least three successful pull lengths. Deliberately off-axis throws fail. Equivalent proportional drags on 320 × 568, 390 × 844 and 430 × 932 produce the same launch velocity. Tap, cancel and interrupted aim cannot launch. Choreography checks align docking/capture/transition times with the score.

This demonstrates a forgiving launch window, not player satisfaction, performance certification, or complete physical-device coverage.

## Browser playtest record

390 × 844 local development preview, using UI interactions rather than save/scene manipulation:

- Level 1: completed in the preceding pass; replay/handoff and exact glass boundary inspected.
- Level 2: intentional off-axis throw produced LEVEL FAILED / GATE A; Retry returned to L2 with 15 energy and unchanged shards. Controlled throw produced GREAT / +7 shards.
- Level 3: Next advanced to the moving-gate level; Pause → Restart returned to L3; controlled throw produced GREAT / +7 shards. Home displayed level 4 and 19 total shards (5 carried from earlier L1, plus 7 each for L2/L3).
- Opening Pause showed the existing pause overlay, keeping the cinematic controls hidden while paused. After remaining paused while the test record was written, Resume returned to the same Living Light beat rather than advancing through the sequence. Probe capture staging and the later laboratory/signal scene were inspected at phone dimensions.

## Physical iPhone checklist

The user confirmed an iPhone with Expo Go is available. Connect iPhone and Mac to the same Wi-Fi, then use the QR provided in the task. The Mac must keep the local development server running. No build or submission is involved.

Record iPhone model, iOS version, and any Expo Go error before evaluating gameplay. If the SDK is unsupported, report the error; do not silently upgrade dependencies or create a build.

1. Watch the opening once. Is Spark readable? Does the probe visibly capture it? Does the laboratory change feel deliberate? Do scan, closure, signal and alarm sounds match events?
2. Replay from Settings. Pause during capture, wait several seconds, resume, then skip. Check that sound stops while paused and resumes with the scene, and that skip leaves the gate and Spark visible.
3. Replay again and background Expo Go for five seconds during the opening. Return: no lost shot, no jump to the end, no duplicated sound. Repeat while aiming: the interrupted aim should cancel safely.
4. Play levels 1–3. Try a short pull, a longer pull, sideways aiming and returning to the touch start to cancel. Report unexpected throws or difficulty reading the gate/target.
5. Fail once, retry, pause and restart. Progress/rewards must change only after success. No energy should be lost under the current free-retry policy.
6. Enable Reduce Motion and replay. Probe/camera/effects should feel restrained; fracture fragments should be absent. Restore the preferred setting afterward.
7. Play for ten minutes. Report visible stutter, sound dropouts, touch lag and noticeable heat. Record when they happen rather than treating the browser test as a device-performance measurement.

Physical-device outcome: pending user feedback. Do not mark the benchmark approved until this record includes the observations.

## Final browser audio and replay check

Level 1 was also replayed and completed after the revised opening, scoring GREAT. It awarded +2 shards for improving the previous CLEAR rank, preserving the already-earned base reward. Opening Pause/Resume stayed on the same beat after a long pause.

The browser run exposed an Expo web audio promise rejection when playback was immediately interrupted. A small platform adapter now catches expected HTMLMediaElement AbortError on web; native playback still uses Expo Audio. Real playback refusals remain logged. Two tests cover interruption rejection handling and source release/refusal. New files: `src/feedback/ManagedAudioPlayer.ts`, `src/feedback/ManagedAudioPlayer.web.ts`, `tests/web-audio.test.ts`; updated `AudioManager.ts`.
