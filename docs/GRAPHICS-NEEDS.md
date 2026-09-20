# SPARK — Graphics Needs Brief

**Status:** Prototype art only (procedural Three.js primitives + RN text UI)  
**In-app:** Home → **GRAPHICS NEEDS**  
**Source of truth in code:** `src/graphics/graphicsNeeds.ts`  
**Copy this doc** for artists, producers, or freelancers.

---

## 1. Art direction (one paragraph)

**SPARK** is a **campaign-driven precision throw** game. The player guides a **living energy Spark** from underground containment across city, sky, and deep space to **get home**. Visuals should feel industrial → atmospheric → cosmic, always **readable at a glance**. Silhouette and opening clarity beat detail. Never decorate over the play corridor. Spark is alive (pulse, trail, emissive) — not a toy ball with a face. Palette anchors: ink `#050B15`, cream `#F4EFE6`, amber `#FFB800`, copper `#FF8A00`, cyan `#00CCFF`, heart `#FF5D6C`, energy `#FFD54A`, shard `#7EF0FF`.

---

## 2. What exists today (prototype)

| Layer | Current state |
| --- | --- |
| 3D environments | Hand-built boxes/planes (Workshop, Rooftop, Space) — 10 story worlds share these 3 tech sets |
| Obstacles | Primitives: rotor, gate, iris, pendulum, ring, **orbiter, drift, phase field, shifting aperture** |
| Jump Gate / target | Flat concentric scoring discs |
| Spark | Colored Phong spheres + sphere-node trails |
| Particles | Tiny colored spheres |
| Campaign UI | Journey list, Level Ready, Shop, Sparks, Out of Energy — text/views only |
| HUD | RN text; Endless hearts = ♥ glyphs; campaign energy = numbers |
| Brand / store | Expo default `icon.png` / splash / favicon |
| Textures / GLB | **None** |
| Custom fonts | **None** (system) |

Audio WAVs under `assets/sfx/` — out of scope for this graphics brief.

---

## 3. Priority legend

| Priority | Meaning |
| --- | --- |
| **P0** | Ship blockers for a “real game” look / store listing / campaign readability |
| **P1** | Strong polish; do after P0 |
| **P2** | Nice-to-have / can stay procedural longer |

**Counts:** P0 **22** · P1 **23** · P2 **7** · **52** items total

---

## 4. Deliverables checklist (copyable)

### Store & launch — P0
- [ ] **App icon** — 1024×1024 SPARK mark; Android adaptive FG/BG/mono
- [ ] **Splash / launch** — centered mark on `#1a1612`

### Brand — P0
- [ ] **SPARK wordmark** — SVG + PNG @1x/@2x/@3x (+ optional monogram)

### Campaign & meta
- [ ] **P0 Journey map chrome** — world nodes + path to HOME (locked / unlocked / complete)
- [ ] **P0 Energy pip** — filled + empty cells (campaign)
- [ ] **P0 Shard currency icon** — small crystalline mark
- [ ] **P1 Home Signal meter** — faint → home glyph set
- [ ] **P1 Level Ready / Jump Gate card** — briefing frame + boost slots
- [ ] **P1 Boost icons** — Guidance / Slow Field / Second Chance
- [ ] **P1 Out of Energy art** — soft empty-cell illustration
- [ ] **P1 World complete / Spark unlock stamp**
- [ ] **P1 HOME finale stills** — final gate + “SPARK MADE IT HOME” title card
- [ ] **P2 False Home (Nebula) cue** — wrong warm glow vs true HOME

### Menus & UI
- [ ] **P0 Spark select portraits** — ~14–15 skins (256–512 transparent PNG)
- [ ] **P1 Home backdrop** — containment / Jump Gate still or branded energy gradient
- [ ] **P1 Menu button frames** — Continue / Journey primary + secondary
- [ ] **P1 UI typefaces** — 1 display + 1 condensed UI via expo-font
- [ ] **P2 Trail select thumbs** — 6 trail previews
- [ ] **P2 Remove Ads / IAP badge**

### In-run HUD
- [ ] **P0 Endless hearts** — filled + empty (Endless Voyage only)
- [ ] **P1 Result callouts** — CLEAR / GREAT / BULLSEYE / PERFECT stamp frames
- [ ] **P1 Close Call mark**
- [ ] **P1 Keep Going? panel** — Endless continue offer
- [ ] **P2 XP / mastery chrome**

### Sparks (cosmetic only — same collision radius)
- [ ] **P0 Original Spark** — living-energy hero form (pulse/core/rim; no face/limbs)
- [ ] **P1 Shop skins** — Neon, Solar, Frost, Storm, Plasma, Void
- [ ] **P1 World-completion Sparks** — Reactor, Neon(city), Storm, Aurora, Solar, Lunar, Meteor, Nebula, Ancient, Origin
- [ ] **P2 Prism** — premium iridescent

### Jump Gate — P0
- [ ] **Jump Gate target** — dimensional bullseye; **art rings must match scoring radii**

