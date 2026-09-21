# New encounters — phone test round

Implemented September 20, 2026. First implementation; phone readability and difficulty tuning are pending. No changes to mid-flight controls, level IDs, rewards, or saved progression. No Expo builds or submissions.

| Encounter | Start here | Follow-up levels | Watch for |
|---|---:|---|---|
| Alternating Doors | 22 | 24 | Two lanes, visible retraction, amber warning, arrival timing |
| Gravity Slingshot | 78 | 83 | Attraction around a solid lunar fragment; curved aim guide |
| Asteroid Conveyor | 92 | 95, 99 | Lateral gaps, offset destination, opposing streams at two depths |
| Expanding Debris | 96 | 102 | Central corridor opens as fragments expand; two clusters later |
| Phase Columns | 108 | 113 | Filled purple columns block; dim outlines pass; amber return warning |
| Rotating Maze | 123 | 127 | Off-center amber aperture; opposing plates in the follow-up |
| Sequential Tunnel | 129 | 142 | Three independently colliding planes with staggered opening times |

Use Settings’ development unlock and Journey level selection. Reload the app first. Test without boosts initially. Each changed level has a one-time introduction and an in-level hint.

For each level report attempts to clear, whether the safe path is obvious, any invisible/incorrect collisions, whether repeating one unchanged shot works too reliably, and stutter on the phone. Keep the first round brief; balance changes follow feedback.

Implementation: FormationState is the common motion/collision sampler; FormationObstacle renders it. NewEncounters selects the campaign courses and introductory text. Sequential Tunnel extends the existing obstacle slots and shot prediction to three planes. Slingshot uses the existing force integrator and gravity-field visuals. New formations are authored campaign encounters; the random Endless generator is unchanged.
