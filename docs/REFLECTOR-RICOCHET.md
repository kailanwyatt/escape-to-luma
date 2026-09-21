# Reflector / ricochet implementation

20 September 2026. One reflector behavior, seven lightweight visual representations. No physics engine, Expo build/export or publishing.

## Campaign and story

The previously shared arrival acknowledgement could suppress mechanic instructions. New mechanic acknowledgements are stored separately in the existing `seenStoryIds`. An unread iris lesson can appear on L46 even if `arrival.level-46` is already seen, or on a later iris encounter. World cards include the relevant instructions and acknowledge them together. Ricochet, moving panels and double bounce have their own lesson IDs. Existing saved progression and rewards remain intact.

| Levels | Purpose |
|---|---|
| 48 | Large stationary satellite panel; complete guide |
| 50 | Different panel angle; complete guide |
| 52 | Smaller stationary reflective face |
| 55 | Slowly translating reflector; future impact position |
| 58 | Bank around a blocker covering the direct route |
| 65 | Orbit reflector and blocker |
| 78 | First two-reflector route; complete guide |
| 87 | A second two-bounce route |
| 95 / 110 / 125 / 140 | Crystal, energy crystal, ancient and Luma presentations |

Other World 4 levels retain the iris mechanic. L150 remains the safe arrival. Exactly 12 existing level definitions receive ricochet courses; IDs/checkpoints are unchanged.

## Concrete data contract

`ChallengeConfig.ricochet` is optional. Normal levels omit it.

```ts
ricochet: {
  maxBounces: 1,          // 1 or 2; hard runtime cap of 2
  requiredBounces: 1,     // must bank before scoring the gate
  fullGuide: true,        // tutorial assistance; Guidance always shows full path
  reflectors: [{
    id: 'satellite-a',
    position: { x: 2.48, y: 2.91, z: 8.44 },
    normal: { x: -0.9798, y: 0, z: -0.2 },
    width: 2.4, height: 2.6,
    active: true,
    visualVariant: 'satelliteReflector',
    // Optional existing MovementConfig: none / horizontal / vertical.
    movement: { type: 'horizontal', amplitude: 0.18, speed: 0.4, phase: 0 },
  }],
}
```

Normals point out of the marked face. They are normalized by the common pose routine. Dimensions are local to that plane. Position/movement use the game simulation clock, frozen during story and pause. Ping-pong is deferred; only the existing static/horizontal/vertical movement vocabulary is implemented.

World defaults live in `ReflectorConfig.ts`; explicit appearances override them. Seven variants share the same front face: satellite, solar array, lunar dish, crystal, energy crystal, ancient mirror and Luma surface. The active dish/crystal face remains planar. The solid backing/bracing fits inside the configured footprint and a 0.35-deep backing volume.

## Shared simulation

`Reflection.ts` owns normalized vector reflection, swept contact, future panel position, bounds/backing checks, separation and the bounce cap. Speed multiplier is exactly 1.0. Only the marked front interior reflects; the rim, rear and support footprint fail. Other surfaces do not become reflective.

`stepRicochet` is called by live flight and `traceRicochet`. Segment callbacks check existing obstacles before and after each contact, including reversed-Z segments. Reflected flight uses a 1/120 fixed step independent of render FPS. Ordinary non-reflector integration is unchanged. The live rotor sampling is deferred until reflected segments have been checked at their impact times; predictor uses the existing obstacle prediction API. Portal scoring still goes through `scoreTarget` and the existing game result/reward path.

Prediction is capped at the existing four-second flight timeout and two bounces. It includes contact diamonds, a sampled incoming/outgoing path and gate intersection. The first single/double lessons and Guidance show the full path; later normal assistance ends shortly after the first bounce. The path uses a fixed buffer; live preview refresh is limited to 30 Hz for an unchanged aim. Existing particles/trails and light haptic feedback are reused. A 0.15-second locally synthesized ricochet sound has its own audio event and provenance file.

Developer visuals include panel orientation normals plus predicted incoming/normal/outgoing vectors, contact markers and bounce count beside the portal prediction. Existing development gating remains in force.

## Review and checks

Run `node scripts/serve-ricochet-gallery.cjs`; open http://localhost:8785. This standalone localhost review uses the actual gameplay camera, AimSystem, reflection functions, obstacle classes and portal scoring. It does not unlock levels or write saves. Controls cover lessons, all seven appearances, small angle adjustments, static/horizontal/vertical motion and normals. Demo throw uses an actual authored drag. Arbitrary gallery overrides are not guaranteed to produce a solvable course.

Course data is checked in as JSON. `scripts/generate-ricochet-courses.ts` derives those static layouts from a reproducible real drag and the shared simulator; it is an authoring tool, not runtime auto-aim. Runtime never retargets the portal to the player's shot.

Local visual review completed single, moving and double bounce with PERFECT results. Tests cover vector/speed reflection, misses, backing and side hits, future moving-panel positions, frame-rate agreement, third-contact termination, obstacle hits before/after reflection, Guidance and story recovery. The campaign audit checks every authored route with reflector-aware physical simulation. Native frame time, iPhone visual contrast, sound/haptic feel and full application lifecycle still need physical-device review; the standalone scene does not establish those results. No external builds or submissions.
