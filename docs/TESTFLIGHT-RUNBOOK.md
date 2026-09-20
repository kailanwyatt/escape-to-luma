# SPARK TestFlight runbook

## Local prerequisites

- Node 22.13.x (Expo SDK 57 minimum; Node 23 is unsupported)
- Xcode and an Apple Developer account
- Expo/EAS account with access to the project
- Bundle identifier: `com.kurt.sparkescapetoluma`

Confirm the bundle identifier matches the App Store Connect record before the
first upload. After an app record is created, changing it creates a different
app.

## Repository checks

```bash
npm ci
npm run typecheck
npx expo-doctor
npx expo install --check
npx expo config --type public
npx expo export --platform ios --output-dir /tmp/spark-ios-export
```

## First device build

```bash
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --platform ios --profile development
```

Install the development build on a physical iPhone and verify:

1. Cold launch and save hydration.
2. Home, opening, Level Ready and gameplay rendering.
3. Audio, haptics, portrait safe areas and background/foreground.
4. Force-quit after a clear and confirm progression survives.

## TestFlight candidate

```bash
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --profile production
```

The production profile is store distribution. An internal/ad-hoc build is not
the TestFlight artifact.

## TestFlight policy

- All 150 levels remain visible and playable.
- Landing, story, onboarding and Worlds 1–2 are the current polish focus.
- Simulated ads, purchases and tracking prompts are disabled.
- Core campaign play must work offline.

## External prerequisites

- App Store Connect app record and agreements.
- EAS project linkage (`extra.eas.projectId`) created by `eas build:configure`.
- Privacy answers based on the final dependencies and actual data behavior.
- Feedback contact, beta description and “What to Test” notes.