### Obstacles (skin per environment / world where noted)
- [ ] **P0 Rotor — Containment / Workshop**
- [ ] **P1 Rotor — Rooftop turbine**
- [ ] **P1 Rotor — Space energy**
- [ ] **P0 Sliding gate** — opening readability critical
- [ ] **P0 Iris aperture** — opening radius gameplay-critical
- [ ] **P0 Security laser grid** — vertical / horizontal / pulse / cross; center gap critical
- [ ] **P1 Pendulum blocker**
- [ ] **P1 Moving ring** — World 3 primary
- [ ] **P0 Orbiter** — World 6 primary
- [ ] **P0 Drifting blocker** — World 7 primary; lane gaps = routes
- [ ] **P0 Phase field** — World 8 primary; open/closed windows clear
- [ ] **P0 Shifting aperture** — World 9 primary; pulse + shift match collision

### Environments
- [ ] **P0 Containment / Workshop set** — World 1
- [ ] **P0 City / Rooftop set** — Worlds 2–3 (+ storm sky)
- [ ] **P0 Space base set** — Worlds 4–10 shared deck + stars
- [ ] **P1 World atmosphere kits** — atmosphere, orbit debris, moon, belt, nebula, ancient network, homeward
- [ ] **P1 Portals ×3** — door / tunnel / ring

### FX
- [ ] **P0 Wind / crosswind cues** — always visible (particles / flags / streaks)
- [ ] **P0 Gravity well visualization** — readable rings / warp haze
- [ ] **P1 Spark trail** — soft ribbon + trail catalog variants
- [ ] **P1 Gate hit / Perfect particles**
- [ ] **P1 Obstacle impact sparks**
- [ ] **P2 Aim trajectory ghosts**
- [ ] **P2 Slow Field overlay**

---

## 5. Technical constraints (give to 3D artist)

1. **Mobile first** — prefer low poly; target ≤15k tris per interactive GLB unless shared.
2. **No mid-shot hitch** — preload or keep procedural fallbacks.
3. **Collision fidelity** — obstacle openings, wells, and Jump Gate radii are gameplay; art cannot “look” bigger/smaller than collision.
4. **Materials** — Phong/Lambert today; PBR OK later if perf allows. Emissive used heavily in space worlds.
5. **Reduce Motion** — FX must degrade (already gated in settings).
6. **Corridor clear** — keep ±~2m play lane visually quiet; dressing goes to sides/ceiling/far Z.
7. **Three technical environments** — Workshop / Rooftop / Space; **ten story worlds** dress those sets. Obstacles re-skin; same collision logic.
8. **All Sparks** — same hitbox; personality via materials/FX only.
9. **Wind & gravity wells** — must be visually communicated whenever active.
10. **Ten obstacle families** — rotor, slidingGate, iris, pendulum, movingRing, orbiter, driftingBlocker, phaseField, shiftingAperture, laserGrid.

---

## 6. Suggested production order

1. Wordmark + icon + splash (store)
2. Energy + shards + Original Spark + Jump Gate + Iris + Workshop rotor + Gate
3. Wind VFX + gravity well VFX (campaign readability)
4. New obstacle skins: orbiter, drift, phase, shifting aperture
5. Containment / City / Space sets + Journey map chrome
6. Spark portraits + remaining skins + world atmosphere kits
7. HUD stamps, trails, portals, HOME / False Home cards
8. Fonts + menu chrome + boost icons

---

## 7. File naming (proposed)

```text
assets/art/
  brand/spark-wordmark.svg
  brand/spark-mark.svg
  store/icon-1024.png
  store/splash.png
  ui/energy-full.png
  ui/energy-empty.png
  ui/shard.png
  ui/heart-full.png
  ui/heart-empty.png
  ui/boost-{guidance|slow-field|second-chance}.png
  ui/spark-{id}.png
  ui/trail-{id}.png
  ui/journey-node-{locked|open|done}.png
  models/spark-{id}.glb
  models/jump-gate.glb
  models/obstacle-rotor-{workshop|rooftop|space}.glb
  models/obstacle-gate.glb
  models/obstacle-iris.glb
  models/obstacle-pendulum.glb
  models/obstacle-ring.glb
  models/obstacle-orbiter.glb
  models/obstacle-drift.glb
  models/obstacle-phase-field.glb
  models/obstacle-shifting-aperture.glb
  models/env-workshop.glb
  models/env-rooftop.glb
  models/env-space.glb
  models/portal-{door|tunnel|ring}.glb
  fx/trail-guide.png
  fx/wind-sheet.png
  fx/gravity-well-ring.png
  fx/spark-hit-sheet.png
  campaign/home-finale.png
  campaign/false-home.png
```

---

## 8. Out of scope for this pass

- Rewriting gameplay / collision
- Full marketing site / trailer art
- Lip-sync / dialogue character animation
- Real AdMob creatives
- Replacing procedural audio

---

## 9. Acceptance (when “graphics” is no longer prototype)

- [ ] Store icon is branded SPARK (not Expo default)
- [ ] Home shows wordmark / mark (not only system text)
- [ ] Campaign energy + shards are sprites
- [ ] Endless hearts are sprites
- [ ] At least Original Spark + Jump Gate + Iris + Workshop rotor + Gate are non-primitive
- [ ] Orbiter / drift / phase / shifting aperture have non-primitive skins
- [ ] Wind and gravity wells are visible when active
- [ ] Journey map is more than a plain text list
- [ ] Each technical environment has a distinct readable set; later worlds have distinguishable atmosphere
- [ ] Spark select shows portraits, not only text
- [ ] Prototype labels (“PROTOTYPE ART”, HUD `· PROTO`) can be removed

---

*Aligned with campaign Worlds 1–10 (levels 1–150). Keep in sync with `src/graphics/graphicsNeeds.ts`.*
