# Obstacle polish: first four families

Historical first-pass report. The expanded 23-family implementation and actual browser screenshots are now documented in [Obstacle visual review](OBSTACLE-VISUAL-REVIEW.md). Its verification results supersede the limitations and next-pass list below; this original record is preserved for context.

Implemented presentation-only geometry in LibraryPriorityArt.ts, attached through LibraryObstacle.ts. Existing state/collision/prediction methods, configuration, levels, saves and economy are unchanged by this pass. Other working-tree changes belong to the ongoing mechanics work.

| Level / family | Before | After |
|---|---|---|
| L6 Piston Field | Floor pads and translucent rectangular rams | Floor sockets below the authoritative floor line, opaque full-width steel bodies, narrow polished shaft faces, caps and inset travel lamps. Solid bodies remain visible even when retracted. |
| L10 Reactive Gate | Flat tinted panels | Opaque capture doors, inset armor and lamps: closed coral, warning amber, open cyan. Panels remain visibly dangerous when the center gap is open. |
| L40 Pulse Ring | Twelve separated boxes | Continuous annulus at state radius ± thickness with a narrow electrical highlight; clear center and no apparent gaps between segments. |
| L47 Rolling Aperture | Ten disconnected rim boxes | Continuous barrier across the visible corridor with a genuine circular hole at the state radius and a thin luminous inner edge. No apparent safe bypass outside the rim. |

Geometry buffers are reused during animation; no per-frame geometry/material construction. Disposal runs on hide/reconfiguration. Mesh dimensions and colors use the same state time passed to the existing renderer. No aim-time snapshots or new clocks.

Validation: 14 tests pass across library-priority-art, new-obstacles and library-encounters. New geometry tests compare floor/top bounds, gate gap/state colors and continuous ring radii with state samples, plus cleanup. Project typecheck remains blocked by existing LevelComposition.ts lines 41–42 assigning centerX/centerY to a broad ObstacleConfig union. Cursor owns that typing fix. No browser/physical-device visual acceptance was performed in this pass; lighting/composition and phone readability still need visual review.

No mechanics change was needed for these four visual updates. Preserve the existing pulse-ring guaranteed-hub exception; its exact collision semantics are not redefined by art. The aperture barrier uses a finite 40-unit outer radius to cover the visible corridor; its collision remains the existing outside-hole plane.

Files: src/obstacles/LibraryPriorityArt.ts (new), src/obstacles/LibraryObstacle.ts (render delegation), tests/library-priority-art.test.ts (new), this report.

Next visual passes: Corkscrew; drones/pincers/clock unit; portal telegraphs; remaining space families and Journey motifs. This report does not claim those families are polished.
