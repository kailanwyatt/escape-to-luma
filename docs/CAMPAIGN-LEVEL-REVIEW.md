# Campaign layout and progression review

20 September 2026. The former later-world loops often repeated one layout with small speed/size increments. The campaign now applies authored spatial routes, different ring paths, crosswind direction, gate heights, pendulum lengths, drone direction, debris travel axes and paired-hazard order. Layouts remain stable across retries; the separately randomized encounter start remains in place.

The opening lessons retain their authored sequence. L5 adds a high offset shot. L16–149 receive distinct routes within each world. Later stages retain the original tightening/speed ramps, with modest additional portal precision above the established minimum. Paired challenges keep larger targets. L146/148/149 gain a second previously learned hazard; L150 remains a safe arrival. L103 uses a lower arc after the original higher route failed the physical corridor check.

Validation: typecheck, 75 tests and 150-level audit pass. The new layout test ignores identifiers, prose, phases, speed and basic aperture-size increments, and checks uniqueness within each world. Every course passes the existing deterministic physical-corridor validator. This does not measure human difficulty or guarantee every randomized phase has an immediate shot. Players may need to wait. Device playtests should measure attempts, completion time and skips across world boundaries before claiming a uniformly increasing difficulty curve. No Expo builds or publishing.

Visual limitation: scenery is still shared across many levels. This pass changes gameplay layouts, not 150 environment scenes.

Coordinates below are world-space: +X appears toward screen left. Wind is world-space acceleration; HUD arrows convert it to screen direction.

