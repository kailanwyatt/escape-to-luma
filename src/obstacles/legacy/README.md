# Obstacle visual archives

Flip the presentation switch while curating. Collision and prediction always use state modules.

### Pistons (`PISTON_VISUAL_VARIANT` in `../PistonVisualVariant.ts`)

| Value | Module |
|-------|--------|
| `cinematic` (default) | `../CinematicPistonArt.ts` — curation / showcase pass |
| `legacy-cinematic` | `CinematicPistonArtV1.ts` — previous metallic prototype |
| `basic` | `PistonFieldArtBasic.ts` — original MeshBasic boxes |

### Reactive Gate (`GATE_VISUAL_VARIANT` in `../GateVisualVariant.ts`)

| Value | Module |
|-------|--------|
| `cinematic` (default) | `../ContainmentGateArt.ts` — curation pass |
| `legacy` | `ContainmentGateArtV1.ts` — previous facility door |

### Split Shutter (`SHUTTER_VISUAL_VARIANT` in `../ShutterVisualVariant.ts`)

| Value | Module |
|-------|--------|
| `cinematic` (default) | `../FacilityShutterArt.ts` — curation pass |
| `legacy` | `FacilityShutterArtV1.ts` — previous layered leaves |

### Elevator Blocks (`ELEVATOR_VISUAL_VARIANT` in `../ElevatorVisualVariant.ts`)

| Value | Module |
|-------|--------|
| `cinematic` (default) | `../FacilityElevatorArt.ts` — curation pass |
| `legacy` | `FacilityElevatorArtV1.ts` — previous carriages |

### Retrieval Scanner (`CLOCK_VISUAL_VARIANT` in `../ClockVisualVariant.ts`)

| Value | Module |
|-------|--------|
| `cinematic` (default) | `../FacilityClockArt.ts` |
| `legacy` | `FacilityClockArtV1.ts` |

### Patrol Drones (`DRONE_VISUAL_VARIANT` in `../DroneVisualVariant.ts`)

| Value | Module |
|-------|--------|
| `cinematic` (default) | `../CaptureDroneArt.ts` |
| `legacy` | `CaptureDroneArtV1.ts` |

### Rapid Shutter (`RAPID_SHUTTER_VISUAL_VARIANT` in `../RapidShutterVisualVariant.ts`)

| Value | Module |
|-------|--------|
| `cinematic` (default) | `../RapidShutterVisual.ts` |
| `legacy` | `RapidShutterVisualV1.ts` |

### Capture Pincers (`SCISSOR_VISUAL_VARIANT` in `../ScissorVisualVariant.ts`)

| Value | Module |
|-------|--------|
| `cinematic` (default) | `../FacilityScissorArt.ts` |
| `legacy` | capsule path in `LibraryWorldArt` |

### Pulse Ring (`PULSE_RING_VISUAL_VARIANT` in `../PulseRingVisualVariant.ts`)

| Value | Module |
|-------|--------|
| `cinematic` (default) | `../CinematicPulseRingArt.ts` |
| `legacy` | flat ring path in `LibraryPriorityArt` |

### Rolling Aperture (`ROLLING_APERTURE_VISUAL_VARIANT` in `../RollingApertureVisualVariant.ts`)

| Value | Module |
|-------|--------|
| `cinematic` (default) | `../CinematicRollingApertureArt.ts` |
| `legacy` | field shader path in `LibraryPriorityArt` |

### Climb Ring (`RING_VISUAL_VARIANT` in `../RingVisualVariant.ts`)

| Value | Module |
|-------|--------|
| `cinematic` (default) | `../AirborneGateVisual.ts` FacilityArtKit path |
| `legacy` | Phong airborne gate |

### Iris / Airlock (`IRIS_VISUAL_VARIANT` in `../IrisVisualVariant.ts`)

| Value | Module |
|-------|--------|
| `cinematic` (default) | FacilityArtKit iris / orbital iris |
| `legacy` | Lambert / Phong petals |
