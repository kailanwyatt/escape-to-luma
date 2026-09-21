# Spark — first TestFlight test round

Local evidence: typecheck, all 149 tests and the 150-level campaign audit passed. Completion screens were inspected in the browser at desktop and phone widths.

Status: local implementation and logic checks complete; native build and all device checks below are pending. No build or upload was run by Codex.

## Before inviting testers

Build manually using FIRST-TESTFLIGHT-BUILD.md. Use a real iPhone first, then an iPad if available. Record device model, iOS version and app version/build. Developer unlocks and simulated commerce are unavailable in TestFlight. Expo Go/browser saves do not establish TestFlight save behavior; treat the first install as a new player.

## Round A: first session (15–20 minutes)

- Fresh install: finish onboarding; watch the opening. Repeat via Settings and test Skip. Both must lead to the same playable L1.
- L1–5: aim, cancel, shoot, fail, retry. Read the first-escape story. Check text, safe areas, typewriter reveal and buttons on the smallest phone available.
- L8–9: distinguish laser core from glow; verify visible gaps are passable.
- L15: finish the world, read its departure story, see world progress and earned Shards, then the Reactor appearance. Continue into the City. Back out and verify the cosmetic is owned and can be equipped in Sparks.
- Pause while aiming and mid-flight; background for a minute. Resume without a lost shot, jump in obstacle timing or duplicate reward.
- Force-close after a completed level, reopen and verify progress, Shards, energy and equipped appearance.

## Round B: energy and shop

- After the tutorial, fail uncleared levels until energy is exhausted. Confirm the out-of-energy screen and timer.
- Reopen after 10 minutes: one energy should return, capped at 15. Test after several recharge intervals too.
- Buy a boost with Shards. Open Shop through the gameplay Boosts panel, buy and return to the same paused level.
- Select then cancel a boost: stock must not decrease. Launch: stock decreases once. Check Guidance, Slow Field, Portal Bloom and Second Chance separately.
- Live rewarded ads and paid packs are intentionally disabled in this beta. They must not grant simulated purchases/rewards or trap the user in a loading screen. Recharge and Shard refills remain available.

## Round C: progression and visuals (as levels are reached)

Prioritize L24/27 (alternating doors), L44 (moving rings), L48/55/87 (ricochets), L68 (Orbit), L78/86 (Moon), L94/101 (asteroids), L113/118 (phase columns), L127/133 (maze combinations), and L146/148 (three-gate tunnels).

For each: note attempts to clear; whether the obstacle was understandable without guessing; misleading collision edges; repeated winning gestures; stutter/heat after 10 minutes. The automated corridor check is a bounded geometric/timing screen, not proof that every route is comfortable with touch input.

Use existing local developer unlocks for an early look at late levels, but repeat native checks after reaching them in TestFlight. Do not reset your main save just to repeat a reward.

## Round D: Home and Endless Voyage

- On the first L150 clear, see the story, world reward, Origin appearance and reunion screen. Explore Endless Voyage directly, or return Home and use Voyage.
- Replay cleared campaign levels, including L150: no forced ending and no repeated world/cosmetic reward.
- Start Voyage: three hearts, no campaign-energy cost, generated challenges and a visible next milestone.
- Clear 8 challenges: total earned Shards should be 24 (2 per clear plus 8 at the milestone). Next milestone should be 16. After 16 clears the total should be 48.
- Miss three times: run ends. Review score, XP and banked Shards. Open Home/Stats, return and restart: no duplicate XP or Shards.
- End a run early via Pause → Home: earned Shards, XP and records remain. Empty runs should not count. A fresh run starts with three hearts and zero run score.
- Shards save as they are earned; XP/records save on normal exit or run end. Abruptly terminating an active run can lose that unfinished run's XP/record progress.

## Feedback to return

For each issue: build/device, level or screen, exact actions, expected vs actual, screenshot or short recording, repeatability (e.g. 3/3 attempts). Categorize as blocker, gameplay, visual or preference.

Do not expand tester access until launch, saving, purchase-disabled states, energy recovery and pause/resume have passed. Crash, lost progress, repeated rewards or an unplayable route block the next round.