| Level | World | Hazards from near to far | Portal X, Y | Radius | Wind |
|---|---|---|---|---|---|
| 1 | containment | slidingGate | 0.00, 3.00 | 1.18 | 0.00 |
| 2 | containment | slidingGate | 0.30, 3.08 | 1.12 | 0.00 |
| 3 | containment | slidingGate | 0.00, 3.00 | 1.28 | 0.00 |
| 4 | containment | rotor | 0.00, 3.00 | 1.28 | 0.00 |
| 5 | containment | rotor | 0.30, 3.30 | 1.18 | 0.00 |
| 6 | containment | rotor | 0.00, 3.00 | 1.18 | 0.00 |
| 7 | containment | rotor | 0.00, 3.00 | 1.18 | 0.00 |
| 8 | containment | laserGrid | 0.00, 3.00 | 0.90 | 0.00 |
| 9 | containment | laserGrid | 0.00, 3.00 | 0.90 | 0.00 |
| 10 | containment | laserGrid | 0.00, 3.00 | 0.90 | 0.00 |
| 11 | containment | laserGrid | 0.00, 3.00 | 0.90 | 0.00 |
| 12 | containment | rotor → slidingGate | 0.00, 3.00 | 1.18 | 0.00 |
| 13 | containment | laserGrid → rotor | 0.00, 3.00 | 1.18 | 0.00 |
| 14 | containment | rotor → rotor | 0.00, 3.00 | 1.18 | 0.00 |
| 15 | containment | rotor → slidingGate | 0.00, 3.00 | 1.06 | 0.00 |
| 16 | city | slidingGate | 0.00, 3.00 | 0.86 | 0.10 |
| 17 | city | slidingGate | 0.00, 3.30 | 0.86 | 0.14 |
| 18 | city | slidingGate | 0.40, 3.00 | 0.85 | -0.16 |
| 19 | city | rotor → slidingGate | -0.40, 3.10 | 1.14 | 0.14 |
| 20 | city | slidingGate | 0.00, 2.70 | 0.84 | -0.20 |
| 21 | city | slidingGate | 0.50, 3.30 | 0.84 | 0.22 |
| 22 | city | slidingGate | -0.50, 2.80 | 0.83 | -0.24 |
| 23 | city | rotor → slidingGate | 0.25, 3.35 | 1.16 | 0.20 |
| 24 | city | slidingGate | -0.30, 3.25 | 0.83 | -0.26 |
| 25 | city | slidingGate | 0.55, 2.85 | 0.82 | 0.28 |
| 26 | city | rotor → slidingGate | -0.55, 3.00 | 1.16 | -0.24 |
| 27 | city | slidingGate | 0.35, 2.70 | 0.81 | 0.30 |
| 28 | city | rotor → slidingGate | -0.40, 3.40 | 1.16 | -0.26 |
| 29 | city | slidingGate | 0.60, 3.15 | 0.80 | 0.32 |
| 30 | city | slidingGate → rotor | -0.60, 2.90 | 1.02 | -0.34 |
| 31 | sky | movingRing (horizontal) | 0.00, 3.00 | 0.86 | 0.18 |
| 32 | sky | movingRing (vertical) | 0.00, 3.30 | 0.86 | 0.19 |
| 33 | sky | movingRing (ellipse) | 0.40, 3.00 | 0.85 | -0.20 |
| 34 | sky | movingRing (horizontal) | -0.40, 3.10 | 0.85 | 0.21 |
| 35 | sky | movingRing (vertical) | 0.00, 2.70 | 0.84 | -0.23 |
| 36 | sky | movingRing (ellipse) | 0.50, 3.30 | 0.84 | 0.24 |
| 37 | sky | movingRing (horizontal) | -0.50, 2.80 | 0.83 | -0.25 |
| 38 | sky | movingRing (vertical) → movingRing (vertical) | 0.25, 3.35 | 0.89 | 0.26 |
| 39 | sky | movingRing (ellipse) → movingRing (horizontal) | -0.30, 3.25 | 0.89 | -0.27 |
| 40 | sky | movingRing (ellipse) → movingRing (horizontal) | 0.55, 2.85 | 0.88 | 0.28 |
| 41 | sky | movingRing (ellipse) → movingRing (vertical) | -0.55, 3.00 | 0.88 | -0.29 |
| 42 | sky | movingRing (vertical) → rotor | 0.35, 2.70 | 1.16 | 0.31 |
| 43 | sky | rotor → movingRing (horizontal) | -0.40, 3.40 | 1.10 | -0.32 |
| 44 | sky | movingRing (ellipse) → rotor | 0.60, 3.15 | 1.16 | 0.33 |
| 45 | sky | rotor → movingRing (vertical) | -0.60, 2.90 | 1.16 | -0.34 |
| 46 | atmosphere | iris | 0.00, 3.00 | 0.82 | 0.00 |
| 47 | atmosphere | iris | 0.00, 3.30 | 0.82 | 0.00 |
| 48 | atmosphere | iris | 0.40, 3.00 | 0.81 | 0.00 |
| 49 | atmosphere | iris | -0.40, 3.10 | 0.81 | 0.00 |
| 50 | atmosphere | iris | 0.00, 2.70 | 0.80 | 0.00 |
| 51 | atmosphere | iris | 0.50, 3.30 | 0.80 | 0.00 |
| 52 | atmosphere | iris | -0.50, 2.80 | 0.79 | 0.00 |
| 53 | atmosphere | iris → iris | 0.25, 3.35 | 0.89 | 0.00 |
| 54 | atmosphere | iris → iris | -0.30, 3.25 | 0.89 | 0.00 |
| 55 | atmosphere | iris → iris | 0.55, 2.85 | 0.88 | 0.00 |
| 56 | atmosphere | iris → iris | -0.55, 3.00 | 0.88 | 0.00 |
| 57 | atmosphere | iris → slidingGate | 0.35, 2.70 | 0.88 | 0.00 |
| 58 | atmosphere | slidingGate → iris | -0.40, 3.40 | 0.88 | 0.00 |
| 59 | atmosphere | iris → slidingGate | 0.60, 3.15 | 0.88 | 0.00 |
| 60 | atmosphere | slidingGate → iris | -0.60, 2.90 | 0.88 | 0.00 |
| 61 | orbit | pendulum | 0.00, 3.00 | 0.82 | 0.00 |
| 62 | orbit | pendulum | 0.00, 3.30 | 0.82 | 0.00 |
| 63 | orbit | pendulum | 0.40, 3.00 | 0.81 | 0.00 |
| 64 | orbit | pendulum | -0.40, 3.10 | 0.81 | 0.00 |
| 65 | orbit | pendulum | 0.00, 2.70 | 0.80 | 0.00 |
| 66 | orbit | pendulum | 0.50, 3.30 | 0.80 | 0.00 |
| 67 | orbit | pendulum | -0.50, 2.80 | 0.79 | 0.00 |
| 68 | orbit | pendulum → pendulum | 0.25, 3.35 | 0.89 | 0.00 |
| 69 | orbit | pendulum → pendulum | -0.30, 3.25 | 0.89 | 0.00 |
| 70 | orbit | pendulum → pendulum | 0.55, 2.85 | 0.88 | 0.00 |
| 71 | orbit | pendulum → pendulum | -0.55, 3.00 | 0.88 | 0.00 |
| 72 | orbit | pendulum → movingRing (horizontal) | 0.35, 2.70 | 0.88 | 0.00 |
| 73 | orbit | pendulum → movingRing (vertical) | -0.40, 3.40 | 0.88 | 0.00 |
| 74 | orbit | pendulum → movingRing (ellipse) | 0.60, 3.15 | 0.88 | 0.00 |
| 75 | orbit | pendulum → movingRing (horizontal) | -0.60, 2.90 | 0.88 | 0.00 |
| 76 | moon | orbiter | 0.00, 3.00 | 0.82 | 0.00 |
| 77 | moon | orbiter | 0.00, 3.30 | 0.82 | 0.00 |
| 78 | moon | orbiter | 0.40, 3.00 | 0.81 | 0.00 |
| 79 | moon | orbiter | -0.40, 3.10 | 0.81 | 0.00 |
| 80 | moon | orbiter | 0.00, 2.70 | 0.80 | 0.00 |
| 81 | moon | orbiter | 0.50, 3.30 | 0.90 | 0.00 |
| 82 | moon | orbiter | -0.50, 2.80 | 0.89 | 0.00 |
| 83 | moon | orbiter → rotor | 0.25, 3.35 | 1.10 | 0.00 |
| 84 | moon | orbiter → rotor | -0.30, 3.25 | 1.16 | 0.00 |
| 85 | moon | rotor → orbiter | 0.55, 2.85 | 1.10 | 0.00 |
| 86 | moon | orbiter → rotor | -0.55, 3.00 | 1.16 | 0.00 |
| 87 | moon | orbiter → orbiter | 0.35, 2.70 | 0.88 | 0.00 |
| 88 | moon | orbiter → orbiter | -0.40, 3.40 | 0.88 | 0.00 |
| 89 | moon | orbiter → orbiter | 0.60, 3.15 | 0.88 | 0.00 |
| 90 | moon | orbiter → orbiter | -0.60, 2.90 | 0.88 | 0.00 |
| 91 | asteroid | driftingBlocker (lateral) → driftingBlocker (lateral) | 0.00, 3.00 | 0.92 | 0.00 |
| 92 | asteroid | driftingBlocker (climbing/diagonal) → driftingBlocker (climbing/diagonal) | 0.00, 3.30 | 0.92 | 0.00 |
| 93 | asteroid | driftingBlocker (climbing/diagonal) → driftingBlocker (climbing/diagonal) | 0.40, 3.00 | 0.91 | 0.00 |
| 94 | asteroid | driftingBlocker (lateral) → driftingBlocker (lateral) | -0.40, 3.10 | 0.91 | 0.00 |
| 95 | asteroid | driftingBlocker (climbing/diagonal) → driftingBlocker (climbing/diagonal) | 0.00, 2.70 | 0.90 | 0.00 |
| 96 | asteroid | driftingBlocker (climbing/diagonal) → driftingBlocker (climbing/diagonal) | 0.50, 3.30 | 0.90 | 0.00 |
| 97 | asteroid | driftingBlocker (lateral) → driftingBlocker (lateral) | -0.50, 2.80 | 0.89 | 0.00 |
| 98 | asteroid | driftingBlocker (climbing/diagonal) → driftingBlocker (climbing/diagonal) | 0.25, 3.35 | 0.89 | 0.00 |
| 99 | asteroid | driftingBlocker (climbing/diagonal) → driftingBlocker (climbing/diagonal) | -0.30, 3.25 | 0.89 | 0.00 |
| 100 | asteroid | driftingBlocker (lateral) → driftingBlocker (lateral) | 0.55, 2.85 | 0.88 | 0.00 |
| 101 | asteroid | driftingBlocker (climbing/diagonal) → driftingBlocker (climbing/diagonal) | -0.55, 3.00 | 0.88 | 0.00 |
| 102 | asteroid | driftingBlocker (climbing/diagonal) → movingRing (horizontal) | 0.35, 2.70 | 0.88 | 0.00 |
| 103 | asteroid | movingRing (vertical) → driftingBlocker (lateral) | -0.40, 3.05 | 0.88 | 0.00 |
| 104 | asteroid | driftingBlocker (climbing/diagonal) → movingRing (ellipse) | 0.60, 3.15 | 0.88 | 0.00 |
| 105 | asteroid | movingRing (horizontal) → driftingBlocker (climbing/diagonal) | -0.60, 2.90 | 0.88 | 0.00 |
| 106 | nebula | phaseField | 0.00, 3.00 | 0.78 | 0.00 |
| 107 | nebula | phaseField | 0.00, 3.30 | 0.78 | 0.00 |
| 108 | nebula | phaseField | 0.40, 3.00 | 0.78 | 0.00 |
| 109 | nebula | phaseField | -0.40, 3.10 | 0.78 | 0.00 |
| 110 | nebula | phaseField | 0.00, 2.70 | 0.78 | 0.00 |
| 111 | nebula | phaseField | 0.50, 3.30 | 0.78 | 0.00 |
| 112 | nebula | phaseField | -0.50, 2.80 | 0.78 | 0.00 |
| 113 | nebula | phaseField → iris | 0.25, 3.35 | 0.89 | 0.00 |
| 114 | nebula | phaseField → iris | -0.30, 3.25 | 0.89 | 0.00 |
| 115 | nebula | iris → phaseField | 0.55, 2.85 | 0.88 | 0.00 |
| 116 | nebula | phaseField → iris | -0.55, 3.00 | 0.88 | 0.00 |
| 117 | nebula | phaseField → phaseField | 0.35, 2.70 | 0.88 | 0.00 |
| 118 | nebula | phaseField → phaseField | -0.40, 3.40 | 0.88 | 0.00 |
| 119 | nebula | phaseField → phaseField | 0.60, 3.15 | 0.88 | 0.00 |
| 120 | nebula | phaseField → phaseField | -0.60, 2.90 | 0.88 | 0.00 |
| 121 | network | shiftingAperture | 0.00, 3.00 | 0.78 | 0.00 |
| 122 | network | shiftingAperture | 0.00, 3.30 | 0.78 | 0.00 |
| 123 | network | shiftingAperture | 0.40, 3.00 | 0.78 | 0.00 |
| 124 | network | shiftingAperture | -0.40, 3.10 | 0.78 | 0.00 |
| 125 | network | shiftingAperture | 0.00, 2.70 | 0.78 | 0.00 |
| 126 | network | shiftingAperture | 0.50, 3.30 | 0.78 | 0.00 |
| 127 | network | shiftingAperture | -0.50, 2.80 | 0.78 | 0.00 |
| 128 | network | shiftingAperture → phaseField | 0.25, 3.35 | 0.89 | 0.00 |
| 129 | network | shiftingAperture → phaseField | -0.30, 3.25 | 0.89 | 0.00 |
| 130 | network | phaseField → shiftingAperture | 0.55, 2.85 | 0.88 | 0.00 |
| 131 | network | shiftingAperture → phaseField | -0.55, 3.00 | 0.88 | 0.00 |
| 132 | network | shiftingAperture → shiftingAperture | 0.35, 2.70 | 0.88 | 0.00 |
| 133 | network | shiftingAperture → shiftingAperture | -0.40, 3.40 | 0.88 | 0.00 |
| 134 | network | shiftingAperture → shiftingAperture | 0.60, 3.15 | 0.88 | 0.00 |
| 135 | network | shiftingAperture → shiftingAperture | -0.60, 2.90 | 0.88 | 0.00 |
| 136 | homeward | rotor → movingRing (vertical) | 0.00, 3.00 | 1.16 | 0.00 |
| 137 | homeward | iris → pendulum | 0.00, 3.30 | 0.92 | 0.00 |
| 138 | homeward | slidingGate → orbiter | 0.40, 3.00 | 0.91 | 0.00 |
| 139 | homeward | phaseField → shiftingAperture | -0.40, 3.10 | 0.91 | 0.00 |
| 140 | homeward | driftingBlocker (climbing/diagonal) → driftingBlocker (climbing/diagonal) | 0.00, 2.70 | 0.90 | 0.00 |
| 141 | homeward | orbiter → iris | 0.50, 3.30 | 0.90 | 0.00 |
| 142 | homeward | movingRing (horizontal) → phaseField | -0.50, 2.80 | 0.89 | 0.00 |
| 143 | homeward | shiftingAperture → pendulum | 0.25, 3.35 | 0.89 | 0.00 |
| 144 | homeward | rotor → slidingGate | -0.30, 3.25 | 1.16 | -0.22 |
| 145 | homeward | driftingBlocker (lateral) → orbiter | 0.55, 2.85 | 0.88 | 0.00 |
| 146 | homeward | shiftingAperture → pendulum | -0.55, 3.00 | 0.88 | 0.00 |
| 147 | homeward | phaseField → movingRing (horizontal) | 0.35, 2.70 | 0.88 | 0.00 |
| 148 | homeward | iris → orbiter | -0.40, 3.40 | 0.88 | 0.00 |
| 149 | homeward | iris → orbiter | 0.60, 3.15 | 0.88 | 0.00 |
| 150 | homeward | Safe arrival | 0.00, 3.00 | 1.26 | 0.00 |
