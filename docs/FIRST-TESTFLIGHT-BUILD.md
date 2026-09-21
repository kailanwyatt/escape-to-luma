# First TestFlight build handoff

Local cleanup completed; no EAS build, prebuild, export, upload or submission was run.

## Build manually

From `/Users/kurt/Documents/mobile-apps/ball-game-cs`:

```sh
npx eas-cli build --platform ios --profile testflight
```

`testflight` inherits the production store-distribution profile and automatic remote
build-number increments. It creates an iOS archive; it does not auto-submit it.
The CLI may ask you to log into Expo, link/create the EAS project and configure Apple
signing. The repository currently has no `extra.eas.projectId`; this is a first-run
account setup step. Use your intended Expo owner and Apple Developer team.
Bundle ID: `com.kurt.sparkescapetoluma`; app version: `0.1.0`.
Submit the successful archive to App Store Connect separately when you are ready.

## Upload contents

`.easignore` includes all existing Git exclusions plus docs, tests, dev galleries,
asset-generation scripts, reference/brand source art, Markdown briefs, temporary output
and credentials. These remain local; runtime code and referenced art/audio remain included.
The stale `dist/` web export was removed. Two unreferenced legacy UI components were
archived as text under `docs/archive/unused-ui/` (excluded from builds).

## Current limits

- Typecheck and local Expo config/dependency checks are available without building.
- Actual native compilation, signing and device performance require your first build.
- Six previously reproduced failures remain in campaign-balance, campaign-composition
  and ricochet tests; they are not caused by cleanup. This is a first device-test build,
  not a claim that full release QA passes.
- TestFlight disables developer unlocks, fake rewarded ads, fake purchases and tracking.
  Energy regenerates on its timer; shard refills remain available. Live paid packs/ads
  are not connected and should not be expected to work in this beta.
- Keep the bundle identifier stable after creating the App Store Connect app.

Docs: https://docs.expo.dev/build-reference/easignore/
